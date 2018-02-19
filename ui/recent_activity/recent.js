var m = require('mithril');
var gameEndActivity = require('./gameEnd');
var watch = require('mutant/watch')

/**
 * A component to render updates about chess games based on the supplied observable
 * list of scuttlebutt chess game messages.
 *
 * If a game is one the player is participating in, then the information text will
 * reflect this and use the word 'you.'
 *
 * @gameCtrl The main game controller. Used to retrieve further information to support
 *           the rendering.
 * @recentGameMessagesObs An observable array of recent chess game scuttlebutt messages with their associated game
 *                        situation state. e.g.
 *                        {
 *                            msg: ...,
 *                            situation: ...
 *                        }
 *                        This list is expected to be a ring buffer (i.e. the least recent message
 *                        drops off the bottom when a new one arrives if the array has reached some capacity.)

 */
module.exports = (gameCtrl, recentGameMessagesObs) => {

  var messages = [];
  var watches = [];

  var renderers = {
    "chess_game_end": renderGameEndMsg
  }

  function renderGameEndMsg(entry) {
    return m('div', m(gameEndActivity(entry.msg, entry.situation, gameCtrl.getMyIdent())));
  }

  function renderMessage(entry) {
    var renderer = renderers[entry.msg.value.content.type];

    if (renderer) {
      return renderer(entry);
    } else {
      console.log("Unexpected recent.js msg: " + entry );
      return m('div');
    }
  }

  function canRender(entry) {
    var type = entry.msg.value.content.type;
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
      var obs = watch(recentGameMessagesObs,
        gameMessages => {
          messages = gameMessages;
          m.redraw();
        }
      )

      watches.push(obs);
    },
    onremove: () => {
      watches.forEach(w => w());
    }
  }
}
