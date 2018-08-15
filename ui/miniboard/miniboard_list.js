const m = require('mithril');
const Chessground = require('chessground').Chessground;
const watch = require('mutant/watch');
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

  function keepMiniboardsUpdated() {
    unlistenUpdates = watch(gameSummaryListObs, (summaries) => {
      gameSummaries = summaries;
      setTimeout(m.redraw);
    });
  }

  return {
    view: () => m('div', {
      class: 'ssb-chess-miniboards',
    },
    gameSummaries.map((summary) => {
      const situationObservable = gameCtrl.getSituationSummaryObservable(summary.gameId);

      return m(
        Miniboard(situationObservable, summary, this.ident),
      );
    })),
    oncreate(e) {
      keepMiniboardsUpdated();

      this.updateTimeAgoTimes = setInterval(
        () => setTimeout(m.redraw), oneMinuteMillseconds,
      );
    },
    onremove: () => {
      clearInterval(this.updateTimeAgoTimes);
      unlistenUpdates();
    },
  };
};
