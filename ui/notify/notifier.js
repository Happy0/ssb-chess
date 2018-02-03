var UserGamesWatcher = require('../../ctrl/user_game_updates_watcher');
var notify = require('./notify')();
var pull = require('pull-stream');
var userLocationUtils = require('../viewer_perspective/user_location')();
var onceTrue = require('mutant/once-true');

module.exports = (gameCtrl, sbot) => {

  var me = gameCtrl.getMyIdent();

  userGamesWatcher = UserGamesWatcher(sbot);

  function notifyIfRelevant(gameMsg) {

    if (!userLocationUtils.chessAppIsVisible()) {

      var gameId = gameMsg.value.content.type === "chess_invite" ? gameMsg.key : gameMsg.value.content.root;

      if (!gameId) {
        return;
      }

      var situation = gameCtrl.getSituationObservable(gameId);

      onceTrue(situation, function (gameSituation) {

        var opponentName = getOpponentName(gameSituation, gameMsg);

        if (gameMsg.value.content && gameMsg.value.content.type === "chess_invite" && gameMsg.value.author != me) {
          var notification = opponentName + " has invited you to a game";
          notify.showNotification(notification);
        }
        else if (gameMsg.value.content.type === "chess_move" && gameMsg.value.author != me) {
          var notification = "It's your move in your game against " + opponentName;
          notify.showNotification(notification);
        } else if (gameMsg.value.content.type === "chess_game_end" && gameMsg.value.author != me) {
          var notification = "Your game with " + opponentName + " ended";
          notify.showNotification(notification);
        } else if (gameMsg.value.content.type === "chess_invite_accept" && gameMsg.value.author != me) {
          var notification = opponentName + " has accepted your game invite";
          notify.showNotification(notification);
        }

      })

    }
  }

  function getOpponentName(situation, msg) {
    return situation.players[msg.value.author] ? situation.players[msg.value.author].name : "";
  }

  function startNotifying() {
    var opts = {
      live: true,
      since: Date.now()
    };

    var gameUpdateStream = userGamesWatcher.chessMessagesForPlayerGames(gameCtrl.getMyIdent(), opts);

    pull(gameUpdateStream, pull.drain((msg) => notifyIfRelevant(msg, "baws")));
  }

  return {
    startNotifying: startNotifying
  }
}
