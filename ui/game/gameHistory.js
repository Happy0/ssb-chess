const Value = require("mutant/value");
const m = require("mithril");
const watch = require("mutant/watch");

const R = require("ramda");

module.exports = (gameObservable) => {

  const moveSelectedObservable = Value();

  var pgnMoves = [];
  const gameStatus = null;

  function renderHistory() {
    return m('div', {
      class: 'ssb-chess-history-area'
    }, [renderMoveHistory()]);
  }

  function renderHalfMove(pgn, moveNumber) {
    const clickHandler = () => {
      moveSelectedObservable.set(moveNumber);
    }

    return m('div', {onclick: clickHandler}, pgn);
  }

  function renderMoveHistory() {
    const halves = R.splitEvery(2, pgnMoves);

    return halves.map( (half, moveNumber) => m('div', {
      class: 'ssb-chess-pgn-move'
    }, [renderHalfMove(half[0], moveNumber), renderHalfMove(half[1], moveNumber + 1)]));
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

        m.redraw();
      }
    });
  }

  return {
    view: renderHistory,
    oncreate: watchForGameUpdates,
    getMoveSelectedObservable: getMoveSelectedObservable,
  }

}
