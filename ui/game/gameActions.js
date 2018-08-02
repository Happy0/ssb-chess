var m = require("mithril");
var onceTrue = require('mutant/once-true');
var Value = require('mutant/value');
var when = require('mutant/when');
var watch = require("mutant/watch");
var computed = require('mutant/computed');

module.exports = (gameMoveCtrl, pgnCtrl, myIdent, situationObservable) => {

  var watchesToClear = [];

  var observing = true;

  var moveConfirmationObservable = makeMoveObservationListener();

  function moveConfirmButtons() {

    var confirmMove = () => {
      moveConfirmationObservable.set({
        moveNeedsConfirmed: false,
        confirmed: true
      })
    }

    var cancelMove = () => {
      moveConfirmationObservable.set({
        moveNeedsConfirmed: false,
        confirmed: false
      })
    }

    return m('div', {
      class: 'ssb-chess-move-confirm-buttons'
    }, [
      m('button', {
        onclick: confirmMove
      }, 'Confirm'),
      m('button', {
        onclick: cancelMove
      }, 'Cancel')
    ])
  }

  function resignButton() {
    var resignGame = (e) => {
      onceTrue(situationObservable,
        situation => {
          if (situation && situation.status.status === "started") {
            gameMoveCtrl.resignGame(situation.gameId, situation.latestUpdateMsg)
          }
        }
      );
    }

    return m('button', {
      onclick: resignGame
    }, 'Resign');
  }

  function handlePgnExport(gameId) {
    pgnCtrl.getPgnExport(gameId).then( pgnText => {
      var url = "/games/" + btoa(gameId) + "/pgn/" + btoa(pgnText);
      m.route.set(url);
    });
  }

  function postGameButtons() {

    const exportPgn = () => {
      onceTrue(situationObservable, situation => {
        handlePgnExport(situation.gameId)
      });
    }

    return m('button', {
      onclick: exportPgn,
      title: 'Export game.'
    }, 'Export game')
  }

  function isObserving(situation) {
    return situation.players[myIdent] == null;
  }

  function makeMoveObservationListener() {
    var value = Value();

    value.set({
      moveNeedsConfirmed: false,
      moveConfirmed: false
    });

    return value;
  }

  function moveNeedsConfirmed() {
    // Eh, miby there's redundancy here, dunno :P

    return computed(moveConfirmationObservable,
      confirmation => confirmation.moveNeedsConfirmed
    );
  }

  function usualButtons() {
    var gameInProgress = computed(
      situationObservable,
      situation => situation && (situation.status.status === "started")
    );

    return when(gameInProgress, resignButton(), postGameButtons());
  }

  return {
    view: (vDom) => {

      if (observing) {
        return postGameButtons();
      }
      else {
        return m('div', {
            class: "ssb-game-actions"
          },
          when(moveNeedsConfirmed(), moveConfirmButtons(), usualButtons())()
        );
      }
    },
    oninit: function(vNode) {
      var w = watch(situationObservable,
        (situation) => observing = isObserving(situation)
      );

      watchesToClear.push(w);
    },
    onremove: () => {
      watchesToClear.forEach(w => w());
      watchesToClear = [];
    },
    showMoveConfirmation: function() {
      moveConfirmationObservable.set({
        moveNeedsConfirmed: true,
        confirmed: false
      });

      return moveConfirmationObservable;
    },
    hideMoveConfirmation: function() {
      moveConfirmationObservable.set({
        moveNeedsConfirmed: false,
        confirmed: false
      });

      m.redraw();
    }

  }
}
