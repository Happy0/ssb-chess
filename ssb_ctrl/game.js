const computed = require('mutant/computed');
const MutantUtils = require('./mutant_utils')();
const MutantArray = require('mutant/array');
const makeSituation = require('./model/situation');
const Value = require('mutant/value');

module.exports = (dataAccess, myIdent, backlinkUtils, socialCtrl) => {

  function getPlayers(gameRootMessage) {
    return new Promise((resolve, reject) => {
          const authorId = gameRootMessage.author;
          const invited = gameRootMessage.content.inviting;

          const authorColour = gameRootMessage.content.myColor === 'white' ? gameRootMessage.content.myColor : 'black';
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
  function getSmallGameSummary(gameId) {
    return MutantUtils.mutantToPromise(getSituationSummaryObservable(gameId));
  }

  /**
  * Returns 'true' if the given scuttlebutt message is something that changes
  * the chess board situation. For example, a move or invite accept. Returns false
  * for messages that do not modify the situation (such as chat messages.)
  */
  function isSituationalChessMessage(msg) {
    if (!msg.value || !msg.value.content) {
      return false;
    }

    const relevantMessageTypes = [
      'chess_invite_accept',
      'chess_move',
      'chess_game_end'];

    const messageType = msg.value.content.type;
    const isSituationMsg = relevantMessageTypes.find(m => m === messageType);
    return isSituationMsg !== undefined;
  }

  function getSituationObservable(gameId) {

    const gameMessages = backlinkUtils.getFilteredBackLinks(gameId, {
      filter: isSituationalChessMessage,
    });

    const msgRoot = getRootMessage(gameId);

    const players = computed([msgRoot], (msg) => {
        // msg may be null if we don't have the root message yet.
        if (!msg) return null;
        else return MutantUtils.promiseToMutant(getPlayers(msg))
      }
    );

    const rematchState = getRematchState(gameId, gameMessages);

    return computed([msgRoot, myIdent, players, gameMessages, gameMessages.sync, rematchState], (
      rootMessage, ident, p, gameMessagesBacklinks, isSynced, rematchInfo

    ) => {
      if (!rootMessage || !isSynced || !p) return null;
      return makeSituation(gameId, rootMessage, ident, p, gameMessagesBacklinks, rematchInfo)
    });
  }

  function getRootMessage(gameId) {
    var result = Value();

    dataAccess.getInviteMessage(gameId, (err, msg) => {
      if (msg) {
        result.set(msg);
      } else {
        console.log(err);

        // It's possible to get the reply to the first invite message before the root
        // message in rare cases, which can result in an error (because the message)
        // isn't found - so we just return null and then return null for the whole
        // observable
        return null;
      }
    });

    return result;
  }

  function getRematchState(gameId, gameMessagesObservable) {
    return computed([gameMessagesObservable], (gameMessages) => {

      if (!gameMessages) return [];

      const rematchInvites = gameMessages.filter(msg => msg.value.content.type === "chess_invite" && msg.value.content.root === gameId);

      const gameStates = rematchInvites.map(msg => {

        var situation = getSituationSummaryObservable(msg.key);

        return computed([situation], gameState => {

          // This observable value is initially pending until we've fetched the necessary data to know whether the invite
          // has been accepted or not
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

  function getSituationSummaryObservable(gameId) {
    return computed([getSituationObservable(gameId)], (situation) => {
      if (situation == null) {
        return null;
      }
      return situationToSummary(situation);
    });
  }

  function getSituation(gameId) {
    return MutantUtils.mutantToPromise(getSituationObservable(gameId));
  }

  function makeMove(
    gameId,
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
      root: gameId,
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
      dataAccess.publishPublicChessMessage(post, (err, msg) => {
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

  function resignGame(gameId, respondsTo) {
    const post = {
      type: 'chess_game_end',
      status: 'resigned',
      root: gameId,
    };

    addPropertyIfNotEmpty(post, 'branch', respondsTo);

    return new Promise((resolve, reject) => {
      dataAccess.publishPublicChessMessage(post, (err, msg) => {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      });
    });
  }

  function endGame(
    gameId,
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
        root: gameId,
      };

      // If game aborted or agreed to draw / claimed draw, some of these
      // properties might not be relevant
      addPropertyIfNotEmpty(post, 'winner', winner);
      addPropertyIfNotEmpty(post, 'ply', ply);
      addPropertyIfNotEmpty(post, 'orig', originSquare);
      addPropertyIfNotEmpty(post, 'dest', destinationSquare);
      addPropertyIfNotEmpty(post, 'pgnMove', pgnMove);
      addPropertyIfNotEmpty(post, 'branch', respondsTo);

      dataAccess.publishPublicChessMessage(post, (err, msg) => {
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
