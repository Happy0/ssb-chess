var m = require("mithril");
var Chessground = require('chessground').Chessground;
var Miniboard = require('./miniboard');

/*
 * GameSummariesFunc is a function that takes no arguments, and when invoked,
 * returns a list of game summaries that should be rendered into a list of
 * miniboards.
*/
module.exports = (getGameSummariesFunc, ident) => {
  var gameSummaries = [];

  this.ident = ident;

  return {
    view: () => {
      return m("div", {class: "ssb-chess-miniboards"},
       gameSummaries.map(a => m(Miniboard(a, this.ident))));
    },
    oncreate: function(e) {
      getGameSummariesFunc().then(summaries => {
        gameSummaries = summaries;
      }).then(m.redraw);
    }
  }
}
