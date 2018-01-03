var m = require("mithril");
var Chessground = require('chessground').Chessground;
var Miniboard = require('./miniboard');

var PubSub = require("pubsub-js");

/*
 * GameSummariesFunc is a function that takes no arguments, and when invoked,
 * returns an observable list of game summaries that should be rendered into
 * a list of miniboards that update as moves are made.
 */
module.exports = (gameCtrl, getGameSummariesFunc, ident) => {
  var gameSummaries = [];
  var gameSummariesObs = null;

  this.ident = ident;

  function keepMiniboardsUpdated() {
    gameSummariesObs = getGameSummariesFunc()(summaries => {
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
    onremove: function(e) {
      if (gameSummariesObs) {
        gameSummariesObs();
      }
    }
  }
}
