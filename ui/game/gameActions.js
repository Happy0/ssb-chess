const m = require('mithril');
const onceTrue = require('mutant/once-true');
const Value = require('mutant/value');
const when = require('mutant/when');
const watch = require('mutant/watch');
const computed = require('mutant/computed');

module.exports = (gameMoveCtrl, myIdent, situationObservable) => {
  let watchesToClear = [];

  let observing = true;

  const moveConfirmationObservable = makeMoveObservationListener();

  function moveConfirmButtons() {
    const confirmMove = () => {
      moveConfirmationObservable.set({
        moveNeedsConfirmed: false,
        confirmed: true,
      });
    };

    const cancelMove = () => {
      moveConfirmationObservable.set({
        moveNeedsConfirmed: false,
        confirmed: false,
      });
    };

    return m('div', {
      class: 'ssb-chess-move-confirm-buttons',
    }, [
      m('button', {
        onclick: confirmMove,
      }, 'Confirm'),
      m('button', {
        onclick: cancelMove,
      }, 'Cancel'),
    ]);
  }

  function resignButton() {
    const resignGame = (e) => {
      onceTrue(situationObservable,
        (situation) => {
          if (situation && situation.status.status === 'started') {
            gameMoveCtrl.resignGame(situation.gameId, situation.latestUpdateMsg);
          }
        });
    };

    return m('button', {
      onclick: resignGame,
    }, 'Resign');
  }

  function handlePgnExport(gameId) {
    const url = '/games/:gameId/pgn';

    m.route.set(url, {
      gameId: btoa(gameId),
    });
  }

  function postGameButtons() {
    const exportPgn = () => {
      onceTrue(situationObservable, (situation) => {
        handlePgnExport(situation.gameId);
      });
    };

    return m('button', {
      onclick: exportPgn,
      title: 'Export game.',
    }, 'Export game');
  }

  function isObserving(situation) {
    return situation.players[myIdent] == null;
  }

  function makeMoveObservationListener() {
    const value = Value();

    value.set({
      moveNeedsConfirmed: false,
      moveConfirmed: false,
    });

    return value;
  }

  function moveNeedsConfirmed() {
    // Eh, miby there's redundancy here, dunno :P

    return computed(moveConfirmationObservable,
      confirmation => confirmation.moveNeedsConfirmed);
  }

  function usualButtons() {
    const gameInProgress = computed(
      situationObservable,
      situation => situation && (situation.status.status === 'started'),
    );

    return when(gameInProgress, resignButton(), postGameButtons());
  }

  return {
    view: (vDom) => {
      if (observing) {
        return postGameButtons();
      }

      return m('div', {
        class: 'ssb-game-actions',
      },
      when(moveNeedsConfirmed(), moveConfirmButtons(), usualButtons())());
    },
    oninit(vNode) {
      const w = watch(situationObservable,
        situation => observing = isObserving(situation));

      watchesToClear.push(w);
    },
    onremove: () => {
      watchesToClear.forEach(w => w());
      watchesToClear = [];
    },
    showMoveConfirmation() {
      moveConfirmationObservable.set({
        moveNeedsConfirmed: true,
        confirmed: false,
      });

      return moveConfirmationObservable;
    },
    hideMoveConfirmation() {
      moveConfirmationObservable.set({
        moveNeedsConfirmed: false,
        confirmed: false,
      });

      m.redraw();
    },

  };
};
