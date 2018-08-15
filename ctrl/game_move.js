const PlayerModelUtils = require('./player_model_utils')();
const PubSub = require('pubsub-js');

module.exports = (gameSSBDao, myIdent, chessWorker) => {
  function makeMove(gameRootMessage, originSquare, destinationSquare, promoteTo) {
    gameSSBDao.getSituation(gameRootMessage).then((situation) => {
      if (situation.toMove !== myIdent) {
        console.log(`Not ${myIdent} to move`);
      } else {
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
    const { gameRootMessage, originSquare, destinationSquare } = e.data.reqid;
    let respondsTo;

    if (e.data.payload.error) {
      console.log('move error');
      console.dir(e);
      PubSub.publish('move_error', e.data.payload.error);
    } else if (e.data.topic === 'move' && e.data.payload.situation.end) {
      const {
        status, winner, ply, fen, players,
      } = e.data.reqid;
      ({ respondsTo } = e.data.reqid);

      const pgnMove = ply > 0 ? e.data.payload.situation.pgnMoves[e.data.payload.situation.pgnMoves.length - 1] : null;

      const coloursToPlayer = PlayerModelUtils.coloursToPlayer(players);

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
      ({ respondsTo } = e.data.reqid);

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
