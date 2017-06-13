const GameSSBDao = require("../ssb_ctrl/game");

module.exports = (sbot) => {

  const chessWorker = new Worker('../vendor/scalachessjs.js');
  const gameSSBDao = GameSSBDao(sbot);

  function getGamesInProgressIds(playerId) {
    return gameSSBDao.getGamesInProgressIds(playerId);
  }

  function getSituation(gameId) {
    return gameSSBDao.getSituation(gameId);
  }

  function makeMove(gameRootMessage, originSquare, destinationSquare) {

  }

  return {
    getGamesInProgressIds: getGamesInProgressIds,
    getSituation: getSituation,
    getSituation: getSituation,
    makeMove: makeMove
  }

}
