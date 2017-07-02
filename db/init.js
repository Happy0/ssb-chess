var sqlite3 = require('sqlite3').verbose();

var DbPromiseUtils = require("./db_promise_utils");

module.exports = () => {

  function initDb() {
    return new Promise((resolve, reject) => {
      var db = new sqlite3.Database('./ssb_chess_rebuildable_db.sqlite3',
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        function(err) {
          if (err) {
            console.dir(err);
            reject(err);
          } else {
            console.log("Successfully opened connection to sqlite.");
            resolve(db);
          }
        })

    }).then(db => createVersionTable(db, 1)).then(db => createGamesTable(db));
  }

  function createVersionTable(db, version) {
    var runStmtAsPromise = DbPromiseUtils(db).runStmtAsPromise;

    var stmt = `
          CREATE TABLE IF NOT EXISTS ssb_chess_version (schema_version integer)
      `
    // TODO: Add schema version so we know if we have to rebuild the database as the
    // schema may change in future versions

    console.dir(runStmtAsPromise);

    return runStmtAsPromise(stmt).then(e => db);
  }

  function createGamesTable(db) {
    var runStmtAsPromise = DbPromiseUtils(db).runStmtAsPromise;

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

    return runStmtAsPromise(stmt).then(e => db);
  }

  return {
    initDb: initDb
  }
}
