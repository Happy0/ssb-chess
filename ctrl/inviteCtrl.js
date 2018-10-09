const computed = require('mutant/computed');
const GameComparer = require('./gameComparer')();
const Value = require('mutant/value');

/**
 * A controller for managing invites
 * 
 * @param {*} myIdent - The user's identity.
 * @param {*} gameChallenger The ssb game challenger (at the lower layer).
 * @param {*} gameDb The ssb game db (at the lower layer).
 * @param {*} myGameUpdates An observable with the latest game update for the current player
 */
module.exports = (myIdent, gameChallenger, gameDb, myGameUpdates) => {

  function inviteToPlay(playerKey, asWhite) {
    return gameChallenger.inviteToPlay(playerKey, asWhite);
  }

  function acceptChallenge(rootGameMessage) {
    return gameChallenger.acceptChallenge(rootGameMessage);
  }

  function pendingChallengesSent() {
    const observable = Value([]);

    gameDb.pendingChallengesSent(myIdent).then(observable.set);

    // todo: not necessary to re-query all pending challenges for _ all _ game updates, just invite based ones
    const unlistenUpdates = myGameUpdates(() => gameDb.pendingChallengesSent(myIdent)
      .then(observable.set));

    return computed([observable], a => a, {
      comparer: GameComparer.hasSameGames,
      onUnlisten: unlistenUpdates,
    });
  }

  function pendingChallengesReceived() {
    const observable = Value([]);

    gameDb.pendingChallengesReceived(myIdent).then(observable.set);

    // todo: not necessary to re-query all pending challenges for _ all _ game updates, just invite based ones
    const unlistenUpdates = myGameUpdates(() => gameDb.pendingChallengesReceived(myIdent)
      .then(observable.set));

    return computed(
      [observable], a => a, {
        comparer: GameComparer.hasSameGames,
        onUnlisten: unlistenUpdates,
      },
    );
  }

  function createChessAndDhtInviteCode(colour) {
    return gameChallenger.createChessAndDhtInviteCode(colour);
  }

  function redeemDhtAndChessInvite(invite) {
    return gameChallenger.redeemDhtAndChessInvite(invite);
  }

  return {
    inviteToPlay,
    acceptChallenge,
    pendingChallengesSent,
    pendingChallengesReceived,
    createChessAndDhtInviteCode,
    redeemDhtAndChessInvite
  }
}