const m = require('mithril');
const _ = require('ramda');

module.exports = (gameCtrl) => {
  let challengableFriends = [];

  function renderFriendOption(friend) {
    return m('option', {
      value: friend.ident,
    }, friend.displayName);
  }

  function compareAlphabetically(a, b) {
      if (a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
      if (a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;
      return 0;
  }

  function renderFriendsdropDown() {

    return m('select', {
      id: 'ssb-chess-challenge-control-select',
      name: 'friends',
    }, challengableFriends.map(renderFriendOption));
  }

  function renderChallengeControl() {
    const invitePlayer = (e) => {
      const buttonElement = e.srcElement;
      buttonElement.disabled = true;

      const inviteDropdown = document.getElementById('ssb-chess-challenge-control-select');
      const friendId = inviteDropdown.options[inviteDropdown.selectedIndex].value;

      gameCtrl.getInviteCtrl().inviteToPlay(friendId)
        .then(msg => m.route.set(`/games/${btoa(msg.key)}`))
        .then(() => { buttonElement.disabled = false; });
    };

    const challengeButton = m('button', {
      class: 'ssb-chess-challenge-send-button',
      onclick: invitePlayer,
    }, 'Challenge');

    return m('div', {
      class: 'ssb-chess-challenge-control',
    }, [renderFriendsdropDown(), challengeButton]);
  }

  function getWeight(playerId, frequencies) {
    return frequencies[playerId] ? frequencies[playerId] : 0;
  }

  /**
   * Sort the list of invitable people by the frequency with which we've played them (weighted slightly by recency.)
   */
  function updateFriends() {

    var playedFrequencies = gameCtrl.getSocialCtrl().getWeightedPlayFrequencyList();
    var followedByMe = gameCtrl.getSocialCtrl().followedByMeWithNames()

    Promise.all([followedByMe, playedFrequencies]).then(result => {
      var [following, playedWeights] = result;

      following.sort( (a,b) => {
        var comp = getWeight(b.ident, playedWeights) - getWeight (a.ident, playedWeights);

        if (comp === 0) {
          return compareAlphabetically(a,b);
        } else {
          return comp;
        }

      });
        

      challengableFriends = following;
    }).then(m.redraw);
  }

  return {
    view: renderChallengeControl,

    oncreate: () => {
      updateFriends();
    },
  };
};
