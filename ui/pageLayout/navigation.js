const m = require('mithril');

module.exports = () => {

  const gamesInProgress = {name: "My Games", link: "#!/my_games"};
  const gamesMyMove = {name: "Games Awaiting Move", link:"#!/games_my_move"};
  const invitationsSent = {name: 'Invitations Sent', link: "#!/invitations_sent"};
  const invitationsReceived = {name: 'Invitations Received', link: "#!/invitations_received"};

  const navItems = [gamesInProgress, gamesMyMove, invitationsSent, invitationsReceived];

  function renderNavItem(navItem) {
    return m('span', {class: 'ssb-chess-nav-item'}, m("a[href=" + navItem.link + "]", navItem.name));
  }

  function navigationTop() {
    return m('div', navItems.map(renderNavItem));
  }

  return {
    navigationTop: navigationTop
  }
}
