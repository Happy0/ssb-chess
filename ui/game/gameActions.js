var m = require("mithril");
var onceTrue = require('mutant/once-true')

module.exports = (gameMoveCtrl, myIdent, situationObservable) => {

  var observing = true;

  function resignButton() {
    var resignGame = () => {
      onceTrue(situationObservable, situation => gameMoveCtrl.resignGame(situation.gameId));
    }

    return m('button', {
      onclick: resignGame,
      style: observing ? "display: none;" : ""
    }, 'Resign');
  }

  function isObserving(situation) {
    return situation.players[myIdent] == null;
  }

  return {
    view: (vDom) => {
      return m('div', {class: "ssb-game-actions"}, [resignButton()]);
    },
    oncreate: function(vNode) {
      situationObservable(situation => observing = isObserving(situation));
    }
  }
}
