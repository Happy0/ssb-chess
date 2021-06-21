const pull = require('pull-stream');

module.exports = (dataAccess, myIdent, chessIndex) => {
  // untested
  // function followPlayer(playerPubKey) {
  //   sbot.publish({
  //     type: 'contact',
  //     contact: playerPubKey,
  //     following: true,
  //   });
  // }

  // // untested
  // function unfollowPlayer(playerPubKey) {
  //   sbot.publish({
  //     type: 'contact',
  //     contact: playerPubKey,
  //     following: false,
  //   });
  // }

  function toPromise(source, through) {
    return new Promise((resolve, reject) => {
      pull(source, pull.collect((err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }));
    });
  }

  function followedByMe() {
    return new Promise((resolve, reject) => {
      pull(dataAccess.follows(myIdent, false), pull.take(1), pull.collect((err, results) => {
        if (err) {
          reject(err);
        } else if (results.length == 1) {
          resolve(results[0]);
        } else {
          console.log("followedByMe length is not 1");
          console.log(results);
          resolve([]);
        }
      }))
    });
  }

  function followingMe() {
    return new Promise((resolve, reject) => {
      pull(dataAccess.followedBy(myIdent, false), pull.take(1), pull.collect((err, results) => {
        if (err) {
          reject(err);
        } else if (results.length == 1) {
          resolve(results[0]);
        } else {
          console.log("followingMe length is not 1");
          console.log(results);
          resolve([]);
        }
      }))
    })
  }

  function getPlayerDisplayName(playerPubKey) {
    // TODO: have some way to mark a game as corrupted.
    if (!playerPubKey || !playerPubKey.startsWith('@')) {
      return Promise.resolve('<error>');
    }

    return new Promise((resolve, reject) => {
      dataAccess.getPlayerDisplayName(playerPubKey, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result);
        }
      })
    });
  }

  function getWeightedPlayFrequencyList() {

    return new Promise( (resolve, reject) => {
      chessIndex.weightedPlayFrequencyList(myIdent, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
      
    });
  }

  return {
    followingMe,
    followedByMe,
    getPlayerDisplayName,
    getWeightedPlayFrequencyList
  };
};
