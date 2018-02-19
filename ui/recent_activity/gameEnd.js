var computed = require('mutant/computed');
var m = require('mithril');
var when = require('mutant/when');

module.exports = (msg, situation, myIdent) => {

  function render() {
    return m('div', JSON.stringify(situation));
  }

  return {
    view: render
  }
}
