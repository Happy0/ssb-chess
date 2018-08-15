const GameChallenger = require("../ssb_ctrl/game_challenge");
const GameSSBDao = require("../ssb_ctrl/game");
const uuidV4 = require('uuid/v4');

const GameDb = require('../db/game_db');
const SocialCtrl = require('./social');
const PlayerCtrl = require('./player');
const MoveCtrl = require('./game_move');
const RecentActivityCtrl = require('./recentActivityCtrl');
const PgnCtrl = require('./pgn');
const MovesFinder = require("./valid_moves_finder");

var PubSub = require('pubsub-js');

const PlayerModelUtils = require('./player_model_utils')();
const UserGamesUpdateWatcher = require('./user_game_updates_watcher');

const Value = require('mutant/value');
const MutantArray = require('mutant/array');
const computed = require('mutant/computed');

const _ = require('lodash');

module.exports = (sbot, myIdent, injectedApi) => {

  var rootDir = __dirname.replace("ctrl","") + "/";
  const chessWorker = new Worker(rootDir + 'vendor/scalachessjs/scalachess.js');

  const gameSSBDao = GameSSBDao(sbot, myIdent, chessWorker);
  const gameChallenger = GameChallenger(sbot, myIdent);
  const gameDb = GameDb(sbot);
  const moveCtrl = MoveCtrl(gameSSBDao, myIdent, chessWorker);
  const pgnCtrl = PgnCtrl(gameSSBDao);

  const socialCtrl = SocialCtrl(sbot, myIdent);
  const playerCtrl = PlayerCtrl(sbot, gameDb, gameSSBDao);

  const movesFinderCtrl = MovesFinder(chessWorker);

  const userGamesUpdateWatcher = UserGamesUpdateWatcher(sbot);
  const recentActivityCtrl = RecentActivityCtrl(userGamesUpdateWatcher, getSituationObservable, myIdent);

  function getMyIdent() {
    return myIdent;
  }

  function inviteToPlay(playerKey, asWhite) {
    return gameChallenger.inviteToPlay(playerKey, asWhite)
  }

  function acceptChallenge(rootGameMessage) {
    console.log("accepting invite " + rootGameMessage);
    return gameChallenger.acceptChallenge(rootGameMessage);
  }

  var myGameUpdates = userGamesUpdateWatcher.latestGameMessageForPlayerObs(myIdent);

  function pendingChallengesSent() {
    var observable = Value([]);

    var challenges = gameDb.pendingChallengesSent(myIdent).then(observable.set);

    var unlistenUpdates = myGameUpdates(update => gameDb.pendingChallengesSent(myIdent).then(observable.set))

    return computed([observable], a => a, {
      comparer: compareGameSummaryLists,
      onUnlisten: unlistenUpdates
    });
  }

  function pendingChallengesReceived() {
    var observable = Value([]);

    gameDb.pendingChallengesReceived(myIdent).then(observable.set);

    var unlistenUpdates = myGameUpdates(update => gameDb.pendingChallengesReceived(myIdent).then(observable.set))

    return computed(
      [observable], a => a, {
        comparer: compareGameSummaryLists,
        onUnlisten: unlistenUpdates
      });
  }

  function getMyGamesInProgress() {
    return getGamesInProgress(myIdent);
  }

  function gamesAgreedToPlaySummaries(playerId) {
    return gameDb.getGamesAgreedToPlayIds(playerId).then(gamesInProgress => {
      return Promise.all(
        gamesInProgress.map(gameSSBDao.getSmallGameSummary)
      )
    });
  }

  function getGamesInProgress(playerId) {
    var observable = MutantArray([]);
    gamesAgreedToPlaySummaries(playerId).then(g => observable.set(g.sort(compareGameTimestamps)));

    var playerGameUpdates = getGameUpdatesObservable(playerId);

    var unlistenUpdates = playerGameUpdates(
      newUpdate => updateObservableWithGameChange(
        () => gamesAgreedToPlaySummaries(playerId),
        newUpdate,
        observable)
    )

    return computed(
      [observable],
      a => a, {
        onUnlisten: unlistenUpdates
      }
    );
  }

  function getFriendsObservableGames(start, end) {
    var observable = MutantArray([]);

    var start = start ? start : 0;
    var end = end ? end : 20

    gameDb.getObservableGames(myIdent, start, end).then(
      gameIds => Promise.all(
        gameIds.map(gameSSBDao.getSmallGameSummary)
    )).then(a => a.sort(compareGameTimestamps)).then(observable.set)

    var observingUpdates = userGamesUpdateWatcher.latestGameMessageForOtherPlayersObs(myIdent);

    var unlistenObservingUpdates = observingUpdates(
      newUpdate => updateObservableWithGameChange(
        () => gameDb.getObservableGames(myIdent, start, end).then(
          gameIds => Promise.all(
            gameIds.map(gameSSBDao.getSmallGameSummary)
        )),
        newUpdate,
        observable)
    )

    return computed(
      [observable],
      a => a.sort(compareGameTimestamps), {
        comparer: compareGameSummaryLists,
        onUnlisten: unlistenObservingUpdates
      }
    );
  }

  function updateObservableWithGameChange(summaryListPromiseFn, newUpdate, observable) {
    var type = newUpdate.value ? newUpdate.value.content.type : null;
    if (type === "chess_move") {
      gameSSBDao.getSmallGameSummary(newUpdate.value.content.root).then(
        summary => {
          var gameId = summary.gameId;
          var idx = observable().findIndex(summary => summary.gameId === gameId);

          if (idx !== -1) {
            observable.put(idx, summary);
          } else {
            summaryListPromiseFn().then(g =>
              observable.set(g.sort(compareGameTimestamps)
            ))
          }
        }
      )
    } else {
      summaryListPromiseFn().then(g => observable.set(g.sort(compareGameTimestamps)))
    }
  }

  function compareGameSummaryLists(list1, list2) {
    if (!list1 || !list2) {
      return false;
    }

    list1 = list1 ? list1 : [];
    list2 = list2 ? list2 : [];

    var list1ids = list1.map(a => a.gameId);
    var list2ids = list2.map(a => a.gameId);

    return _.isEmpty(_.xor(list1ids, list2ids))
  }

  function filterGamesMyMove(gameSummaries) {
    return gameSummaries.filter(summary =>
      summary.toMove === myIdent
    )
  }

  function compareGameTimestamps(g1, g2) {
    return g2.lastUpdateTime - g1.lastUpdateTime;
  }

  function getGamesWhereMyMove() {

    var myGamesInProgress = getMyGamesInProgress();

    return computed([myGamesInProgress],
      (gamesInProgress) => {
        return computed(
          [gamesInProgress],
           games => filterGamesMyMove(games).sort(compareGameTimestamps))
      }
    );
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
    } else {
      return userGamesUpdateWatcher.latestGameMessageForPlayerObs(ident);
    }
  }

  return {
    getMyIdent: getMyIdent,
    inviteToPlay: inviteToPlay,
    acceptChallenge: acceptChallenge,
    getGamesWhereMyMove: getGamesWhereMyMove,
    pendingChallengesSent: pendingChallengesSent,
    pendingChallengesReceived: pendingChallengesReceived,
    getMyGamesInProgress: getMyGamesInProgress,
    getGamesInProgress: getGamesInProgress,
    getFriendsObservableGames: getFriendsObservableGames,
    getSituation: getSituation,
    getSituationObservable: getSituationObservable,
    getSituationSummaryObservable: getSituationSummaryObservable,
    getMoveCtrl: () => moveCtrl,
    getSocialCtrl: () => socialCtrl,
    getPlayerCtrl: () => playerCtrl,
    getRecentActivityCtrl: () => recentActivityCtrl,
    getMovesFinderCtrl: () => movesFinderCtrl,
    getPgnCtrl: () => pgnCtrl,
    getSbot: () => sbot
  }

}
