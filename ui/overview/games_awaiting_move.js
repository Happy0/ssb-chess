var m = require("mithril");

var Chessground = require('chessground').Chessground;

module.exports = (gameCtrl) => {

  var gameSummaries = [];

  function attachChessground(summary) {
    console.dir(summary);
    return summary;
  }

  function renderSummary(summary) {
    var vDom = m("div", {id: summary.gameId, class: "cg-board-wrap"} );

    var config = {fen: summary.fen, viewOnly: true};

    if (summary.lastMove) {
      config.lastMove = [summary.lastMove.orig, summary.lastMove.dest];
    }

    // The dom element isn't available yet
    setTimeout( () => {
      var element = vDom.dom;
      Chessground(element, config );
    });

    return vDom;
  }

  gameCtrl.getMyGamesInProgress().then(summaries => {
    gameSummaries = summaries;
  }).then(e => m.redraw());

  return {
    view: function() {
      console.log("hihi");
      return m("div", {class: "blue merida"}, gameSummaries.map(renderSummary));
    }
  }
}
