const SocialCtrl = require('../ssb_ctrl/social');

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
      ident,
      displayName: name,
    }));
  }

  function friends() {
    const iFollow = followedByMe();
    const followsMe = followingMe();

    return Promise.all([iFollow, followsMe]).then((results) => {
      const following = results[0];
      const followedBy = results[1];

      return following.filter(n => followedBy.indexOf(n) !== -1);
    });
  }

  function getDisplayName(id) {
    return identWithDisplayName(id).then(result => result.displayName);
  }

  function friendsWithNames() {
    return friends().then((palaroonis) => {
      const namesWithIdents = palaroonis.map(identWithDisplayName);

      return Promise.all(namesWithIdents);
    });
  }

  return {
    followingMe,
    followedByMe,
    friends,
    friendsWithNames,
    getDisplayName,
  };
};
