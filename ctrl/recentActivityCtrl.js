var computed = require('mutant/computed');
var MutantArray = require('mutant/array');
var Value = require('mutant/value');
var userViewingGame = require('./userViewingGame')();

module.exports = (userGamesUpdateWatcher, getSituationObs, myIdent) => {

  function msgAndSituationObs(msg) {
    var gameId = msg.value.content.root;

    var situationObs = getSituationObs(gameId);

    return computed([situationObs], situation => {
      return {
        msg: msg,
        situation: situation
      }
    })
  }

  var activityObs = userGamesUpdateWatcher.getRingBufferGameMsgsForPlayer(myIdent, getSituationObs, ["chess_game_end"], 10)

  function getRecentActivity() {
    return activityObs;
  }

  var lastSeenObs = Value();

  return {
    getRecentActivityForUserGames: () => {
      return getRecentActivity();
    },
    unseenNotifications: () => {
      var recentActivity = getRecentActivity();

      var unseen = computed( [recentActivity, lastSeenObs], activityMessages => {
        var lastSeenStr = localStorage.getItem('ssb_chess_last_seen_notification');
        var lastSeen = lastSeenStr ? parseInt(lastSeenStr) : 0;

        return activityMessages.filter(entry => entry.msg.timestamp > lastSeen);
      });

      return computed([unseen], unseenMessages => {

        // If the user is already viewing the game, don't up the count.
        var currentGame = userViewingGame.getCurrentGame();
        if (currentGame && unseenMessages.indexOf(entry => entry.msg.value.content.root === currentGame) !== -1) {
          unseenMessages.splice(unseenMessages.indexOf(entry => entry.msg.value.content.root === currentGame), 1);

          // If it's the only one that was in the list, make sure the user won't see it when they open the app again
          if (unseenMessages.length === 0) {
            localStorage.setItem('ssb_chess_last_seen_notification', Date.now());
          }

        }

        return unseenMessages;
      })
    },
    setLastseenMessage: (timeStamp) => {
      localStorage.setItem('ssb_chess_last_seen_notification', timeStamp);

      // Reset the count to 0 if we're already viewing the page.
      lastSeenObs.set(timeStamp);
    }

  }
}
