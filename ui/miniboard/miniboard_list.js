var m = require("mithril");
var Chessground = require('chessground').Chessground;
var Miniboard = require('./miniboard');

var PubSub = require("pubsub-js");

/*
 * GameSummariesFunc is a function that takes no arguments, and when invoked,
 * returns a list of game summaries that should be rendered into a list of
 * miniboards.
 */
module.exports = (gameCtrl, getGameSummariesFunc, ident) => {
  var gameSummaries = [];

  this.ident = ident;

  function keepMiniboardsUpdated() {
    getGameSummariesFunc()(summaries => {
      gameSummaries = summaries;
      m.redraw();
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
      PubSub.unsubscribe(this.miniboardUpdatesListener);
    }
  }
}
