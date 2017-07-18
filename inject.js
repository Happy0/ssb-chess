const nest = require('depnest');
const index = require('./index');
const {
  h
} = require('mutant');

var onceTrue = require('mutant/once-true');

exports.gives = nest({
  'app.html': {
    page: true,
    menuItem: true
  }
})

exports.needs = nest({
  'sbot.obs.connection': 'first'
});


exports.create = function(api) {
  const route = '/chess'

  const topLevelDomElement = document.createElement('div');
  topLevelDomElement.id = "ssb-chess-container";

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
    if (path !== route) {
      return
    } else {
      onceTrue(api.sbot.obs.connection(), (sbot) => {
        index(topLevelDomElement, sbot);
      });

      return topLevelDomElement;
    }
  }
}
