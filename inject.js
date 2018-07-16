const nest = require('depnest');
const { h, onceTrue } = require('mutant');
const get = require('lodash/get');
const m = require('mithril');
// const { isMsg } = require('ssb-ref')

const index = require('./index');

exports.gives = nest({
  'app.html.menuItem': true,
  'app.sync.locationId': true,
  'router.sync.routes': true,
})

exports.needs = nest({
  'app.sync.locationId': 'first',
  'sbot.obs.connection': 'first'
});

exports.create = function(api) {
  var pageLoaded = false;
  var topLevelDomElement = ChessContainer()
  var app = null;

  return nest({
    'app.html.menuItem': menuItem,
    'app.sync.locationId': locationId,
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

  function chessIndex() {
    // We only create the app once (for now.)
    if (pageLoaded) {
      return topLevelDomElement;
    } else {
      pageLoaded = true;

      onceTrue(api.sbot.obs.connection, (sbot) => {
        app = index(topLevelDomElement, sbot);
      });

      return topLevelDomElement
    }
  }

  function chessShow(location) {
    const gameId = location.key;

    // If the app is already open, route to the game, otherwise open the app at the
    // page
    if (pageLoaded) {
      app.goToGame(gameId);
      // TODO - put this in the router?
      topLevelDomElement.title = `/chess/${getRoot(location)}`;

      return topLevelDomElement;
    } else {
      var destinationRoute = `/games/${btoa(gameId)}`;

      pageLoaded = true;

      onceTrue(api.sbot.obs.connection, (sbot) => {
        app = index(topLevelDomElement, sbot, { initialView: destinationRoute });
      });

      return topLevelDomElement;
    }

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


  function ChessContainer () {
    const root = h('div.ssb-chess-container')
    // root.title = location.page
      // ? '/chess'
      // : `/chess/${getRoot(location)}`

    // root.id = api.app.sync.locationId(location)
    
    root.title = '/chess'
    root.id = JSON.stringify({ page: 'chess' })

    return root
  }
}

function locationId (location) {
  if (location.page === 'chess') return JSON.stringify({ page: 'chess' })
  if (isChessMsg(location)) return JSON.stringify({ page: 'chess' })
}

function isChessMsg (loc) {
  const type = get(loc, ['value', 'content', 'type'], '');
  return type.startsWith('chess');
}

function getRoot (msg) {
  return get(msg, ['value', 'content', 'root'], msg.key)
}
