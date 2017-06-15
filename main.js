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

var GameCtrl = require('./ctrl/game');

var CommandLine = require("./command_line")

ssbClient(keys,
  function (err, sbot) {
    if (err) {
      console.log(err);
    }

    sbot.whoAmI((err,ident) => {
      const gameCtrl = GameCtrl(sbot, ident.id);
      const commandHandler = CommandLine(gameCtrl);
    })
  });


// stream all messages for all keypairs.
// pull(
//   ssb.createFeedStream(),
//   pull.collect(function (err, ary) {
//     console.log("yoyo");
//     console.log(ary)
//   })
// )
