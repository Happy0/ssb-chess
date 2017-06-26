var m = require("mithril");
var Chessground = require('chessground').Chessground;
var Miniboard = require('./miniboard')();

module.exports = (getGameSummariesFunc, ident) => {
  var gameSummaries = [];

  this.ident = ident;

  return {
    view: () => {
      return m("div", {class: "ssb-chess-miniboards"},
       gameSummaries.map(a => Miniboard.renderSummary(a, this.ident)));
    },
    oncreate: function(e) {
      getGameSummariesFunc().then(summaries => {
        gameSummaries = summaries;
      }).then(e => {m.redraw()});
    }
  }
}
