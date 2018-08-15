const Promise = require('bluebird');
const Worker = require('tiny-worker');

module.exports = (gameSSBDao, chessWorker) => {
  function postWorkerMessage(chessWorker, situation) {
    chessWorker.postMessage({
      topic: 'pgnDump',
      payload: {
        initialFen: situation.getInitialFen(),
        pgnMoves: situation.pgnMoves,
        white: `${situation.getWhitePlayer().name} (${situation.getWhitePlayer().id})`,
        black: `${situation.getBlackPlayer().name} (${situation.getBlackPlayer().id})`,
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

  function handlePgnResponse(event, gameId, resolve, reject) {
    if (event.data.topic === 'pgnDump' && event.data.reqid.gameRootMessage === gameId) {
      const pgnText = addChessSite(event.data.payload.pgn);
      resolve(pgnText);
    } else if (event.error === 'error') {
      reject(event.error);
    }
  }

  function awaitPgnResponse(chessWorker, gameId) {
    let handler = null;

    return new Promise((resolve, reject) => {
      // Yuck, need to remove event listener using same function reference
      handler = event => handlePgnResponse(event, gameId, resolve, reject);
      chessWorker.addEventListener('message', handler);
    }).finally(() => chessWorker.terminate());
  }

  return {
    getPgnExport: gameId => new Promise((resolve, reject) => {
      const rootDir = `${__dirname.replace('ctrl', '')}/`;
      const chessWorker = new Worker(`${rootDir}vendor/scalachessjs/scalachess.js`);

      // Yuck. Make sure the event listener is set up before posting the web worker message.
      // Well, at least the caller gets a nice promise back to hook on to =p.
      awaitPgnResponse(chessWorker, gameId).then(resolve).catch(reject);

      gameSSBDao.getSituation(gameId).then(situation => postWorkerMessage(chessWorker, situation)).catch(reject);
    }),
  };
};
