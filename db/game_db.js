var sqlite3 = require('sqlite3').verbose();
var pull = require("pull-stream");

var DbPromiseUtils = require("./db_promise_utils");

module.exports = (sbot, db) => {

  var allStmtAsPromise = DbPromiseUtils(db).allStmtAsPromise;
  var getStmtAsPromise = DbPromiseUtils(db).getStmtAsPromise;
  var runStmtAsPromise = DbPromiseUtils(db).runStmtAsPromise;

  function myLiveFeedSince(since) {
    const myFeedSource = sbot.createFeedStream({
      live: true
    });

    console.log(since);
    if (since) {
      myFeedSource['gte'] = since;
    }

    return myFeedSource;
  }

  function messagesByType(typeOfMessage, date) {
    var opts = {type: typeOfMessage};

    if (date) {
      opts["gt"] = date;
    }

    var source =  sbot.messagesByType(opts);

    return source;
  }

  function getLastSeenMessageDate() {
    var query = `select updated from ssb_chess_games where rowid = (SELECT max(rowid) from ssb_chess_games);`
    return getStmtAsPromise(query).then(result => result ? result.updated: null);
  }

  function insertNewGameChallenge(newGameChallengeMsg, cb) {

    var insertStmt = `INSERT OR IGNORE INTO ssb_chess_games (gameId, inviter, invitee, inviterColor, status, winner, updated)
      VALUES ( '${newGameChallengeMsg.key}',
       '${newGameChallengeMsg.value.author}', '${newGameChallengeMsg.value.content.inviting}',
       '${newGameChallengeMsg.value.content.myColor}', 'invited', null, ${Date.now()} )`;

    db.run(insertStmt, a => cb(null, "this is just to sync inserts"));
  }

  function updateWithChallengeAccepted(acceptedGameChallengeMsg, cb) {

    if (!acceptedGameChallengeMsg.value.content.root) {
      console.log("no root message");
      return;
    }

    var updateStmt = `UPDATE ssb_chess_games SET status = 'started', updated=${Date.now()}
      WHERE gameId = '${acceptedGameChallengeMsg.value.content.root}'`;

    db.run(updateStmt, a => cb(null, "this is just to sync inserts"));
  }

  function updateEndGame(endGameMessage) {
    console.dir(endGameMessage);
    var updateStmt = `UPDATE ssb_chess_games
      SET status = '${endGameMessage.value.content.status}', winner = '${endGameMessage.value.content.winner}', updated=${Date.now()}
      WHERE gameId = '${endGameMessage.value.content.root}'  `;

    db.run(updateStmt, err => {if (err) console.dir(err)});
  }

  function watchForArrivingUpdates() {
    console.log("Watching for arriving unseen invites, accepted invites and game ends");

    getLastSeenMessageDate().then(sinceDate => {

      pull(myLiveFeedSince(sinceDate), pull.drain(msg => {
        if (msg.sync) {
          return;
        }

        var noop = (a, b) => {};

        const type = msg.value.content.type;

        if (type === "ssb_chess_game_end") {
          updateEndGame(msg);
        } else if (type === "ssb_chess_invite") {
          insertNewGameChallenge(msg, noop);
        } else if (type === "ssb_chess_invite_accept") {
          updateWithChallengeAccepted(msg, noop);
        }

      }));

    });
  }

  function catchUpWithUnseenGameEnds(sinceDate) {
    console.log("Catching up with unseen game ends since " + sinceDate);
    pull(messagesByType("ssb_chess_game_end", sinceDate),
      pull.map(inviteMsg => updateEndGame(inviteMsg)),
      pull.onEnd(err => {
        if (err) {
          console.dir(err);
        } else {
          getLastSeenMessageDate().then(sinceDate =>
             watchForArrivingUpdates());
        }
      })
    )
  }

  function catchUpWithUnseenAcceptedInvites(sinceDate) {
    console.log("Catching up with unseen accepted invites since " + sinceDate);
    pull(messagesByType("ssb_chess_invite_accept", sinceDate),
      pull.asyncMap(inviteMsg => updateWithChallengeAccepted(inviteMsg)),
      pull.onEnd(err => {
        if (err) {
          console.dir(err);
        } else {
          catchUpWithUnseenGameEnds(sinceDate);
        }
      })
    )
  }

  function catchUpWithUnseenInvites() {
    getLastSeenMessageDate().then(sinceDate => {
      console.log("Catching up with unseen invites since " + sinceDate);
      console.dir(pull.asyncMap);

      pull(
        messagesByType("ssb_chess_invite", sinceDate),
        pull.asyncMap(insertNewGameChallenge),
        pull.onEnd(err => {
          if (err) {
            console.dir(err);
          } else {
            catchUpWithUnseenAcceptedInvites(sinceDate);
          }
        })
      )
    })
  }

  function loadGameSummariesIntoDatabase() {
    return catchUpWithUnseenInvites();
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
    console.log(query);

    return allStmtAsPromise(query).then(rows => rows.map(getInvitationSummary));
  }

  function pendingChallengesReceived(playerId) {
    var query = ` select * from ssb_chess_games WHERE invitee="${playerId}" and status="invited" `;

    return allStmtAsPromise(query).then(rows => rows.map(getInvitationSummary));
  }

  function getGamesAgreedToPlayIds(playerId) {
    var query = `select * from ssb_chess_games
    WHERE invitee="${playerId}"
      or inviter="${playerId}" and (status <> "invited");`;

    return allStmtAsPromise(query).then(rows => rows.map(row => row.gameId));
  }

  return {
      loadGameSummariesIntoDatabase: loadGameSummariesIntoDatabase,
      pendingChallengesSent: pendingChallengesSent,
      pendingChallengesReceived: pendingChallengesReceived,
      getGamesAgreedToPlayIds: getGamesAgreedToPlayIds
  }
}
