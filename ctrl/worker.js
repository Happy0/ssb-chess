// The worker we construct depends on the environment we're in (nodejs or webbrowser);
module.exports = function makeChessWorker() {
    try {
        // Reference error if in nodejs
        Worker;
        const worker = new Worker('scalachessworker.js');
        return worker;
    } catch (e) {
        const rootDir = `${__dirname.replace('ctrl', '')}/`;
        const path =`${rootDir}vendor/scalachessjs/scalachess.js`;
        const ChessWorker = require('tiny-worker');
        return new ChessWorker(path);
    }


}