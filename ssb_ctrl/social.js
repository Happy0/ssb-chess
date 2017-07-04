const pull = require("pull-stream");

module.exports = (sbot, myIdent) => {

  // untested
  function followPlayer(playerPubKey) {
    sbot.publish({
      type: 'contact',
      contact: playerPubKey,
      following: true
    }, function(err, msg) {
      console.log("Following contact: " + console.dir(msg));
    });
  }

  // untested
  function unfollowPlayer(playerPubKey) {
    sbot.publish({
      type: 'contact',
      contact: playerPubKey,
      following: false
    }, function(err, msg) {
      console.log("Unfollowing contact: " + console.dir(msg));
    })
  }

  function consumeStreamIntoArrayPromise(source, through) {
    return new Promise((resolve, reject) => {
      pull(source, through, pull.collect((err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }));
    })

  }

  function followedByMe() {
    var followsMe = sbot.links({
      source: myIdent,
      rel: "contact",
      values: true,
      reverse: true
    });

    var onlyStillFollowingsThrough = pull(
      pull.unique('dest'),
      pull.filter(msg => msg.value.content.following !== false)
    );

    return consumeStreamIntoArrayPromise(followsMe, onlyStillFollowingsThrough)
            .then(results => results.map(a => a.dest));
  }

  function followingMe() {
    var followsMe = sbot.links({
      dest: myIdent,
      rel: "contact",
      values: true,
      reverse: true
    });

    var onlyStillFollowingsThrough = pull(
      pull.unique('source'),
      pull.filter(msg => msg.value.content.following !== false)
    );

    return consumeStreamIntoArrayPromise(followsMe, onlyStillFollowingsThrough)
      .then(results => results.map(a => a.source));
  }

  function getPlayerDisplayName(playerPubKey) {
    //console.log("uwot " + playerPubKey);

    // TODO: have some way to mark a game as corrupted.
    if (!playerPubKey || !playerPubKey.startsWith('@')) {
      return Promise.resolve("<error>");
    }

    //console.log("player pub key:" + playerPubKey);
    const aboutStream = sbot.links({
      dest: playerPubKey,
      rel: "about",
      reverse: true,
      values: true
    });

    return new Promise((resolve, reject) => {
      pull(aboutStream, pull.find(msg => msg.value.author === playerPubKey && msg.value.content.name, (err, result) => {
        if (err) {
          reject(err);
        } else {
          result = (result && result.value.content.name) ? result.value.content.name : playerPubKey;
          resolve(result);
        }
      }));
    });
  }

  return {
    followingMe: followingMe,
    followedByMe: followedByMe,
    followPlayer: followPlayer,
    unfollowPlayer: unfollowPlayer,
    getPlayerDisplayName: getPlayerDisplayName
  }

}
