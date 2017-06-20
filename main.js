var fs = require('fs');
var ssbClient = require('ssb-client')

var conf = require("./conf/config.json");


var GameCtrl = require('./ctrl/game');

var CommandLine = require("./command_line")

ssbClient(
  function (err, sbot) {
    if (err) {
      console.log(err);
    }

    sbot.whoami((err,ident) => {
      const gameCtrl = GameCtrl(sbot, ident.id);
      const commandHandler = CommandLine(gameCtrl);
    })
  });

const pull = require("pull-stream");
//stream all messages for all keypairs.
