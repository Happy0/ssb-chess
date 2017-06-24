var ssbClient = require('ssb-client');
var GameCtrl = require('./ctrl/game');
var CommandLine = require("./command_line");
var m = require("mithril");

module.exports = () => {

  ssbClient(
    function (err, sbot) {
      if (err) {
        console.log(err);
      } else {
        console.log("Starting ssb-chess");
        sbot.whoami((err,ident) => {
          const gameCtrl = GameCtrl(sbot, ident.id);

          

        })
      }
    });


}
