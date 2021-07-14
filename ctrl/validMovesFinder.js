const get = require('lodash/get');
const computed = require('mutant/computed');
const Value = require('mutant/value');

const chessWorker = require ('./worker')();

module.exports = () => {
  // A map of observables that are currently awaiting a response from the asynchronous
  // chess logic webworker.
  const awaitingWorkerResponses = {};

  /**
   * @return An observable of the valid moves for the current game position for the
   *         user
   */
  function validMovesForSituationObs(situationObs) {
    return computed([situationObs], (situation) => {
      const destsObs = Value({});

      const key = getDestsKey(situation.gameId, situation.ply);

      awaitingWorkerResponses[key] = destsObs;

      chessWorker.postMessage({
        topic: 'dests',
        payload: {
          fen: situation.fen,
        },
        reqid: {
          gameRootMessage: situation.gameId,
          ply: situation.ply,
        },
      });

      return destsObs;
    });
  }

  /**
   *
   * @return An observable of whether the player currently playing may claim a draw.
   */
  function canClaimDrawObs(situationObs) {
    // TODO: test this, use this to expose 'claim draw' button

    return computed([situationObs], (situation) => {
      const drawObs = Value({});
      const key = getDrawKey(situation.gameId, situation.ply);

      awaitingWorkerResponses[key] = drawObs;

      chessWorker.postMessage({
        topic: 'threefoldTest',
        payload: {
          initialFen: situation.getInitialFen(),
          pgnMoves: situation.pgnMoves,
        },
        reqid: {
          gameRootMessage: situation.gameId,
          ply: situation.ply,
        },
      });

      return drawObs;
    });
  }

  // Listens for respones from the chess webworker and updates observables
  // awaiting the response
  function listenForWorkerResults() {
    chessWorker.addEventListener('message', (event) => {
      const gameId = event.data.reqid.gameRootMessage;
      const { ply } = event.data.reqid;

      if (event.data.topic === 'dests') {
        const destsMapKey = getDestsKey(gameId, ply);
        const awaitingDestsObs = get(awaitingWorkerResponses, destsMapKey);

        if (awaitingDestsObs) {
          const validDests = event.data.payload.dests;
          awaitingDestsObs.set(validDests);
          delete awaitingWorkerResponses[destsMapKey];
        }
      } else if (event.data.topic === 'threefoldTest') {
        const canDrawKey = getDrawKey(gameId, ply);

        const awaitingCanDraw = get(awaitingWorkerResponses, canDrawKey);

        if (awaitingCanDraw) {
          const canClaimDraw = event.data.payload.threefoldRepetition;
          awaitingCanDraw.set(canClaimDraw);
          delete awaitingWorkerResponses[canDrawKey];
        }
      }
    });
  }

  function getDestsKey(gameId, ply) {
    return `${gameId}.${ply}.dests`;
  }

  function getDrawKey(gameId, ply) {
    return `${gameId}.${ply}.canClaimDraw`;
  }

  listenForWorkerResults();

  return {
    validMovesForSituationObs,
    canClaimDrawObs,
  };

 
};
