const Value = require("mutant/value");
const m = require("mithril");
const watch = require("mutant/watch");

const R = require("ramda");

module.exports = (gameObservable) => {

  const moveSelectedObservable = Value();

  var pgnMoves = [];
  const gameStatus = null;

  var moveNumberSelected = null;
  var latestMove = 0;

  function renderHistory() {
    return m('div', {
      class: 'ssb-chess-history-area'
    }, [renderMoveHistory()]);
  }

  function renderHalfMove(pgn, moveNumber) {
    const clickHandler = () => {
      moveNumberSelected = moveNumber;
      moveSelectedObservable.set(moveNumber);
    }

    return m('div', {
      onclick: clickHandler
    }, pgn);
  }

  function renderMoveHistory() {
    const halves = R.splitEvery(2, pgnMoves);

    return halves.map((half, moveNumber) => m('div', {
      class: 'ssb-chess-pgn-move'
    }, [renderHalfMove(half[0], moveNumber), renderHalfMove(half[1], moveNumber + 1)]));
  }

  function handleArrowKeys() {
    const left = 37;
    const up = 38;
    const right = 39;
    const down = 40;

    document.onkeydown = function(evt) {
      evt = evt || window.event;
      if (evt.keyCode === left && (moveNumberSelected > 0)) {
        moveNumberSelected = moveNumberSelected - 1;
      } else if (evt.keyCode === left && (moveNumberSelected == null)) {
        moveNumberSelected = latestMove - 1;
      } else if (evt.keyCode === right && moveNumberSelected < latestMove) {
        moveNumberSelected = moveNumberSelected + 1;
      } else if (evt.keyCode === up) {
        moveNumberSelected = 0;
      } else if (evt.keyCode === down) {
        moveNumberSelected = latestMove;
      }

      moveSelectedObservable.set(moveNumberSelected);
    }
  }

  /**
   * This observable changes as the user selects old positions in the move
   * history to view the move of. The value emitted is the ply number of the
   * move
   */
  function getMoveSelectedObservable() {
    return moveSelectedObservable;
  }

  function watchForGameUpdates() {
    gameObservable(situation => {
      if (situation) {
        pgnMoves = situation.pgnMoves;
        status = situation.gameStatus;

        latestMove = situation.ply;

        handleArrowKeys();

        m.redraw();
      }
    });
  }

  return {
    view: renderHistory,
    oncreate: watchForGameUpdates,
    getMoveSelectedObservable: getMoveSelectedObservable
  }

}
