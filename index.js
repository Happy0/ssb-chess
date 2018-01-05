var GameCtrl = require('./ctrl/game');
var m = require("mithril");

var MiniboardListComponent = require('./ui/miniboard/miniboard_list');
var NavigationBar = require('./ui/pageLayout/navigation');
var GameComponent = require('./ui/game/gameView');
var PlayerProfileComponent = require('./ui/player/player_profile');
var InvitationsComponent = require('./ui/invitations/invitations');

var settingsCtrl = require('./ctrl/settings')();

var onceTrue = require('mutant/once-true');

module.exports = (attachToElement, sbot) => {

  var cssFiles = [
    "./css/global.css",
    "./css/chessground/assets/chessground.css",
    "./css/chessground/assets/theme.css",
    "./css/board-theme.css",
    "./css/miniboards.css",
    "./css/largeBoard.css",
    "./css/invites.css",
    "./css/loading.css",
    "./css/promote.css",
    "./css/game.css",
    "./css/historyArea.css",
    "./css/playerProfiles.css",
    "./css/actionButtons.css"
  ];

  // h4cky0 strikes again? mebbe there's a better way? ;x
  function cssFilesToStyleTag(dom) {
    var rootDir = __dirname + "/";

    var styles = m('div', {}, cssFiles.map(file => m('link', {rel: 'stylesheet', 'href': rootDir + file})))

    m.render(dom, styles);
  }

  function renderPageTop(parent, gameCtrl) {

    var navBar = NavigationBar(gameCtrl, settingsCtrl);

    var TopComponent = {
      view: () => m('div',[
        m(navBar)
      ])
    };

    m.mount(parent, TopComponent);
  }

  function appRouter(mainBody, gameCtrl) {
    var gamesInProgressObs = gameCtrl.getMyGamesInProgress();
    var gamesMyMoveObs = gameCtrl.getGamesWhereMyMove();
    var observableGamesObs = gameCtrl.getFriendsObservableGames();

    m.route(mainBody, "/my_games", {
      "/my_games": MiniboardListComponent(gameCtrl, gamesInProgressObs, gameCtrl.getMyIdent()),
      "/games_my_move": MiniboardListComponent(gameCtrl, gamesMyMoveObs , gameCtrl.getMyIdent()),
      "/games/:gameId": {
        onmatch: function(args, requestedPath) {
          var gameId = atob(args.gameId);
          var gameSituationObs = gameCtrl.getSituationObservable(gameId);

          // Only load the game page once we have the initial game situation state.
          // The mithril router allows us to return a component in a promise.
          return new Promise ( (resolve, reject) => {
            onceTrue(gameSituationObs, originalSituation => {
              var gameComponent = GameComponent(gameCtrl, gameSituationObs, settingsCtrl);
              resolve(gameComponent);
            })
          })
        }
      },
      "/invitations": InvitationsComponent(gameCtrl),
      "/observable": MiniboardListComponent(gameCtrl, observableGamesObs, gameCtrl.getMyIdent()),
      "/player/:playerId": PlayerProfileComponent(gameCtrl)
    })
  }

  sbot.whoami((err, ident) => {
    const gameCtrl = GameCtrl(sbot, ident.id);

    const mainBody = attachToElement;
    const navDiv = document.createElement("div");
    navDiv.id = "ssb-nav";
    const bodyDiv = document.createElement("div");

    const cssDiv = document.createElement("div");
    cssFilesToStyleTag(cssDiv);

    mainBody.appendChild(cssDiv);
    mainBody.appendChild(navDiv);
    mainBody.appendChild(bodyDiv);

    renderPageTop(navDiv, gameCtrl);

    appRouter(bodyDiv, gameCtrl);
  });
}
