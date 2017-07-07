const m = require('mithril');

module.exports = (gameCtrl) => {

  var challengableFriends = [];

  function renderFriendOption(friend) {
    return m('option', {value: friend.ident}, friend.displayName);
  }

  function renderFriendsdropDown() {
    console.log(challengableFriends);
    return m('select', {name: 'friends'}, challengableFriends.map(renderFriendOption) );
  }

  function renderChallengeControl() {
    const challengeButton = m('button', 'challenge');

    return m('div', [renderFriendsdropDown(), challengeButton]);
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
