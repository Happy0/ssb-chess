const Value = require("mutant/value");
const m = require("mithril");
const watch = require("mutant/watch");

module.exports = (gameObservable) => {

  const moveSelectedObservable = Value();

  var pgnMoves = [];
  const gameStatus = null;

  function renderHistory() {
    return m('div', {}, [renderMoveHistory()]);
  }

  function renderMoveHistory() {
      return pgnMoves.map(pgnMove => m('div', {class: 'ssb-chess-pgn-move'}, pgnMove));
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
