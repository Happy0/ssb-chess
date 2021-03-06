const ChessWorker = require('./worker');

module.exports = (gameSSBDao, myIdent) => {

  const chessWorker = ChessWorker();

  function makeMove(gameRootMessage, originSquare, destinationSquare, promoteTo) {
    gameSSBDao.getSituation(gameRootMessage).then((situation) => {
      if (situation.toMove === myIdent) {
        const { pgnMoves } = situation;
        chessWorker.postMessage({
          topic: 'move',
          payload: {
            fen: situation.fen,
            pgnMoves,
            orig: originSquare,
            dest: destinationSquare,
            promotion: promoteTo,
          },
          reqid: {
            gameRootMessage,
            originSquare,
            destinationSquare,
            players: situation.players,
            respondsTo: situation.latestUpdateMsg,
            coloursToPlayer: situation.coloursToPlayer()
          },

        });
      }
    });
  }

  function resignGame(gameId, respondsTo) {
    return gameSSBDao.resignGame(gameId, respondsTo);
  }

  function handleChessWorkerResponse(e) {
    // This is a hack. Reqid is meant to be used for a string to identity
    // which request the response game from.
    const { gameRootMessage, originSquare, destinationSquare, coloursToPlayer } = e.data.reqid;
    const { respondsTo } = e.data.reqid;

    if (e.data.payload.error) {
      // Todo: work out how to communicate this to the user.
      // This shouldn't happen though... (eh, famous last words, I guess.)
      throw new Error('Move error: ', e);
    } else if (e.data.topic === 'move' && e.data.payload.situation.end) {
      const {
        status,
        winner,
        ply,
        fen,
      } = e.data.payload.situation;

      const pgnMove = ply > 0
        ? e.data.payload.situation.pgnMoves[e.data.payload.situation.pgnMoves.length - 1]
        : null;

      const winnerId = winner ? coloursToPlayer[winner].id : null;

      gameSSBDao.endGame(
        gameRootMessage,
        status.name,
        winnerId,
        fen,
        ply,
        originSquare,
        destinationSquare,
        pgnMove,
        respondsTo,
      );
    } else if (e.data.topic === 'move') {
      gameSSBDao.makeMove(
        gameRootMessage,
        e.data.payload.situation.ply,
        originSquare,
        destinationSquare,
        e.data.payload.situation.promotion,
        e.data.payload.situation.pgnMoves[e.data.payload.situation.pgnMoves.length - 1],
        e.data.payload.situation.fen,
        respondsTo,
      );
    }
  }

  chessWorker.addEventListener('message', handleChessWorkerResponse);

  return {
    makeMove,
    resignGame,
  };
};
