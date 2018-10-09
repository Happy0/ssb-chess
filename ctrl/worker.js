// The worker we construct depends on the environment we're in (nodejs or webbrowser);
var ChessWorker =  Worker !== undefined ? Worker : require('tiny-worker');

const rootDir = `${__dirname.replace('ctrl', '')}/`;
const path =`${rootDir}vendor/scalachessjs/scalachess.js`;

module.exports = function makeChessWorker() {
    return new ChessWorker(path);
}