module.exports = function makeChessWorker() {
    const rootDir = `${__dirname.replace('ctrl', '')}/`;
    const path =`${rootDir}vendor/scalachessjs/scalachess.js`;
    const ChessWorker = require('tiny-worker');
    return new ChessWorker(path);
}