var UserGamesWatcher = require('../../ctrl/user_game_updates_watcher');
var notify = require('./notify');
var pull = require('pull-stream');
var userLocationUtils = require('../viewer_perspective/user_location')();
var onceTrue = require('mutant/once-true');

module.exports = (gameCtrl, sbot) => {

  var me = gameCtrl.getMyIdent();

  userGamesWatcher = UserGamesWatcher(sbot);

  function notifyIfRelevant(msg) {
    userLocationUtils.ifChessAppNotVisible( () => {
      var situation = gameCtrl.getSituation(msg.value.content.root);

      onceTrue(situation, (gameSituation) => {
        var opponentName = situation.players[msg.value.author] ? situation.players[msg.value.author].name : "";

        if (msg.value.content.type === "chess_move" && msg.value.author != me && msg.value.content.root) {
          var msg = "It's your move in your game against " + opponentName;
          notify.showNotification(msg);
        } else if (msg.value.content.type === "chess_game_end" && msg.value.author != me && msg.value.content.root) {
          var msg = "Your game with " + opponentName + " ended";
          notify.showNotification(msg);
        } else if (msg.value.content.type === "chess_invite" && msg.value.author != me && msg.value.content.root) {
          var msg = opponentName + " has invited you to a game";
          notify.showNotification(msg);
        } else if (msg.value.content.type === "chess_invite" && msg.value.author != me && msg.value.content.root) {
          var msg = opponentName + " has accepted your game invite";
          notify.showNotification(msg);
        }

      })

    });
  }

  function startNotifying() {
    var opts = {
      live: true,
      since: Date.now()
    };

    var gameUpdateStream = userGamesWatcher.chessMessagesForPlayerGames(gameCtrl.getMyIdent(), opts);

    pull(gameUpdateStream, pull.drain(notifyIfRelevant));
  }

  return {
    startNotifying: startNotifying
  }
}
