module.exports = (ssbot) => {

  function followPlayer(playerPubKey) {
    sbot.publish({ type: 'contact', contact: playerPubKey, following: true }, function(err, msg) {
      console.log("Following contact: " + console.dir(msg));
    });
  }

  function unfollowPlayer(playerPubKey) {
    sbot.publish({ type: 'contact', contact: feedplayerPubKeyId, following: false }, function(err, msg) {
      console.log("Unfollowing contact: " + console.dir(msg));
    })
  }

}
