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
    const myFeedSource = sbot.createHistoryStream({id: playerId});

    const invitesSentFilter = filter(msg => msg.value.content.type === "ssb_chess_invite");
    const invitesAcceptedFilter = filter(msg => msg.value.content.type === "ssb_chess_invite_accept");

    const myInviteGameIds = pull(myFeedSource, invitesSentFilter, map(msg => msg.key));
    const inviteAcceptedIds = pull(myFeedSource, invitesAcceptedFilter, map(msg => msg.value.root));

    return new Promise((resolve, reject) => {
      pull(cat([myInviteGameIds, inviteAcceptedIds]), pull.collect((err, res) => resolve(res)));
    });
  }

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

        const filterByPlayerMoves =
          filter(msg => msg.type === "ssb_chess_move" && players.hasOwnProperty(msg.author));

        const getPlayerToMove = players => {
          const colourToMove = pgnMoves.length % 2 !== 0 ? "white": "black" ;
          const playerIds = Object.keys(players);

          for (var i = 0; i < playerIds.length; i++) {
            if (players(playerIds[i]) === colourToMove) {
              return playerIds[i];
            }
          }

        };

        getPlayers(gameRootMessage).then(players => {

            pull(source,
              pull(
                filterByPlayerMoves,
                map(msg => msg.content)
              ),
              collect(msgs => resolve({
                pgnMoves: msgs.map(msg => msg.pgnMove),
                origDests: msgs.map(msg => ({ 'orig': msg.org , 'dest': msg.dest })),
                fen: msgs[msgs.length -1].fen,
                players: players,
                toMove: getPlayerToMove(players)
              })));
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
