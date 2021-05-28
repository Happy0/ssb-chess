const mutantPullReduce = require('mutant-pull-reduce');
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

  function inviteToPlay(playerKey, asWhite, rematchFromGameId) {
      return gameChallenger.inviteToPlay(playerKey, asWhite, rematchFromGameId);
  }
  
  function acceptChallenge(rootGameMessage) {
      return gameChallenger.acceptChallenge(rootGameMessage);
  }

  function pendingChallengesSent() {
      const pendingChallengesSource = gameDb.pendingChallengesSent(myIdent);
  
      return mutantPullReduce(pendingChallengesSource, (state, next) => next, {
        nextTick: true,
        sync: true,
      });
    }

  function pendingChallengesReceived() {
    const challengesReceivedSource = gameDb.pendingChallengesReceived(myIdent);

    return mutantPullReduce(challengesReceivedSource, (state, next) => next, {
      nextTick: true,
      sync: true,
    });
  }

  return {
      inviteToPlay,
      acceptChallenge,
      pendingChallengesSent,
      pendingChallengesReceived,
  }
}