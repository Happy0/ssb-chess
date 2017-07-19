var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PlayerModelUtils = require('../../ctrl/player_model_utils')();

module.exports = (summary, identPerspective) => {

  var chessground = null;

  // An observer might not be in the 'players' list so we need a default
  // perspective of white for them.
  const playerColour = (summary.players[identPerspective] &&
    summary.players[identPerspective].colour) ? summary.players[identPerspective].colour : "white";

  function renderSummary() {

    var coloursNames = PlayerModelUtils.coloursToNames(summary.players);
    var otherPlayerColour = playerColour == "white" ? "black" : "white";

    return m('div', {
      class: "ssb-chess-miniboard blue merida"
    }, [m('center', {
        class: "ssb-chess-miniboard-name"
      }, coloursNames[otherPlayerColour].substring(0, 10)),
      m('a[href=' + '/games/' + btoa(summary.gameId) + ']', {
        class: "ssb-chessground-container",
        title: summary.gameId,
        id: summary.gameId,
        oncreate: m.route.link
      }),
      m('center', {
        class: "ssb-chess-miniboard-name"
      }, coloursNames[playerColour].substring(0, 10))
    ]);
  }

  function listenForLiveGameUpdates() {
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
  }

  return {
    view: function() {
      return renderSummary();
    },
    oncreate: function(vNode) {

      // This lifecycle event tells us that the DOM is ready. That means we
      // can attach chessground to our chessground container element that was
      // prepared for it during the 'view' lifecycle method.

      var config = {
        fen: summary.fen,
        viewOnly: true,
        orientation: playerColour
      };

      if (summary.lastMove) {
        config.lastMove = [summary.lastMove.orig, summary.lastMove.dest];
      }

      var dom = vNode.dom;
      var chessGroundParent = dom.querySelector(".ssb-chessground-container");
      chessground = Chessground(chessGroundParent, config);

    },
    oninit: function() {
      listenForLiveGameUpdates();
    },
    onremove: function() {
      PubSub.unsubscribe(this.moveListener);
    }
  }

}
