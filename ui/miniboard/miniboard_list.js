var m = require("mithril");
var Chessground = require('chessground').Chessground;
var Miniboard = require('./miniboard')();

module.exports = (getGameSummariesFunc) => {

  var gameSummaries = [];

  getGameSummariesFunc().then(summaries => {
    gameSummaries = summaries;
  }).then(e => m.redraw());

  return {
    view: function() {
      return m("div", {class: "ssb-chess-miniboards"},
       gameSummaries.map(Miniboard.renderSummary));
    }
  }
}
