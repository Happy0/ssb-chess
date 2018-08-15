const pull = require('pull-stream');

module.exports = (sbot) => {
  function pendingChallengesSent(playerId) {
    return new Promise((resolve, reject) => {
      sbot.ssbChessIndex.pendingChallengesSent(playerId, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  function pendingChallengesReceived(playerId) {
    return new Promise((resolve, reject) => {
      sbot.ssbChessIndex.pendingChallengesReceived(playerId, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  function getGamesAgreedToPlayIds(playerId) {
    return new Promise((resolve, reject) => {
      sbot.ssbChessIndex.getGamesAgreedToPlayIds(playerId, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  function getObservableGames(playerId) {
    return new Promise((resolve, reject) => {
      sbot.ssbChessIndex.getObservableGames(playerId, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  function getGamesFinished(playerId) {
    return sbot.ssbChessIndex.getGamesFinished(playerId);
  }

  return {
    pendingChallengesSent,
    pendingChallengesReceived,
    getGamesAgreedToPlayIds,
    getObservableGames,
    getGamesFinished,
  };
};
