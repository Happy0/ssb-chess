var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PubSub = require('pubsub-js');
var PromotionBox = require('./promote');
var onceTrue = require("mutant/once-true");
var GameHistory = require("./gameHistory");
var Value = require("mutant/value");

var watchAll = require("mutant/watch-all");

module.exports = (gameCtrl) => {

  const myIdent = gameCtrl.getMyIdent();

  var chessGround = null;

  var gameHistoryObservable = Value();
  var gameHistory = GameHistory(gameHistoryObservable);

  function plyToColourToPlay(ply) {
    return ply % 2 === 0 ? "white" : "black";
  }

  function isPromotionMove(chessGround, dest) {
    return (dest[1] === '8' || dest[1] === '1') &&
      chessGround.state.pieces[dest].role === 'pawn';
  }

  function renderBoard(gameId) {
    var vDom = m('div', {
      class: 'cg-board-wrap ssb-chess-board-large',
      id: gameId
    });

    return vDom;
  }

  function switchToPlayerTurnByPly(conf, ply) {
    conf.turnColor = plyToColourToPlay(ply);
    conf.movable.color = plyToColourToPlay(ply);
  }

  function situationToChessgroundConfig(situation) {
    const playerColour = situation.players[myIdent] ? situation.players[myIdent].colour : 'white';

    const colourToPlay = plyToColourToPlay(situation.ply);

    var config = {
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
              var chessboardDom = document.getElementsByClassName("cg-board-wrap")[0];

              PromotionBox(chessboardDom, colourToPlay, dest[0],
                (promotingToPiece) => {
                  gameCtrl.makeMove(situation.gameId, orig, dest, promotingToPiece);
                }).renderPromotionOptionsOverlay();

            } else {
              gameCtrl.makeMove(situation.gameId, orig, dest);
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

    return config;
  }

  return {

    view: function(ctrl) {
      const gameId = atob(ctrl.attrs.gameId);
      return m('div', {
        class: "ssb-chess-board-background-blue3 merida ssb-chess-game-layout"
      }, [renderBoard(gameId), m(gameHistory)]);
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
    },
    oncreate: function(vNode) {
      const gameId = atob(vNode.attrs.gameId);
      var dom = document.getElementById(gameId);

      var gameSituationObs = gameCtrl.getSituationObservable(gameId);

      onceTrue(gameSituationObs, situation => {
        var config = situationToChessgroundConfig(situation);
        chessGround = Chessground(dom, config);

        gameCtrl.publishValidMoves(situation.gameId);
        gameHistoryObservable.set(situation);

        watchAll([gameSituationObs, gameHistory.getMoveSelectedObservable()],
          (newSituation, moveSelected) => {
            var config = situationToChessgroundConfig(newSituation);

            chessGround.set(config);
            gameCtrl.publishValidMoves(newSituation.gameId);
            gameHistoryObservable.set(newSituation);
          });

      });

    },
    onremove: function(vnode) {
      PubSub.unsubscribe(this.validMovesListener);
      chessGround.destroy();
    }
  }

}
