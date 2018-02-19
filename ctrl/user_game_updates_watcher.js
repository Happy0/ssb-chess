var asyncRemove = require('pull-async-filter');
var concatStreams = require('pull-cat');
var computed = require('mutant/computed');
var pull = require('pull-stream');
var many = require('pull-many')
var MutantArray = require('mutant/array');
var MutantPullReduce = require('mutant-pull-reduce');

module.exports = (sbot) => {

  const chessTypeMessages = [
   "chess_invite",
   "chess_move",
   "chess_invite_accept",
   "chess_game_end"];

  function latestGameMessageForPlayerObs(playerId) {

    var opts = {
      since: Date.now(),
      reverse: false
    }

    var chessMessagesReferencingPlayer = chessMessagesForPlayerGames(playerId, opts);

    return MutantPullReduce(chessMessagesReferencingPlayer, (state, next) => {
      return next;
    }, {
      nextTick: true,
      sync: true
    });
  }

  function latestGameMessageForOtherPlayersObs(playerId) {

    var opts = {
      since: Date.now(),
      reverse: false
    }

    var observingGamesMsgs = chessMessagesForOtherPlayersGames(playerId, opts);

    return MutantPullReduce(observingGamesMsgs, (state, next) => {
      return next;
    }, {
      nextTick: true,
      sync: true
    });
  }

  function chessMessagesForPlayerGames(playerId, opts) {
    var since = opts ? opts.since : null;
    var reverse = opts ? opts.reverse : false;
    var messageTypes = opts && opts.messageTypes ? opts.messageTypes : chessTypeMessages;

    // Default to live
    var liveStream = (opts && (opts.live !== undefined && opts.live !== null )) ? opts.live : true

    var liveFeed = sbot.createLogStream({
      live: liveStream,
      gt: since,
      reverse: reverse
    })

    return pull(
      liveFeed,
      msgMatchesFilter(
        playerId,
        true,
        messageTypes
      )
     )
  }

  function chessMessagesForOtherPlayersGames(playerId, opts) {
    var since = opts ? opts.since : null;
    var reverse = opts ? opts.reverse : false;
    var messageTypes = opts && opts.messageTypes ? opts.messageTypes : chessTypeMessages;

    var liveFeed = sbot.createLogStream({
      live: true,
      gt: since,
      reverse: reverse
    })

    return pull(
      liveFeed,
      msgMatchesFilter(
        playerId,
        false,
        messageTypes
      )
     )
  }

  function getGameId(msg) {

    if (msg.value.content.type === "chess_invite") {
      return msg.key;
    }
    else if (!msg.value || !msg.value.content || !msg.value.content.root) {
      console.warn("No root found for chess message ");
      console.warn(msg);
      return null;
    } else {
      return msg.value.content.root;
    }
  }

  function isChessMessage(msg, msgTypes) {

    if (!msg.value || !msg.value.content) {
      return false;
    }
    else {
      return msgTypes.indexOf(msg.value.content.type) !== -1
    }

  }

  function containsPlayerId(playerId, players) {
    return players.indexOf(playerId) !== -1;
  }

  function msgMatchesFilter(playerId, playerShouldBeInGame, messageTypes) {
    return pull(
              pull(
                pull.filter(msg => isChessMessage(msg, messageTypes)),
                asyncRemove((msg, cb) => {
                var gameId = getGameId(msg);

                if (gameId == null) {
                  cb(null, false);
                } else {
                  sbot.ssbChessIndex.gameHasPlayer(gameId, playerId, (err, result) => {
                    if (playerShouldBeInGame) {
                      cb(err, !result);
                    } else {
                      cb(err, result);
                    }

                  })
                }
              })
            )
          )
  }

  function getRingBufferGameMsgsForPlayer(id, getSituationObservable, msgTypes, size, opts) {
    var since = opts ? opts.since : null;

    var nonLiveMsgSources = msgTypes.map(type =>
       pull(
         sbot.messagesByType({type : type, reverse: true, gte: since}),
         msgMatchesFilter(id, true, msgTypes)
       )
     );

    var liveStream = chessMessagesForPlayerGames(id, {
      live: true,
      // Go Back a minute in case we missed any while loading the old ones.
      since: Date.now() - 60000,
      messageTypes: msgTypes
    });

    var oldEntries = pull(
      pull(
        many(nonLiveMsgSources)),
        pull.take(size)
      );

    // Take a limited amount of old messages and then add any new live messages to
    // the top of the observable list
    var stream = concatStreams([oldEntries, liveStream]);

    var obsArray = MutantArray([]);

    var count = 0;
    var pushToFront = false;
    pull(stream, pull.drain((msg) => {

      var situationObs = getSituationObservable(msg.value.content.root);

      var entry = computed([situationObs], situation => {
        return {
          msg: msg,
          situation: situation
        }
      })

      if (msg.sync) {
        // When we have reached messages arriving live in the stream, we start
        // push to the front of the array rather than the end so the newest
        // messages are at the top
        pushToFront = true;
      } else if (pushToFront) {
        obsArray.insert(entry, 0);

        if (count > size) {
          // Remove the oldest entry if we have reached capacity.
          obsArray.pop();
        }

      } else {
        obsArray.push(entry)
      }

      count++;
    }))

    // Sort in descending order
    return computed([obsArray], array =>
       array.sort( (a,b) => b.msg.value.timestamp < a.msg.value.timestamp) );
  }

  return {
   /**
    * Watches for incoming updates to a player's games and sets the observable
    * value to the latest chess message.
    */
   latestGameMessageForPlayerObs : latestGameMessageForPlayerObs,

   /**
    * Watches for incoming updates to a games a player is not playing in and
    * sets the observable value to the latest chess message.
    */
   latestGameMessageForOtherPlayersObs: latestGameMessageForOtherPlayersObs,

   /**
    * Get a ring buffer of game messages of a given type concerning a player's game.
    * @playerId the id of the player to track game messages for.
    * @msgs an array of game type messages to fill the buffer with, and a size for the
    * @size The size of the ring buffer.
    */
   getRingBufferGameMsgsForPlayer: getRingBufferGameMsgsForPlayer,

   /**
   * A stream of chess game messages (excluding chat messages) for the given
   * user after the given timestamp.
   */
   chessMessagesForPlayerGames: chessMessagesForPlayerGames,

   /**
    * A stream of chess game messages for games that the player of the
    * given ID is not playing in.
    */
   chessMessagesForOtherPlayersGames: chessMessagesForOtherPlayersGames
  }
}
