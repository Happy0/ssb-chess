var SocialCtrl = require("../ssb_ctrl/social");

module.exports = (sbot, myIdent) => {

  const socialCtrl = SocialCtrl(sbot, myIdent);

  function followingMe() {
    return socialCtrl.followingMe();
  }

  function followedByMe() {
    return socialCtrl.followedByMe();
  }

  function identWithDisplayName(ident) {
    return socialCtrl.getPlayerDisplayName(ident).then(name => ({
      'ident': ident,
      'displayName': name
    }));
  }

  function friends() {
    var iFollow = followedByMe();
    var followsMe = followingMe();

    return Promise.all([iFollow, followsMe]).then(results => {
      var following = results[0];
      var followedBy = results[1];

      return following.filter(function(n) {
        return followedBy.indexOf(n) !== -1;
      });
    })

  }

  function friendsWithNames() {
    return friends().then(palaroonis => {
      var namesWithIdents = palaroonis.map(identWithDisplayName);

      return Promise.all(namesWithIdents)
    });
  }

  return {
    followingMe: followingMe,
    followedByMe: followedByMe,
    friends: friends,
    friendsWithNames: friendsWithNames
  }

}
