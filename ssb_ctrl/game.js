const computed = require('mutant/computed');

const SocialCtrl = require('./social');
const MutantUtils = require('./mutant_utils')();
const ChessMsgUtils = require('../ssb_model/chess_msg_utils')();

const getFilteredBackLinks = require('./backlinks_obs')();

module.exports = (sbot, myIdent) => {
  const socialCtrl = SocialCtrl(sbot);

  function getPlayers(gameRootMessage) {
    return new Promise((resolve, reject) => {
      sbot.get(gameRootMessage, (error, result) => {
        if (error) {
          reject(error);
        } else {
          const authorId = result.author;
          const invited = result.content.inviting;

          const authorColour = result.content.myColor === 'white' ? result.content.myColor : 'black';
          const players = {};

          Promise.all([authorId, invited].map(socialCtrl.getPlayerDisplayName))
            .then((names) => {
              players[authorId] = {};
              players[authorId].colour = authorColour;
              [players[authorId].name] = names;
              players[authorId].id = authorId;

              players[invited] = {};
              players[invited].colour = authorColour === 'white' ? 'black' : 'white';
              [, players[invited].name] = names;
              players[invited].id = invited;

              resolve(players);
            });
        }
      });
    });
  }

  function situationToSummary(gameSituation) {
    const summary = {
      gameId: gameSituation.gameId,
      fen: gameSituation.fen,
      players: gameSituation.players,
      toMove: gameSituation.toMove,
      status: gameSituation.status,
      lastMove: gameSituation.lastMove,
      check: gameSituation.check,
      lastUpdateTime: gameSituation.lastUpdateTime,
      coloursToPlayer: gameSituation.coloursToPlayer
    };

    return summary;
  }

  /*
   * Return just the FEN, players, and who's move it is.
   * This might be used for a miniboard view of a game, for example.
   */
  function getSmallGameSummary(gameRootMessage) {
    return MutantUtils.mutantToPromise(getSituationSummaryObservable(gameRootMessage));
  }

  function findGameStatus(players, gameMessages) {
    const gameFinishedMsg = gameMessages.find(msg => msg.value.content.type === 'chess_game_end');

    const inviteAcceptMsg = gameMessages.find(msg => msg.value.content.type === 'chess_invite_accept');

    let gameStatus = 'invited';
    if (gameFinishedMsg) {
      gameStatus = gameFinishedMsg.value.content.status;
    } else if (inviteAcceptMsg) {
      gameStatus = 'started';
    }


    const status = {
      status: gameStatus,
      winner: gameFinishedMsg != null
        ? ChessMsgUtils.winnerFromEndMsgPlayers(
          Object.keys(players),
          gameFinishedMsg,
        ) : null,
    };

    return status;
  }

  function filterByPlayerMoves(players, messages) {
    return messages.filter(msg => ({}).hasOwnProperty.call(players, msg.value.author)
      && (msg.value.content.type === 'chess_move'
        || (msg.value.content.type === 'chess_game_end' && msg.value.content.orig != null)));
  }

  function getPlayerToMove(players, numMoves) {
    const colourToMove = numMoves % 2 === 0 ? 'white' : 'black';

    const playerIds = Object.keys(players);

    for (let i = 0; i < playerIds.length; i += 1) {
      if (players[playerIds[i]].colour === colourToMove) {
        return playerIds[i];
      }
    }

    throw new Error('Unable to find player ID', colourToMove);
  }

  /**
  * Returns 'true' if the given scuttlebutt message is something that changes
  * the chess board situation. For example, a move or invite. Returns false
  * for messages that do not modify the situation (such as chat messages.)
  */
  function isSituationalChessMessage(msg) {
    if (!msg.value || !msg.value.content) {
      return false;
    }

    const relevantMessageTypes = [
      'chess_invite',
      'chess_invite_accept',
      'chess_move',
      'chess_game_end'];

    const messageType = msg.value.content.type;
    const isSituationMsg = relevantMessageTypes.find(m => m === messageType);
    return isSituationMsg !== undefined;
  }

  function getSituationObservable(gameRootMessage) {
    const gameMessages = getFilteredBackLinks(gameRootMessage, {
      filter: isSituationalChessMessage,
    });

    const players = MutantUtils.promiseToMutant(getPlayers(gameRootMessage));

    return computed([players, gameMessages.sync, gameMessages],
      (p, synced, messages) => {
        if (!p || !synced) return null;

        // TODO: use an IDE that makes it easy to rename variables and rename 'msgs'
        // to 'move messages';
        let msgs = filterByPlayerMoves(p, messages);
        if (!msgs) msgs = [];
        if (!messages) messages = [];

        // Sort in ascending ply so that we get a list of moves linearly
        msgs = msgs.sort((a, b) => a.value.content.ply - b.value.content.ply);

        const latestUpdate = messages.reduce(msgWithBiggestTimestamp, null);

        const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

        const pgnMoves = msgs.map(msg => msg.value.content.pgnMove);
        const fenHistory = msgs.map(msg => msg.value.content.fen);
        fenHistory.unshift(startFen);

        const status = findGameStatus(p, messages);

        const origDests = msgs.map(msg => ({
          orig: msg.value.content.orig,
          dest: msg.value.content.dest,
        }));

        const isCheck = msgs.length > 0 ? msgs[msgs.length - 1].value.content.pgnMove.indexOf('+') !== -1 : false;
        const isCheckmate = msgs.length > 0 ? msgs[msgs.length - 1].value.content.pgnMove.indexOf('#') !== -1 : false;

        return {
          gameId: gameRootMessage,
          pgnMoves,
          fenHistory,
          ply: pgnMoves.length,
          origDests,
          check: isCheck || isCheckmate,
          fen: msgs.length > 0 ? msgs[msgs.length - 1].value.content.fen : startFen,
          players: p,
          toMove: getPlayerToMove(p, pgnMoves.length),
          status,
          lastMove: origDests.length > 0 ? origDests[origDests.length - 1] : null,
          lastUpdateTime: latestUpdate ? latestUpdate.value.timestamp : 0,
          latestUpdateMsg: latestUpdate ? latestUpdate.key : gameRootMessage,
          isCheckOnMoveNumber(moveNumber) {
            const arrIdx = moveNumber - 1;
            return this.pgnMoves[arrIdx] != null && (this.pgnMoves[arrIdx].indexOf('+') !== -1 || this.pgnMoves[arrIdx].indexOf('#') !== -1);
          },
          getInitialFen() {
            return startFen;
          },
          getWhitePlayer() {
            return Object.values(this.players).find(player => player.colour === 'white');
          },
          getBlackPlayer() {
            return Object.values(this.players).find(player => player.colour === 'black');
          },
          hasPlayer(id) {
            return this.players[id] != null;
          },
          currentPlayerIsInGame() {
            return this.players[myIdent] != null;
          },
          coloursToPlayer() {
            return mapColoursToPlayer(this.players);
          },
          getOtherPlayer(id) {
            let otherPlayer;
            Object.keys(this.players).forEach((k) => {
              if (k !== id) {
                otherPlayer = this.players[k];
              }
            });

            return otherPlayer;
          },
        };
      });
  }

  function msgWithBiggestTimestamp(msg1, msg2) {
    if (msg1 == null) {
      return msg2;
    } if (msg2 == null) {
      return msg1;
    } if (msg1.value.timestamp > msg2.value.timestamp) {
      return msg1;
    }
    return msg2;
  }

  function getSituationSummaryObservable(gameRootMessage) {
    return computed([getSituationObservable(gameRootMessage)], (situation) => {
      if (situation == null) {
        return null;
      }
      return situationToSummary(situation);
    });
  }

  function getSituation(gameRootMessage) {
    return MutantUtils.mutantToPromise(getSituationObservable(gameRootMessage));
  }

  function makeMove(
    gameRootMessage,
    ply,
    originSquare,
    destinationSquare,
    promotion,
    pgnMove,
    fen,
    respondsTo,
  ) {
    const post = {
      type: 'chess_move',
      ply,
      root: gameRootMessage,
      orig: originSquare,
      dest: destinationSquare,
      pgnMove,
      fen,
    };

    if (promotion) {
      post.promotion = promotion;
    }

    if (respondsTo) {
      post.branch = respondsTo;
    }

    return new Promise((resolve, reject) => {
      sbot.publish(post, (err, msg) => {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      });
    });
  }

  function addPropertyIfNotEmpty(obj, key, value) {
    if (value) {
      obj[key] = value;
    }
  }

  function resignGame(gameRootMessage, respondsTo) {
    const post = {
      type: 'chess_game_end',
      status: 'resigned',
      root: gameRootMessage,
    };

    addPropertyIfNotEmpty(post, 'branch', respondsTo);

    return new Promise((resolve, reject) => {
      sbot.publish(post, (err, msg) => {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      });
    });
  }

  function endGame(
    gameRootMessage,
    status,
    winner,
    fen,
    ply,
    originSquare,
    destinationSquare,
    pgnMove,
    respondsTo,
  ) {
    return new Promise((resolve, reject) => {
      const post = {
        type: 'chess_game_end',
        status,
        ply,
        fen,
        root: gameRootMessage,
      };

      // If game aborted or agreed to draw / claimed draw, some of these
      // properties might not be relevant
      addPropertyIfNotEmpty(post, 'winner', winner);
      addPropertyIfNotEmpty(post, 'ply', ply);
      addPropertyIfNotEmpty(post, 'orig', originSquare);
      addPropertyIfNotEmpty(post, 'dest', destinationSquare);
      addPropertyIfNotEmpty(post, 'pgnMove', pgnMove);
      addPropertyIfNotEmpty(post, 'branch', respondsTo);

      sbot.publish(post, (err, msg) => {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      });
    });
  }

  function mapColoursToPlayer(json) {
    const ret = {};
    Object.keys(json).forEach((key) => {
      ret[json[key].colour] = json[key];
    });
    return ret;
  }

  return {
    getPlayers,
    getSituation,
    getSituationObservable,
    getSituationSummaryObservable,
    getSmallGameSummary,
    makeMove,
    resignGame,
    endGame,
  };
};
