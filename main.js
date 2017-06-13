var fs = require('fs');
var ssbKeys = require('ssb-keys');
var ssbClient = require('ssb-client')

var homeDirectory = require('os').homedir();
var ssbChessDirectory = homeDirectory + "/.ssb-chess/";

var ssbChessKeys = ssbChessDirectory + "keys";
var ssbDb = ssbChessDirectory + "/db";

var conf = require("./conf/config.json");

// TODO: parameterise path or just use the ssb default
var keys = ssbKeys.loadOrCreateSync(ssbChessKeys);

var GameChallengeCtrl = require('./ssb_ctrl/game_challenge');

ssbClient(keys,
  function (err, sbot) {
    if (err) {
      console.log(err);
    }

    GameChallengeCtrl(sbot);
  });


// stream all messages for all keypairs.
// pull(
//   ssb.createFeedStream(),
//   pull.collect(function (err, ary) {
//     console.log("yoyo");
//     console.log(ary)
//   })
// )
