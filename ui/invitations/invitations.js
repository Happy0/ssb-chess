const Miniboard = require('../miniboard/miniboard');
const m = require("mithril");

module.exports = (gameCtrl, sentOrReceivedBoolean) => {
  console.log(sentOrReceivedBoolean);
  var invitations = [];

  function renderInvite(gameSummary) {

    return m('div', {class: "ssb-chess-miniboard"},
      m(Miniboard(gameSummary, gameCtrl.getMyIdent() ))
    );
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
      return m("div", {class: "ssb-chess-miniboards"},
       invitations.map(renderInvite));
    }
  }
}
