module.exports = () => {
  function getObject(key) {
    const item = localStorage.getItem(key);

    if (item) {
      return JSON.parse(item);
    }

    return {};
  }

  function storeSettings(settings) {
    const settingsAsString = JSON.stringify(settings);
    localStorage.setItem('ssb-chess', settingsAsString);
  }

  function setMoveConfirmation(choice) {
    const chessSettings = getObject('ssb-chess');
    chessSettings.moveConfirmationEnabled = choice;
    storeSettings(chessSettings);
  }

  function getMoveConfirmation() {
    const chessSettings = getObject('ssb-chess');

    if (chessSettings.moveConfirmationEnabled === undefined
      || chessSettings.moveConfirmationEnabled === null) {
      return true;
    }
    return chessSettings.moveConfirmationEnabled;
  }

  function setPlaySounds(choice) {
    const chessSettings = getObject('ssb-chess');
    chessSettings.playSounds = choice;
    storeSettings(chessSettings);
  }

  function getPlaySounds() {
    const chessSettings = getObject('ssb-chess');

    if (chessSettings.playSounds === undefined || chessSettings.playSounds === null) {
      return true;
    }
    return chessSettings.playSounds;
  }

  return {
    setMoveConfirmation,
    getMoveConfirmation,
    getPlaySounds,
    setPlaySounds,
  };
};
