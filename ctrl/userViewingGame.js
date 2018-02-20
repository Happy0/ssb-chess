var PubSub = require('pubsub-js');

module.exports = () => {

  var currentGameId = null;

  function lookingAtGame (gameId) {
    currentGameId = gameId;
  }

  function notLookingAtGame () {
    currentGameId = null;
  }

  PubSub.subscribe('viewing_game', (msg, data) => {
    lookingAtGame(data.gameId);
  });

  PubSub.subscribe('exited_game', () => {
    notLookingAtGame();
  })

  return {
    getCurrentGame: () => currentGameId;
  }
}
