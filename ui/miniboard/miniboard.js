var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PlayerModelUtils = require('../../ctrl/player_model_utils')();

module.exports = (summary, identPerspective) => {

  var chessground = null;

  function renderSummary() {

    // An observer might not be in the 'players' list so we need a default
    // perspective of white for them.
    const playerColour = (summary.players[identPerspective] &&
       summary.players[identPerspective].colour) ? summary.players[identPerspective].colour: "white";

    var vDom = m('a[href=' + '/games/' + btoa(summary.gameId) +']', {class: 'cg-board-wrap', title: summary.gameId, oncreate: m.route.link},
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
      chessground = Chessground(element, config);
    });

    var coloursNames = PlayerModelUtils.coloursToNames(summary.players);
    var otherPlayerColour = playerColour == "white" ? "black" : "white";

    return m('div', {
        class: "ssb-chess-miniboard blue merida"
      }, [m('center', {class: "ssb-chess-miniboard-name"}, coloursNames[otherPlayerColour].substring(0, 10)),
      vDom,
      m('center', {class: "ssb-chess-miniboard-name"}, coloursNames[playerColour].substring(0, 10))]);
  }

  return {
    view: function() {
      return renderSummary();
    },
    oninit: function() {
      this.moveListener = PubSub.subscribe("game_update", function(msg, data) {
        if (data.gameId === summary.gameId) {
          var config = {
            fen: data.fen,
            lastMove: [data.orig, data.dest]
          }

          if (chessground) {
              chessground.set(config);
          }
        }
      });

    },
    onremove: function() {
      PubSub.unsubscribe(this.moveListener);
    }
  }

}
