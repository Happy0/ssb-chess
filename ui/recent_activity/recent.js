var m = require('mithril');
var gameEndActivity = require('./gameEnd');

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
 *                        drops off the bottom when a new one arrives if the array has reached some capacity.)

 */
module.exports = (gameCtrl, recentGameMessagesObs) => {

  var messages = [];

  var renderers = {
    "chess_game_end": renderGameEndMsg
  }

  function renderGameEndMsg(msg) {
    return m('div', m(gameEndActivity(msg, gameCtrl.getMyIdent(), gameCtrl.getSituationObservable(msg.value.content.root))));
  }

  function renderMessage(msg) {
    var renderer = renderers[msg.value.content.type];

    if (renderer) {
      return renderer(msg);
    } else {
      console.log("Unexpected recent.js msg: " + msg );
      return m('div');
    }
  }

  function canRender(msg) {
    var type = msg.value.content.type;
    return renderers.hasOwnProperty(type);
  }

  function renderMessages() {
    return messages
      .filter(canRender)
      .map(renderMessage);
  }

  return {
    view: () => renderMessages(),
    oncreate: () => {
      recentGameMessagesObs(
        gameMessages => {
          messages = gameMessages;
          m.redraw();
        }
      )
    }
  }
}
