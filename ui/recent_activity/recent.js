var m = require('mithril');

/**
 * A component to render updates about chess games based on the supplied observable
 * list of scuttlebutt chess game messages.
 *
 * If a game is one the player is participating in, then the information text will
 * reflect this and use the word 'you.'
 *
 * @gameCtrl The main game controller. Used to retrieve further information to support
 *           the rendering.
 * @recentGameMessagesObs An observable array of recent chess game scuttlebutt messages.
 *                        This list is expected to be a ring buffer (i.e. the least recent message
                          drops off the bottom when a new one arrives if the array has reached some capacity.)
 */
module.exports = (gameCtrl, recentGameMessagesObs) => {

  function renderGameEndMsg(chessGameMsg) {

  }

  function renderMessage(chessGameMsg) {

  }

  return {
    view: () => {

    }
  }
}
