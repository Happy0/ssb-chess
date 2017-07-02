module.exports = (db) => {


  function loadPlayerNames() {

  }

  function getFriendDisplayName() {

  }

    function createVersionTable(version) {
      var stmt = `
          CREATE TABLE IF NOT EXISTS ssb_chess_version (schema_version integer)
      `
      // TODO: Add schema version so we know if we have to rebuild the database as the
      // schema may change in future versions

      return runStmtAsPromise(stmt);
    }

  

  return {
    loadPlayerNames: loadPlayerNames,
    getFriendDisplayName: getFriendDisplayName
  }

}
