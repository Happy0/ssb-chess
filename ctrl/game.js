const GameChallenger = require("../ssb_ctrl/game_challenge");
const GameSSBDao = require("../ssb_ctrl/game");
const uuidV4 = require('uuid/v4');
const Worker = require("tiny-worker");

const GameDb = require('../db/game_db');
const SocialCtrl = require('./social');
const PlayerCtrl = require('./player');
const MoveCtrl = require('./game_move');

var PubSub = require('pubsub-js');

const PlayerModelUtils = require('./player_model_utils')();
const UserGamesUpdateWatcher = require('./user_game_updates_watcher');

const Value = require('mutant/value');
const computed = require('mutant/computed');

const MutantUtils = require('../utils/mutant_utils')();

const _ = require('lodash');

module.exports = (sbot, myIdent, injectedApi) => {

  const gameSSBDao = GameSSBDao(sbot, myIdent, injectedApi);
  const gameChallenger = GameChallenger(sbot, myIdent);
  const gameDb = GameDb(sbot);
  const moveCtrl = MoveCtrl(gameSSBDao, myIdent);

  const socialCtrl = SocialCtrl(sbot, myIdent);
  const playerCtrl = PlayerCtrl(sbot, gameDb, gameSSBDao);

  const userGamesUpdateWatcher = UserGamesUpdateWatcher(sbot);

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

    var originalChallenges = MutantUtils.promiseToMutant(gameDb.pendingChallengesSent(myIdent))
    return computed([originalChallenges, myGameUpdates], (original, newUpdate) => {
      if (newUpdate) {
        return MutantUtils.promiseToMutant(gameDb.pendingChallengesSent(myIdent));
      } else {
        return original;
      }
    }, {
      comparer: compareGameSummaryLists
    });
  }

  function pendingChallengesReceived() {
    var originalChallenges = MutantUtils.promiseToMutant(gameDb.pendingChallengesReceived(myIdent))
    return computed([originalChallenges, myGameUpdates], (original, newUpdate) => {
      if (newUpdate) {
        return MutantUtils.promiseToMutant(gameDb.pendingChallengesReceived(myIdent));
      } else {
        return original;
      }
    }, {
      comparer: compareGameSummaryLists
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
    var playerGameUpdates = getPlayerGameUpdatesObservable(playerId);

    var originalGames = MutantUtils.promiseToMutant(
      gamesAgreedToPlaySummaries(playerId).then(
        summaries => summaries.sort(compareGameTimestamps)
      )
    );

    return computed(
      [originalGames, playerGameUpdates], (original, newUpdate) => {
        if (newUpdate) {
          return MutantUtils.promiseToMutant(
            gamesAgreedToPlaySummaries(playerId).then(
              summaries => summaries.sort(compareGameTimestamps)
            )
          );
        } else {
          return original;
        }
      }, {
        comparer: compareGameSummaryLists
      }
    );
  }

  function getFriendsObservableGames(start, end) {
    var observable = Value([]);

    var start = start ? start : 0;
    var end = end ? end : 20

    // todo: make this sorted / update the observable
    gameDb.getObservableGames(myIdent, start, end).then(gameIds => Promise.all(
      gameIds.map(gameSSBDao.getSmallGameSummary)
    )).then(observable.set)

    return computed(
      [observable],
      a => a.sort(compareGameTimestamps), {
        comparer: compareGameSummaryLists
      }
    );
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
    var playerGameUpdates = getPlayerGameUpdatesObservable(myIdent);

    return computed(
      [getMyGamesInProgress(), playerGameUpdates], (myGames, playerGameUpdates) => {
        var myMove = filterGamesMyMove(myGames);
        return myMove.sort(compareGameTimestamps);
      }, {
        comparer: compareGameSummaryLists,
        defaultValue: []
      });
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

  function getPlayerGameUpdatesObservable(playerId) {
    if (playerId === myIdent) {
      return myGameUpdates
    } else {
      return userGamesUpdateWatcher.latestGameMessageForPlayerObs(playerId);
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
    getSbot: () => sbot
  }

}
