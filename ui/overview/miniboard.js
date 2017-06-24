var m = require("mithril");
var Chessground = require('chessground').Chessground;

module.exports = () => {

  function renderSummary(summary) {
    
    var vDom = m("div", {id: summary.gameId, class: "cg-board-wrap ssb-chess-miniboard"} );

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

  return {
    renderSummary: renderSummary
  }

}
