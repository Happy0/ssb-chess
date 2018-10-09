// The worker we construct depends on the environment we're in (nodejs or webbrowser);

let ChessWorker = null;
try {
    // Reference error if in nodejs
    ChessWorker = Worker;
} catch (e) {
    ChessWorker = require('tiny-worker');
}

const rootDir = `${__dirname.replace('ctrl', '')}/`;
const path =`${rootDir}vendor/scalachessjs/scalachess.js`;

module.exports = function makeChessWorker() {
    return new ChessWorker(path);
}