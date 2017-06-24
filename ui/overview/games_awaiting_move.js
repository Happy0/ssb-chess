var m = require("mithril");
var Chessground = require('chessground').Chessground;
var Miniboard = require('./miniboard')();

module.exports = (gameCtrl) => {

  var gameSummaries = [];

  gameCtrl.getMyGamesInProgress().then(summaries => {
    gameSummaries = summaries;
  }).then(e => m.redraw());

  return {
    view: function() {
      return m("div", {class: "blue merida ssb-chess-miniboards"},
       gameSummaries.map(Miniboard.renderSummary));
    }
  }
}
