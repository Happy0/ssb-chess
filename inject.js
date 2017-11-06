const nest = require('depnest');
const { h, onceTrue } = require('mutant');
// const { isMsg } = require('ssb-ref')

const index = require('./index');

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.chessIndex': true,
  'router.sync.routes': true,
})

exports.needs = nest({
  'app.page.chessIndex': 'first',
  'sbot.obs.connection': 'first'
});

exports.create = function(api) {
  const topLevelDomElement = h('div.ssb-chess-container', { title: '/chess' })
  var pageLoaded = false;

  return nest({
    'app.html.menuItem': menuItem,
    'app.page.chessIndex': chessIndex,
    'router.sync.routes': routes,
  })

  function menuItem(handleClick) {
    return h('a', {
      style: {
        order: 0
      },
      'ev-click': () => handleClick({ page: 'chess' })
    }, '/chess')
  }

  function chessIndex(location) {
    if (pageLoaded) {
      return topLevelDomElement;
    }

    onceTrue(api.sbot.obs.connection(), (sbot) => {

      index(topLevelDomElement, sbot);

      pageLoaded = true;
    });

    return topLevelDomElement;
  }

  function routes (sofar = []) {
    const pages = api.app.page

    // loc = location, an object with all the info required to specify a location
    const routes = [
//    [ loc => loc.page === 'chessGame' && isMsg(loc.game), pages.chessGame ], // example
//    [ loc => loc.page === 'chess' && isMsg(loc.game), pages.chessGame ],     // alternative

      [ loc => loc.page === 'chess', pages.chessIndex ],
    ]

    // this stacks chess routes below routes loaded by depject so far (polite)
    return [...sofar, ...routes]
  }
}
