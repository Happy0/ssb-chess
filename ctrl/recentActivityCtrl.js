var computed = require('mutant/computed');
var MutantArray = require('mutant/array');

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

  return {
    getRecentActivityForUserGames: () => {
      return userGamesUpdateWatcher.getRingBufferGameMsgsForPlayer(myIdent, getSituationObs, ["chess_game_end"], 10)
    }
  }
}
