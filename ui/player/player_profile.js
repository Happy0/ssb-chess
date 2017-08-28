var PlayerGames = require('./player_games');

module.exports = (gameCtrl) => {


  return {
    view: (vNode) => {
      var playerId = atob(vNode.attrs.playerId);
      var playerGames = PlayerGames(gameCtrl, playerId);

      return m('div', [playerGames] )
    }
  }

}
