var computed = require('mutant/computed');
var m = require('mithril');
var when = require('mutant/when');

module.exports = (msg, myIdent, situationObs) => {

  var situation = null;

  var removeWatches = [];

  function render() {
    return m('div', JSON.stringify(msg))
  }

  return {
    view: render,
    oncreate: () => {
      var obs = situationObs(currentSituation => {
        situation = currentSituation;
      });

      removeWatches.push(obs);
    },
    onremove: () => {
      removeWatches.forEach(w => w());
    }
  }
}
