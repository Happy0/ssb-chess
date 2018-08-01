var m = require("mithril");
var Chessground = require('chessground').Chessground;
var PubSub = require('pubsub-js');
var PromotionBox = require('./promote');
var onceTrue = require("mutant/once-true");
var GameHistory = require("./gameHistory");
var ActionButtons = require('./gameActions');
var Value = require("mutant/value");
var watchAll = require("mutant/watch-all");
var computed = require("mutant/computed");
var Howl = require("howler").Howl;

var EmbeddedChat = require("ssb-embedded-chat");

var PieceGraveyard = require("./PieceGraveyard");

module.exports = (gameCtrl, situationObservable, settings) => {

  const myIdent = gameCtrl.getMyIdent();

  var chessGround = null;
  var chessGroundObservable = Value();

  var gameHistory = GameHistory(situationObservable, myIdent);
  var actionButtons  = ActionButtons(
    gameCtrl.getMoveCtrl(),
    gameCtrl.getPgnCtrl(),
    myIdent,
    situationObservable
  );

  var gameHistoryObs = gameHistory.getMoveSelectedObservable();

  var pieceGraveOpponent = PieceGraveyard(chessGroundObservable, situationObservable, gameHistoryObs, myIdent, false);
  var pieceGraveMe = PieceGraveyard(chessGroundObservable, situationObservable, gameHistoryObs, myIdent, true);

  var rootDir = __dirname.replace('/ui/game','') + "/";

  var moveSound = new Howl({
    src: [rootDir + 'assets/sounds/Move.mp3']
  });

  var captureSound = new Howl({
    src: [rootDir + 'assets/sounds/Capture.mp3']
  });

  function plyToColourToPlay(ply) {
    return ply % 2 === 0 ? "white" : "black";
  }

  function isPromotionMove(chessGround, dest) {
    return (dest[1] === '8' || dest[1] === '1') &&
      chessGround.state.pieces[dest] &&
      (chessGround.state.pieces[dest].role === 'pawn');
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

  function watchForMoveConfirmation(situation, onConfirm) {
      if (!settings.getMoveConfirmation()) {
        // If move confirmation is not enabled, perform the move immediately
        onConfirm();
        return
      }

      var confirmedObs = actionButtons.showMoveConfirmation();
      m.redraw();

      var watches = computed([confirmedObs, gameHistory.getMoveSelectedObservable()], (confirmed, moveSelected) => {
      return {
        moveConfirmed: confirmed,
        moveSelected: moveSelected
      }
    });

    var removeConfirmationListener = watches( value  => {
      if (value.moveConfirmed.confirmed) {
        onConfirm();
      } else if (value.moveSelected !== "live" || value.moveConfirmed.confirmed === false) {
        var oldConfig = situationToChessgroundConfig(situation, "live");

        if (value.moveSelected === "live") {
          chessGround.set(oldConfig);
          gameCtrl.getMoveCtrl().publishValidMoves(situation.gameId);
        }
      }

      removeConfirmationListener();
      actionButtons.hideMoveConfirmation();
    });

  }

  function situationToChessgroundConfig(situation, moveSelected) {
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
                  var onConfirmMove = () => gameCtrl.getMoveCtrl().makeMove(situation.gameId, orig, dest, promotingToPiece);
                  watchForMoveConfirmation(situation, onConfirmMove);
                }).renderPromotionOptionsOverlay();

            } else {
              var onConfirmMove = () => {
                gameCtrl.getMoveCtrl().makeMove(situation.gameId, orig, dest);
              }

              watchForMoveConfirmation(situation, onConfirmMove)
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

    if (moveSelected !== "live") {
      resetConfigToOlderPosition(situation, config, moveSelected);
    }

    return config;
  }

  function resetConfigToOlderPosition(newSituation, newConfig, moveNumber) {
    setNotMovable(newConfig);
    newConfig.fen = newSituation.fenHistory[moveNumber];

    if (moveNumber > 0) {
      newConfig.lastMove = [
        newSituation.origDests[moveNumber - 1].orig,
        newSituation.origDests[moveNumber - 1].dest
      ];
    } else {
      newConfig.lastMove = null;
    }

    const colourToPlay = plyToColourToPlay(moveNumber);
    newConfig['turnColor'] = colourToPlay;

    // Remove 'check' if its in the current state until we
    // receive an event telling us it is check as we scroll
    // through the move history
    newConfig.check = false;
  }

  function makeEmbeddedChat(situation) {

    var config = {
      rootMessageId: situation.gameId,
      chatMessageType: "chess_chat",
      chatMessageField: "msg",
      chatboxEnabled: true
    };

     if (situation.players[myIdent] != null) {
       config.isPublic = false;
       config.participants = Object.keys(situation.players);
     } else {
       config.isPublic = true;
     }


    var chat = EmbeddedChat(gameCtrl.getSbot(), config)

    return chat.getChatboxElement();
  }

  function playMoveSound(situation, newConfig, chessGround, moveSelected) {
    if (newConfig.fen !== chessGround.state.fen && moveSelected !== 0) {

      var pgnMove =
        moveSelected === "live" ? situation.pgnMoves[
          situation.pgnMoves.length - 1 ] : situation.pgnMoves[moveSelected - 1];

      // Hacky way of determining if it's a capture move.
      if (pgnMove.indexOf('x') !== -1) {
        captureSound.play();
      } else {
        moveSound.play();
      }

    }
  }

  return {

    view: function(ctrl) {
      const gameId = atob(ctrl.attrs.gameId);

      return m('div', {
        class: "ssb-chess-board-background-blue3 merida ssb-chess-game-layout"
      }, [renderChat(gameId), renderBoard(gameId),
        m('div', {class: "ssb-chess-history-area"}, [
          m(pieceGraveOpponent),
          m(gameHistory),
          m(actionButtons),
          m(pieceGraveMe)
        ] )]);
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

      var originalSituation = situationObservable();

      var config = situationToChessgroundConfig(originalSituation, "live");
      chessGround = Chessground(boardDom, config);
      chessGroundObservable.set(chessGround);

      var chatElement = makeEmbeddedChat(originalSituation);
      chatDom.appendChild(chatElement);

      gameCtrl.getMoveCtrl().publishValidMoves(originalSituation.gameId);

      this.removeWatches = watchAll([situationObservable, gameHistory.getMoveSelectedObservable()],
        (newSituation, moveSelected) => {
          var newConfig = situationToChessgroundConfig(newSituation, moveSelected);

          // If the user is on the latest move, they may move and we
          // render the game updates. Otherwise the board is read only
          if (moveSelected !== "live") {
            gameCtrl.getMoveCtrl().publishValidMoves(newSituation.gameId, moveSelected);
          } else {
            gameCtrl.getMoveCtrl().publishValidMoves(newSituation.gameId);
          }

          if (settings.getPlaySounds()) {
            playMoveSound(newSituation, newConfig, chessGround, moveSelected);
          }

          chessGround.set(newConfig);
        });

        PubSub.publish("viewing_game", {
          gameId: gameId
        })

    },
    onremove: function(vnode) {

      if(this.removeWatches) {
        this.removeWatches();
      }

      PubSub.unsubscribe(this.validMovesListener);
      chessGround.destroy();

      PubSub.publish("exited_game");
    }
  }

}
