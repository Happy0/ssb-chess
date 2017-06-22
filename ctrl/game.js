const GameChallenger = require("../ssb_ctrl/game_challenge");
const GameSSBDao = require("../ssb_ctrl/game");
const uuidV4 = require('uuid/v4');
const Worker = require("tiny-worker");

var PubSub = require('pubsub-js');

module.exports = (sbot, myIdent) => {

    const chessWorker = new Worker('vendor/scalachessjs/scalachess.js');
    const gameSSBDao = GameSSBDao(sbot);
    const gameChallenger = GameChallenger(sbot, myIdent);

    function inviteToPlay(playerKey, asWhite) {
      return gameChallenger.inviteToPlay(playerKey, asWhite)
    }

    function acceptChallenge(rootGameMessage) {
      return gameChallenger.acceptChallenge(rootGameMessage);
    }

    function pendingChallengesSent() {
      return gameChallenger.pendingChallengesSent();
    }

    function pendingChallengesReceived() {
      return gameChallenger.pendingChallengesReceived();
    }

    function getMyGamesInProgress() {
      return getGamesInProgressIds(myIdent);
    }

    // todo: this returns summaries, not ids: rename.
    function getGamesInProgressIds(playerId) {
      return gameChallenger.getGamesInProgressIds(playerId).then(gamesInProgress => {
        return Promise.all(gamesInProgress.map(gameSSBDao.getSmallGameSummary));
      });
    }

    function getGamesWhereMyMove() {
      return getMyGamesInProgress().then(myGamesSummaries =>
        myGamesSummaries.filter(summary => summary.toMove === myIdent)
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
                destinationSquare: destinationSquare
              }

            });

          }
        });
      }

      function handleMoveResponse(e) {
        if (e.data.payload.error) {
          console.log("move error");
          console.dir(e);
          PubSub.publish("move_error", e.data.payload.error);
        } else {

          // This is a hack. Reqid is meant to be used for a string to identity
          // which request the response game from.
          const gameRootMessage = e.data.reqid.gameRootMessage;
          const originSquare = e.data.reqid.originSquare;
          const destinationSquare = e.data.reqid.destinationSquare;

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

      chessWorker.addEventListener('message', handleMoveResponse);

      return {
        inviteToPlay: inviteToPlay,
        acceptChallenge: acceptChallenge,
        getGamesWhereMyMove: getGamesWhereMyMove,
        pendingChallengesSent: pendingChallengesSent,
        pendingChallengesReceived: pendingChallengesReceived,
        getMyGamesInProgress: getMyGamesInProgress,
        getGamesInProgressIds: getGamesInProgressIds,
        getSituation: getSituation,
        makeMove: makeMove
      }

    }
