const pull = require("pull-stream");

module.exports = (sbot) => {

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

  function getPlayerDisplayName(playerPubKey) {
    //console.log("uwot " + playerPubKey);

    if (!playerPubKey) {
      return Promise.resolve("");
    }

    const feedStream = sbot.createHistoryStream({
      id: playerPubKey
    });

    return new Promise((resolve, reject) => {
      pull(feedStream, pull.find(msg => msg.value.content.type === "about" && msg.value.content.name, (err, result) => {
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
    followPlayer: followPlayer,
    unfollowPlayer: unfollowPlayer,
    getPlayerDisplayName: getPlayerDisplayName
  }

}
