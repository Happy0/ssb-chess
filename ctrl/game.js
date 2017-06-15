const GameChallenger = require("../ssb_ctrl/game_challenge");
const GameSSBDao = require("../ssb_ctrl/game");
const uuidV4 = require('uuid/v4');

module.exports = (sbot, myIdent) => {

  const chessWorker = new Worker('../vendor/scalachessjs.js');
  const gameSSBDao = GameSSBDao(sbot);
  const gameChallenger = GameChallenger(sbot);

  function inviteToPlay(playerKey, asWhite) {
    return gameChallenger.inviteToPlay(playerKey, asWhite)
  }

  function acceptChallenge(rootGameMessage) {
    return gameChallenger.acceptChallenge(rootGameMessage);
  }

  function getGamesInProgressIds(playerId) {
    return gameSSBDao.getGamesInProgressIds(playerId);
  }

  function getSituation(gameId) {
    return gameSSBDao.getSituation(gameId);
  }

  function makeMove(gameRootMessage, originSquare, destinationSquare) {
    return new Promise( (resole, reject) => {
      gameSSBDao.getSituation(gameRootMessage).then(situation => {
        if (situation.toMove !== myIdent) {
          reject("Not " + myIdent + " to move");
        }

        // So that we know whether the message is intended for our listener
        const reqId = uuidV4();

        function handleMoveResponse(e) {
            //TODO: make this more robust / move to a promise approach
            if (e.data.payload.reqid === reqId) {

              worker.removeEventListener('message', handleMoveResponse);

              gameSSBDao.makeMove(gameRootMessage,
                 e.data.payload.situation.ply,
                 originSquare,
                 destinationSquare,
                 e.data.payload.situation.fen,
                 e.data.payload.situation.pgnMoves[e.data.payload.situation.pgnMoves.length - 1]);

              // Return the new fen
              resolve(e.data.payload.situation.fen);
            }
        }

        worker.addEventListener('message', handleMoveResponse);

        const pgnMoves = situation.pgnMoves;

        worker.postMessage({
          'topic': 'move',
          'payload': {
            'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            'pgnMoves': pgnMoves,
            'orig': originSquare,
            'dest': destinationSquare
          },
          reqid: messageId
        });

      });
    });
  }

  return {
    inviteToPlay: inviteToPlay,
    acceptChallenge: acceptChallenge,
    getGamesInProgressIds: getGamesInProgressIds,
    getSituation: getSituation,
    makeMove: makeMove
  }

}
