const m = require('mithril');

module.exports = (gameCtrl) => {

  var challengableFriends = [];

  function renderFriendOption(friend) {
    return m('option', {value: friend.ident}, friend.displayName);
  }

  function renderFriendsdropDown() {
    console.log(challengableFriends);
    return m('select', {id: "ssb-chess-challenge-control", name: 'friends'}, challengableFriends.map(renderFriendOption) );
  }

  function renderChallengeControl() {
    const invitePlayer = () => {
      var inviteDropdown = document.getElementById("ssb-chess-challenge-control");
      var friendId = inviteDropdown.options[inviteDropdown.selectedIndex].value;

      gameCtrl.inviteToPlay(friendId).then(m.redraw);
    }

    const challengeButton = m('button', {onclick: invitePlayer}, 'Challenge');

    return m('div', {class: "ssb-chess-challenge-control"}, [renderFriendsdropDown(), challengeButton]);
  }

  return {
    view : renderChallengeControl,

    oncreate: () => {
      // Using palaroonis as a variable name because it's my project and
      // nobody can stop me >=D #madlad
      gameCtrl.getSocialCtrl().friendsWithNames().then(palaroonis => {
         challengableFriends = palaroonis;
       }).then(m.redraw);
    }
  }

}
