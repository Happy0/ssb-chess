const m = require('mithril');

module.exports = (gameCtrl) => {

  var challengableFriends = [];

  function renderChallengeControl() {
    const challengeButton = m('button', 'challenge');

    return m('div', [m('p', 'nothing yet'), challengeButton]);
  }

  return {
    view : renderChallengeControl,

    oncreate: () => {
      // Using palaroonis as a variable name because it's my project and
      // nobody can stop me >=D #madlad
      gameCtrl.getSocialCtrl().friends().then(palaroonis =>
         challengableFriends = palaroonis);
    }
  }

}
