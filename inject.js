const nest = require('depnest');
const { h, onceTrue } = require('mutant');
const get = require('lodash/get');
// const { isMsg } = require('ssb-ref')

const index = require('./index');

exports.gives = nest({
  'app.html.menuItem': true,
  'router.sync.routes': true,
})

exports.needs = nest({
  'app.sync.locationId': 'first',
  'sbot.obs.connection': 'first'
});

exports.create = function(api) {
  // var topLevelDomElement
  var pageLoaded = false;

  return nest({
    'app.html.menuItem': menuItem,
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
    const topLevelDomElement = ChessContainer(location);

    onceTrue(api.sbot.obs.connection, (sbot) => {
      index(topLevelDomElement, sbot);

      pageLoaded = true;
    });

    return topLevelDomElement
  }

  function chessShow(location) {
    const rootEl = ChessContainer(location);
    const gameId = location.key;

    onceTrue(api.sbot.obs.connection, (sbot) => {
      index(rootEl, sbot, { initialView: `/games/${btoa(gameId)}` });
    });

    return rootEl
  }

  function routes (sofar = []) {
    // loc = location, an object with all the info required to specify a location
    const routes = [
      [ loc => loc.page === 'chess', chessIndex ],
      [ loc => isChessMsg(loc), chessShow],
    ]

    // this stacks chess routes below routes loaded by depject so far (polite)
    return [...sofar, ...routes]
  }


  function ChessContainer (location) {
    const root = h('div.ssb-chess-container')
    root.title = location.page
      ? '/chess'
      : `/chess/${getRoot(location)}`

    root.id = api.app.sync.locationId(location)

    return root
}
}

function isChessMsg (loc) {
  const type = get(loc, ['value', 'content', 'type'], '');
  return type.startsWith('chess');
}

function getRoot (msg) {
  return get(msg, ['value', 'content', 'root'], msg.key)
}
