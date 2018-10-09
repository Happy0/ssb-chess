const Worker = require('tiny-worker');

/**
 * Just constructs a web worker. I'm separating this out into a different file as
 * I'm wondering if ssb-chess might run in the web browser some time and we might need to
 * require a different WebWorker implementation depending on the context.
 * 
 * Electron apps can use 'new Worker'. However, CLI apps (such as bots) require a
 * nodejs implementation of the webworker API.
 * 
 * tiny-worker works for both electron and the CLI.
 */

module.exports = Worker;