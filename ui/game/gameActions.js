var m = require("mithril");
var onceTrue = require('mutant/once-true')

module.exports = (gameMoveCtrl, myIdent, situationObservable) => {

  var observing = true;

  function resignButton() {
    var resignGame = () => {
      onceTrue(situationObservable, situation => gameMoveCtrl.resignGame(situation.gameId));
    }

    return m('button', {
      onclick: resignGame
    }, 'Resign');
  }

  function isObserving(situation) {
    return situation.players[myIdent] == null;
  }

  return {
    view: (vDom) => {
      return m('div', {
        class: "ssb-game-actions",
        style: observing ? "display: none;" : ""
      }, [resignButton()]);
    },
    oncreate: function(vNode) {
      situationObservable(situation => observing = isObserving(situation));
    }
  }
}
