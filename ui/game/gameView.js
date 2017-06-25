var m = require("mithril");
var Chessground = require('chessground').Chessground;

module.exports = (gameCtrl) => {

  const myIdent = gameCtrl.getMyIdent();

  function renderBoard(gameId) {
    var vDom = m('div', {
      class: 'cg-board-wrap ssb-chess-board-large'
    });

    setTimeout(() => {
      var chessGround = Chessground(vDom.dom, {});

      gameCtrl.getSituation(gameId).then(situation => {
        const playerColour = situation.players[myIdent].colour;

        chessGround.set({
          fen: situation.fen,
          orientation: playerColour,
          movable: {
            color: situation.toMove === myIdent?  playerColour : null,
            events: {
              after: (orig, dest, metadata) => {
                gameCtrl.makeMove(gameId, orig, dest);
              },
              afterNewPiece: (role, position) => {
                //TODO: Support promotions
              }
            }
          }
        });
      })
    });

    return vDom;
  }

  return {

    view: function(ctrl) {
      const gameId = atob(ctrl.attrs.gameId);
      return m('div', {
        class: "blue merida"
      }, renderBoard(gameId));
    }
  }

}
