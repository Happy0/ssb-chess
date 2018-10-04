const GameChallenger = require('../ssb_ctrl/game_challenge');
const GameSSBDao = require('../ssb_ctrl/game');

const GameDb = require('../db/game_db');
const SocialCtrl = require('./social');
const PlayerCtrl = require('./player');
const MoveCtrl = require('./gameMove');
const RecentActivityCtrl = require('./recentActivityCtrl');
const PgnCtrl = require('./pgn');
const MovesFinder = require('./validMovesFinder');
const InviteCtrl = require('./inviteCtrl');
const GameCtrl = require('./gameCtrl');
const UserGamesUpdateWatcher = require('./userGameUpdatesWatcher');

const settingsCtrl = require('./settings')();

/**
 * The main controller which can be used to access the functional area specific controllers.
 * 
 * @param {*} sbot the scuttlebot instance
 * @param {*} myIdent the user's public key
 */
module.exports = (sbot, myIdent) => {
  const rootDir = `${__dirname.replace('ctrl', '')}/`;
  const chessWorker = new Worker(`${rootDir}vendor/scalachessjs/scalachess.js`);

  const gameSSBDao = GameSSBDao(sbot, myIdent, chessWorker);
  const gameChallenger = GameChallenger(sbot, myIdent);
  const gameDb = GameDb(sbot);
  const moveCtrl = MoveCtrl(gameSSBDao, myIdent, chessWorker);
  const pgnCtrl = PgnCtrl(gameSSBDao);

  const socialCtrl = SocialCtrl(sbot, myIdent);
  const playerCtrl = PlayerCtrl(sbot, gameDb, gameSSBDao);

  const movesFinderCtrl = MovesFinder(chessWorker);

  const userGamesUpdateWatcher = UserGamesUpdateWatcher(sbot);

  const myGameUpdates = userGamesUpdateWatcher.latestGameMessageForPlayerObs(myIdent);

  const gameCtrl = GameCtrl(myIdent, gameSSBDao, gameDb, userGamesUpdateWatcher, myGameUpdates);

  const recentActivityCtrl = RecentActivityCtrl(
    userGamesUpdateWatcher,
    gameCtrl.getSituationObservable,
    myIdent,
  );

  const inviteCtrl = InviteCtrl(myIdent, gameChallenger, gameDb, myGameUpdates);

  function getMyIdent() {
    return myIdent;
  }

  return {
    getMyIdent,
    getGameCtrl: () => gameCtrl,
    getInviteCtrl: () => inviteCtrl,
    getMoveCtrl: () => moveCtrl,
    getSocialCtrl: () => socialCtrl,
    getPlayerCtrl: () => playerCtrl,
    getRecentActivityCtrl: () => recentActivityCtrl,
    getMovesFinderCtrl: () => movesFinderCtrl,
    getPgnCtrl: () => pgnCtrl,
    getUserGameWatcherCtrl: () => userGamesUpdateWatcher,
    getSbot: () => sbot,
    getSettingsCtrl: () => settingsCtrl
  };
};
