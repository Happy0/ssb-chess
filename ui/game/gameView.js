var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PubSub = require('pubsub-js');

module.exports = (gameCtrl) => {

  const myIdent = gameCtrl.getMyIdent();
  var chessGround = null;

  function renderBoard(gameId) {
    var vDom = m('div', {
      class: 'cg-board-wrap ssb-chess-board-large'
    });

    setTimeout(() => {
      chessGround = Chessground(vDom.dom, {});

      gameCtrl.getSituation(gameId).then(situation => {
        const playerColour = situation.players[myIdent].colour;

        var config = {
          fen: situation.fen,
          orientation: playerColour,
          turnColor: playerColour,
          movable: {
            color: situation.toMove === myIdent?  playerColour : null,
            events: {
              after: (orig, dest, metadata) => {
                console.log("Chessground move event. " + orig + " " + dest);
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

        console.dir(chessGround.state);
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

          if (chessGround && data.fen !== chessGround.state.fen) {
            console.log("Game update received, playing move on board.");
            chessGround.move(data.orig, data.dest);
          } else {
            console.log("null chessground");
          }

        }
      });
    },
    onremove: function (vnode) {
      console.log("unsubscribing from move events " + this.moveListener);
      PubSub.unsubscribe(this.moveListener);
    }
  }

}
