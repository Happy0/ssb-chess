const m = require('mithril');
const watch = require('mutant/watch');
const gameEndActivity = require('./gameEnd');

/**
 * A component to render updates about chess games based on the supplied observable
 * list of scuttlebutt chess game messages.
 *
 * If a game is one the player is participating in, then the information text will
 * reflect this and use the word 'you.'
 *
 * @gameCtrl The main game controller. Used to retrieve further information to support
 *           the rendering.
 * @recentGameMessagesObs An observable array of recent chess game scuttlebutt
 * messages with their associated game situation state. e.g.
 *
 * {
 *   msg: ...,
 *   situation: ...
 * }
 *
 * This list is expected to be a ring buffer (i.e. the least recent message
 * drops off the bottom when a new one arrives if the array has reached some
 * capacity).
 */
module.exports = (gameCtrl, recentGameMessagesObs) => {
  let messages = [];
  const watches = [];

  function renderGameEndMsg(entry) {
    return m('div', m(gameEndActivity(entry.msg, entry.situation, gameCtrl.getMyIdent())));
  }

  const renderers = {
    chess_game_end: renderGameEndMsg,
  };

  function renderMessage(entry) {
    const renderer = renderers[entry.msg.value.content.type];

    if (renderer) {
      return m('div', { class: 'ssb-chess-game-activity-notification' }, renderer(entry));
    }
    return m('div');
  }

  function canRender(entry) {
    const { type } = entry.msg.value.content;
    return {}.hasOwnProperty.call(renderers, type);
  }

  function renderMessages() {
    return messages
      .filter(canRender)
      .map(renderMessage);
  }

  return {
    view: () => m('div', { class: 'ssb-chess-game-notifications' }, renderMessages()),
    oncreate: () => {
      const obs = watch(recentGameMessagesObs,
        (gameMessages) => {
          messages = gameMessages;

          if (messages && messages.length > 0) {
            gameCtrl.getRecentActivityCtrl().setLastseenMessage(messages[0].msg.timestamp);
          }

          m.redraw();
        });

      watches.push(obs);
    },
    onremove: () => {
      watches.forEach(w => w());
    },
  };
};
