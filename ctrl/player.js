var pull = require("pull-stream");

module.exports = (sbot, gameDb, gameSsbCtrl) => {

  function endedGamesPagesSource(playerId) {
    var start = 0;
    var chunkSize = 10;

    return function(end, cb) {
      if (end) return cb(end);

      var dbFetchCallback = (err, result) => {
        if (err) return cb(err);

        if (result.length === 0) {
          cb(true);
        } else {
          start = start + (chunkSize + 1)
          cb(null, result);
        }
      }

      gameDb.getGamesFinishedPageCb(playerId, start, start + chunkSize, dbFetchCallback)
    }
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
