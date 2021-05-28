const { pull } = require('pull-stream');

module.exports = (chessIndex) => {

  function pendingChallengesSent(playerId) {
    return chessIndex.pendingChallengesSent(playerId);
  }

  function pendingChallengesReceived(playerId) {
    return chessIndex.pendingChallengesReceived(playerId);
  }

  function getGamesAgreedToPlayIds(playerId) {
    return new Promise((resolve, reject) => {
      pull(
        chessIndex.getGamesInProgressIds(playerId),
        pull.take(1),
        pull.drain(result => resolve(result) )
      );
    });
  }

  function getObservableGames(playerId) {
    return new Promise((resolve, reject) => {
      pull(
        chessIndex.getObservableGamesIds(playerId),
        pull.take(1),
        pull.drain(result => resolve(result) )
      );
    });
  }

  function getGamesFinished(playerId) {
    return chessIndex.getGamesFinishedIds(playerId);
  }

  function getAllGameIds() {
    return chessIndex,getAllGamesInDb();
  }

  return {
    pendingChallengesSent,
    pendingChallengesReceived,
    getGamesAgreedToPlayIds,
    getObservableGames,
    getGamesFinished,
    getAllGameIds
  };
};
