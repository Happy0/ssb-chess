var sqlite3 = require('sqlite3').verbose();
var pull = require("pull-stream");

var DbPromiseUtils = require("./db_promise_utils");

var PubSub = require("pubsub-js");

//TODO: Get rid of some of the boiler plate in this file.

module.exports = (sbot, db) => {

  var allStmtAsPromise = DbPromiseUtils(db).allStmtAsPromise;

  var ssb_chess_type_messages = [
    "chess_invite",
    "chess_move",
    "chess_invite_accept",
    "chess_game_end"
  ];

  function liveLogStreamSince(since) {

    var opts = {
      live: true
    }

    if (since) {
      opts['gte'] = since;
    }

    const myFeedSource = sbot.createLogStream(opts);

    return myFeedSource;
  }

  function getInvitationSummary(row) {

    const invitation = {
      gameId: row.gameId,
      sentBy: row.inviter,
      inviting: row.invitee,
      inviterPlayingAs: row.inviterColor,
      timeStamp: row.updated
    }

    return invitation;
  }

  function pendingChallengesSent(playerId) {
    var query = ` select * from ssb_chess_games WHERE inviter="${playerId}" and status="invited" `;

    return allStmtAsPromise(query).then(rows => rows.map(getInvitationSummary));
  }

  function pendingChallengesReceived(playerId) {
    var query = ` select * from ssb_chess_games WHERE invitee="${playerId}" and status="invited" `;

    return allStmtAsPromise(query).then(rows => rows.map(getInvitationSummary));
  }

  function getGamesAgreedToPlayIds(playerId) {
    var query = `select * from ssb_chess_games
    WHERE invitee="${playerId}"
      or inviter="${playerId}" and (status = "started");`;

    return allStmtAsPromise(query).then(rows => rows.map(row => row.gameId));
  }

  function getObservableGames(playerId, start, end) {
    var query = `select * from ssb_chess_games
    WHERE (invitee <> "${playerId}")
      and (inviter <> "${playerId}") and (status = "started")
       ORDER BY updated DESC
        LIMIT ${start},${end};`;

    return allStmtAsPromise(query).then(rows => rows.map(row => row.gameId));
  }

  function getRelatedMessages(gameInvite, cb) {
    const linksToInvite = sbot.links({
      dest: gameInvite.key,
      values: true
    });

    pull(linksToInvite, pull.collect((err, res) => {

      if (err) {
        cb(err, null);
      } else {
        msgs = res === null ? [] : res;
        var result = {
          invite: gameInvite,
          gameMessages: msgs
        }

        cb(null, result);
      }

    }))
  }

  function getGameStatus(maybeAcceptMsg, maybeGameEndMsg) {
    if (maybeGameEndMsg) {
      return maybeGameEndMsg.value.content.status;
    } else if (maybeAcceptMsg) {
      return "started";
    } else {
      return "invited";
    }
  }

  function getUpdatedTime(maybeAcceptMsg, maybeGameEndMsg, orDefault) {
    if (maybeGameEndMsg) {
      return maybeGameEndMsg.value.timestamp;
    } else if (maybeAcceptMsg) {
      return maybeAcceptMsg.value.timestamp;
    } else {
      return orDefault;
    }
  }

  function storeGameHistoryIntoView(gameHistory, optionalSyncCallback) {
    var invite = gameHistory.invite;
    var inviter = invite.value.author;

    var acceptInviteMsg = gameHistory.gameMessages.find(msg =>
      msg.value.content &&
      msg.value.content.type === "chess_invite_accept" &&
      msg.value.author === invite.value.content.inviting);

    var gameEndMsg = gameHistory.gameMessages.find(msg =>
      msg.value.content && msg.value.content.type === "chess_game_end");

    var status = getGameStatus(acceptInviteMsg, gameEndMsg);
    var updateTime = getUpdatedTime(acceptInviteMsg, gameEndMsg, invite.value.timestamp);

    var winner = gameEndMsg ? gameEndMsg.value.content.winner : null;

    var insertStmt = `INSERT OR REPLACE INTO ssb_chess_games (gameId, inviter, invitee, inviterColor, status, winner, updated)
      VALUES ( '${invite.key}',
       '${inviter}', '${invite.value.content.inviting}',
       '${invite.value.content.myColor}', '${status}', '${winner}', ${Date.now() / 1000} )`;

    db.run(insertStmt, function(err) {

      if (err) {
        console.dir(err);
        console.log("Error inserting game status view");
      }

      if (optionalSyncCallback) {
        // This can be used to run insert statements 1 after another if
        // ordering is important (as it is for as we want to refresh the
        //  page only when we're completely caught up)
        optionalSyncCallback(null, "db insert finished");
      }

    });

  }

  function getGameInvite(id, cb) {
    sbot.get(id, function(err, inviteMsg) {
      // happy0? h4cky0 moar like
      inviteMsg.value = inviteMsg;

      inviteMsg.key = id;
      //console.dir(id);
      //console.dir(inviteMsg);
      cb(null, inviteMsg);
    });
  }

  function getGamesFinishedPageCb(playerId, start, end, cb) {

    // This query is inefficient as it walks through the whole result set,
    // discarding results before 'start'. It'll do for now, but maybe I'll
    // do something more efficient in the future :)
    var query = `select * from ssb_chess_games
    WHERE ((invitee = "${playerId}")
      or (inviter = "${playerId}")) and (status <> "started" and status <> "invited")
       ORDER BY updated DESC
        LIMIT ${start},${end};`;

    db.all(query, (err, result) => {
      if (err) {
        cb(err,null);
      } else {
        cb(null, result.map(res => res.gameId))
      }
    });
  }

  function keepUpToDateWithGames(since) {

    var isChessMsgFilter = (msg) => !msg.sync === true && ssb_chess_type_messages.indexOf(msg.value.content.type) !== -1;

    var gameIdUpdateThrough = pull(pull.filter(isChessMsgFilter),
      pull.map(msg => msg.value.content.root ? msg.value.content.root : msg.key));

    var originalGameInvites = pull(gameIdUpdateThrough, pull.asyncMap(getGameInvite));

    var storeGamesSync = pull(originalGameInvites, pull(pull.asyncMap(getRelatedMessages), pull.asyncMap(storeGameHistoryIntoView)));

    pull(liveLogStreamSince(since), storeGamesSync, pull.drain(e => {
      console.log("Game update");
      PubSub.publish("catch_up_with_games");
    }, () => console.log("unexpected end of game invitations stream")));
  }

  function signalAppReady() {
    PubSub.publish("ssb_chess_games_loaded");
    PubSub.publish("catch_up_with_games", Date.now());
  }

  function loadGameSummariesIntoDatabase() {
    var inviteMsgs = sbot.messagesByType({
      "type": "chess_invite"
    });

    var insertGamesThrough = pull(
      pull.asyncMap(getRelatedMessages),
      pull.asyncMap(storeGameHistoryIntoView)
    );

    var startedCatchingUpAt = Date.now();

    pull(inviteMsgs,
      insertGamesThrough,
      pull.onEnd(() => {
        console.log("Caught up with game statuses so far. Watching for new updates.");
        signalAppReady();

        var timeSpentCatchingUp = Date.now() - startedCatchingUpAt;

        // Catch up since now - (time we spent catching up with old messages + 2 minutes in milliseconds)
        // * 1000 to put it into unix time
        var since = (Date.now() - (timeSpentCatchingUp + (120 * 1000)));

        keepUpToDateWithGames(since);
      }));
  }

  return {
    loadGameSummariesIntoDatabase: loadGameSummariesIntoDatabase,
    pendingChallengesSent: pendingChallengesSent,
    pendingChallengesReceived: pendingChallengesReceived,
    getGamesAgreedToPlayIds: getGamesAgreedToPlayIds,
    getObservableGames: getObservableGames,
    getGamesFinishedPageCb: getGamesFinishedPageCb
  }
}
