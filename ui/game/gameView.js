var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PubSub = require('pubsub-js');
var PromotionBox = require('./promote');

module.exports = (gameCtrl) => {

  const myIdent = gameCtrl.getMyIdent();

  var chessGround = null;

  var config = {};

  function plyToColourToPlay(ply) {
    return ply % 2 === 0 ? "white" : "black";
  }

  function columnLetterToNumberFromZero(columnLetter) {
    return columnLetter.codePointAt(0) - 97;
  }

  function renderPromotionOptionsOverlay(colour, column, onChoice) {
    var chessBoard = document.getElementsByClassName("cg-board-wrap")[0];

    var prom = document.createElement('div');

    var promoteCallback = (selectedPiece) => {
      chessBoard.removeChild(prom);
      onChoice(selectedPiece);
    }

    var box = PromotionBox(colour, promoteCallback);

    var left = colour === "white" ? 75 * columnLetterToNumberFromZero(column) : ((75 * 7) - (75 * columnLetterToNumberFromZero(column)));
    var promotionBox = m('div', {
      style: 'z-index: 100; position: absolute; left: ' + left + 'px; top: 0px;'
    }, m(box));

    chessBoard.appendChild(prom);

    m.render(prom, promotionBox);

  }

  function isPromotionMove(chessGround, dest) {
    return dest[1] === '8' || (dest[1] === '1' &&
      chessGround.state.pieces[dest].role === 'pawn');
  }

  function renderBoard(gameId) {
    var vDom = m('div', {
      class: 'cg-board-wrap ssb-chess-board-large'
    });

    setTimeout(() => {
      chessGround = Chessground(vDom.dom, config);

      gameCtrl.getSituation(gameId).then(situation => {
        const playerColour = situation.players[myIdent] ? situation.players[myIdent].colour : 'white';

        const colourToPlay = plyToColourToPlay(situation.ply);

        config = {
          fen: situation.fen,
          orientation: playerColour,
          turnColor: colourToPlay,
          ply: situation.ply,
          check: situation.check,
          movable: {
            color: situation.toMove === myIdent ? playerColour : null,
            events: {
              after: (orig, dest, metadata) => {

                if (isPromotionMove(chessGround, dest)) {

                  renderPromotionOptionsOverlay(colourToPlay, dest[0],
                    (promotingToPiece) => {
                      gameCtrl.makeMove(gameId, orig, dest, promotingToPiece);
                    });

                } else {
                  gameCtrl.makeMove(gameId, orig, dest);
                }

                var notMovable = {
                  check: false,
                  movable: {
                    color: null
                  }
                };

                chessGround.set(notMovable);
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

  function switchToPlayerTurnByPly(conf, ply) {
    conf.turnColor = plyToColourToPlay(ply);
    conf.movable.color = plyToColourToPlay(ply);
  }


  return {

    view: function(ctrl) {
      const gameId = atob(ctrl.attrs.gameId);
      return m('div', {
        class: "ssb-chess-board-background-blue3 merida"
      }, renderBoard(gameId));
    },
    oninit: function(vnode) {
      const gameId = atob(vnode.attrs.gameId);

      this.validMovesListener = PubSub.subscribe("valid_moves", function(msg, data) {
        if (data.gameId === gameId && chessGround) {

          var dests = {
            check: data.check,
            movable: {
              dests: data.validMoves,
              free: false
            }
          }

          chessGround.set(dests);
        }
      });

      this.moveListener = PubSub.subscribe("game_update", function(msg, data) {
        console.log("update handler");
        console.dir(data);
        if (data.gameId === gameId) {

          if (chessGround && (data.ply > config.ply)) {
            console.log("Game update received, playing move on board.");

            config.fen = data.fen;
            config.ply = data.ply;
            config.lastMove = [data.orig, data.dest];

            const observing = m.route.param("observing") ? m.route.param("observing") : false;

            if (!observing) {
              switchToPlayerTurnByPly(config, data.ply);
            }

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
