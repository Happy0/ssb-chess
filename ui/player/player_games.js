const Scroller = require('pull-scroll');
var h = require('hyperscript');
var m = require('mithril');
var pull = require('pull-stream');

var Miniboard = require('../miniboard/miniboard');

module.exports = (gameCtrl) => {

  function renderFinishedGameSummary(gameSummary, playerId) {
    var dom = document.createElement('div');
    dom.className = "ssb-chess-profile-game-summary"

    var miniboard = Miniboard(gameCtrl, gameSummary, playerId);
    m.render(dom, m(miniboard));

    return dom;
  }

  function getScrollingFinishedGamesDom(playerId) {
    const finishedGamesSource = gameCtrl.getPlayerCtrl().endedGamesSummariesSource(playerId);

    var content = h('div')
    var scroller = h('div', {
        style: {
          'overflow-y': 'scroll',
           position: 'fixed', bottom:'0px', top: '200px'
        },
        className: "ssb-chess-player-finished-games-scroller"
      }, content)

      pull(finishedGamesSource,
        Scroller(scroller, content, (current) => renderFinishedGameSummary(current, playerId)  )
      );

      return h('div', {
        className: 'ssb-chess-player-finished-games'
      }, scroller);
  }


  return {
    getScrollingFinishedGamesDom: getScrollingFinishedGamesDom
  }
}
