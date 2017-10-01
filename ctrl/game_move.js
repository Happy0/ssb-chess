const PlayerModelUtils = require("./player_model_utils")();

module.exports = (gameSSBDao, myIdent) => {

  var rootDir = __dirname.replace("ctrl","") + "/";
  const chessWorker = new Worker(rootDir + 'vendor/scalachessjs/scalachess.js');

  function makeMove(gameRootMessage, originSquare, destinationSquare, promoteTo) {

    gameSSBDao.getSituation(gameRootMessage).then(situation => {
      if (situation.toMove !== myIdent) {
        console.log("Not " + myIdent + " to move");
      } else {

        const pgnMoves = situation.pgnMoves;
        chessWorker.postMessage({
          'topic': 'move',
          'payload': {
            'fen': situation.fen,
            'pgnMoves': pgnMoves,
            'orig': originSquare,
            'dest': destinationSquare,
            'promotion': promoteTo
          },
          reqid: {
            gameRootMessage: gameRootMessage,
            originSquare: originSquare,
            destinationSquare: destinationSquare,
            players: situation.players
          }

        });

      }
    });
  }

  function resignGame(gameId) {
    return gameSSBDao.resignGame(gameId);
  }

  function publishValidMoves(gameId, ply) {

    gameSSBDao.getSituation(gameId).then(situation => {

      var gameFen = ply != null ? situation.fenHistory[ply] : situation.fen;

      chessWorker.postMessage({
        topic: 'init',
        payload: {
          'fen': gameFen
        },
        reqid: {
          gameRootMessage: situation.gameId
        }
      })

    });
  }

  function handleChessWorkerResponse(e) {
    // This is a hack. Reqid is meant to be used for a string to identity
    // which request the response game from.
    const gameRootMessage = e.data.reqid.gameRootMessage;
    const originSquare = e.data.reqid.originSquare;
    const destinationSquare = e.data.reqid.destinationSquare;

    if (e.data.payload.error) {
      console.log("move error");
      console.dir(e);
      PubSub.publish("move_error", e.data.payload.error);
    } else if (e.data.topic === 'init') {

      var gameId = e.data.reqid.gameRootMessage;
      var validDests = e.data.payload.setup.dests;
      var isCheck = e.data.payload.setup.check;

      PubSub.publish("valid_moves", {
        gameId: gameId,
        validMoves: validDests,
        check: isCheck
      })

    } else if (e.data.payload.situation.end) {

      var status = e.data.payload.situation.status;
      var winner = e.data.payload.situation.winner;
      var ply = e.data.payload.situation.ply;
      var fen = e.data.payload.situation.fen;
      var players = e.data.reqid.players;

      var pgnMove = ply > 0 ? e.data.payload.situation.pgnMoves[e.data.payload.situation.pgnMoves.length - 1] : null;

      var coloursToPlayer = PlayerModelUtils.coloursToPlayer(players);

      var winnerId = winner ? coloursToPlayer[winner].id : null;

      gameSSBDao.endGame(gameRootMessage, status.name, winnerId, fen, ply,
        originSquare, destinationSquare, pgnMove).then(dc => {
        gameSSBDao.getSituation(gameRootMessage).then(situation =>
          PubSub.publish("game_end", situation))
      });
    } else {

      gameSSBDao.makeMove(
        gameRootMessage,
        e.data.payload.situation.ply,
        originSquare,
        destinationSquare,
        e.data.payload.situation.promotion,
        e.data.payload.situation.pgnMoves[e.data.payload.situation.pgnMoves.length - 1],
        e.data.payload.situation.fen
      ).then(dc => {
        gameSSBDao.getSituation(gameRootMessage).then(situation => PubSub.publish("move", situation));
      });
    }
  }

  chessWorker.addEventListener('message', handleChessWorkerResponse);

  return {
    makeMove: makeMove,
    resignGame: resignGame,
    publishValidMoves: publishValidMoves
  }
}
