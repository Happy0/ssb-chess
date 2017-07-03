var m = require("mithril");
var Chessground = require('chessground').Chessground;
var Miniboard = require('./miniboard');

var PubSub = require("pubsub-js");

/*
 * GameSummariesFunc is a function that takes no arguments, and when invoked,
 * returns a list of game summaries that should be rendered into a list of
 * miniboards.
 */
module.exports = (getGameSummariesFunc, ident) => {
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
        gameSummaries.map(a => m(Miniboard(a, this.ident))));
    },
    oncreate: function(e) {
      updateMiniboards();

      this.miniboardUpdatesListener = PubSub.subscribe("chess_games_list_update", (msg, data) => {

        // Eh, maybe one day I'll be more fine grained about it :P
        if (data == null || data != null) {
          console.info("Updating miniboards");
          updateMiniboards();
        }

      });

    },
    onremove: function(e) {
      console.log("remove");
      PubSub.unsubscribe(this.miniboardUpdatesListener);
    }
  }
}
