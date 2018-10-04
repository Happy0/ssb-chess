const m = require('mithril');
const Miniboard = require('../miniboard/miniboard');
const ChallengeComponent = require('../challenge/challenge_control');

module.exports = (mainCtrl) => {
  let invitationsReceived = [];
  let invitationsSent = [];

  let watches = [];

  const challengeComponent = ChallengeComponent(mainCtrl);

  function renderAcceptOrRejectControls(gameId, inviteSent) {
    const acceptInvite = () => {
      mainCtrl.getInviteCtrl().acceptChallenge(gameId)
        .then(() => m.route.set(`/games/${btoa(gameId)}`));
    };

    // Hide for now since it doesn't do anything yet ;x
    // Will unhide once I implement 'cancel invites' controllers
    // and take them into account when indexing games.
    const cancelButton = m('button', {
      style: 'display: none;',
      class: 'ssb-chess-miniboard-controls',
      disabled: true,
    }, 'cancel');

    const acceptOrRejectButtons = [
      m('button', {
        class: 'ssb-chess-miniboard-control',
        onclick: acceptInvite,
      }, 'accept'),
      m('button', {
        class: 'ssb-chess-miniboard-control',
        disabled: true,
      }, 'decline'),
    ];

    return m('div', {
      class: 'ssb-chess-miniboard-controls',
    }, (inviteSent ? cancelButton : acceptOrRejectButtons));
  }

  function renderInvite(gameSummary, sent) {
    const gameSummaryObservable = mainCtrl.getGameCtrl().getSituationSummaryObservable(gameSummary.gameId);

    return m('div', {
      class: 'ssb-chess-miniboard',
    }, [
      m(Miniboard(gameSummaryObservable, gameSummary, mainCtrl.getMyIdent())),
      renderAcceptOrRejectControls(gameSummary.gameId, sent),
    ]);
  }

  function invitesToSituations(invites) {
    return Promise.all(
      invites.map(invite => mainCtrl.getGameCtrl().getSituation(invite.gameId)),
    );
  }

  function keepInvitesUpdated() {
    const invitesReceived = mainCtrl.getInviteCtrl().pendingChallengesReceived();
    const invitesSent = mainCtrl.getInviteCtrl().pendingChallengesSent();

    const w1 = invitesReceived((received) => {
      invitesToSituations(received)
        .then((inviteSituations) => { invitationsReceived = inviteSituations; })
        .then(m.redraw);
    });

    const w2 = invitesSent((sent) => {
      invitesToSituations(sent)
        .then((inviteSituations) => { invitationsSent = inviteSituations; })
        .then(m.redraw);
    });

    watches.push(w1);
    watches.push(w2);
  }

  function renderMiniboards(invites, sent, title) {
    const titleDiv = m('div', {
      class: 'ssb-chess-invites-section-title',
    }, title);

    const miniboards = m('div', {
      class: 'ssb-chess-miniboards',
    },

    invites.map(invite => renderInvite(invite, sent)));

    return m('div', {}, [titleDiv, miniboards]);
  }

  return {
    oncreate() {
      keepInvitesUpdated();
    },
    view() {
      const invitationsReceivedMiniboards = renderMiniboards(invitationsReceived, false, 'Received');
      const invitationsSentMiniboards = renderMiniboards(invitationsSent, true, 'Sent');

      const challengeCtrl = m(challengeComponent);

      return m('div', [
        challengeCtrl,
        invitationsReceivedMiniboards,
        invitationsSentMiniboards,
      ]);
    },
    onremove() {
      watches.forEach(w => w());
      watches = [];
    },
  };
};
