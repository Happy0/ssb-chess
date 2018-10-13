const pull = require('pull-stream');
const ChessWorker = require('./worker');
const Bluebird = require('bluebird');

module.exports = (gameSSBDao) => {

  const chessWorker = ChessWorker();

  function postWorkerMessage(chessWorker, situation) {
    chessWorker.postMessage({
      topic: 'pgnDump',
      payload: {
        initialFen: situation.getInitialFen(),
        pgnMoves: situation.pgnMoves,
        white: `${situation.getWhitePlayer().name}`,
        black: `${situation.getBlackPlayer().name}`,
        date: new Date(situation.lastUpdateTime).toString(),
      },
      reqid: {
        gameRootMessage: situation.gameId,
      },
    });
  }

  function addChessSite(pgn) {
    // TODO : make pull request on scalachessjs to paramaterise this.
    return pgn.replace('[Site "https://lichess.org"]', '[Site "ssb-chess (https://github.com/happy0/ssb-chess)"]');
  }

  function handlePgnResponse(event, gameId, cb) {
    if (event.data.topic === 'pgnDump' && event.data.reqid.gameRootMessage === gameId) {
      const pgnText = addChessSite(event.data.payload.pgn);
      cb(null, pgnText);
    } else if (event.data.topic === 'error') {
      cb(event.error);
    } else {
      console.log("unexpected: ");
      console.log(event);
    }
  }

  function awaitPgnResponse(chessWorker, gameId, cb) {
    let handler = event => handlePgnResponse(event, gameId, cb);
    chessWorker.onmessage = handler;
  }

  function getSituation(gameId, cb) {
    return gameSSBDao.getSituation(gameId).then((res) => cb(null, res)).catch(err => cb(err));
  }

  function pgnExportCb(situation, cb) {
    awaitPgnResponse(chessWorker, situation.gameId, cb);
    postWorkerMessage(chessWorker, situation);
  }

  function situationToPgnStreamThrough() {
    return pull(
      pull.filter(situation => situation.pgnMoves && situation.pgnMoves.length > 0),
      pull.asyncMap((situation, cb) => {
        pgnExportCb(situation, cb)
      }));
  }

  return {
    /**
     * Transforms a game ID source into a PGN text pull stream (a pull-stream through.)
     * Useful for exporting a collection of games.
     */
    pgnStreamThrough: () => {
      return pull(
        pull.asyncMap(getSituation),
        situationToPgnStreamThrough()
      );
    },
    /**
     * Transforms a game situation into a PGN text pull stream (a pull-stream through.)
     * Useful for exporting a collection of games.
     */
    situationToPgnStreamThrough: situationToPgnStreamThrough,
    getPgnExport: gameId => {
      const pgnExport = Bluebird.promisify(pgnExportCb);
      return gameSSBDao.getSituation(gameId).then(pgnExport)
    },
  };
};
