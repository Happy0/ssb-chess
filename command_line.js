const neodoc = require('neodoc');
var PubSub = require('pubsub-js');

module.exports = (gameCtrl) => {

  function usage() {
    return `
      Usage:
        ssb_chess invite <invitee_pub_key> <as_white>
        ssb_chess accept_invite <game_id>

        ssb_chess pending_invites_sent
        ssb_chess pending_invites_received

        ssb_chess list_games
        ssb_chess list_games_my_move
        ssb_chess list_games_finished <begin> <end>
        ssb_chess situation <game_id>

        ssb_chess move <game_id> <orig_square> <dest_square>
      `;
  }

  function runCommand(args) {

    if (args["list_games"]) {
      gameCtrl.getMyGamesInProgress().then(gameIds => {
        gameIds.forEach(console.dir);
      }).then(() => process.exit(1));
    } else if (args["list_games_finished"]) {
      const begin = args["<begin>"];
      const end = args["<end>"];

      gameCtrl.getMyFinishedGames(begin, end).then(summaries =>
        console.dir(summaries)).then(() => process.exit(1));
    } else if (args["list_games_my_move"]) {

      gameCtrl.getGamesWhereMyMove().then(summaries =>
        console.dir(summaries)).then(() => process.exit(1));

    } else if (args["situation"]) {
      const situationGameId = args["<game_id>"];

      gameCtrl.getSituation(situationGameId).then(situation =>
        console.dir(situation)).then(() => process.exit(1));
    } else if (args["invite"]) {
      const invitee = args["<invitee_pub_key>"];
      const asColour = args["<as_white>"];

      if ((asColour !== true) && (asColour !== false)) {
        console.error("asWhite must be true or false");
      } else {
        gameCtrl.inviteToPlay(invitee, asColour).then(() =>
          console.dir("Invite sent.")).then(() => process.exit(1));
      }
    } else if (args["accept_invite"]) {
      const gameId = args["<game_id>"];

      gameCtrl.acceptChallenge(gameId).then(() =>
        console.log("Invite accepted.")).then(() => process.exit(1));
    } else if (args["pending_invites_sent"]) {
      gameCtrl.pendingChallengesSent().then((res) =>
        console.dir(res)).then(() => process.exit(1));
    } else if (args["pending_invites_received"]) {
      gameCtrl.pendingChallengesReceived().then(res => {
        console.dir(res);
      }).then(() => process.exit(1));
    } else if (args["move"]) {
      const moveInGameId = args["<game_id>"];
      const orig = args["<orig_square>"];
      const dest = args["<dest_square>"];

      gameCtrl.makeMove(moveInGameId, orig, dest);
    }
  }

  PubSub.subscribe("move", (msg, data) => {
    if (msg === "move") {
      console.log("move");
      console.dir(data);
    } else if (msg === "move_error") {
      console.log("Move error: ");
      console.dir(msg);
    } else if (msg === "game_end") {
      console.log("Game over");
      console.dir(msg);
    } else {
      console.dir("Unexpected message: " + msg);
    }

    process.exit(1);
  })

  const args = neodoc.run(usage());
  runCommand(args);

  return "stuff";

}
