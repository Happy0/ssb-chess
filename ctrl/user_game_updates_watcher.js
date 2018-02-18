  var concatStreams = require('pull-cat')
var pull = require('pull-stream');
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
      msgMatchesChessInviteMsgFilter(
        (msg) => inviteRelatesToPlayerGame(playerId, msg),
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
      msgMatchesChessInviteMsgFilter(
        (msg) => !inviteRelatesToPlayerGame(playerId, msg),
        messageTypes
      )
     )
  }

  function inviteRelatesToPlayerGame(playerId, msg) {
    var relatesToPlayer = msg != null && [msg.author, msg.content.inviting].indexOf(playerId) !== -1;
    return relatesToPlayer;
  }

  function getGameInvite(msg, cb) {

    if (msg.value.content.type === "chess_invite") {
      // Ugh, hackiness =p.
      msg.value.originalMsg = msg;
      return getInviteOrWarn(null, msg.value, cb)
    }
    else if (!msg.value || !msg.value.content || !msg.value.content.root) {
      console.warn("No root found for chess message ");
      console.warn(msg);
      cb(null, []);
    } else {
      var gameId = msg.value.content.root;
      sbot.get(gameId, (err, result) => {
        // I'm so hacky :<
        result.originalMsg = msg;
        getInviteOrWarn(err, result, cb)
      });
    }
  }

  function getInviteOrWarn(err, result, cb) {
    if (err) {
        console.warn("Error while retrieving game invite message");
        console.warn(err);
        cb(null, null);
    }
    else if (result.content.type !== "chess_invite") {
      console.warn("Unexpectedly not a chess invite root ");
      console.warn(result);
      cb(null, null);
    }
    else if (!result.content.inviting) {
      console.warn("Unexpectedly no invitee")
      console.warn(result);
      cb(null, null);
    } else {
      cb(null, result)
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

  function msgMatchesChessInviteMsgFilter(chessInviteFilter, messageTypes) {
    return pull(
            pull(
              pull.filter(msg => isChessMessage(msg, messageTypes)),
              pull.asyncMap(getGameInvite)
            ),
            pull(
              pull.filter(chessInviteFilter),
              // See earlier hack ;x.
              pull.map(msg => msg.originalMsg ? msg.originalMsg : msg)
            )
        )
  }

  function getRingBufferGameMsgsForPlayer(id, msgTypes, size) {
    var nonLiveStream = chessMessagesForPlayerGames(id, {
      live: false,
      reverse: true,
      messageTypes: msgTypes
    });

    var liveStream = chessMessagesForPlayerGames(id, {
      live: true,
      since: Date.now(),
      messageTypes: msgTypes
    });


    var oldEntries = pull(nonLiveStream, pull.take(size));

    // Take a limited amount of old messages and then add any new live messages to
    // the top of the observable list
    var stream = concatStreams([oldEntries, liveStream]);

    var obsArray = MutantArray([]);

    var count = 0;
    var pushToFront = false;
    pull(stream, pull.drain((msg) => {
      if (msg.sync) {
        // When we have reached messages arriving live in the stream, we start
        // push to the front of the array rather than the end so the newest
        // messages are at the top
        pushToFront = true;
      } else if (pushToFront) {
        obsArray.insert(msg, 0);

        if (count > size) {
          // Remove the oldest entry if we have reached capacity.
          obsArray.pop();
        }

      } else {
        obsArray.push(msg)
      }

      count++;

    }))

    return obsArray;
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
