  var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PubSub = require('pubsub-js');
var PromotionBox = require('./promote');
var onceTrue = require("mutant/once-true");
var GameHistory = require("./gameHistory");
var Value = require("mutant/value");

var watchAll = require("mutant/watch-all");

var EmbeddedChat = require("ssb-embedded-chat");

module.exports = (gameCtrl) => {

  const myIdent = gameCtrl.getMyIdent();

  var chessGround = null;

  var gameHistoryObservable = Value();
  var gameHistory = GameHistory(gameHistoryObservable, myIdent);

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

  function renderChat(gameId) {
    return m('div', {
      class: 'ssb-chess-chat',
      id: "chat-" + gameId
    })
  }

  function setNotMovable(conf) {
    conf['movable'] = {};
    conf['movable']['color'] = null;
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

  function makeEmbeddedChat(situation) {

    var config = {
      rootMessageId: situation.gameId,
      chatMessageType: "chess_chat",
      chatMessageField: "msg",
      recipients: situation.players,
      chatboxEnabled: situation.players[myIdent] != null
    };

    var chat = EmbeddedChat(gameCtrl.getSbot(), config)

    return chat.getChatboxElement();
  }

  return {

    view: function(ctrl) {
      const gameId = atob(ctrl.attrs.gameId);
      return m('div', {
        class: "ssb-chess-board-background-blue3 merida ssb-chess-game-layout"
      }, [renderChat(gameId), renderBoard(gameId), m(gameHistory)]);
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
      var boardDom = document.getElementById(gameId);
      var chatDom = document.getElementById("chat-"+gameId);

      this.gameSituationObs = gameCtrl.getSituationObservable(gameId);

      onceTrue(this.gameSituationObs, situation => {
        var config = situationToChessgroundConfig(situation);
        chessGround = Chessground(boardDom, config);

        var chatElement = makeEmbeddedChat(situation);
        chatDom.appendChild(chatElement);

        gameCtrl.publishValidMoves(situation.gameId);
        gameHistoryObservable.set(situation);

        this.removeWatches = watchAll([this.gameSituationObs, gameHistory.getMoveSelectedObservable()],
          (newSituation, moveSelected) => {
            var newConfig = situationToChessgroundConfig(newSituation);

            // If the user is on the latest move, they may move and we
            // render the game updates. Otherwise the board is read only
            if (moveSelected !== "live") {
              setNotMovable(newConfig);
              newConfig.fen = newSituation.fenHistory[moveSelected];

              if (moveSelected > 0) {
                newConfig.lastMove = [newSituation.origDests[moveSelected -1 ].orig, newSituation.origDests[moveSelected - 1].dest];
              } else {
                newConfig.lastMove = null;
              }

              const colourToPlay = plyToColourToPlay(moveSelected);
              newConfig['turnColor'] = colourToPlay;

              gameCtrl.publishValidMoves(newSituation.gameId, moveSelected);
            } else {
              gameCtrl.publishValidMoves(newSituation.gameId);
            }

            chessGround.set(newConfig);
            gameHistoryObservable.set(newSituation);
          });

      });

    },
    onremove: function(vnode) {

      this.removeWatches();

      PubSub.unsubscribe(this.validMovesListener);
      chessGround.destroy();

      // Set the game history area to 'live mode' for the next game that is
      // opened
      gameHistory.goToLiveMode();
    }
  }

}
