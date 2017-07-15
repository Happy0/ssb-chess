var GameCtrl = require('./ctrl/game');
var m = require("mithril");

var Db = require("./db/init")();

var MiniboardListComponent = require('./ui/miniboard/miniboard_list');
var NavigationBar = require('./ui/pageLayout/navigation')();
var GameComponent = require('./ui/game/gameView');
var InvitationsComponent = require('./ui/invitations/invitations');
var StatusBar = require('./ui/pageLayout/status_bar');

module.exports = (attachToElement, sbot) => {

  function renderPageTop(parent) {

    var statusBar = m(StatusBar());

    m.render(parent, [
      statusBar,
      NavigationBar.navigationTop()
    ]);
  }

  function appRouter(mainBody, gameCtrl) {
    m.route(mainBody, "/my_games", {
      "/my_games": MiniboardListComponent(gameCtrl.getMyGamesInProgress, gameCtrl.getMyIdent()),
      "/games_my_move": MiniboardListComponent(gameCtrl.getGamesWhereMyMove, gameCtrl.getMyIdent()),
      "/games/:gameId": GameComponent(gameCtrl),
      "/invitations": InvitationsComponent(gameCtrl)
    })
  }

  sbot.whoami((err, ident) => {
    Db.initDb().then(db => {
      const gameCtrl = GameCtrl(sbot, ident.id, db);
      gameCtrl.startPublishingBoardUpdates();

      const mainBody = attachToElement;
      const navDiv = document.createElement("div");
      navDiv.id = "ssb-nav";
      const bodyDiv = document.createElement("div");

      mainBody.appendChild(navDiv);
      mainBody.appendChild(bodyDiv);

      renderPageTop(navDiv);

      appRouter(bodyDiv, gameCtrl);
    })
  });
}
