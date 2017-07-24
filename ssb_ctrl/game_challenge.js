const pull = require("pull-stream");

module.exports = (sbot, myIdent) => {

  function inviteToPlay(invitingPubKey, asWhite) {

    const post = {
      'type': 'chess_invite',
      'inviting': invitingPubKey,
      'myColor': asWhite ? 'white' : 'black'
    }

    return new Promise((resolve, reject) => {
      sbot.publish(post, function(err, msg) {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      });
    });
  }

  function acceptChallenge(gameRootMessage) {
    console.log("Accepting challenge. Root game message is: " + gameRootMessage);
    const post = {
      'type': 'chess_invite_accept',
      'root': gameRootMessage
    }

    return new Promise((resolve, reject) => {
      sbot.publish(post, function(err, msg) {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      });
    });
  }

  return {
    inviteToPlay: inviteToPlay,
    acceptChallenge: acceptChallenge
  }
}
