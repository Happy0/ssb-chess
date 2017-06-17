const neodoc = require('neodoc');

module.exports = (gameCtrl) => {

  function usage() {
    return `
      Usage:
        ssb_chess invite <invitee_pub_key> <as_colour>
        ssb_chess accept_invite <game_id>

        ssb_chess list_games
        ssb_chess situation <game_id>

        ssb_chess move <game_id> <orig_square> <dest_square>
      `;
  }

  function runCommand(args) {

    if (args["list_games"]) {
      gameCtrl.getMyGamesInProgress().then(gameIds => {
        console.log("games:");
        gameIds.forEach(console.dir);
        console.log(gameIds.length);
      });
    } else if (args["situation"]) {
      const situationGameId = args["<game_id>"];

      gameCtrl.getSituation(situationGameId).then(situation => console.dir(situation));
    } else if (args["invite"]) {
      const invitee = args["<invitee_pub_key>"];
      const asColour = args["<as_colour>"];
      gameCtrl.inviteToPlay(invitee, asColour);
    } else if (args["accept_invite"]) {
      const gameId = args["<game_id>"];
      console.log("Game idarooni: " + gameId);

      gameCtrl.acceptChallenge(gameId);
    } else if (args["move"]) {
      const moveInGameId = args["<game_id>"];
      const orig = args["<orig_square>"];
      const dest = args["<dest_square>"];

      gameCtrl.makeMove(moveInGameId, orig, dest).then(result => console.dir(result)).catch(err => console.dir(err));
    }
  }

  const args = neodoc.run(usage());
  runCommand(args);

  return "stuff";

}
