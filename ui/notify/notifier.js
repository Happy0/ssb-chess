const pull = require('pull-stream');
const onceTrue = require('mutant/once-true');
const notify = require('./notify')();
const userLocationUtils = require('../viewer_perspective/user_location')();

module.exports = (mainCtrl) => {
  const me = mainCtrl.getMyIdent();

  const userGamesWatcher = mainCtrl.getUserGameWatcherCtrl();

  function getOpponentName(situation, msg) {
    return situation.players[msg.value.author] ? situation.players[msg.value.author].name : '';
  }

  function notifyIfRelevant(gameMsg) {
    if (!userLocationUtils.chessAppIsVisible()) {
      const gameId = gameMsg.value.content.type === 'chess_invite' ? gameMsg.key : gameMsg.value.content.root;

      if (!gameId) {
        return;
      }

      const situation = mainCtrl.getGameCtrl().getSituationObservable(gameId);

      onceTrue(situation, (gameSituation) => {
        const opponentName = getOpponentName(gameSituation, gameMsg);
        let notification;

        if (gameMsg.value.content && gameMsg.value.content.type === 'chess_invite' && gameMsg.value.author != me) {
          notification = `${opponentName} has invited you to a game`;
          notify.showNotification(notification);
        } else if (gameMsg.value.content.type === 'chess_move' && gameMsg.value.author != me) {
          notification = `It's your move in your game against ${opponentName}`;
          notify.showNotification(notification);
        } else if (gameMsg.value.content.type === 'chess_game_end' && gameMsg.value.author != me) {
          notification = `Your game with ${opponentName} ended`;
          notify.showNotification(notification);
        } else if (gameMsg.value.content.type === 'chess_invite_accept' && gameMsg.value.author != me) {
          notification = `${opponentName} has accepted your game invite`;
          notify.showNotification(notification);
        }
      });
    }
  }

  function startNotifying() {
    const opts = {
      live: true,
      since: Date.now(),
    };

    const gameUpdateStream = userGamesWatcher.chessMessagesForPlayerGames(
      mainCtrl.getMyIdent(),
      opts,
    );

    pull(gameUpdateStream, pull.drain(msg => notifyIfRelevant(msg)));
  }

  return {
    startNotifying,
  };
};
