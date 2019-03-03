const ChessMsgUtils = require('../../ssb_model/chess_msg_utils')();

module.exports = function makeSituation(gameId, gameRootMessage, myIdent, players, gameMessages, currentRematchState) {

    let moveMessages = filterByPlayerMoves(players, gameMessages);
    if (!moveMessages) moveMessages = [];
    if (!gameMessages) gameMessages = [];

    // Sort in ascending ply so that we get a list of moves linearly
    moveMessages = moveMessages.sort((a, b) => a.value.content.ply - b.value.content.ply);

    const latestUpdate = gameMessages.reduce(msgWithBiggestTimestamp, null);

    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    const pgnMoves = moveMessages.map(msg => msg.value.content.pgnMove);
    const fenHistory = moveMessages.map(msg => msg.value.content.fen);
    fenHistory.unshift(startFen);

    const status = findGameStatus(players, gameMessages);

    const origDests = moveMessages.map(msg => ({
      orig: msg.value.content.orig,
      dest: msg.value.content.dest,
    }));

    const isCheck = moveMessages.length > 0 ? moveMessages[moveMessages.length - 1].value.content.pgnMove.indexOf('+') !== -1 : false;
    const isCheckmate = moveMessages.length > 0 ? moveMessages[moveMessages.length - 1].value.content.pgnMove.indexOf('#') !== -1 : false;

    return {
      gameId,
      rematchFrom: gameRootMessage.content.root,
      pgnMoves,
      fenHistory,
      ply: pgnMoves.length,
      origDests,
      check: isCheck || isCheckmate,
      fen: moveMessages.length > 0 ? moveMessages[moveMessages.length - 1].value.content.fen : startFen,
      players: players,
      toMove: getPlayerToMove(players, pgnMoves.length),
      status,
      lastMove: origDests.length > 0 ? origDests[origDests.length - 1] : null,
      lastUpdateTime: latestUpdate ? latestUpdate.value.timestamp : 0,
      latestUpdateMsg: latestUpdate ? latestUpdate.key : gameId,
      rematches: currentRematchState || [],
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
  }

  function mapColoursToPlayer(json) {
    const ret = {};
    Object.keys(json).forEach((key) => {
      ret[json[key].colour] = json[key];
    });
    return ret;
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