var m = require("mithril");
var Chessground = require('chessground').Chessground;
var Miniboard = require('./miniboard')();

module.exports = (getGameSummariesFunc) => {

  var gameSummaries = [];

  return {
    view: function() {
      return m("div", {class: "ssb-chess-miniboards"},
       gameSummaries.map(Miniboard.renderSummary));
    },
    oncreate: function(e) {
      getGameSummariesFunc().then(summaries => {
        gameSummaries = summaries;
      }).then(e => {m.redraw()});
    }
  }
}
