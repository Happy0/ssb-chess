var pull = require("pull-stream");

module.exports = (sbot, gameDb, gameSsbCtrl) => {

  function endedGamesPagesSource(playerId) {
    return gameDb.getGamesFinished(playerId);
  }

  function getGameSummaryCb(gameId, cb) {
    gameSsbCtrl.getSmallGameSummary(gameId)
      .then(res => cb(null, res))
      .catch(e => cb(e, null));
  }

  function endedGamesSummariesSource(playerId) {
    var endedGamesSrc = endedGamesPagesSource(playerId);

    var flatStream = pull(endedGamesSrc, pull.flatten());

    return pull(flatStream, pull.asyncMap(getGameSummaryCb));
  }


  return {
    endedGamesSummariesSource: endedGamesSummariesSource
  }

}
