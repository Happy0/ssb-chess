const GameChallenger = require("../ssb_ctrl/game_challenge");
const GameSSBDao = require("../ssb_ctrl/game");
const uuidV4 = require('uuid/v4');
const Worker = require("tiny-worker");

module.exports = (sbot, myIdent) => {

  const chessWorker = new Worker('vendor/scalachessjs.js');
  const gameSSBDao = GameSSBDao(sbot);
  const gameChallenger = GameChallenger(sbot);

  function inviteToPlay(playerKey, asWhite) {
    return gameChallenger.inviteToPlay(playerKey, asWhite)
  }

  function acceptChallenge(rootGameMessage) {
    return gameChallenger.acceptChallenge(rootGameMessage);
  }

  function getMyGamesInProgress() {
    return gameSSBDao.getGamesInProgressIds(myIdent);
  }

  function getGamesInProgressIds(playerId) {
    return gameSSBDao.getGamesInProgressIds(playerId);
  }

  function getSituation(gameId) {
    return gameSSBDao.getSituation(gameId);
  }

  function makeMove(gameRootMessage, originSquare, destinationSquare) {
    // lol worra mess

    // So that we know whether the message is intended for our listener
    const reqId = uuidV4();

    function handleMoveResponse(resolve, reject, e) {
      if (e.data.payload.error) {
        reject(e.data.payload.error);
      } else if (e.data.reqid === reqId) {
        //TODO: make this more robust
        console.info("req");
        //chessWorker.removeEventListener('message', handleMoveResponse);

        gameSSBDao.makeMove(gameRootMessage,
          e.data.payload.situation.ply,
          originSquare,
          destinationSquare,
          e.data.payload.situation.pgnMoves[e.data.payload.situation.pgnMoves.length - 1],
          e.data.payload.situation.fen);

        // Return the new fen
        resolve(e.data.payload.situation);
      } else {
        console.dir("Unexpected message: ");
        console.dir(e);
        reject(e);
      }
    }

    return new Promise((resolve, reject) => {
      gameSSBDao.getSituation(gameRootMessage).then(situation => {
        if (situation.toMove !== myIdent) {
          reject("Not " + myIdent + " to move");
        } else {

          const moveResultHandler = handleMoveResponse.bind(this, resolve, reject);

          chessWorker.addEventListener('message', moveResultHandler);

          const pgnMoves = situation.pgnMoves;
          chessWorker.postMessage({
            'topic': 'move',
            'payload': {
              'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              'pgnMoves': pgnMoves,
              'orig': originSquare,
              'dest': destinationSquare
            },
            reqid: reqId
          });

        }
      });
    });
  }

  return {
    inviteToPlay: inviteToPlay,
    acceptChallenge: acceptChallenge,
    getMyGamesInProgress: getMyGamesInProgress,
    getGamesInProgressIds: getGamesInProgressIds,
    getSituation: getSituation,
    makeMove: makeMove
  }

}
