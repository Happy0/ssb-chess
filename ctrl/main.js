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

const BacklinkUtils = require('../utils/backlinks_obs');

/**
 * The main controller which can be used to access the functional area specific controllers.
 * 
 * @param {*} sbot the scuttlebot instance
 * @param {*} myIdent the user's public key
 */
module.exports = (sbot, myIdent) => {

  const backlinkUtils = BacklinkUtils();
  const socialCtrl = SocialCtrl(sbot, myIdent);

  const gameSSBDao = GameSSBDao(sbot, myIdent, backlinkUtils, socialCtrl);
  const gameChallenger = GameChallenger(sbot, myIdent);
  const gameDb = GameDb(sbot);
  const moveCtrl = MoveCtrl(gameSSBDao, myIdent);
  const pgnCtrl = PgnCtrl(gameSSBDao);

  const playerCtrl = PlayerCtrl(sbot, gameDb, gameSSBDao);

  const movesFinderCtrl = MovesFinder();

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

  function setUpGamesIndex() {
    // In older versions of ssb-chess-db, the plugin was given 'ssbChessIndex'
    // as a name. This caused issues when loading the plugin into a standalone
    // scuttlebot ( https://github.com/Happy0/ssb-chess-db/issues/1 )
    // We deal with this old name for backwards compatibility.
    if (sbot['chess-db']) {
      sbot.ssbChessIndex = sbot['chess-db'];
    }
    else if (sbot.chessDb) {
      // (13/12/2018) lol... ssbc/secret-stack was recently changed to transform
      // plugins with -'s in them to camcel case, so here we are again...
      // (https://github.com/ssbc/secret-stack/pull/29)
      sbot.ssbChessIndex = sbot.chessDb;
    } else if (!sbot.ssbChessIndex) {
      throw new Error('Missing plugin ssb-chess-db');
    }
  }

  setUpGamesIndex();

  return {
    /**
     * Get the player's public key.
     */
    getMyIdent,

    /**
     * Game controller for fetching game states, and fetching games with properties like 'games where it's the player's move.'
     * 
     * The games and game lists are returned as observables.
     */
    getGameCtrl: () => gameCtrl,

    /**
     * Invite controller. Manage incoming / outgoing game invitations.
     */
    getInviteCtrl: () => inviteCtrl,

    /**
     * Controller for performing moves on a game. Commits game moves to the user's feed.
     */
    getMoveCtrl: () => moveCtrl,

    /**
     * Controller for fetching information about users - such as their display name, who the player is following, etc.
     */
    getSocialCtrl: () => socialCtrl,

    /**
     * Controller for fetching information about players.
     */
    getPlayerCtrl: () => playerCtrl,

    /**
     * Controller for finding out about recent activity on games, such as games a player was in that ended recently.
     * Useful for showing an aggregated list of activity such as a list of games that the user recently won / lost / drew.
     * 
     * Differs from getUserGameWatcherCtrl
     */
    getRecentActivityCtrl: () => recentActivityCtrl,

    /**
     * Controller for calculating valid moves for a given game situation.
     */
    getMovesFinderCtrl: () => movesFinderCtrl,

    /**
     * Controller for exporting games as a PGN.
     */
    getPgnCtrl: () => pgnCtrl,

    /**
     * Controller for watching for updates in player's games. Useful for showing notifications when it's a
     * player's turn to move, or watching for game updates to know when to update observables.
     */
    getUserGameWatcherCtrl: () => userGamesUpdateWatcher,

    /**
     * Get the sbot instance. An abstraction leak, but can be useful when using UI libraries that take the
     * sbot instance as a parameter.
     */
    getSbot: () => sbot,

    /**
     * A controller for storing settings in local storage
     */
    getSettingsCtrl: () => settingsCtrl
  };
};
