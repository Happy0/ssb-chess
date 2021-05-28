const asyncRemove = require('pull-async-filter');
const concatStreams = require('pull-cat');
const computed = require('mutant/computed');
const pull = require('pull-stream');
const many = require('pull-many');
const MutantArray = require('mutant/array');
const MutantPullReduce = require('mutant-pull-reduce');

module.exports = (sbot) => {
  const chessTypeMessages = [
    'chess_invite',
    'chess_move',
    'chess_invite_accept',
    'chess_game_end'];

  function latestGameMessageForPlayerObs(playerId) {
    const opts = {
      since: Date.now(),
      reverse: false,
    };

    const chessMessagesReferencingPlayer = chessMessagesForPlayerGames(playerId, opts);

    return MutantPullReduce(chessMessagesReferencingPlayer, (state, next) => next, {
      nextTick: true,
      sync: true,
    });
  }

  function latestGameMessageForOtherPlayersObs(playerId) {
    const opts = {
      since: Date.now(),
      reverse: false,
    };

    const observingGamesMsgs = chessMessagesForOtherPlayersGames(playerId, opts);

    return MutantPullReduce(observingGamesMsgs, (state, next) => next, {
      nextTick: true,
      sync: true,
    });
  }

  function chessMessagesForPlayerGames(playerId, opts) {
    const since = opts ? opts.since : null;
    const reverse = opts ? opts.reverse : false;
    const messageTypes = opts && opts.messageTypes ? opts.messageTypes : chessTypeMessages;

    // Default to live
    const liveStream = (opts && (opts.live !== undefined && opts.live !== null)) ? opts.live : true;

    const liveFeed = sbot.createLogStream({
      live: liveStream,
      gt: since,
      reverse,
    });

    return pull(
      liveFeed,
      msgMatchesFilter(
        playerId,
        true,
        messageTypes,
      ),
    );
  }

  function chessMessagesForOtherPlayersGames(playerId, opts) {
    const since = opts ? opts.since : null;
    const reverse = opts ? opts.reverse : false;
    const messageTypes = opts && opts.messageTypes ? opts.messageTypes : chessTypeMessages;

    const liveFeed = sbot.createLogStream({
      live: true,
      gt: since,
      reverse,
    });

    return pull(
      liveFeed,
      msgMatchesFilter(
        playerId,
        false,
        messageTypes,
      ),
    );
  }

  function getGameId(msg) {
    if (msg.value.content.type === 'chess_invite') {
      return msg.key;
    }
    if (!msg.value || !msg.value.content || !msg.value.content.root) {
      return null;
    }
    return msg.value.content.root;
  }

  function isChessMessage(msg, msgTypes) {
    if (!msg.value || !msg.value.content) {
      return false;
    }

    return msgTypes.indexOf(msg.value.content.type) !== -1;
  }

  function msgMatchesFilter(playerId, playerShouldBeInGame, messageTypes) {
    return pull(
      pull(
        pull.filter(msg => isChessMessage(msg, messageTypes)),
        asyncRemove((msg, cb) => {
          const gameId = getGameId(msg);

          if (gameId == null) {
            cb(null, false);
          } else {
            sbot.ssbChessIndex.gameHasPlayer(gameId, playerId, (err, result) => {
              if (playerShouldBeInGame) {
                cb(err, !result);
              } else {
                cb(err, result);
              }
            });
          }
        }),
      ),
    );
  }

  function getRingBufferGameMsgsForPlayer(id, getSituationObservable, msgTypes, size, opts) {
    const since = opts ? opts.since : null;

    const nonLiveMsgSources = msgTypes.map(type => pull(
      sbot.messagesByType({ type, reverse: true, gte: since }),
      msgMatchesFilter(id, true, msgTypes),
    ));

    const liveStream = chessMessagesForPlayerGames(id, {
      live: true,
      // Go Back a minute in case we missed any while loading the old ones.
      since: Date.now() - 60000,
      messageTypes: msgTypes,
    });

    const oldEntries = pull(
      pull(
        many(nonLiveMsgSources),
      ),
      pull.take(size),
    );

    // Take a limited amount of old messages and then add any new live messages to
    // the top of the observable list
    const stream = concatStreams([oldEntries, liveStream]);

    const obsArray = MutantArray([]);

    let count = 0;
    let pushToFront = false;
    pull(stream, pull.drain((msg) => {
      const situationObs = getSituationObservable(msg.value.content.root);

      const entry = computed([situationObs], situation => ({
        msg,
        situation,
      }));

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
        obsArray.push(entry);
      }

      count += 1;
    }));

    // Sort in descending order
    return computed([obsArray], array => array.sort((a, b) => b.msg.timestamp - a.msg.timestamp));
  }

  return {
    /**
    * Watches for incoming updates to a player's games and sets the observable
    * value to the latest chess message.
    */
    latestGameMessageForPlayerObs,

    /**
    * Watches for incoming updates to a games a player is not playing in and
    * sets the observable value to the latest chess message.
    */
    latestGameMessageForOtherPlayersObs,

    /**
    * Get a ring buffer of game messages of a given type concerning a player's game.
    * @playerId the id of the player to track game messages for.
    * @msgs an array of game type messages to fill the buffer with, and a size for the
    * @size The size of the ring buffer.
    */
    getRingBufferGameMsgsForPlayer,

    /**
   * A stream of chess game messages (excluding chat messages) for the given
   * user after the given timestamp.
   */
    chessMessagesForPlayerGames,

    /**
    * A stream of chess game messages for games that the player of the
    * given ID is not playing in.
    */
    chessMessagesForOtherPlayersGames,
  };
};
