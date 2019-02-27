const computed = require('mutant/computed');

const MutantUtils = require('./mutant_utils')();

const MutantArray = require('mutant/array');

const makeSituation = require('./model/situation');

module.exports = (sbot, myIdent, backlinkUtils, socialCtrl) => {

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

          Promise.all([authorId, invited].map(socialCtrl.getDisplayName))
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

    const gameMessages = backlinkUtils.getFilteredBackLinks(gameRootMessage, {
      filter: isSituationalChessMessage,
    });

    const players = MutantUtils.promiseToMutant(getPlayers(gameRootMessage));

    const rematchState = getRematchState(gameMessages);

    return computed([gameRootMessage, myIdent, players, gameMessages, gameMessages.sync, rematchState], (
      gameId, ident, p, gameMessagesBacklinks, isSynced, rematchInfo

    ) => {
      if (!isSynced || !p) return null;
      return makeSituation(gameId, ident, p, gameMessagesBacklinks, rematchInfo)
    });
  }

  function getRematchState(gameMessagesObservable) {
    return computed([gameMessagesObservable], (gameMessages) => {

      if (!gameMessages) return [];

      const rematchInvites = gameMessages.filter(msg => msg.value.content.type === "chess_invite" && msg.value.content.root !== null);

      const gameStates = rematchInvites.map(msg => {

        var situation = getSituationSummaryObservable(msg.key);

        return computed([situation], gameState => {
          if (!gameState) return {
            status: "pending"
          };

          return {
            gameId: msg.key,
            status: gameState.status.status === "invited" ? "invited" : "accepted",
            isMyInvite: msg.value.author === myIdent
          }
        })

      });

      return MutantArray(gameStates);
    });
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
