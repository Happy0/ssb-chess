const Promise = require('bluebird');

module.exports = (dataAccess, myIdent) => {
  const getLatestAboutMsgIds = Promise.promisify(dataAccess.getLatestAboutMsgIds.bind(dataAccess));

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

          // TODO: Make this branch off the previous game's 'chess_game_end'
          // message to support ssb-ooo. Not important for now.
        }

        if (aboutInfo && aboutInfo.length != 0) {
          post.branch = aboutInfo;
        }

        dataAccess.publishPublicChessMessage(post, (err, msg) => {
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
      dataAccess.publishPublicChessMessage(post, (err, msg) => {
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
