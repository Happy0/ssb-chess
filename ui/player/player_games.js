const Scroller = require('pull-scroll');
const h = require('hyperscript');
const m = require('mithril');
const pull = require('pull-stream');

const Miniboard = require('../miniboard/miniboard');

module.exports = (gameCtrl) => {
  function renderFinishedGameSummary(gameSummary, playerId) {
    const dom = document.createElement('div');
    dom.className = 'ssb-chess-profile-game-summary';

    const gameSummaryObservable = gameCtrl.getGameCtrl().getSituationSummaryObservable(gameSummary.gameId);

    const miniboard = Miniboard(gameSummaryObservable, gameSummary, playerId);

    const board = m(miniboard);

    m.render(dom, board);

    return dom;
  }

  function getScrollingFinishedGamesDom(playerId) {
    const finishedGamesSource = gameCtrl.getPlayerCtrl().endedGamesSummariesSource(playerId);

    const content = h('div', {
      className: 'ssb-chess-player-finished-games-scroller',
    });

    const scroller = h('div', {
      style: {
        'overflow-y': 'scroll',
        position: 'fixed',
        bottom: '0px',
        top: '200px',
        width: '100%',
      },
    }, content);

    pull(finishedGamesSource,
      Scroller(scroller, content, current => renderFinishedGameSummary(current, playerId)));

    return h('div', {
      className: 'ssb-chess-player-finished-games',
    }, scroller);
  }


  return {
    getScrollingFinishedGamesDom,
  };
};
