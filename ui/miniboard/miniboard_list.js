const m = require('mithril');
const watch = require('mutant/watch');
const R = require('ramda');
const Miniboard = require('./miniboard');

/**
 * Takes an observable list of game summaries (non-observable inner objects)
 * and renders them into a page of miniboards.
 * Those miniboards create an observable to change the board when a move is
 * made.
 *
 * The list of games is updated if the gameSummaryListObs fires (e.g. if a
 * game ends or begins on a page of games a user is playing.)
 */
module.exports = (gameCtrl, gameSummaryListObs, ident) => {
  let gameSummaries = [];

  const oneMinuteMillseconds = 60000;

  this.ident = ident;

  let unlistenUpdates = null;

  let updateTimeAgoTimesTimer = null;

  function keepMiniboardsUpdated() {
    unlistenUpdates = watch(gameSummaryListObs, (summaries) => {
      if (hasDifferentGameIds(gameSummaries, summaries)) {
        // Only redraw if there is an additional game or a game has ended
        setTimeout(m.redraw);
      }

      gameSummaries = summaries;
    });
  }

  function hasDifferentGameIds(oldSummaries, newSummaries) {
    const comparer = (oldSummary, newSummary) => oldSummary.gameId === newSummary.gameId;
    return R.symmetricDifferenceWith(comparer, oldSummaries, newSummaries).length !== 0;
  }

  return {
    view: () => m('div', {
      class: 'ssb-chess-miniboards',
    },
    gameSummaries.map((summary) => {
      const situationObservable = gameCtrl.getGameCtrl().getSituationSummaryObservable(summary.gameId);

      return m(
        Miniboard(situationObservable, summary, this.ident),
      );
    })),
    oncreate() {
      keepMiniboardsUpdated();

      updateTimeAgoTimesTimer = setInterval(
        () => setTimeout(m.redraw), oneMinuteMillseconds,
      );
    },
    onremove: () => {
      clearInterval(updateTimeAgoTimesTimer);
      unlistenUpdates();
    },
  };
};
