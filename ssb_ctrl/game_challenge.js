const About = require('ssb-ooo-about');
const Promise = require('bluebird');
const ssbKeys = require('ssb-keys');

const crypto = require('crypto');


module.exports = (sbot, myIdent) => {

  const about = About(sbot, {});
  const getLatestAboutMsgIds = Promise.promisify(about.async.getLatestMsgIds);

  const publish = Promise.promisify(sbot.publish);

  /**
   * Generates an invite code for a game of chess which can be given to another person in another app, without
   * knowing what their scuttlebutt ID is.
   * 
   * A 'challenge' is encrypted using the inviter's own public key, and then added to the invite message as a 'inviteCode' field.
   * 
   * The unencrypted version is given as part of the invite code which is not posted to the feed. This way, when someone
   * redeems the invite we can compare their 'inviteCode' to our unecrypted version. This prevents a random person who hasn't been
   * given the invite 'out of band' from accepting the invite.
   * 
   * The DHT invite code can be redeemed to allow the two players to follow each other and connect to sync up using ssb-dht-invite.
   * 
   * @param {*} colour the colour the inviter wants to play as
   */
  function createChessAndDhtInviteCode(colour) {

    const randomBytes = Promise.promisify(crypto.randomBytes);

    const chessInvite = randomBytes(10)
      .then(bytes => {
        var answer = bytes.toString('base64');
        return ssbKeys.box(answer, [getKeys().public])
      })
      .then((password) => postInviteWithEncryptedPassword(password, colour));

    const dhtInvite = makeDhtInvite();

    return Promise.all([chessInvite, dhtInvite]).then(result => {
      let chessInviteCode = result[0];
      let dhtCode = result[1];

      return {
        dhtInviteCode: dhtCode,
        chessInvite: chessInviteCode
      }
    });
  }

  /**
   * Replies to the key of the game invite message in the invite code with the unencrypted
   * version of the challenge (challengeResponse) and then accepts the DHT invite code.
   * 
   * @param {*} dhtInvite the dht invite (given to invitee in another app) object
   */
  function redeemDhtAndChessInvite(dhtInvite) {

    if (!sbot.dhtInvite) {
      return Promise.reject("dht invite plugin not installed");
    }

    const dhtCode = dhtInvite.dhtInviteCode;
    const gameId = dhtInvite.chessInvite.gameId;
    const inviteCode = dhtInvite.chessInvite.challengeResponse;

    const dhtAccept = Promise.promisify(dhtCode);

    return publish({
      type: 'chess_invite_accept',
      challengeResponse: inviteCode,
      root: gameId,
      branch: gameId
    }).then( () => dhtAccept(inviteCode));
  }

  function makeDhtInvite() {
    if (!sbot.dhtInvite) {
      return Promise.reject("dht invite plugin not installed");
    }

    var createDhtInvite = Promise.promisify(sbot.dhtInvite.create);
    return createDhtInvite();
  }

  function postInviteWithEncryptedPassword(password, colour) {

    const message = {
      type: 'chess_invite',
      challenge: password,
      myColor: colour
    }

    return publish(message).then(inviteMsgCode);
  }

  function getKeys() {
    return sbot.keys;
  }

  function inviteMsgCode(msg) {
    const keys = getKeys();

    const encryptedPassword = msg.value.content.challenge;

    const password = ssbKeys.unbox(encryptedPassword, keys.private);

    return {
      gameId: msg.key,
      challengeResponse: password
    }
  }

  function inviteToPlay(invitingPubKey, asWhite) {
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

  function init() {
    if (sbot.dhtInvite) {
      sbot.dhtInvite.start();
    }
  }

  init();

  return {
    inviteToPlay,
    acceptChallenge,
    createChessAndDhtInviteCode,
    redeemDhtAndChessInvite
  };
};
