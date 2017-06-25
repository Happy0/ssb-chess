const m = require('mithril');

module.exports = () => {

  const gamesInProgress = {name: "My Games", link: "#!/my_games"}

  const navItems = [gamesInProgress];

  function renderNavItem(navItem) {
    return m("a[href=" + navItem.link + "]", navItem.name);
  }

  function navigationTop() {
    return m('div', navItems.map(renderNavItem));
  }

  return {
    navigationTop: navigationTop
  }
}
