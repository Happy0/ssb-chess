
module.exports = (userGamesUpdateWatcher, myIdent) => {

  return {
    getRecentActivityForUserGames: () => {
      return userGamesUpdateWatcher.getRingBufferGameMsgsForPlayer(myIdent, ["chess_game_end"], 5)
    }
  }
}
