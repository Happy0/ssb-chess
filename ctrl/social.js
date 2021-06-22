const SocialCtrl = require('../ssb_ctrl/social');

module.exports = (dataAccess, myIdent, chessIndex) => {
  const socialCtrl = SocialCtrl(dataAccess, myIdent, chessIndex);

  function followedByMe() {
    return socialCtrl.followedByMe();
  }

  function identWithDisplayName(ident) {
    return socialCtrl.getPlayerDisplayName(ident).then(name => ({
      ident,
      displayName: name,
    }));
  }

  function getDisplayName(id) {
    return identWithDisplayName(id).then(result => result.displayName);
  }

  function followedByMeWithNames() {
    return followedByMe().then((palaroonis) => {
      const namesWithIdents = palaroonis.map(identWithDisplayName);

      return Promise.all(namesWithIdents);
    });
  }

  function getWeightedPlayFrequencyList() {
    return socialCtrl.getWeightedPlayFrequencyList();
  }

  return {
    getWeightedPlayFrequencyList,
    followedByMe,
    followedByMeWithNames,
    getDisplayName,
  };
};
