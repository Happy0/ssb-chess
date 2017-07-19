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

  var mainDomElement = document.createElement('div');

  // Setting an id for the top level element interferes with the title of the tab
  mainDomElement.id="ssb-chess-container";
  topLevelDomElement.appendChild(mainDomElement);

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
        index(mainDomElement, sbot);
      });

      return topLevelDomElement;
    }
  }
}
