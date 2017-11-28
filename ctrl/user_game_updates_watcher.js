var pull = require('pull-stream');
var MutantPullReduce = require('mutant-pull-reduce');

module.exports = (sbot) => {

  function latestGameMessageForPlayerObs(playerId) {
    var liveFeed = sbot.createFeedStream({
      live: true
    })

    var chessMessagesReferencingPlayer = pull(liveFeed, msgReferencesPlayerFilter(playerId)) ;

    return MutantPullReduce(chessMessagesReferencingPlayer, (state, next) => {
      return next;
    }, {
      startValue: Date.now(),
      nextTick: true,
      sync: true
    });
  }

  function getGamePlayers(msg, cb) {
    if (!msg.value || !msg.value.content || !msg.value.content.root) {
      console.warn("No root found for chess message ");
      console.warn(msg);
      cb(null, []);
    } else {
      var gameId = msg.value.content.root;
      sbot.get(gameId, (err, result) => {

        if (msg.value.content.type !== "chess_invite") {
          console.warn("Unexpectedly not a chess invite root ");
          console.warn(msg);
          cb(null, []);
        }
        else if (msg.value.content.inviting) {
          console.warn("Unexpectedly no invitee")
          console.warn(msg);
        } else {
          cb(null, [msg.value.author, msg.value.content.inviting])
        }
      });
    }
  }

  function isChessMessage(msg) {
    if (!msg.value || !msg.value.content) {
      return false;
    }
    else {
      return [
       "chess_move",
       "chess_invite_accept",
       "chess_game_end"].indexOf(msg.value.content.type) !== -1
    }

  }

  function containsPlayerId(playerId, players) {
    return players.indexOf(playerId) !== -1;
  }

  function msgReferencesPlayerFilter(playerId) {
    return pull(
            pull(
              pull.filter(isChessMessage),
              pull.asyncMap(getGamePlayers)
            ),
            pull.filter(containsPlayerId)
          )
  }

  return {
   /**
    * Watches for incoming updates to a player's games and sets the observable
    * value to the last message.
    */
   latestGameMessageForPlayerObs : latestGameMessageForPlayerObs
  }
}
