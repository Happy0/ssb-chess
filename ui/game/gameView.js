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
          turnColor: situation.players[situation.toMove].colour,
          ply: situation.ply,
          movable: {
            color: situation.toMove === myIdent ? playerColour : null,
            events: {
              after: (orig, dest, metadata) => {
                gameCtrl.makeMove(gameId, orig, dest);

                var notMovable = {
                  movable: {
                    color: null
                  }
                };

                chessGround.set(notMovable);
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

        return situation;
      }).then(situation => gameCtrl.publishValidMoves(gameId));
    });

    return vDom;
  }

  function switchToViewerTurn() {
    config.turnColor = config.orientation;
    config.movable.color = config.orientation;
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

          var dests = {
            check: data.check,
            movable: {
              dests: data.validMoves
            }
          }

          chessGround.set(dests);
        }
      });

      this.moveListener = PubSub.subscribe("game_update", function(msg, data) {
        console.log("update handler");
        console.dir(data);
        if (data.gameId === gameId && data.author !== myIdent) {

          if (chessGround && (data.ply > config.ply)) {
            console.log("Game update received, playing move on board.");

            config.fen = data.fen;
            config.ply = data.ply;
            config.lastMove = [data.orig, data.dest];
            switchToViewerTurn(config);
            chessGround.set(config);

            gameCtrl.publishValidMoves(gameId);
          } else {
            console.log("null chessground");
          }

        }
      });
    },
    onremove: function(vnode) {
      console.log("unsubscribing from move events " + this.moveListener);

      PubSub.unsubscribe(this.moveListener);
      PubSub.unsubscribe(this.validMovesListener);
    }
  }

}
