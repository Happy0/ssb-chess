var PubSub = require('pubsub-js');
const pull = require("pull-stream");

module.exports = (sbot) => {

  function listenForBoardUpdates() {


    var options = {
      type: "ssb_chess_move",
      live: true,
      gt: Date.now()
    }

    const messagesByTypeSource = sbot.messagesByType(options);

    pull(messagesByTypeSource, pull.drain((res) => {

      if (!res.sync) {
        var content = {
          gameId: res.value.content.root,
          author: res.value.author
        };

        PubSub.publish("game_update", content);
      }
    }, done => console.dir("Debug: Live move game updates stream ended.")));


  }

  return {
    listenForBoardUpdates: listenForBoardUpdates
  }
}
