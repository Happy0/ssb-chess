var m = require("mithril");
var onceTrue = require('mutant/once-true');
var Value = require('mutant/value');
var when = require('mutant/when');
var computed = require('mutant/computed');

module.exports = (gameMoveCtrl, myIdent, situationObservable) => {

  var observing = true;

  var moveConfirmationObservable = makeMoveObservationListener();

  function moveConfirmButtons() {

    var confirmMove = () => {
      console.log("confirmed move");
      moveConfirmationObservable.set({
        moveNeedsConfirmed: false,
        confirmed: true
      })
    }

    var cancelMove = () => {
      console.log("Cancelled move.");
      moveConfirmationObservable.set({
        moveNeedsConfirmed: false,
        confirmed: false
      })
    }

    return m('div', {class: 'ssb-chess-move-confirm-buttons'},
      [
        m('button', {onclick: confirmMove}, 'Confirm'),
        m('button', {onclick: cancelMove}, 'Cancel')
      ]
    )
  }

  function resignButton() {
    var resignGame = () => {
      onceTrue(situationObservable, situation => gameMoveCtrl.resignGame(situation.gameId));
    }

    return m('button', {
      onclick: resignGame
    }, 'Resign');
  }

  function isObserving(situation) {
    return situation.players[myIdent] == null;
  }

  function makeMoveObservationListener () {
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
       confirmation => confirmation.moveNeedsConfirmed);
  }

  function usualButtons() {
    return resignButton();
  }

  return {
    view: (vDom) => {

      return m('div', {
        class: "ssb-game-actions",
        style: observing ? "display: none;" : ""
      },
        when(moveNeedsConfirmed(), moveConfirmButtons(), usualButtons())()
      );
    },
    oncreate: function(vNode) {
      situationObservable(situation => observing = isObserving(situation));
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

      // Wrap in 'setTimeout' as we don't want an accidental redraw within a
      // redraw as this can lead to bad behaviour
      setTimeout(m.redraw);

      return moveConfirmationObservable;
    }

  }
}
