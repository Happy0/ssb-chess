const m = require('mithril');

module.exports = () => {

  const gamesInProgress = {name: "My Games", link: "/my_games"};
  const gamesMyMove = {name: "Games Awaiting Move", link:"/games_my_move"};
  const invitations = {name: 'Invitations', link: "/invitations"};
  const testarooni = {name: 'Testarooni', link: "/testarooni"};

  const navItems = [gamesInProgress, gamesMyMove, invitations, testarooni];

  function renderNavItem(navItem) {
    return m('span', {class: 'ssb-chess-nav-item'}, m("a[href=" + navItem.link + "]", { oncreate: m.route.link}, navItem.name));
  }

  function navigationTop() {
    return m('div', navItems.map(renderNavItem));
  }

  return {
    navigationTop: navigationTop
  }
}
