const Value = require("mutant/value");
const m = require("mithril");
const watch = require("mutant/watch");

const R = require("ramda");

module.exports = (gameObservable) => {

  var moveNumberSelected = "live";
  const moveSelectedObservable = Value(moveNumberSelected);

  var pgnMoves = [];
  const gameStatus = null;

  var latestMove = 0;

  function renderHistory() {
    return m('div', {
      class: 'ssb-chess-history-area'
    }, [renderMoveHistory()]);
  }

  function renderHalfMove(pgn, moveNumber) {
    const clickHandler = () => {

      if (moveNumber === latestMove) {
        moveNumberSelected = "live";
      } else {
        moveNumberSelected = moveNumber;
      }

      moveSelectedObservable.set(moveNumber);
    }

    return m('div', {
      onclick: clickHandler
    }, pgn);
  }

  function renderMoveHistory() {
    const halves = R.splitEvery(2, pgnMoves);

    return halves.map((half, halfNumber) => m('div', {
      class: 'ssb-chess-pgn-move'
    }, [renderHalfMove(half[0], ((halfNumber + 1) * 2) - 1 ), renderHalfMove(half[1], (halfNumber + 1) * 2)]));
  }

  function handleArrowKeys() {
    const left = 37;
    const up = 38;
    const right = 39;
    const down = 40;

    document.onkeydown = function(evt) {
      evt = evt || window.event;
      if (evt.keyCode === left && (moveNumberSelected !== 0)) {
        if (moveNumberSelected === "live") {
          moveNumberSelected = latestMove;
        }

        moveNumberSelected = moveNumberSelected - 1;
      } else if (evt.keyCode === right && moveNumberSelected !== "live") {
        moveNumberSelected = moveNumberSelected + 1;

        if (moveNumberSelected === latestMove) {
          moveNumberSelected = "live";
        }

      } else if (evt.keyCode === up) {
        moveNumberSelected = 0;
      } else if (evt.keyCode === down) {
        moveNumberSelected = "live";
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

        m.redraw();
      }
    });

  }

  return {
    view: renderHistory,
    oncreate: () => {
      watchForGameUpdates();
      handleArrowKeys();
    },
    getMoveSelectedObservable: getMoveSelectedObservable
  }

}
