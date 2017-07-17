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
  'api.sbot.obs.connection': 'first'
});


exports.create = function(api) {
  const route = '/chess'

  const topLevelDomElement = document.createElement('div');

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

  function chessPage() {
    return topLevelDomElement;
  }

  onceTrue(api.sbot.obs.connection(), (sbot) => {
    if (path !== route) return

    index(sbot, topLevelDomElement);

    return topLevelDomElement;
  });
}
