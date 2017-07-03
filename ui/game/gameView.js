var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PubSub = require('pubsub-js');

module.exports = (gameCtrl) => {

  const myIdent = gameCtrl.getMyIdent();
  var chessGround = null;

  var config = {};

  function renderBoard(gameId) {
    var vDom = m('div', {
      class: 'cg-board-wrap ssb-chess-board-large'
    });

    setTimeout(() => {
      chessGround = Chessground(vDom.dom, config);

      gameCtrl.getSituation(gameId).then(situation => {
        const playerColour = situation.players[myIdent].colour;

        config = {
          fen: situation.fen,
          orientation: playerColour,
          turnColor: playerColour,
          movable: {
            color: situation.toMove === myIdent?  playerColour : null,
            events: {
              after: (orig, dest, metadata) => {
                console.log("Chessground move event. " + orig + " " );
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

        console.dir(chessGround);
        console.dir(chessGround.state);

        return situation;
      }).then(situation => gameCtrl.publishValidMoves(situation));
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

      this.validMovesListener = PubSub.subscribe("valid_moves", function(msg, data) {
        if (data.gameId === gameId && chessGround) {
          config.movable.dests = data.validMoves;

          chessGround.set(config);
        }
      });

      this.moveListener = PubSub.subscribe("game_update", function(msg, data) {
        console.log("update handler");
        console.dir(data);
        if (data.gameId === gameId && data.author !== myIdent) {

          console.dir(chessGround);
          if (chessGround && data.fen !== chessGround.state.fen) {
            console.log("Game update received, playing move on board.");
            chessGround.move(data.orig, data.dest);

            // Tell chessground that it's now us to move. We know we're the opposite
            // colour because the condition for the 'if' is only true if it wasn't
            // us who made the move
            var newTurnColor = (config.turnColor === "white") ? "black":  "white";

            config.turnColor = newTurnColor;
            config.movable.color = newTurnColor;
            chessGround.set(config);

          } else {
            console.log("null chessground");
          }

        }
      });
    },
    onremove: function (vnode) {
      console.log("unsubscribing from move events " + this.moveListener);

      PubSub.unsubscribe(this.moveListener);
      PubSub.unsubscribe(this.validMovesListener);
    }
  }

}
