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

    sbot.whoami((err,ident) => {
      const gameCtrl = GameCtrl(sbot, ident.id);
      const commandHandler = CommandLine(gameCtrl);

      // console.log("dfsfdsf");
      // pull(
      //   sbot.createFeedStream(),
      //   pull.collect(function (err, ary) {
      //     console.log("yoyo");
      //     console.log(ary)
      //   })
      // )
    })
  });

const pull = require("pull-stream");
//stream all messages for all keypairs.
