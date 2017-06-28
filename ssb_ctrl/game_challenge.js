const pull = require("pull-stream");

module.exports = (sbot, myIdent) => {

  const startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  const myFeedSource = sbot.createHistoryStream({
    id: myIdent
  });

  const invitesSentFilter = pull.filter(msg => msg.value.content.type === "ssb_chess_invite");

  const filterByChallengeAcceptedThrough = pull.filter(msg => msg.value.content.type === "ssb_chess_invite_accept" && msg.value.content.root != null);
  const mapRootGameIdThrough = pull.map(msg => msg.value.content.root);

  function inviteToPlay(invitingPubKey, asWhite) {

    const post = {
      'type': 'ssb_chess_invite',
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
      'type': 'ssb_chess_invite_accept',
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
