var m = require('mithril');
var Chessground = require('chessground').Chessground;
var PlayerModelUtils = require('../../ctrl/player_model_utils')();
var timeAgo = require('./timeAgo')()

module.exports = (gameSummaryObservable, summary, identPerspective, opts) => {

  var chessground = null;
  var observables = [];
  var lastActivityTimestamp = summary.lastUpdateTime;

  var timeAgoRedrawTimer = null;

  // An observer might not be in the 'players' list so we need a default
  // perspective of white for them.
  const playerColour = (summary.players[identPerspective] &&
    summary.players[identPerspective].colour) ? summary.players[identPerspective].colour : "white";

  function renderPlayerName(player) {
    return m('a[href=/player/' + btoa(player.id) + ']', {
        class: "ssb-chess-miniboard-name",
        oncreate: m.route.link
      },
      player.name.substring(0, 10));
  }

  function renderSummaryBottom() {
    if (!(opts && opts.small)) {
      var coloursNames = PlayerModelUtils.coloursToPlayer(summary.players);
      var otherPlayerColour = playerColour == "white" ? "black" : "white";

      var leftPlayer = coloursNames[playerColour];
      var rightPlayer = coloursNames[otherPlayerColour];

      return m('div', {
        class: 'ssb-chess-miniboard-bottom'
      }, [m('center', {
          class: "ssb-chess-miniboard-name"
        }, renderPlayerName(leftPlayer)),
        m('small', {
          class: 'ssb-chess-miniboard-time-ago'
        }, lastActivityTimestamp ? timeAgo(lastActivityTimestamp)(): ""),
        m('center', {
          class: "ssb-chess-miniboard-name"
        }, renderPlayerName(rightPlayer))
      ])

    } else {
      return m('div');
    }
  }

  function renderSummary() {

    var observing = Object.keys(summary.players).indexOf(identPerspective) === -1;
    var boardSizeClass = opts && opts.small ? "ssb-chess-board-small" : "ssb-chess-board-medium";

    return m('div', {
      class: "ssb-chess-miniboard ssb-chess-board-background-blue3 merida"
    }, [
      m('a[href=' + '/games/' + btoa(summary.gameId) + "?observing=" + observing + ']', {
        class: "ssb-chessground-container cg-board-wrap " + boardSizeClass,
        title: summary.gameId,
        id: summary.gameId,
        oncreate: m.route.link
      }), renderSummaryBottom()
    ]);
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

      var situationObs = gameSummaryObservable(newSummary => {
        var newConfig = summaryToChessgroundConfig(newSummary);
        chessground.set(newConfig);
        lastActivityTimestamp = newSummary.lastUpdateTime
      });

      observables.push(situationObs);
    },
    onremove: function() {
      if (chessground) {
        chessground.destroy();
      }

      observables.forEach(w => w());
      observables = [];
    }
  }

}
