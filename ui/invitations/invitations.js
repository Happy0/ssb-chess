const Miniboard = require('../miniboard/miniboard');
const m = require("mithril");

module.exports = (gameCtrl, sentOrReceivedBoolean) => {
  console.log(sentOrReceivedBoolean);
  var invitations = [];

  function renderAcceptOrRejectControls(gameId) {

    const acceptInvite = () => gameCtrl.acceptChallenge(gameId).then(e => m.redraw());

    return m('div', {class: "ssb-chess-miniboard-controls"}, [
      m('button', { class: 'ssb-chess-miniboard-control', onclick: acceptInvite }, 'accept'),
      m('button', { class: 'ssb-chess-miniboard-control', disabled: true}, 'decline')
    ]);
  }

  function renderInvite(gameSummary) {

    return m('div', {
      class: "ssb-chess-miniboard"
    }, [
      m(Miniboard(gameSummary, gameCtrl.getMyIdent())),
      renderAcceptOrRejectControls(gameSummary.gameId)
    ]);
  }

  return {
    oncreate: function() {
      const invitesFunction =
        sentOrReceivedBoolean ? gameCtrl.pendingChallengesSent : gameCtrl.pendingChallengesReceived;

      var inviteSituations = invitesFunction().then(invites => Promise.all(
        invites.map(invite => gameCtrl.getSituation(invite.gameId))));

      inviteSituations.then(situations => invitations = situations).then(m.redraw);

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
