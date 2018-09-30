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
  const resignationConfirmationObservable = makeResignConfirmationListener();

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

  function renderResignConfirmation() {
    const confirmText = 'Yes';
    const cancelText = 'No';

    let doResignation = () => {
      resignGame();
      cancelResignationConfirmation();
    };

    return m('div', {class: 'ssb-chess-resign-confirmation'}, [
      m('p', {class: 'ssb-chess-resign-confirmation-prompt'}, "Really resign?"),
      m('div', {class: "ssb-chess-resign-confirmation-buttons"}, [
        renderResignConfirmationButton(confirmText, doResignation),
        renderResignConfirmationButton(cancelText, cancelResignationConfirmation)
      ])
    ]);

  }

  function cancelResignationConfirmation() {
    resignationConfirmationObservable.set(defaultResignationObservableValues());
    m.redraw();
  }

  function renderResignConfirmationButton(text, cb) {
    return m('button', {
      onclick: cb,
      class: 'ssb-chess-resign-confirmation-button'
    }, text);
  }

  function resignGame() {
    onceTrue(situationObservable,
      (situation) => {
        if (situation && situation.status.status === 'started') {
          gameMoveCtrl.resignGame(situation.gameId, situation.latestUpdateMsg);
        }
      });
  }

  function resignButton() {

    let showResignationConfirmation = () => {
      var resignState = defaultResignationObservableValues();
      resignState.resignationNeedsConfirmed = true;

      resignationConfirmationObservable.set(resignState);

      m.redraw();
    }

    return m('button', {
      onclick: showResignationConfirmation,
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

  function defaultResignationObservableValues () {
    return {
      resignationNeedsConfirmed: false,
      resignationConfirmed: false,
    }
  }

  function makeResignConfirmationListener() {
    const value = Value(defaultResignationObservableValues);

    value.set(defaultResignationObservableValues());

    return value;
  }

  function moveNeedsConfirmed() {

    return computed(moveConfirmationObservable,
      confirmation => confirmation.moveNeedsConfirmed);
  }

  function resignationNeedsConfirmed() {
    return computed(
      resignationConfirmationObservable,
      confirmation => confirmation.resignationNeedsConfirmed
    );
  }

  function usualButtons() {
    const gameInProgress = computed(
      situationObservable,
      situation => situation && (situation.status.status === 'started'),
    );

    return when(gameInProgress, resignButton(), postGameButtons());
  }

  return {
    view: () => {
      if (observing) {
        return postGameButtons();
      }

      return m('div', {
        class: 'ssb-game-actions',
      },
        when(
          resignationNeedsConfirmed(),
          renderResignConfirmation(),
          when(moveNeedsConfirmed(), moveConfirmButtons(), usualButtons())()
        )()
      )
    },
    oninit() {
      const w = watch(situationObservable, (situation) => {
        observing = isObserving(situation);
      });

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
