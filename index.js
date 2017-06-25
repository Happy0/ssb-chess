var ssbClient = require('ssb-client');
var GameCtrl = require('./ctrl/game');
var m = require("mithril");

var MiniboardListComponent = require('./ui/miniboard/miniboard_list');

module.exports = () => {

  ssbClient(
    function (err, sbot) {
      if (err) {
        console.log(err);
      } else {
        console.log("Starting ssb-chess");
        sbot.whoami((err,ident) => {
          const gameCtrl = GameCtrl(sbot, ident.id);
          const gamesAwaitingMove = MiniboardListComponent(gameCtrl.getMyGamesInProgress);

          m.mount(document.body, gamesAwaitingMove);
        })
      }
    });


}
