var sqlite3 = require('sqlite3').verbose();
var pull = require("pull-stream");

module.exports = (sbot) => {

  var db = null;

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

  function allStmtAsPromise(stmt) {
    return new Promise( (resolve, reject) => {
      db.all(stmt, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  function getStmtAsPromise(stmt) {
    return new Promise( (resolve, reject) => {
      db.get(stmt, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  function runStmtAsPromise(stmt) {
    return new Promise( (resolve, reject) => {
      db.run(stmt, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }

      })
    });
  }

  function getLastSeenMessageDate() {
    var query = `select updated from ssb_chess_games where rowid = (SELECT max(rowid) from ssb_chess_games);`
    return getStmtAsPromise(query).then(result => result ? result.updated: null);
  }

  function insertNewGameChallenge(newGameChallengeMsg) {
    //console.dir(newGameChallengeMsg);

    var insertStmt = `INSERT OR IGNORE INTO ssb_chess_games (gameId, inviter, invitee, inviterColor, status, winner, updated)
      VALUES ( '${newGameChallengeMsg.key}',
       '${newGameChallengeMsg.value.author}', '${newGameChallengeMsg.value.content.inviting}',
       '${newGameChallengeMsg.value.content.myColor}', 'invited', null, ${Date.now()} )`;

    console.log("hm");
    console.log(insertStmt);

    db.run(insertStmt, err => {if (err) console.dir(err)});
  }

  function updateWithChallengeAccepted(acceptedGameChallengeMsg) {

    if (!acceptedGameChallengeMsg.value.content.root) {
      console.log("no root message");
      return;
    }

    var updateStmt = `UPDATE ssb_chess_games SET status = 'started', updated=${Date.now()}
      WHERE gameId = '${acceptedGameChallengeMsg.value.content.root}'`;

    db.run(updateStmt, err => {if (err) console.dir(err)});
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
        const type = msg.value.content.type;

        if (type === "ssb_chess_game_end") {
          updateEndGame(msg);
        } else if (type === "ssb_chess_invite") {
          insertNewGameChallenge(msg);
        } else if (type === "ssb_chess_invite_accept") {
          updateWithChallengeAccepted(msg);
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
      pull.map(inviteMsg => updateWithChallengeAccepted(inviteMsg)),
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

      pull(
        messagesByType("ssb_chess_invite", sinceDate),
        pull.map(inviteMsg => insertNewGameChallenge(inviteMsg)),
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

  function createVersionTable(version) {
    var stmt = `
        CREATE TABLE IF NOT EXISTS ssb_chess_version (schema_version integer)
    `
    // TODO: Add schema version so we know if we have to rebuild the database as the
    // schema may change in future versions

    return runStmtAsPromise(stmt);
  }

  function createGamesTable() {
    var stmt = `
    CREATE TABLE IF NOT EXISTS ssb_chess_games (
       gameId text,
       inviter text,
       invitee text,
       inviterColor text,
       status text,
       winner text,
       updated integer,
       UNIQUE(gameId)
     )
    `;

    return runStmtAsPromise(stmt);
  }

  function createTablesIfNotExists() {
    var versionTable = createVersionTable();
    var gamesTable = createGamesTable();

    return Promise.all([versionTable, gamesTable]).then(z => db);
  }

  function loadGameSummariesIntoDatabase() {
    return createTablesIfNotExists().then(dc => catchUpWithUnseenInvites());
  }

  function connect() {
    return new Promise( (resolve, reject ) => {
      db = new sqlite3.Database('./games_summary_db.sqlite3',
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function(err) {
          if (err) {
            console.dir(err);
            reject(err);
          } else {
            console.log("resolve success");
            resolve();
          }
        });

    });
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
      connect: connect,
      loadGameSummariesIntoDatabase: loadGameSummariesIntoDatabase,
      pendingChallengesSent: pendingChallengesSent,
      pendingChallengesReceived: pendingChallengesReceived,
      getGamesAgreedToPlayIds: getGamesAgreedToPlayIds
  }
}
