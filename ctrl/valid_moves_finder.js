const get = require('lodash/get');
const computed = require('mutant/computed');
const Value = require('mutant/value');

module.exports = (chessWorker) => {

  // A map of observables that are currently awaiting a response from the asynchronous
  // chess logic webworker.
  const awaitingWorkerResponses = {};

  /**
   * @return An observable of the valid moves for the current game position for the
   *         user
   */
  function validMovesForSituationObs(situationObs) {

    return computed([situationObs], situation => {

      let destsObs = Value({});

      let key = getDestsKey(situation.gameId, situation.ply);

      awaitingWorkerResponses[key] = destsObs;

      chessWorker.postMessage({
        topic: 'dests',
        payload: {
          fen: situation.fen
        },
        reqid: {
          gameRootMessage: situation.gameId,
          ply: situation.ply
        }
      })

      return destsObs;
    })
  }

  /**
   *
   * @return An observable of whether the player currently playing may claim a draw.
   */
  function canClaimDrawObs(situationObs) {
    // TODO
  }

  // Listens for respones from the chess webworker and updates observables
  // awaiting the response
  function listenForWorkerResults() {
    chessWorker.addEventListener('message', (event) => {

      var gameId = event.data.reqid.gameRootMessage;
      var ply = event.data.reqid.ply;

      if (event.data.topic === "dests") {
        let destsMapKey = getDestsKey(gameId, ply);
        let awaitingDestsObs = get(awaitingWorkerResponses, destsMapKey);

        if (awaitingDestsObs) {
          let validDests = event.data.payload.dests;
          awaitingDestsObs.set(validDests);
          delete awaitingWorkerResponses [destsMapKey];
        }

      } else if (event.data.topic === "threefoldTest") {
        let canDrawKey = getDrawKey(gameId, ply);

        let awaitingCanDraw = get(awaitingWorkerResponses, canDrawKey);

        if (awaitingCanDraw) {
          let canClaimDraw = event.data.payload.threefoldRepetition;
          awaitingCanDraw.set(canClaimDraw);
          delete awaitingWorkerResponses[canDrawKey];
        }
      }

    });
  }

  function getDestsKey (gameId, ply) {
    return `${gameId}.${ply}.dests`;
  }

  function getDrawKey (gameId, ply) {
    return `${gameId}.${ply}.canClaimDraw`;
  }

  listenForWorkerResults();

  return {
    validMovesForSituationObs: validMovesForSituationObs,
    canClaimDrawObs: canClaimDrawObs
  }
}
