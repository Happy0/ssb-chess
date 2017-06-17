const filter = require('pull-stream/throughs/filter')
const pull = require("pull-stream");
const map = require("pull-stream/throughs/map");
const collect = require("pull-stream/sinks/collect");
const many = require('pull-many');
const cat = require('pull-cat')

module.exports = (sbot) => {

  function getEndedGames(playerId) {
    //TODO
  }

  function getGamesInProgressIds(playerId) {
    const myFeedSource = sbot.createHistoryStream({
      id: playerId
    });

    const invitesSentFilter = filter(msg => msg.value.content.type === "ssb_chess_invite");
    const invitesAcceptedFilter = filter(msg => msg.value.content.type === "0");

    const myInviteGameIds = pull(myFeedSource, invitesSentFilter, map(msg => msg.key));
    const inviteAcceptedIds = pull(myFeedSource, invitesAcceptedFilter, map(msg => msg.value.root));

    return new Promise((resolve, reject) => {
      pull(cat([myInviteGameIds, inviteAcceptedIds]), pull.collect((err, res) => resolve(res)));
    });
  }

  function getPlayers(gameRootMessage) {
    return new Promise((resolve, reject) => {
      sbot.get(gameRootMessage, function(error, result) {
        if (error) {
          reject(error)
        } else {
          const authorId = result.author;
          const invited = result.content.inviting;

          const authorColour = result.content.myColor === "white" ? result.content.myColor : "black";
          const players = {};

          players[authorId] = authorColour;
          players[invited] = authorColour === "white" ? "black" : "white";

          resolve(players);
        }
      });

    })
  }

  function getSituation(gameRootMessage) {
    //TODO: worra mess, tidy this function up

    return new Promise((resolve, reject) => {

      const source = sbot.links({
        dest: gameRootMessage,
        values: true,
        keys: false,
        reverse: true
      });

      const filterByPlayerMoves = players =>
        filter(msg => msg.value.content.type === "ssb_chess_move" && players.hasOwnProperty(msg.value.author));

      const getPlayerToMove = (players, numMoves) => {
        const colourToMove = numMoves % 2 === 0 ? "white" : "black";

        const playerIds = Object.keys(players);

        for (var i = 0; i < playerIds.length; i++) {
          if (players[playerIds[i]] === colourToMove) {
            return playerIds[i];
          }
        }

      };

      getPlayers(gameRootMessage).then(players => {

        pull(source,
          filterByPlayerMoves(players),
          collect((err, msgs) => {
            if (!msgs) msgs = [];

            var pgnMoves = msgs.map(msg => msg.value.content.pgnMove);

            resolve({
              pgnMoves: pgnMoves,
              origDests: msgs.map(msg => ({
                'orig': msg.value.content.orig,
                'dest': msg.value.content.dest
              })),
              fen: msgs.length > 0 ? msgs[msgs.length - 1].value.content.fen : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              players: players,
              toMove: getPlayerToMove(players, pgnMoves.length)
            })
          }));
      });
    });
  }

  function makeMove(gameRootMessage, ply, originSquare, destinationSquare, pgnMove, fen) {
    const post = {
      type: 'ssb_chess_move',
      ply: ply,
      root: gameRootMessage,
      orig: originSquare,
      dest: destinationSquare,
      pgnMove: pgnMove,
      fen: fen
    }

    sbot.publish(post, function(err, msg) {
      console.log("Posting move: " + console.dir(msg));
    });
  }

  return {
    getGamesInProgressIds: getGamesInProgressIds,
    getPlayers: getPlayers,
    getSituation: getSituation,
    makeMove: makeMove
  }

}
