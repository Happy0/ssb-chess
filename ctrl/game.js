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

module.exports = (sbot, myIdent, injectedApi) => {

  const gameSSBDao = GameSSBDao(sbot, myIdent, injectedApi);
  const gameChallenger = GameChallenger(sbot, myIdent);
  const gameDb = GameDb(sbot);
  const moveCtrl = MoveCtrl(gameSSBDao, myIdent);

  const socialCtrl = SocialCtrl(sbot, myIdent);
  const playerCtrl = PlayerCtrl(sbot, gameDb, gameSSBDao);

  const userGamesUpdateWatcher = UserGamesUpdateWatcher(sbot);
  var myLiveGameEventsObserverable = userGamesUpdateWatcher.latestGameMessageForPlayerObs(myIdent);

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

  function pendingChallengesSent() {
    var challenges = gameDb.pendingChallengesSent(myIdent);
    return challenges;
  }

  function pendingChallengesReceived() {
    return gameDb.pendingChallengesReceived(myIdent);
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
    return gamesAgreedToPlaySummaries(playerId).then(summaries =>
      summaries.filter(summary => summary.status.status === "started"));
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
    var start = start? start : 0;
    var end = end? end : 20

    return gameDb.getObservableGames(myIdent, start, end).then(gameIds => Promise.all(
      gameIds.map(gameSSBDao.getSmallGameSummary)
    ))
  }

  function getGamesWhereMyMove() {
    return getMyGamesInProgress().then(myGamesSummaries =>
      myGamesSummaries.filter(summary =>
        summary.toMove === myIdent)
    )
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
