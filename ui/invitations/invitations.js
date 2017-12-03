const Miniboard = require('../miniboard/miniboard');
const m = require("mithril");
const ChallengeComponent = require('../challenge/challenge_control');

module.exports = (gameCtrl) => {

  var invitationsReceived = [];
  var invitationsSent = [];

  var challengeComponent = ChallengeComponent(gameCtrl);

  function renderAcceptOrRejectControls(gameId, inviteSent) {

    const acceptInvite = () => {
      gameCtrl.acceptChallenge(gameId)
        .then(e => m.route.set("/games/" + btoa(gameId)))
    }

    // Hide for now since it doesn't do anything yet ;x
    // Will unhide once I implement 'cancel invites' controllers
    // and take them into account when indexing games.
    const cancelButton = m('button', {
      style: 'display: none;',
      class: 'ssb-chess-miniboard-controls',
      disabled: true
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
    }, (inviteSent ? cancelButton : acceptOrRejectButtons));
  }

  function renderInvite(gameSummary, sent) {

    return m('div', {
      class: "ssb-chess-miniboard"
    }, [
      m(Miniboard(gameCtrl, gameSummary, gameCtrl.getMyIdent())),
      renderAcceptOrRejectControls(gameSummary.gameId, sent)
    ]);
  }

  function invitesToSituations(invites) {
    return Promise.all(
      invites.map(invite => gameCtrl.getSituation(invite.gameId)));
  }

  function keepInvitesUpdated() {
    var invitesReceived = gameCtrl.pendingChallengesReceived();
    var invitesSent = gameCtrl.pendingChallengesSent();

    invitesReceived(received => {
      invitesToSituations(received)
        .then(inviteSituations => invitationsReceived = inviteSituations)
        .then(m.redraw);
    })

    invitesSent(sent => {
      invitesToSituations(sent)
        .then(inviteSituations => invitationsSent = inviteSituations)
        .then(m.redraw);
    })

  }

  function renderMiniboards(invites, sent, title) {

    var title = m('div', {
      class: "ssb-chess-invites-section-title"
    }, title);

    var miniboards = m("div", {
        class: "ssb-chess-miniboards"
      },

      invites.map(invite => renderInvite(invite, sent))

    )

    return m('div', {}, [title, miniboards]);
  }

  return {
    oncreate: function() {

      keepInvitesUpdated();
    },
    view: function() {

      var invitationsReceivedMiniboards = renderMiniboards(invitationsReceived, false, "Received");
      var invitationsSentMiniboards = renderMiniboards(invitationsSent, true, "Sent");

      var challengeCtrl = m(challengeComponent);

      return m('div', [
        challengeCtrl,
        invitationsReceivedMiniboards,
        invitationsSentMiniboards
      ]);
    },
    onremove: function(e) {
      PubSub.unsubscribe(this.miniboardUpdatesListener);
    }
  }
}
