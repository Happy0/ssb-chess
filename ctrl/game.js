module.exports = (sbot) => {

  const chessWorker = new Worker('../vendor/scalachessjs.js');

  function getSituation(gameId) {

  }

  function makeMove(gameRootMessage, originSquare, destinationSquare) {
    
  }

  return {
    getSituation: getSituation,
    makeMove: makeMove
  }

}
