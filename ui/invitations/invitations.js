const Miniboard = require('../miniboard/miniboard');
const m = require("mithril");

module.exports = (gameCtrl, sentOrReceivedBoolean) => {
  console.log(sentOrReceivedBoolean);
  var invitations = [];

  function renderAcceptOrRejectControls(gameId) {

    const acceptInvite = () => gameCtrl.acceptChallenge(gameId).then(e => m.redraw());

    const cancelButton = m('button', {
      class: 'ssb-chess-miniboard-controls'
    }, 'cancel');

    const acceptOrRejectButtons = [
      m('button', {
        class: 'ssb-chess-miniboard-control',
        onclick: acceptInvite
      }, 'accept'),
      m('button', {
        class: 'ssb-chess-miniboard-control',
        disabled: true
      }, 'decline')
    ];

    return m('div', {
      class: "ssb-chess-miniboard-controls"
    }, (sentOrReceivedBoolean ? cancelButton : acceptOrRejectButtons));
  }

  function renderInvite(gameSummary) {

    return m('div', {
      class: "ssb-chess-miniboard"
    }, [
      m(Miniboard(gameSummary, gameCtrl.getMyIdent())),
      renderAcceptOrRejectControls(gameSummary.gameId)
    ]);
  }

  function updateInvites() {
    const invitesFunction =
      sentOrReceivedBoolean ? gameCtrl.pendingChallengesSent : gameCtrl.pendingChallengesReceived;

    var inviteSituations = invitesFunction().then(invites => Promise.all(
      invites.map(invite => gameCtrl.getSituation(invite.gameId))));

    inviteSituations.then(situations => invitations = situations).then(m.redraw);
  }

  return {
    oncreate: function() {
      updateInvites();
    },
    view: function() {
      console.log("views clicked");
      return m("div", {
          class: "ssb-chess-miniboards"
        },
        invitations.map(renderInvite));
    }
  }
}
