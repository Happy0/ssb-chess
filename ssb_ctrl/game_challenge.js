module.exports = (sbot) => {

  const startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  function inviteToPlay(invitingPubKey, asWhite) {

    const post = {
      'type': 'ssb_chess_invite',
      'inviting': invitingPubKey,
      'gameId': gameId,
      'myColor': asWhite? 'white' : 'black'
    }

    sbot.publish(post, function(err,msg) {
      console.log("Posting invite: " + console.dir(msg));
    });
  }

  function acceptChallenge(gameRootMessage) {
    const post = {
      'type': 'ssb_chess_invite_accept',
      'root': gameRootMessage
    }

    sbot.publish(post, function(err, msg) {
      console.log("Accepting game invite: " + console.dir(msg));
    })
  }

  return {
    inviteToPlay: inviteToPlay,
    acceptChallenge: acceptChallenge
  }
}
