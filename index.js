const m = require('mithril');
const onceTrue = require('mutant/once-true');

const MainCtrl = require('./ctrl/main');

const MiniboardListComponent = require('./ui/miniboard/miniboard_list');
const NavigationBar = require('./ui/pageLayout/navigation');
const GameComponent = require('./ui/game/gameView');
const PlayerProfileComponent = require('./ui/player/player_profile');
const InvitationsComponent = require('./ui/invitations/invitations');
const RecentActivityComponent = require('./ui/recent_activity/recent');
const PgnExportComponent = require('./ui/export/pgnExport');
const Notifier = require('./ui/notify/notifier');

module.exports = (attachToElement, sbot, opts = {}) => {
  const { initialView } = opts;

  setUpGamesIndex();

  const cssFiles = [
    './css/global.css',
    './css/chessground/assets/chessground.css',
    './css/chessground/assets/theme.css',
    './css/board-theme.css',
    './css/miniboards.css',
    './css/largeBoard.css',
    './css/invites.css',
    './css/loading.css',
    './css/promote.css',
    './css/game.css',
    './css/historyArea.css',
    './css/playerProfiles.css',
    './css/actionButtons.css',
    './css/activity.css',
    './css/pgnExport.css',
  ];

  function setUpGamesIndex() {
    // In older versions of ssb-chess-db, the plugin was given 'ssbChessIndex'
    // as a name. This caused issues when loading the plugin into a standalone
    // scuttlebot ( https://github.com/Happy0/ssb-chess-db/issues/1 )
    // We deal with this old name for backwards compatibility.
    if (sbot['chess-db']) {
      sbot.ssbChessIndex = sbot['chess-db'];
    } else if (!sbot.ssbChessIndex && !sbot['chess-db']) {
      throw new Error('Missing plugin ssb-chess-db');
    }
  }

  // h4cky0 strikes again? mebbe there's a better way? ;x
  function cssFilesToStyleTag(dom) {
    const rootDir = `${__dirname}/`;

    const styles = m('div', {}, cssFiles.map(file => m('link', { rel: 'stylesheet', href: rootDir + file })));

    m.render(dom, styles);
  }

  function renderPageTop(parent, mainCtrl, settingsCtrl) {
    const navBar = NavigationBar(mainCtrl, settingsCtrl);

    const TopComponent = {
      view: () => m('div', [
        m(navBar),
      ]),
    };

    m.mount(parent, TopComponent);
  }

  function appRouter(mainBody, mainCtrl, settingsCtrl) {
    const gamesInProgressObs = mainCtrl.getGameCtrl().getMyGamesInProgress();
    const gamesMyMoveObs = mainCtrl.getGameCtrl().getGamesWhereMyMove();
    const observableGamesObs = mainCtrl.getGameCtrl().getFriendsObservableGames();
    const userRecentActivity = mainCtrl.getRecentActivityCtrl().getRecentActivityForUserGames();

    // Hack: keep observables loaded with the latest value.
    gamesInProgressObs(e => e);
    gamesMyMoveObs(e => e);
    observableGamesObs(t => t);
    userRecentActivity(t => t);

    const defaultView = initialView || '/my_games';

    m.route(mainBody, defaultView, {
      '/my_games': MiniboardListComponent(mainCtrl, gamesInProgressObs, mainCtrl.getMyIdent()),
      '/games_my_move': MiniboardListComponent(mainCtrl, gamesMyMoveObs, mainCtrl.getMyIdent()),
      '/games/:gameId': {
        onmatch(args) {
          const gameId = atob(args.gameId);
          const gameSituationObs = mainCtrl.getGameCtrl().getSituationObservable(gameId);

          // Only load the game page once we have the initial game situation state.
          // The mithril router allows us to return a component in a promise.
          return new Promise((resolve) => {
            onceTrue(gameSituationObs, () => {
              const gameComponent = GameComponent(mainCtrl, gameSituationObs, settingsCtrl);
              resolve(gameComponent);
            });
          });
        },
      },
      '/invitations': InvitationsComponent(mainCtrl),
      '/activity': RecentActivityComponent(mainCtrl, userRecentActivity),
      '/observable': MiniboardListComponent(mainCtrl, observableGamesObs, mainCtrl.getMyIdent()),
      '/player/:playerId': PlayerProfileComponent(mainCtrl),
      '/games/:gameId/pgn': {
        onmatch(args) {
          const gameId = atob(args.gameId);
          return mainCtrl.getPgnCtrl()
            .getPgnExport(gameId)
            .then(pgnText => PgnExportComponent(gameId, pgnText));
        },
      },
    });
  }

  sbot.whoami((err, ident) => {
    const mainCtrl = MainCtrl(sbot, ident.id);

    const settingsCtrl = mainCtrl.getSettingsCtrl();

    const mainBody = attachToElement;
    const navDiv = document.createElement('div');
    navDiv.id = 'ssb-nav';
    const bodyDiv = document.createElement('div');

    const cssDiv = document.createElement('div');
    cssFilesToStyleTag(cssDiv);

    mainBody.appendChild(cssDiv);
    mainBody.appendChild(navDiv);
    mainBody.appendChild(bodyDiv);

    renderPageTop(navDiv, mainCtrl, settingsCtrl);

    // Display HTML5 notifications if the user is not viewing the chess app
    // and one of their games has an update.
    const notifier = Notifier(mainCtrl, sbot);
    notifier.startNotifying();

    appRouter(bodyDiv, mainCtrl, settingsCtrl);
  });

  return {
    goToGame: (gameId) => {
      const gameRoute = `/games/${btoa(gameId)}`;
      m.route.set(gameRoute);
    },
  };
};
