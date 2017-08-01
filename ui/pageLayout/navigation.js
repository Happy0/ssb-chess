const m = require('mithril');
const PubSub = require('pubsub-js');

module.exports = (gameCtrl) => {

  const gamesInProgress = {
    name: "Games",
    link: "/my_games",
    count: 0
  };
  const gamesMyMove = {
    name: "My Move",
    link: "/games_my_move",
    count: 0,
    countUpdateFn: gameCtrl.getGamesWhereMyMove
  };
  const invitations = {
    name: 'Invitations',
    link: "/invitations",
    count: 0,
    countUpdateFn: gameCtrl.pendingChallengesReceived
  };
  const observable = {
    name: 'Observe',
    link: "/observable",
    count: 0,
    countUpdateFn: gameCtrl.getFriendsObservableGames
  };

  var navItems = [gamesInProgress, gamesMyMove, invitations, observable];

  function renderNavItem(navItem) {
    return m('span', {
      class: 'ssb-chess-nav-item'
    }, m("a[href=" + navItem.link + "]", {
        oncreate: m.route.link
      },

      [m('span', navItem.name),
        m('span', {
          style: navItem.count === 0 ? 'display: none' : '',
          class: 'ssb-chess-nav-count'
        }, `(${navItem.count})`)
      ]));
  }

  function renderNavigation() {
    return m('div', navItems.map(renderNavItem));
  }

  function updateCounts() {
    var countPromises = navItems.map(item => item.countUpdateFn ? item.countUpdateFn().then(arr => arr.length) : Promise.resolve(0));

    Promise.all(countPromises).then(counts => {

      counts.forEach((count, idx) => {
        navItems[idx].count = count;
      });

      m.redraw();
    });
  }

  return {
    view: () => {
      return renderNavigation();
    },
    oncreate: () => {
      this.gameUpdatesListener = PubSub.subscribe('catch_up_with_games', updateCounts);
    },
    onremove: () => {
      Pubsub.unsubscribe(this.gameUpdatesListener);
    }
  }
}
