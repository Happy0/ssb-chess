var ssbClient = require('ssb-client');
var GameCtrl = require('./ctrl/game');
var m = require("mithril");

var MiniboardListComponent = require('./ui/miniboard/miniboard_list');
var NavigationBar = require('./ui/pageLayout/navigation')();
var GameComponent = require('./ui/game/gameView');

module.exports = () => {

  function renderPageTop() {
    const navBar = document.getElementById("ssb-nav");
    m.render(navBar, NavigationBar.navigationTop());
  }

  function appRouter(mainBody, gameCtrl) {
    m.route(mainBody, "/my_games", {
      "/my_games": MiniboardListComponent(gameCtrl.getMyGamesInProgress),
      "/games/:gameId": GameComponent(gameCtrl)
    })
  }

  ssbClient(
    function (err, sbot) {
      if (err) {
        console.log(err);
      } else {
        console.log("Starting ssb-chess");
        sbot.whoami((err,ident) => {
          const gameCtrl = GameCtrl(sbot, ident.id);

          renderPageTop();
          const mainBody = document.getElementById("ssb-main");
          appRouter(mainBody, gameCtrl);

        })
      }
    });


}
