var computed = require('mutant/computed');
var m = require('mithril');
var resolve = require('mutant/resolve');
var when = require('mutant/when');

var Miniboard = require('../miniboard/miniboard');

module.exports = (msg, situation, myIdent) => {

  function loading() {
    return m('div', 'Loading...');
  }

  function render() {
    if (!situation) {
      return loading()
    } else {
      var opts = {
        small: true
      }

      return m('div', {class: "ssb-chess-game-end-notification"}, [
        m(Miniboard(computed([situation], s=>s), situation, myIdent, opts)),
        m('div', JSON.stringify(situation.status))
      ]);
    }
  }

  return {
    view: render,
    oncreate: () => {
      if (situation) {

      }
    }
  }
}
