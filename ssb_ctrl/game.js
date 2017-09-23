const filter = require('pull-stream/throughs/filter')
const pull = require("pull-stream");
const map = require("pull-stream/throughs/map");
const collect = require("pull-stream/sinks/collect");

const nest = require('depnest');

const computed = require("mutant/computed");
const when = require("mutant/when");
var Value = require('mutant/value')
const onceTrue = require("mutant/once-true")

var SocialCtrl = require("./social");
const MutantUtils = require("./mutant_utils")();

module.exports = (sbot, myIdent, injectedApi) => {

  const socialCtrl = SocialCtrl(sbot);

  function getPlayers(gameRootMessage) {
    return new Promise((resolve, reject) => {
      sbot.get(gameRootMessage, function(error, result) {
        if (error) {
          reject(error)
        } else {
          const authorId = result.author;
          const invited = result.content.inviting;

          const authorColour = result.content.myColor === "white" ? result.content.myColor : "black";
          const players = {};

          var names = Promise.all([authorId, invited].map(socialCtrl.getPlayerDisplayName));
          names.then(names => {
            players[authorId] = {};
            players[authorId].colour = authorColour;
            players[authorId].name = names[0];
            players[authorId].id = authorId;

            players[invited] = {};
            players[invited].colour = authorColour === "white" ? "black" : "white";
            players[invited].name = names[1];
            players[invited].id = invited;

            resolve(players);

          });
        }
      });

    })
  }

  function situationToSummary(gameSituation) {

    const summary = {
      gameId: gameSituation.gameId,
      fen: gameSituation.fen,
      players: gameSituation.players,
      toMove: gameSituation.toMove,
      status: gameSituation.status,
      lastMove: gameSituation.lastMove,
      check: gameSituation.check
    }

    return summary;
  }

  /*
   * Return just the FEN, players, and who's move it is.
   * This might be used for a miniboard view of a game, for example.
   */
  function getSmallGameSummary(gameRootMessage) {
    return MutantUtils.mutantToPromise(getSituationSummaryObservable(gameRootMessage));
  }

  function findGameStatus(gameMessages) {
    var result = gameMessages.find(msg => {
      return msg.value.content.type === "chess_game_end"
    });

    const status = {
      status: result != null && result.value.content.status ? result.value.content.status : "started",
      winner: result != null ? result.value.content.winner : null
    }

    return status;
  }

  //TODO: REMOVE
  function getGameStatus(gameRootMessage) {
    const source = sbot.links({
      dest: gameRootMessage,
      values: true,
      keys: false
    });

    return new Promise((resolve, reject) => {
      pull(source, pull.find(msg => msg.value.content.type === "chess_game_end", (err, result) => {
        if (err) {
          reject(err);
        } else {
          const status = {
            status: result != null && result.value.content.status ? result.value.content.status : "started",
            winner: result != null ? result.value.content.winner : null
          }

          resolve(status);
        }
      }));
    });
  }

  function filterByPlayerMoves(players, messages) {
    return messages.filter(msg => players.hasOwnProperty(msg.value.author) &&
      (msg.value.content.type === "chess_move" ||
        (msg.value.content.type === "chess_game_end" && msg.value.content.orig != null)));
  }

  function getPlayerToMove(players, numMoves) {
    const colourToMove = numMoves % 2 === 0 ? "white" : "black";

    const playerIds = Object.keys(players);

    for (var i = 0; i < playerIds.length; i++) {
      if (players[playerIds[i]].colour === colourToMove) {
        return playerIds[i];
      }
    }

  };

  function getSituationObservable(gameRootMessage) {
    const gameMessages = injectedApi.backlinks(gameRootMessage);
    const players = MutantUtils.promiseToMutant(getPlayers(gameRootMessage));

    return computed([players, gameMessages.sync, gameMessages], (players, synced, messages) => {
      if (!players || !synced) return null;

      var msgs = filterByPlayerMoves(players, messages);
      if (!msgs) msgs = [];

      // Sort in ascending ply so that we get a list of moves linearly
      msgs = msgs.sort((a, b) => a.value.content.ply - b.value.content.ply);

      var pgnMoves = msgs.map(msg => msg.value.content.pgnMove);
      var fenHistory = msgs.map(msg => msg.value.content.fen);
      fenHistory.unshift("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

      var status = findGameStatus(msgs);

      var origDests = msgs.map(msg => ({
        'orig': msg.value.content.orig,
        'dest': msg.value.content.dest
      }));

      var isCheck = msgs.length > 0 ? msgs[msgs.length - 1].value.content.pgnMove.indexOf('+') !== -1 : false;

      return {
        gameId: gameRootMessage,
        pgnMoves: pgnMoves,
        fenHistory: fenHistory,
        ply: pgnMoves.length,
        origDests: origDests,
        check: isCheck,
        fen: msgs.length > 0 ? msgs[msgs.length - 1].value.content.fen : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        players: players,
        toMove: getPlayerToMove(players, pgnMoves.length),
        status: status,
        lastMove: origDests.length > 0 ? origDests[origDests.length - 1] : null
      }
    });
  }

  function getSituationSummaryObservable(gameRootMessage) {
    return computed([getSituationObservable(gameRootMessage)], situation => {
      if (situation == null) {
        return null;
      } else {
        return situationToSummary(situation);
      }
    })
  }

  function getSituation(gameRootMessage) {
    return MutantUtils.mutantToPromise(getSituationObservable(gameRootMessage));
  }

  function makeMove(gameRootMessage, ply, originSquare, destinationSquare, promotion, pgnMove, fen) {
    const post = {
      type: 'chess_move',
      ply: ply,
      root: gameRootMessage,
      orig: originSquare,
      dest: destinationSquare,
      pgnMove: pgnMove,
      fen: fen
    }

    if (promotion) {
      post['promotion'] = promotion;
    }

    return new Promise((resolve, reject) => {

      sbot.publish(post, function(err, msg) {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      });
    })
  }

  function addPropertyIfNotEmpty(obj, key, value) {
    if (value) {
      obj[key] = value
    }
  }

  function resignGame(gameRootMessage) {
    const post = {
      type: 'chess_game_end',
      status: "resigned",
      root: gameRootMessage
    };

    return new Promise( (resolve, reject) => {
      sbot.publish(post, (err, msg) => {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      })
    })
  }

  function endGame(gameRootMessage, status, winner, fen, ply, originSquare, destinationSquare, pgnMove) {
    return new Promise((resolve, reject) => {

      const post = {
        type: 'chess_game_end',
        status: status,
        ply: ply,
        fen: fen,
        root: gameRootMessage
      };

      // If game aborted or agreed to draw / claimed draw, some of these
      // properties might not be relevant
      addPropertyIfNotEmpty(post, "winner", winner);
      addPropertyIfNotEmpty(post, "ply", ply);
      addPropertyIfNotEmpty(post, "orig", originSquare);
      addPropertyIfNotEmpty(post, "dest", destinationSquare);
      addPropertyIfNotEmpty(post, "pgnMove", pgnMove);

      sbot.publish(post, function(err, msg) {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      });

    });
  }

  return {
    getPlayers: getPlayers,
    getSituation: getSituation,
    getSituationObservable: getSituationObservable,
    getSituationSummaryObservable: getSituationSummaryObservable,
    getSmallGameSummary: getSmallGameSummary,
    makeMove: makeMove,
    resignGame: resignGame,
    endGame: endGame
  }

}
