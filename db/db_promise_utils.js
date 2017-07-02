module.exports = (db) => {

  function allStmtAsPromise(stmt) {
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
      db.run(stmt, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }

      })
    });
  }

  return {
    allStmtAsPromise: allStmtAsPromise,
    runStmtAsPromise: runStmtAsPromise,
    getStmtAsPromise: getStmtAsPromise
  }
}
