var computed = require('mutant/computed');
var MutantArray = require('mutant/array');
var Value = require('mutant/value');

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

  function getRecentActivity() {
    return userGamesUpdateWatcher.getRingBufferGameMsgsForPlayer(myIdent, getSituationObs, ["chess_game_end"], 10)
  }

  var lastSeenObs = Value();

  return {
    getRecentActivityForUserGames: () => {
      return getRecentActivity();
    },
    unseenNotifications: () => {
      var recentActivity = getRecentActivity();

      return computed( [recentActivity, lastSeenObs], activityMessages => {
        var lastSeenStr = localStorage.getItem('last_seen_notification');
        var lastSeen = lastSeenStr ? parseInt(lastSeenStr) : 0;

        return activityMessages.filter(entry => entry.msg.value.timestamp > lastSeen);
      });
    },
    setLastseenMessage: (timeStamp) => {
      localStorage.setItem('last_seen_notification', timeStamp);

      // Reset the count to 0 if we're already viewing the page.
      lastSeenObs.set(timeStamp);
    }

  }
}
