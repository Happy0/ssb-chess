const uuidV4 = require('uuid/v4');

module.exports = (sbot) => {

  function inviteToPlay(invitingPubKey, asWhite) {
    const gameId = uuidV4();

    const post = {
      'type': 'ssb_chess_invite',
      'inviting': invitingPubKey,
      'gameId': gameId,
      'myColor': asWhite? 'white' : 'black'
    }

    sbot.publish(post, function(err,msg) {
      console.log("Posting invite: " + msg);
    });
  }

  function acceptChallenge(gameId) {
    const post = {
      'type': 'ssb_chess_invite_accept',
      'gameId': gameId
    }

    sbot.publish(post, function(err, msg) {
      console.log("Accepting game invite: " + msg);
    })
  }

  return {
    inviteToPlay: inviteToPlay,
    acceptChallenge: acceptChallenge
  }
}
