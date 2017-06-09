var fs = require('fs');
var ssbKeys = require('ssb-keys');
var ssbClient = require('ssb-client')

var homeDirectory = require('os').homedir();
var ssbChessDirectory = homeDirectory + "/.ssb-chess/";

var ssbChessKeys = ssbChessDirectory + "keys";
var ssbDb = ssbChessDirectory + "/db"

var keys = ssbKeys.loadOrCreateSync(ssbChessKeys);

var gameChallengeCtrl = require('./ctrl/game_challenge')(feed);

ssbClient(keys, {
  host: 'locahost',
  port: 8080,
  key: keys.id
  },
  function (err, sbot) {

  });


// stream all messages for all keypairs.
// pull(
//   ssb.createFeedStream(),
//   pull.collect(function (err, ary) {
//     console.log("yoyo");
//     console.log(ary)
//   })
// )
