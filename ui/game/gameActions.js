var m = require("mithril");

module.exports = (gameMoveCtrl) => {

  function resignButton(gameId) {
    var resignGame = () => {
      gameMoveCtrl.resignGame(gameId);
    }

    return m('button', {onclick: resignGame}, 'Resign');
  }

  return {
    view: (vDom) => {
      return m('div', {class: "ssb-game-actions"}, [resignButton()]);
    }
  }
}
