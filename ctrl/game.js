const GameChallenger = require("../ssb_ctrl/game_challenge");
const GameSSBDao = require("../ssb_ctrl/game");
const GameUpdateListener = require("../ssb_ctrl/games_update_listener");
const uuidV4 = require('uuid/v4');
const Worker = require("tiny-worker");

const GameDb = require("../db/game_db");

var PubSub = require('pubsub-js');

const PlayerModelUtils = require('./player_model_utils')();

module.exports = (sbot, myIdent, db) => {

  const chessWorker = new Worker('vendor/scalachessjs/scalachess.js');
  const gameSSBDao = GameSSBDao(sbot, myIdent);
  const gameChallenger = GameChallenger(sbot, myIdent);

  const gameDb = GameDb(sbot, db);
  gameDb.loadGameSummariesIntoDatabase();

  const gameUpdateListener = GameUpdateListener(sbot);

  function getMyIdent() {
    return myIdent;
  }

  function startPublishingBoardUpdates() {
    gameUpdateListener.listenForBoardUpdates();
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

  function getGamesWhereMyMove() {
    return getMyGamesInProgress().then(myGamesSummaries =>
      myGamesSummaries.filter(summary =>
        summary.toMove === myIdent)
    )
  }

  function getSituation(gameId) {
    return gameSSBDao.getSituation(gameId);
  }

  function makeMove(gameRootMessage, originSquare, destinationSquare) {

    gameSSBDao.getSituation(gameRootMessage).then(situation => {
      if (situation.toMove !== myIdent) {
        console.log("Not " + myIdent + " to move");
      } else {

        const pgnMoves = situation.pgnMoves;
        chessWorker.postMessage({
          'topic': 'move',
          'payload': {
            'fen': situation.fen,
            'pgnMoves': pgnMoves,
            'orig': originSquare,
            'dest': destinationSquare
          },
          reqid: {
            gameRootMessage: gameRootMessage,
            originSquare: originSquare,
            destinationSquare: destinationSquare,
            previousSituation: situation
          }

        });

      }
    });
  }

  function handleChessWorkerResponse(e) {
    // This is a hack. Reqid is meant to be used for a string to identity
    // which request the response game from.
    const gameRootMessage = e.data.reqid.gameRootMessage;
    const originSquare = e.data.reqid.originSquare;
    const destinationSquare = e.data.reqid.destinationSquare;

    if (e.data.payload.error) {
      console.log("move error");
      console.dir(e);
      PubSub.publish("move_error", e.data.payload.error);
    } else if (e.data.topic === 'dests') {

      var gameId = e.data.reqid.gameRootMessage;
      var validDests = e.data.payload.dests;

      console.log("Publishing valid moves");
      console.dir(validDests);

      PubSub.publish("valid_moves", {
        gameId: gameId,
        validMoves: validDests
      })

    } else if (e.data.payload.situation.end) {

      var status = e.data.payload.situation.status;
      var winner = e.data.payload.situation.winner;
      var ply = e.data.payload.situation.ply;
      var fen = e.data.payload.situation.fen;
      var players = e.data.reqid.previousSituation.players;

      var pgnMove = ply > 0 ? e.data.payload.situation.pgnMoves[e.data.payload.situation.pgnMoves.length - 1] : null;

      var coloursToPlayer = PlayerModelUtils.coloursToPlayers(players);

      // TODO: test this still works after some refactoring
      var winnerId = winner ? coloursToPlayer[winner].id : null;

      gameSSBDao.endGame(gameRootMessage, status.name, winnerId, fen, ply,
        originSquare, destinationSquare, pgnMove).then(dc => {
        getSituation(gameRootMessage).then(situation =>
          PubSub.publish("game_end", situation))
      });


    } else {

      gameSSBDao.makeMove(
        gameRootMessage,
        e.data.payload.situation.ply,
        originSquare,
        destinationSquare,
        e.data.payload.situation.pgnMoves[e.data.payload.situation.pgnMoves.length - 1],
        e.data.payload.situation.fen
      ).then(dc => {
        getSituation(gameRootMessage).then(situation => PubSub.publish("move", situation));
      });
    }
  }

  function publishValidMoves(situation) {
    var gameFen = situation.fen;

    chessWorker.postMessage({
      topic: 'dests',
      payload: {
        'fen': gameFen
      },
      reqid: {
        gameRootMessage: situation.gameId
      }
    })
  }

  chessWorker.addEventListener('message', handleChessWorkerResponse);

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
    getSituation: getSituation,
    makeMove: makeMove,
    startPublishingBoardUpdates: startPublishingBoardUpdates,
    publishValidMoves: publishValidMoves
  }

}
