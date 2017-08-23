var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PlayerModelUtils = require('../../ctrl/player_model_utils')();

module.exports = (gameCtrl, summary, identPerspective) => {

  var chessground = null;

  // An observer might not be in the 'players' list so we need a default
  // perspective of white for them.
  const playerColour = (summary.players[identPerspective] &&
    summary.players[identPerspective].colour) ? summary.players[identPerspective].colour : "white";

  function renderSummaryBottom() {

    var coloursNames = PlayerModelUtils.coloursToNames(summary.players);
    var otherPlayerColour = playerColour == "white" ? "black" : "white";

    return m('div', {class: 'ssb-chess-miniboard-bottom'}, [m('center', {
        class: "ssb-chess-miniboard-name"
      }, coloursNames[playerColour].substring(0, 10)),

      m('center', {
        class: "ssb-chess-miniboard-name"
      }, coloursNames[otherPlayerColour].substring(0, 10))
    ])
}

function renderSummary() {

  var observing = Object.keys(summary.players).indexOf(identPerspective) === -1;

  return m('div', {
      class: "ssb-chess-miniboard ssb-chess-board-background-blue3 merida"
    }, [
      m('a[href=' + '/games/' + btoa(summary.gameId) + "?observing=" + observing + ']', {
        class: "ssb-chessground-container",
        title: summary.gameId,
        id: summary.gameId,
        oncreate: m.route.link
      }), renderSummaryBottom()]);
  }

  function summaryToChessgroundConfig(summary) {
    var config = {
      fen: summary.fen,
      viewOnly: true,
      orientation: playerColour,
      turnColor: summary.players[summary.toMove].colour,
      check: summary.check,
      coordinates: false
    };

    if (summary.lastMove) {
      config.lastMove = [summary.lastMove.orig, summary.lastMove.dest];
    }

    return config;
  }

  return {
    view: function() {
      return renderSummary();
    },
    oncreate: function(vNode) {

      // This lifecycle event tells us that the DOM is ready. That means we
      // can attach chessground to our chessground container element that was
      // prepared for it during the 'view' lifecycle method.

      var config = summaryToChessgroundConfig(summary);

      var dom = vNode.dom;
      var chessGroundParent = dom.querySelector(".ssb-chessground-container");
      chessground = Chessground(chessGroundParent, config);

      // Listen for game updates
      var gameSummaryObservable = gameCtrl.getSituationSummaryObservable(summary.gameId);
      gameSummaryObservable(newSummary => {
        var newConfig = summaryToChessgroundConfig(newSummary);
        chessground.set(newConfig);
      });
    },
    onremove: function() {
      chessground.destroy();
    }
  }

}
