const nest = require('depnest');
const index = require('./index');
const {
  h
} = require('mutant');

export.gives = nest({
  'app.html': {
    page: true,
    menuItem: true
  }
})

export.needs = nest({
  'sbot': 'first'
});

export.create = function(api) {
  const route = '/chess'

  return nest({
    'app.html': {
      menuItem: menuItem,
      page: chessPage
    }
  })

  function menuItem(handleClick) {
    return h('a', {
      style: {
        order: 0
      },
      'ev-click': () => handleClick(route)
    }, route)
  }


  function chessPage(path) {
    if (path !== route) return

    // todo: build required scuttlebot functions from patchcore into this object
    // and structure the sbot object as though it was 'sbot' from just plain
    // scuttlebot. (i.e. not sbot.async.get but sbot.get)
    var sbot = {};

    return index(sbot, document.createElement('div'));
  }
}
