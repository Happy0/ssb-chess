var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PlayerModelUtils = require('../../ctrl/player_model_utils')();

module.exports = () => {

  function renderSummary(summary, identPerspective) {
    console.dir(summary);
    const playerColour = summary.players[identPerspective] ? summary.players[identPerspective].colour: "white";

    var vDom = m('a', {class: 'cg-board-wrap',
      href: '#!/games/' + btoa(summary.gameId)},
      m("div", {
        id: summary.gameId
      }))

    var config = {
      fen: summary.fen,
      viewOnly: true,
      orientation: playerColour
    };

    if (summary.lastMove) {
      config.lastMove = [summary.lastMove.orig, summary.lastMove.dest];
    }

    // The dom element isn't available yet
    setTimeout(() => {
      var element = vDom.dom;
      Chessground(element, config);
    });

    var coloursNames = PlayerModelUtils.coloursToNames(summary.players);

    return m('div', {
        class: "ssb-chess-miniboard blue merida"
      }, [m('center', {class: "ssb-chess-miniboard-name"}, coloursNames["black"].substring(0, 10)),
      vDom,
      m('center', {class: "ssb-chess-miniboard-name"}, coloursNames["white"].substring(0, 10))]);
  }

  return {
    renderSummary: renderSummary
  }

}
