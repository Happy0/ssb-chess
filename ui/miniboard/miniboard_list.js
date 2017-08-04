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

  function updateMiniboards() {
    getGameSummariesFunc().then(summaries => {
      gameSummaries = summaries;
    }).then(m.redraw);
  }

  return {
    view: () => {
      return m("div", {
          class: "ssb-chess-miniboards"
        },
        gameSummaries.map(summary => m(Miniboard(gameCtrl, summary, this.ident))));
    },
    oncreate: function(e) {
      updateMiniboards();

      this.miniboardUpdatesListener = PubSub.subscribe("catch_up_with_games", (msg, data) => {

        // Eh, maybe one day I'll be more fine grained about it :P
        console.info("Updating miniboards");
        updateMiniboards();

      });

    },
    onremove: function(e) {
      console.log("remove");
      PubSub.unsubscribe(this.miniboardUpdatesListener);
    }
  }
}
