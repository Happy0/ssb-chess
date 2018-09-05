const m = require('mithril');
const { Chessground } = require('chessground');
const PubSub = require('pubsub-js');
const Value = require('mutant/value');
const watchAll = require('mutant/watch-all');
const computed = require('mutant/computed');
const { Howl } = require('howler');

const EmbeddedChat = require('ssb-embedded-chat');
const ActionButtons = require('./gameActions');
const GameHistory = require('./gameHistory');
const PromotionBox = require('./promote');

const PieceGraveyard = require('./PieceGraveyard');

module.exports = (gameCtrl, situationObservable, settings) => {
  const myIdent = gameCtrl.getMyIdent();

  let chessGround = null;
  const chessGroundObservable = Value();

  const gameHistory = GameHistory(situationObservable, myIdent);
  const actionButtons = ActionButtons(
    gameCtrl.getMoveCtrl(),
    myIdent,
    situationObservable,
  );

  const gameHistoryObs = gameHistory.getMoveSelectedObservable();

  const pieceGraveOpponent = PieceGraveyard(
    chessGroundObservable,
    situationObservable,
    gameHistoryObs,
    myIdent,
    false,
  );
  const pieceGraveMe = PieceGraveyard(
    chessGroundObservable,
    situationObservable,
    gameHistoryObs,
    myIdent,
    true,
  );

  const rootDir = `${__dirname.replace('/ui/game', '')}/`;

  const moveSound = new Howl({
    src: [`${rootDir}assets/sounds/Move.mp3`],
  });

  const captureSound = new Howl({
    src: [`${rootDir}assets/sounds/Capture.mp3`],
  });

  function plyToColourToPlay(ply) {
    return ply % 2 === 0 ? 'white' : 'black';
  }

  function isPromotionMove(cg, dest) {
    return (dest[1] === '8' || dest[1] === '1')
      && cg.state.pieces[dest]
      && (cg.state.pieces[dest].role === 'pawn');
  }

  function renderBoard(gameId) {
    const vDom = m('div', {
      class: 'cg-board-wrap ssb-chess-board-large',
      id: gameId,
    });

    return vDom;
  }

  function renderChat(gameId) {
    return m('div', {
      class: 'ssb-chess-chat',
      id: `chat-${gameId}`,
    });
  }

  function setNotMovable(conf) {
    conf.movable = {};
    conf.movable.color = null;
  }

  function watchForMoveConfirmation(situation, onConfirm, validMoves) {
    if (!settings.getMoveConfirmation()) {
      // If move confirmation is not enabled, perform the move immediately
      onConfirm();
      return;
    }

    const confirmedObs = actionButtons.showMoveConfirmation();
    m.redraw();

    const watches = computed(
      [confirmedObs, gameHistory.getMoveSelectedObservable()],
      (confirmed, moveSelected) => ({
        moveConfirmed: confirmed,
        moveSelected,
      }),
    );

    const removeConfirmationListener = watches((value) => {
      if (value.moveConfirmed.confirmed) {
        onConfirm();
      } else if (value.moveSelected !== 'live' || value.moveConfirmed.confirmed === false) {
        const oldConfig = situationToChessgroundConfig(situation, 'live', validMoves);

        if (value.moveSelected === 'live') {
          chessGround.set(oldConfig);
        }
      }

      removeConfirmationListener();
      actionButtons.hideMoveConfirmation();
    });
  }

  function situationToChessgroundConfig(situation, moveSelected, validMoves) {
    const playerColour = situation.players[myIdent] ? situation.players[myIdent].colour : 'white';

    const colourToPlay = plyToColourToPlay(situation.ply);

    const config = {
      fen: situation.fen,
      orientation: playerColour,
      turnColor: colourToPlay,
      ply: situation.ply,
      check: situation.check,
      movable: {
        dests: validMoves,
        free: false,
        color: situation.toMove === myIdent ? playerColour : null,
        events: {
          after: (orig, dest) => {
            if (isPromotionMove(chessGround, dest)) {
              const chessboardDom = document.getElementsByClassName('cg-board-wrap')[0];

              PromotionBox(chessboardDom, colourToPlay, dest[0],
                (promotingToPiece) => {
                  const onConfirmMove = () => gameCtrl.getMoveCtrl().makeMove(
                    situation.gameId,
                    orig,
                    dest,
                    promotingToPiece,
                  );
                  watchForMoveConfirmation(situation, onConfirmMove);
                }).renderPromotionOptionsOverlay();
            } else {
              const onConfirmMove = () => {
                gameCtrl.getMoveCtrl().makeMove(situation.gameId, orig, dest);
              };

              watchForMoveConfirmation(situation, onConfirmMove, validMoves);
            }

            const notMovable = {
              check: false,
              movable: {
                color: null,
              },
            };

            chessGround.set(notMovable);
          },
        },
      },
    };

    if (situation.lastMove) {
      config.lastMove = [situation.lastMove.orig, situation.lastMove.dest];
    }

    if (moveSelected !== 'live') {
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
        newSituation.origDests[moveNumber - 1].dest,
      ];
    } else {
      newConfig.lastMove = null;
    }

    const colourToPlay = plyToColourToPlay(moveNumber);
    newConfig.turnColor = colourToPlay;

    newConfig.check = newSituation.isCheckOnMoveNumber(moveNumber);
  }

  function makeEmbeddedChat(situation) {
    const config = {
      rootMessageId: situation.gameId,
      chatMessageType: 'chess_chat',
      chatMessageField: 'msg',
      chatboxEnabled: true,
    };

    if (situation.players[myIdent] != null) {
      config.isPublic = false;
      config.participants = Object.keys(situation.players);
    } else {
      config.isPublic = true;
    }

    config.getDisplayName = (id, cb) => {
      gameCtrl.getSocialCtrl().getDisplayName(id)
        .then(name => cb(null, name))
        .catch(err => cb(err, null));
    };

    const chat = EmbeddedChat(gameCtrl.getSbot(), config);

    return chat;
  }

  function playMoveSound(situation, newConfig, cg, moveSelected) {
    if (newConfig.fen !== cg.state.fen && moveSelected !== 0) {
      const pgnMove = moveSelected === 'live' ? situation.pgnMoves[
        situation.pgnMoves.length - 1] : situation.pgnMoves[moveSelected - 1];

      // Hacky way of determining if it's a capture move.
      if (pgnMove.indexOf('x') !== -1) {
        captureSound.play();
      } else {
        moveSound.play();
      }
    }
  }

  return {

    view(ctrl) {
      const gameId = atob(ctrl.attrs.gameId);

      return m('div', {
        class: 'ssb-chess-board-background-blue3 merida ssb-chess-game-layout',
      }, [renderChat(gameId), renderBoard(gameId),
        m('div', { class: 'ssb-chess-history-area' }, [
          m(pieceGraveOpponent),
          m(gameHistory),
          m(actionButtons),
          m(pieceGraveMe),
        ])]);
    },
    oncreate(vNode) {
      const gameId = atob(vNode.attrs.gameId);
      const boardDom = document.getElementById(gameId);
      const chatDom = document.getElementById(`chat-${gameId}`);

      const originalSituation = situationObservable();

      const config = situationToChessgroundConfig(originalSituation, 'live', {});
      chessGround = Chessground(boardDom, config);
      chessGroundObservable.set(chessGround);

      this.embeddedChat = makeEmbeddedChat(originalSituation);
      chatDom.appendChild(this.embeddedChat.getChatboxElement());

      const validMovesObservable = gameCtrl.getMovesFinderCtrl()
        .validMovesForSituationObs(situationObservable);

      this.removeWatches = watchAll([situationObservable,
        gameHistory.getMoveSelectedObservable(), validMovesObservable],
      (newSituation, moveSelected, validMoves) => {
        const newConfig = situationToChessgroundConfig(newSituation, moveSelected, validMoves);

        if (settings.getPlaySounds()) {
          playMoveSound(newSituation, newConfig, chessGround, moveSelected);
        }

        chessGround.set(newConfig);
      });

      PubSub.publish('viewing_game', {
        gameId,
      });
    },
    onremove() {
      if (this.removeWatches) {
        this.removeWatches();
      }

      if (chessGround) {
        // Yuck. This has been null for people at this stage before. Perhaps onremove
        // can be called before oncreate in edge cases?
        chessGround.destroy();
      }

      if (this.embeddedChat) {
        this.embeddedChat.destroy();
      }

      PubSub.publish('exited_game');
    },
  };
};
