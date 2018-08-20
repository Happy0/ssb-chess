const m = require('mithril');
const PlayerGames = require('./player_games');

module.exports = gameCtrl => ({
  view: () => m('div'),
  oncreate: (vNode) => {
    if (vNode.attrs.playerId === this.playerId) {
      return;
    }

    this.playerId = atob(vNode.attrs.playerId);
    const playerGames = PlayerGames(gameCtrl).getScrollingFinishedGamesDom(this.playerId);

    vNode.dom.appendChild(playerGames);
  },
  onupdate: (vNode) => {
    /* When we arrive at this route again we need to replace the contents of
       * the game history page if it's a different player since we last loaded
       * this route. Maybe there's a nicer way of doing this... */
    if (vNode.attrs.playerId !== this.playerId) {
      this.playerId = atob(vNode.attrs.playerId);

      while (vNode.dom.firstChild) {
        vNode.dom.removeChild(vNode.dom.firstChild);
      }

      const playerGames = PlayerGames(gameCtrl).getScrollingFinishedGamesDom(this.playerId);
      vNode.dom.appendChild(playerGames);
    }
  },
});
