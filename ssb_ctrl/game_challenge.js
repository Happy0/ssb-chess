const About = require('ssb-ooo-about');
const Promise = require('bluebird');

module.exports = (sbot, myIdent) => {
  const about = About(sbot, {});
  const getLatestAboutMsgIds = Promise.promisify(about.async.getLatestMsgIds);

  function inviteToPlay(invitingPubKey, asWhite, rematchFromGameId) {
    return new Promise((resolve, reject) => {
      // Give some messages that give both player's latest 'about' messages
      // so that their name (about about) can be displayed to spectators who
      // don't have one of the players in their follow graph using ssb-ooo.
      const aboutMsgs = Promise.all(
        [
          getLatestAboutMsgIds(invitingPubKey),
          getLatestAboutMsgIds(myIdent),
        ],
      ).then(arr => arr.reduce((a, b) => a.concat(b), []));

      aboutMsgs.then((aboutInfo) => {
        const post = {
          type: 'chess_invite',
          inviting: invitingPubKey,
          myColor: asWhite ? 'white' : 'black',
        };

        if (rematchFromGameId) {
          post.root = rematchFromGameId;
        }

        if (aboutInfo && aboutInfo.length != 0) {
          post.branch = aboutInfo;
        }

        sbot.publish(post, (err, msg) => {
          if (err) {
            reject(err);
          } else {
            resolve(msg);
          }
        });
      });
    });
  }

  function acceptChallenge(gameRootMessage) {
    const post = {
      type: 'chess_invite_accept',
      root: gameRootMessage,
      // Used for ssb-ooo which allows clients to request messages from peers
      // that are outside their follow graph.
      branch: gameRootMessage,
    };

    return new Promise((resolve, reject) => {
      sbot.publish(post, (err, msg) => {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      });
    });
  }

  return {
    inviteToPlay,
    acceptChallenge
  };
};
