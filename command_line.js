const neodoc = require('neodoc');

module.exports = (gameCtrl) => {

  function usage() {
    return `
      Usage:
        ssb_chess invite <invitee_pub_key> <as_colour>
        ssb_chess accept_invite <game id>

        ssb_chess list_games

        ssb_chess move <game_id> <orig_square> <dest_square>
      `;
  }

  function runCommand(args) {

    if (args["list_games"]){
      gameCtrl.getMyGamesInProgress().then(gameIds => {
        console.log("games:");
        gameIds.forEach(console.dir);
        console.log(gameIds.length);
    });
    }
    else if (args["invite"]) {
      const invitee = args["<invitee_pub_key>"];
      const asColour = args["<as_colour>"];
      gameCtrl.inviteToPlay(invitee, asColour);
    }
    else if (args["accept_invite"]) {
      const gameId = args["game_id"];

      gameCtrl.acceptChallenge(gameId);
    }

    //process.exit(1);
  }

  const args = neodoc.run(usage());
  runCommand(args);

  return "stuff";

}
