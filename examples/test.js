const { pull } = require('pull-stream');
const computed = require('mutant/computed');
const SsbClient = require('ssb-client');
const SSbChess = require('../index');

const me = "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519";

window = {}
window.requestIdleCallback =
    window.requestIdleCallback ||
    function(cb) {
        var start = Date.now();
        return setTimeout(function() {
            cb({
                didTimeout: false,
                timeRemaining: function() {
                    return Math.max(0, 50 - (Date.now() - start));
                },
            });
        }, 1);
    };

window.cancelIdleCallback =
    window.cancelIdleCallback ||
    function(id) {
        clearTimeout(id);
    };


SsbClient((err, client) => {

    const ssbChess = SSbChess(client, me);
    //const observable = ssbChess.getGameCtrl().getFriendsObservableGames();
    
    //observable(result => console.log(result.length));

  var sent = ssbChess.getInviteCtrl().pendingChallengesSent();
  sent(e => console.log(e))

   var received = ssbChess.getInviteCtrl().pendingChallengesReceived()
   received(e => console.log(e));

    const inProgress = ssbChess.getGameCtrl().getMyGamesInProgress();
   inProgress(e => console.log(e))

 //   ssbChess.getSocialCtrl().getWeightedPlayFrequencyList().then(e => console.log(e));

    // const SsbIndex = require("ssb-chess-index");
    // const index = SsbIndex(client)
    // pull(index.pendingChallengesSent(me), pull.drain(e => console.log(e))  )
})
