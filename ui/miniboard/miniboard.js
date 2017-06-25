var m = require("mithril");
var Chessground = require('chessground').Chessground;

module.exports = () => {

  function coloursToNames(players) {
    var obj = {};
    for (var key in players) {
      obj[players[key].colour] = players[key].name;
    }

    return obj;
  }

  function renderSummary(summary) {

    var vDom = m("div", {
      id: summary.gameId,
      class: "cg-board-wrap"
    });

    var config = {
      fen: summary.fen,
      viewOnly: true
    };

    if (summary.lastMove) {
      config.lastMove = [summary.lastMove.orig, summary.lastMove.dest];
    }

    // The dom element isn't available yet
    setTimeout(() => {
      var element = vDom.dom;
      Chessground(element, config);
    });

    var coloursNames = coloursToNames(summary.players);

    return m('div', {
        class: "ssb-chess-miniboard"
      }, [m('center', {class: "ssb-chess-miniboard-name"}, coloursNames["black"].substring(0, 10)),
      vDom,
      m('center', {class: "ssb-chess-miniboard-name"}, coloursNames["white"].substring(0, 10))]);
  }

  return {
    renderSummary: renderSummary
  }

}
