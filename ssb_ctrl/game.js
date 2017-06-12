const filter = require('pull-stream/throughs/filter')
const pull = require("pull-stream/pull");
const map = require("pull-stream/throughs/map");
const collect = require("pull-stream/sinks/collect");

module.exports = (sbot) => {

  const chessWorker = new Worker('../vendor/scalachessjs.js');

  function getPlayers(gameRootMessage) {
    return new Promise((resolve, reject) => {
      sbot.get(gameRootMessage, function(error, result) {
        if (error) reject(error);

        const authorId = result.value.author;
        const invited = result.value.content.inviting;

        const authorColour = result.value.content.myColor ? result.value.content.myColor : "white";
        const players = {
          authorId: authorColour,
          invited: authorColour === "white" ? "black" : "white"
        }

        resolve(players);

      });

    })
  }

  function getSituation(gameRootMessage) {
    return new Promise((resolve, reject) => {

        const source = sbot.links({
          source: gameRootMessage,
          keys: false,
          values: true
        });

        getPlayers(gameRootMessage).then(players => {

            pull(source,
              pull(
                filter(msg => msg.type === "ssb_chess_move" && players.hasOwnProperty(msg.author)),
                map(msg => msg.content.pgnMove)
              ),
              collect(pgns => resolve({
                pgnMoves: pgnMoves,
                whiteToMove: pgnMoves.length % 2 !== 0,
                players
              }));
            });
        });
    }

    function makeMove(gameRootMessage, ply, originSquare, destinationSquare, pgnMove) {
      const post = {
        type: 'ssb_chess_move',
        ply: ply,
        root: gameRootMessage,
        orig: originSquare,
        dest: destinationSquare,
        pgnMove: pgnMove
      }

      sbot.publish(post, function(err, msg) {
          console.log("Posting move: " + console.dir(msg)));
      });
  }

  return {
    getPlayers: getPlayers,
    getSituation: getSituation,
    makeMove: makeMove
  }

}
