module.exports = () => {

  function getObject(key) {
    var item = localStorage.getItem(key);

    if (item) {
        return JSON.parse(item);
    }
    else {
      return {};
    }
  }

  function storeSettings(settings) {
    var settingsAsString = JSON.stringify(settings);
    localStorage.setItem('ssb-chess', settingsAsString);
  }

  function setMoveConfirmation(choice) {
      var chessSettings = getObject("ssb-chess");
      chessSettings.moveConfirmationEnabled = choice;
      storeSettings(chessSettings);
  }

  function getMoveConfirmation() {
    var chessSettings = getObject("ssb-chess");

    if (chessSettings.moveConfirmationEnabled === undefined || chessSettings.moveConfirmationEnabled === null) {
      return true;
    } else {
      return chessSettings.moveConfirmationEnabled;
    }
  }

  function setPlaySounds(choice) {
    var chessSettings = getObject("ssb-chess");
    chessSettings.playSounds = choice;
    storeSettings(chessSettings);
  }

  function getPlaySounds() {
    var chessSettings = getObject("ssb-chess");

    if (chessSettings.playSounds === undefined || chessSettings.playSounds === null) {
      return true;
    } else {
      return chessSettings.playSounds;
    }
  }

  return {
    setMoveConfirmation: setMoveConfirmation,
    getMoveConfirmation: getMoveConfirmation,
    getPlaySounds: getPlaySounds,
    setPlaySounds: setPlaySounds
  }
}
