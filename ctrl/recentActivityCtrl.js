const computed = require('mutant/computed');
const Value = require('mutant/value');
const userViewingGame = require('./userViewingGame')();

module.exports = (userGamesUpdateWatcher, getSituationObs, myIdent) => {
  const activityObs = userGamesUpdateWatcher.getRingBufferGameMsgsForPlayer(myIdent, getSituationObs, ['chess_game_end'], 10);

  function getRecentActivity() {
    return activityObs;
  }

  const lastSeenObs = Value();

  return {
    getRecentActivityForUserGames: () => getRecentActivity(),
    unseenNotifications: () => {
      const recentActivity = getRecentActivity();

      const unseen = computed([recentActivity, lastSeenObs], (activityMessages) => {
        const lastSeenStr = localStorage.getItem('ssb_chess_last_seen_notification');
        const lastSeen = lastSeenStr ? parseFloat(lastSeenStr) : 0;

        return activityMessages.filter(entry => entry.msg.timestamp > lastSeen);
      });

      return computed([unseen], (unseenMessages) => {
        // If the user is already viewing the game, don't up the count.
        const currentGame = userViewingGame.getCurrentGame();
        const msgIndex = unseenMessages.findIndex(entry => entry.msg.value.content.root === currentGame);

        if (currentGame && (msgIndex !== -1)) {
          unseenMessages.splice(msgIndex, 1);

          // If it's the only one that was in the list, make sure the user won't see it when they open the app again
          if (unseenMessages.length === 0) {
            localStorage.setItem('ssb_chess_last_seen_notification', Date.now());
          }
        }

        return unseenMessages;
      });
    },
    setLastseenMessage: (timeStamp) => {
      localStorage.setItem('ssb_chess_last_seen_notification', timeStamp);

      // Reset the count to 0 if we're already viewing the page.
      lastSeenObs.set(timeStamp);
    },

  };
};
