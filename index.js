var GameCtrl = require('./ctrl/game');
var m = require("mithril");

var Db = require("./db/init")();

var MiniboardListComponent = require('./ui/miniboard/miniboard_list');
var NavigationBar = require('./ui/pageLayout/navigation')();
var GameComponent = require('./ui/game/gameView');
var InvitationsComponent = require('./ui/invitations/invitations');
var StatusBar = require('./ui/pageLayout/status_bar');

module.exports = (attachToElement, sbot) => {

  var cssFiles = [
    "./css/global.css",
    "./css/chessground/assets/chessground.css",
    "./css/chessground/assets/theme.css",
    "./css/miniboards.css",
    "./css/largeBoard.css",
    "./css/invites.css",
    "./css/loading.css",
    "./css/promote.css"
  ];

  // h4cky0 strikes again? mebbe there's a better way? ;x
  function cssFilesToStyleTag(dom) {
    var rootDir = __dirname + "/";

    var styles = m('div', {}, cssFiles.map(file => m('link', {rel: 'stylesheet', 'href': rootDir + file})))

    m.render(dom, styles);
  }

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
      "/invitations": InvitationsComponent(gameCtrl),
      "/testarooni": require("./ui/game/promote")('black', (p) => console.log(":o! " + p), () => console.log("o:"))
    })
  }

  sbot.whoami((err, ident) => {
    Db.initDb().then(db => {
      const gameCtrl = GameCtrl(sbot, ident.id, db);
      gameCtrl.loadGameSummariesIntoDatabase();
      gameCtrl.startPublishingBoardUpdates();

      const mainBody = attachToElement;
      const navDiv = document.createElement("div");
      navDiv.id = "ssb-nav";
      const bodyDiv = document.createElement("div");

      const cssDiv = document.createElement("div");
      cssFilesToStyleTag(cssDiv);

      mainBody.appendChild(cssDiv);
      mainBody.appendChild(navDiv);
      mainBody.appendChild(bodyDiv);

      renderPageTop(navDiv);

      appRouter(bodyDiv, gameCtrl);
    })
  });
}
