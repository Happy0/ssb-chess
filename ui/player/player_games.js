const Scroller = require('pull-scroll');
var h = require('hyperscript');
var m = require('mithril');
var pull = require('pull-stream');

var Miniboard = require('../miniboard/miniboard');

module.exports = (gameCtrl) => {

  function renderFinishedGameSummary(gameSummary, playerId) {
    var dom = document.createElement('div');
    dom.className = "ssb-chess-profile-game-summary";

    var gameSummaryObservable = gameCtrl.getSituationSummaryObservable(gameSummary.gameId);

    var miniboard = Miniboard(gameSummaryObservable, gameSummary, playerId);

    var board = m(miniboard);

    m.render(dom, board);

    return dom;
  }

  function getScrollingFinishedGamesDom(playerId) {
    const finishedGamesSource = gameCtrl.getPlayerCtrl().endedGamesSummariesSource(playerId);

    var content = h('div', {
      className: "ssb-chess-player-finished-games-scroller"
    })

    var scroller = h('div', {
      style: {
        'overflow-y': 'scroll',
        position: 'fixed',
        bottom: '0px',
        top: '200px',
        width: '100%'
      },
    }, content)

    pull(finishedGamesSource,
      Scroller(scroller, content, (current) => renderFinishedGameSummary(current, playerId))
    );

    return h('div', {
      className: 'ssb-chess-player-finished-games'
    }, scroller);
  }


  return {
    getScrollingFinishedGamesDom: getScrollingFinishedGamesDom
  }
}
