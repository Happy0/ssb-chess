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
    var observable = Value([]);

    var challenges = gameDb.pendingChallengesSent(myIdent).then(observable.set);

    myGameUpdates(update => gameDb.pendingChallengesSent(myIdent).then(observable.set))

    return computed([observable], a => a, {comparer: compareGameSummaryLists});
  }

  function pendingChallengesReceived() {
    var observable = Value([]);

    gameDb.pendingChallengesReceived(myIdent).then(observable.set);

    myGameUpdates(update => gameDb.pendingChallengesReceived(myIdent).then(observable.set))

    return computed([observable], a => a, {comparer: compareGameSummaryLists});
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
    var observable = Value([]);
    gamesAgreedToPlaySummaries(playerId).then(observable.set);

    var playerGameUpdates = userGamesUpdateWatcher.latestGameMessageForPlayerObs(playerId);
    playerGameUpdates(newUpdate => gamesAgreedToPlaySummaries(playerId).then(observable.set))

    return computed([observable], a => a, {comparer: compareGameSummaryLists } );
  }

  function getMyFinishedGames(start, finish) {
    return getFinishedGames(myIdent, start, finish);
  }

  function getFinishedGames(playerId, start, finish) {
    // In the future, this would now just grab every single game then slice it
    // but would slice in a database query instead
    return gamesAgreedToPlaySummaries(playerId).then(summaries =>
      summaries.filter(summary => summary.status.status !== "started").slice(start, finish));
  }

  function getFriendsObservableGames(start, end) {
    var observable = Value([]);

    var start = start? start : 0;
    var end = end? end : 20

    // todo: make this sorted / update the observable
    gameDb.getObservableGames(myIdent, start, end).then(gameIds => Promise.all(
      gameIds.map(gameSSBDao.getSmallGameSummary)
    )).then(observable.set)

    return observable;
  }

  function compareGameSummaryLists(list1, list2) {
    list1 = list1 ? list1: [];
    list2 = list2? list2: [];

    var list1ids = list1.map(a => a.gameId);
    var list2ids = list2.map(a => a.gameId);

    return _.isEmpty(_.xor(list1ids, list2ids))
  }

  function filterGamesMyMove(gameSummaries) {
    return gameSummaries.filter(summary =>
      summary.toMove === myIdent
    )
  }

  function getGamesWhereMyMove() {
    var gamesWhereMyMove = Value([]);

    var playerGameUpdates = userGamesUpdateWatcher.latestGameMessageForPlayerObs(myIdent);

    getMyGamesInProgress()(
      myGamesSummaries => {
        var myMove = filterGamesMyMove(myGamesSummaries);
        gamesWhereMyMove.set(myMove);
    });

    playerGameUpdates( update => {
        getMyGamesInProgress()(
          myGamesSummaries => {
            var myMove = filterGamesMyMove(myGamesSummaries);
            gamesWhereMyMove.set(myMove);
        })
    })

    return computed([gamesWhereMyMove], a => a, {comparer: compareGameSummaryLists} );
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

  return {
    getMyIdent: getMyIdent,
    inviteToPlay: inviteToPlay,
    acceptChallenge: acceptChallenge,
    getGamesWhereMyMove: getGamesWhereMyMove,
    pendingChallengesSent: pendingChallengesSent,
    pendingChallengesReceived: pendingChallengesReceived,
    getMyGamesInProgress: getMyGamesInProgress,
    getGamesInProgress: getGamesInProgress,
    getFinishedGames: getFinishedGames,
    getMyFinishedGames: getMyFinishedGames,
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
