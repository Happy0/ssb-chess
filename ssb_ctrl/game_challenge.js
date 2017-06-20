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

    sbot.publish(post, function(err, msg) {
      console.log("Posting invite: " + console.dir(msg));
    });
  }

  function acceptChallenge(gameRootMessage) {
    console.log("Accepting challenge. Root game message is: " + gameRootMessage);
    const post = {
      'type': 'ssb_chess_invite_accept',
      'root': gameRootMessage
    }

    sbot.publish(post, function(err, msg) {
      console.log("Error while accepting game invite: " + console.dir(err));
      console.log("Accepting game invite: " + console.dir(msg));
    })
  }

  function pendingChallengesSent() {
    const filterByChallengeSentThrough = pull.filter(msg => msg.value.content.type === "ssb_chess_invite");

    return new Promise((resolve, reject) => {
      pull(myFeedSource, filterByChallengeSentThrough, pull.collect((err, challengeMessages) => {
        if (err) {
          reject(err);
        } else {
          const acceptedChallenges = challengeMessages.map(challengeMessage =>
            getAcceptMessageIfExists(challengeMessage.key,
              challengeMessage.value.content.inviting)
            );

          //console.dir(challengeMessages);

          //const allChallenges = challengeMessages.map(challenge => challenge.key);

          Promise.all(acceptedChallenges)
            .then(acceptedIds => acceptedIds.filter(a => a != null))
            .then(acceptedIds => {

            const unacceptedChallenges = challengeMessages.filter(challenge => acceptedIds.indexOf(challenge.key) === -1 );

            resolve(unacceptedChallenges.map(getInvitationSummary));
          });

        }
      }));

    });
  }

  function getInvitationSummary(gameInviteMessage) {
    const inviteSentBy = gameInviteMessage.value.author;
    const invitee = gameInviteMessage.value.content.inviting;
    const inviterPlayingAs = gameInviteMessage.value.content.myColor;
    const timeStamp = gameInviteMessage.value.timestamp;

    const invitation = {
      gameId: gameInviteMessage.key,
      sentBy: inviteSentBy,
      inviting: invitee,
      inviterPlayingAs: inviterPlayingAs,
      timeStamp: timeStamp
    }

    return invitation;
  }

  function sentInvitations(playerId) {
    const feedSource = sbot.createHistoryStream({
      id: playerId
    });

    return new Promise( (resolve, reject) => {
      pull(feedSource, invitesSentFilter, pull.collect((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }

      }));
    })
  }

  function getGamesInProgressIds(playerId) {
    const feedSource = sbot.createHistoryStream({
      id: playerId
    });

    return new Promise((resolve, reject) => {

      const invitationsPromise = sentInvitations(playerId)
        .then(sentInvites => Promise.all(sentInvites.map(msg=>
          //console.log("msgarooni");
          //console.dir(msg);
          getAcceptMessageIfExists(msg.key, msg.value.content.inviting)   )));

      const challengesAcceptedThrough = pull(filterByChallengeAcceptedThrough, mapRootGameIdThrough);

      invitationsPromise
        .then(acceptMessages => acceptMessages.filter(i => i != null))
        .then(acceptedGameIds => {
          pull(feedSource, challengesAcceptedThrough , pull.collect((err, res) => resolve(res.concat(acceptedGameIds))));
        })
    });
  }

  function pendingChallengesReceived() {
    const mapGameIdThrough = pull.map(msg => msg.key);

    const messagesByInviteTypeSource = sbot.messagesByType({
      type: "ssb_chess_invite"
    });
    const filterByMeAsInviteeThrough = pull.filter(msg => {
      //console.dir(msg.value);
      return msg.value.content.inviting === myIdent
    });

    return new Promise((resolve, reject) => {

      pull(myFeedSource, pull(filterByChallengeAcceptedThrough, mapRootGameIdThrough), pull.collect((err1, challengesAcceptedIds) => {

        pull(messagesByInviteTypeSource, filterByMeAsInviteeThrough, pull.collect( (err2, invitingMes) => {

          if (err1) {
            reject(err1);
          } else if (err2) {
            reject(err2);
          } else {
            const myInvitesPending = invitingMes.filter(invitation => challengesAcceptedIds.indexOf(invitation.key) === -1)
            resolve(myInvitesPending.map(getInvitationSummary));
          }

        }));
      }));
    });

  }

  function getAcceptMessageIfExists(rootGameId, inviteSentTo) {
    return new Promise((resolve, reject) => {
      const source = sbot.links({
        dest: rootGameId,
        values: true,
        keys: false
      });

      pull(source,
        pull.find(msg => msg.value.content.type === "ssb_chess_invite_accept" && msg.value.author === inviteSentTo, (err, result) => {
          if (err) {
            reject(err);
          } else {
            // Result is 'null' if no such message
            var id = result != null ? result.value.content.root : null;
            resolve(id);
          }
        }));
    })
  }

  return {
    inviteToPlay: inviteToPlay,
    acceptChallenge: acceptChallenge,
    getInvitationSummary: getInvitationSummary,
    pendingChallengesSent: pendingChallengesSent,
    pendingChallengesReceived: pendingChallengesReceived,
    getGamesInProgressIds: getGamesInProgressIds
  }
}
