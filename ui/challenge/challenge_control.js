const m = require('mithril');

module.exports = (gameCtrl) => {

  var challengableFriends = [];

  function renderFriendOption(friend) {
    return m('option', {
      value: friend.ident
    }, friend.displayName);
  }

  function sortChallengeableFriendsAlphabetically() {
    challengableFriends.sort(function(a, b) {
      if (a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
      if (a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;
      return 0;
    });
  }

  function renderFriendsdropDown() {
    sortChallengeableFriendsAlphabetically();

    return m('select', {
      id: "ssb-chess-challenge-control",
      name: 'friends'
    }, challengableFriends.map(renderFriendOption));
  }

  function renderChallengeControl() {
    const invitePlayer = (e) => {
      var buttonElement = e.srcElement;
      buttonElement.disabled = true

      var inviteDropdown = document.getElementById("ssb-chess-challenge-control");
      var friendId = inviteDropdown.options[inviteDropdown.selectedIndex].value;

      gameCtrl.inviteToPlay(friendId)
        .then(m.redraw)
        .then(() => buttonElement.disabled = false);
    }

    const challengeButton = m('button', {
      onclick: invitePlayer
    }, 'Challenge');

    return m('div', {
      class: "ssb-chess-challenge-control"
    }, [renderFriendsdropDown(), challengeButton]);
  }

  function updateFriends() {
    // Using palaroonis as a variable name because it's my project and
    // nobody can stop me >=D #madlad
    gameCtrl.getSocialCtrl().friendsWithNames().then(palaroonis => {
      challengableFriends = palaroonis;
    }).then(m.redraw);
  }

  return {
    view: renderChallengeControl,

    oncreate: () => {
      updateFriends();
    }
  }

}
