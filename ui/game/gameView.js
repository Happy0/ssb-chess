var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PubSub = require('pubsub-js');

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

        var config = {
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
        };

        if (situation.lastMove) {
          config.lastMove = [situation.lastMove.orig, situation.lastMove.dest];
        }

        chessGround.set(config);
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
    },
    oninit: function(vnode) {
      const gameId = atob(vnode.attrs.gameId);
      this.moveListener = PubSub.subscribe("game_update", function(msg, data) {
        console.log("update handler");
        console.dir(data);
        if (data.gameId === gameId && data.author !== myIdent) {
          console.log("Game update received, redrawing.");
          m.redraw();
        }
      });
    },
    onremove: function (vnode) {
      console.log("unsubscribing from move events");
      PubSub.unsubscribe(this.moveListener);
    }
  }

}
