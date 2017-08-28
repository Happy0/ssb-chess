var m = require('mithril');
var PlayerGames = require('./player_games');

module.exports = (gameCtrl) => {


  return {
    view: (vNode) => {


      return m('div');
    },
    oncreate: (vNode) => {
      var playerId = atob(vNode.attrs.playerId);
      var playerGames = PlayerGames(playerId, gameCtrl).getScrollingFinishedGamesDom();

      vNode.dom.appendChild(playerGames);
    }
  }

}
