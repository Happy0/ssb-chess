const Value = require('mutant/value');
const MutantArray = require('mutant/array');
const computed = require('mutant/computed');
const _ = require('lodash');
const GameChallenger = require('../ssb_ctrl/game_challenge');
const GameSSBDao = require('../ssb_ctrl/game');

const GameDb = require('../db/game_db');
const SocialCtrl = require('./social');
const PlayerCtrl = require('./player');
const MoveCtrl = require('./game_move');
const RecentActivityCtrl = require('./recentActivityCtrl');
const PgnCtrl = require('./pgn');
const MovesFinder = require('./valid_moves_finder');

const UserGamesUpdateWatcher = require('./user_game_updates_watcher');


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
  const recentActivityCtrl = RecentActivityCtrl(
    userGamesUpdateWatcher,
    getSituationObservable,
    myIdent,
  );

  function getMyIdent() {
    return myIdent;
  }

  function inviteToPlay(playerKey, asWhite) {
    return gameChallenger.inviteToPlay(playerKey, asWhite);
  }

  function acceptChallenge(rootGameMessage) {
    return gameChallenger.acceptChallenge(rootGameMessage);
  }

  const myGameUpdates = userGamesUpdateWatcher.latestGameMessageForPlayerObs(myIdent);

  function pendingChallengesSent() {
    const observable = Value([]);

    gameDb.pendingChallengesSent(myIdent).then(observable.set);

    const unlistenUpdates = myGameUpdates(() => gameDb.pendingChallengesSent(myIdent)
      .then(observable.set));

    return computed([observable], a => a, {
      comparer: compareGameSummaryLists,
      onUnlisten: unlistenUpdates,
    });
  }

  function pendingChallengesReceived() {
    const observable = Value([]);

    gameDb.pendingChallengesReceived(myIdent).then(observable.set);

    const unlistenUpdates = myGameUpdates(() => gameDb.pendingChallengesReceived(myIdent)
      .then(observable.set));

    return computed(
      [observable], a => a, {
        comparer: compareGameSummaryLists,
        onUnlisten: unlistenUpdates,
      },
    );
  }

  function getMyGamesInProgress() {
    return getGamesInProgress(myIdent);
  }

  function gamesAgreedToPlaySummaries(playerId) {
    return gameDb.getGamesAgreedToPlayIds(playerId).then(gamesInProgress => Promise.all(
      gamesInProgress.map(gameSSBDao.getSmallGameSummary),
    ));
  }

  function getGamesInProgress(playerId) {
    const observable = MutantArray([]);
    gamesAgreedToPlaySummaries(playerId).then(g => observable.set(g.sort(compareGameTimestamps)));

    const playerGameUpdates = getGameUpdatesObservable(playerId);

    const unlistenUpdates = playerGameUpdates(
      newUpdate => updateObservableWithGameChange(
        () => gamesAgreedToPlaySummaries(playerId),
        newUpdate,
        observable,
      ),
    );

    return computed(
      [observable],
      a => a, {
        onUnlisten: unlistenUpdates,
      },
    );
  }

  function getFriendsObservableGames(startArg, endArg) {
    const observable = MutantArray([]);

    const start = startArg || 0;
    const end = endArg || 20;

    gameDb.getObservableGames(myIdent, start, end).then(
      gameIds => Promise.all(
        gameIds.map(gameSSBDao.getSmallGameSummary),
      ),
    ).then(a => a.sort(compareGameTimestamps)).then(observable.set);

    const observingUpdates = userGamesUpdateWatcher.latestGameMessageForOtherPlayersObs(myIdent);

    const unlistenObservingUpdates = observingUpdates(
      newUpdate => updateObservableWithGameChange(
        () => gameDb.getObservableGames(myIdent, start, end).then(
          gameIds => Promise.all(
            gameIds.map(gameSSBDao.getSmallGameSummary),
          ),
        ),
        newUpdate,
        observable,
      ),
    );

    return computed(
      [observable],
      a => a.sort(compareGameTimestamps), {
        comparer: compareGameSummaryLists,
        onUnlisten: unlistenObservingUpdates,
      },
    );
  }

  function updateObservableWithGameChange(summaryListPromiseFn, newUpdate, observable) {
    const type = newUpdate.value ? newUpdate.value.content.type : null;
    if (type === 'chess_move') {
      gameSSBDao.getSmallGameSummary(newUpdate.value.content.root).then(
        (summary) => {
          const { gameId } = summary;
          const idx = observable().findIndex(s => s.gameId === gameId);

          if (idx !== -1) {
            observable.put(idx, summary);
          } else {
            summaryListPromiseFn().then(g => observable.set(g.sort(compareGameTimestamps)));
          }
        },
      );
    } else {
      summaryListPromiseFn().then(g => observable.set(g.sort(compareGameTimestamps)));
    }
  }

  function compareGameSummaryLists(list1, list2) {
    if (!list1 || !list2) {
      return false;
    }

    list1 = list1 || [];
    list2 = list2 || [];

    const list1ids = list1.map(a => a.gameId);
    const list2ids = list2.map(a => a.gameId);

    return _.isEmpty(_.xor(list1ids, list2ids));
  }

  function filterGamesMyMove(gameSummaries) {
    return gameSummaries.filter(summary => summary.toMove === myIdent);
  }

  function compareGameTimestamps(g1, g2) {
    return g2.lastUpdateTime - g1.lastUpdateTime;
  }

  function getGamesWhereMyMove() {
    const myGamesInProgress = getMyGamesInProgress();

    return computed([myGamesInProgress],
      gamesInProgress => computed(
        [gamesInProgress],
        games => filterGamesMyMove(games).sort(compareGameTimestamps),
      ));
  }

  function getSituation(gameId) {
    return gameSSBDao.getSituation(gameId);
  }

  function getSituationObservable(gameId) {
    return gameSSBDao.getSituationObservable(gameId);
  }

  function getSituationSummaryObservable(gameId) {
    return gameSSBDao.getSituationSummaryObservable(gameId);
  }

  function getGameUpdatesObservable(ident) {
    if (ident === myIdent) {
      return myGameUpdates;
    }
    return userGamesUpdateWatcher.latestGameMessageForPlayerObs(ident);
  }

  return {
    getMyIdent,
    inviteToPlay,
    acceptChallenge,
    getGamesWhereMyMove,
    pendingChallengesSent,
    pendingChallengesReceived,
    getMyGamesInProgress,
    getGamesInProgress,
    getFriendsObservableGames,
    getSituation,
    getSituationObservable,
    getSituationSummaryObservable,
    getMoveCtrl: () => moveCtrl,
    getSocialCtrl: () => socialCtrl,
    getPlayerCtrl: () => playerCtrl,
    getRecentActivityCtrl: () => recentActivityCtrl,
    getMovesFinderCtrl: () => movesFinderCtrl,
    getPgnCtrl: () => pgnCtrl,
    getSbot: () => sbot,
  };
};
