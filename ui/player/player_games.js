const Scroller = require('pull-scroll');
var h = require('hyperscript');
var m = require('mithril');
var pull = require('pull-stream');

var Miniboard = require('../miniboard/miniboard');

module.exports = (playerId, gameCtrl) => {

  const finishedGamesSource = gameCtrl.getPlayerCtrl().endedGamesSummariesSource(playerId);

  function renderFinishedGameSummary(gameSummary) {
    var dom = document.createElement('div');

    var miniboard = Miniboard(gameCtrl, gameSummary, playerId);
    m.mount(dom, miniboard);

    return dom;
  }

  function getScrollingFinishedGamesDom() {

    var content = h('div')
    var scroller = h('div', {
        style: {
          //must set overflow-y to scroll for this to work.
          'overflow-y': 'scroll',
          //and cause this element to not stretch.
          //this can also be achived using flexbox column.
          position: 'fixed', bottom:'0px', top: '0px',
          width: '600px'
        }
      }, content)

      pull(finishedGamesSource,
        Scroller(scroller, content, renderFinishedGameSummary)
      );

      return h('div', {
        className: 'ssb-chess-player-finished-games'
      }, scroller);
  }


  return {
    getScrollingFinishedGamesDom: getScrollingFinishedGamesDom
  }
}
