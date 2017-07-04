var SocialCtrl = require("../ssb_ctrl/social");

module.exports = (sbot, myIdent) => {

  const socialCtrl = SocialCtrl(sbot, myIdent);

  function followingMe() {
    return socialCtrl.followingMe();
  }

  function followedByMe() {
    return socialCtrl.followedByMe();
  }

  function friends() {
    var followedByMe = this.followedByMe();
    var followingMe = this.followingMe();
    
    return Promise.all([followedByMe, followingMe]).then(results => {
      var following = results[0];
      var followedBy = results[1];

      return following.filter(function(n) {
        return followedBy.indexOf(n) !== -1;
      });
    })

  }

  return {
    followingMe: followingMe,
    followedByMe: followedByMe,
    friends: friends
  }

}
