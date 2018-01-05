var m = require("mithril");
var Chessground = require('chessground').Chessground;
var Miniboard = require('./miniboard');

var PubSub = require("pubsub-js");

var watch = require("mutant/watch");

/**
 * Takes an observable list of game summaries (non-observable inner objects)
 * and renders them into a page of miniboards.
 * Those miniboards create an observable to change the board when a move is
 * made.
 *
 * The list of games is updated if the gameSummaryListObs fires (e.g. if a
 * game ends or begins on a page of games a user is playing.)
 */
module.exports = (gameCtrl, gameSummaryListObs, ident) => {
  var gameSummaries = [];

  this.ident = ident;

  var unlistenUpdates = null;

  function keepMiniboardsUpdated() {
    unlistenUpdates = watch(gameSummaryListObs, summaries => {
      gameSummaries = summaries;
      setTimeout(m.redraw)
    });
  }

  return {
    view: () => {
      return m("div", {
          class: "ssb-chess-miniboards"
        },
        gameSummaries.map(summary => m(Miniboard(gameCtrl, summary, this.ident))));
    },
    oncreate: function(e) {
      keepMiniboardsUpdated();
    },
    onremove: () => {
      unlistenUpdates();
    }
  }
}
