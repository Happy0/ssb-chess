var ssbClient = require('ssb-client');
var GameCtrl = require('./ctrl/game');
var m = require("mithril");

var GamesAwaitingMoveComponent = require('./ui/overview/games_awaiting_move');

module.exports = () => {

  ssbClient(
    function (err, sbot) {
      if (err) {
        console.log(err);
      } else {
        console.log("Starting ssb-chess");
        sbot.whoami((err,ident) => {
          const gameCtrl = GameCtrl(sbot, ident.id);

          const gamesAwaitingMove = GamesAwaitingMoveComponent(gameCtrl);

          m.mount(document.body, gamesAwaitingMove);
        })
      }
    });


}
