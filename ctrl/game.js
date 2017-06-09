module.exports = (sbot) => {

  const chessWorker = new Worker('../vendor/scalachessjs.js');

  function getSituation(gameId) {

  }

  function makeMove(gameId, originSquare, destinationSquare) {

  }

  return {
    getSituation: getSituation,
    makeMove: makeMove
  }

}
