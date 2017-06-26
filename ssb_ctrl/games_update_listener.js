var PubSub = require('pubsub-js');
const pull = require("pull-stream");

module.exports = (sbot) => {

  function handleUpdate(res) {

    // dunno what that sync message is all about, so let's ignore it
    // and brush it away
    if (!res.sync) {
      var content = {
        gameId: res.value.content.root,
        author: res.value.author,
        ply: res.value.content.ply,
        orig: res.value.content.orig,
        dest: res.value.content.dest,
        fen: res.value.content.fen
      };

      PubSub.publish("game_update", content);
    }
  }

  function listenForBoardUpdates() {

    var moveOptions = {
      type: "ssb_chess_move",
      live: true,
      gt: Date.now()
    }

    var gameEndOptions = {
      type: "ssb_chess_game_end",
      live: true,
      gt: Date.now()
    }

    const moveTypeSource = sbot.messagesByType(moveOptions);
    const gameEndSource = sbot.messagesByType(gameEndOptions);

    pull(moveTypeSource, pull.drain((res) => {
      handleUpdate(res);
    }, done => console.dir("Debug: Live move game updates stream ended.")));

    pull(gameEndSource, pull.drain((res) => {
      handleUpdate(res);
    }, done => console.dir("Debug: Live move game updates stream ended.")));
  }

  return {
    listenForBoardUpdates: listenForBoardUpdates
  }
}
