var computed = require('mutant/computed');
var m = require('mithril');
var resolve = require('mutant/resolve');
var when = require('mutant/when');

var Miniboard = require('../miniboard/miniboard');

module.exports = (msg, situation, myIdent) => {

  function loading() {
    return m('div', 'Loading...');
  }

  function renderMateMessage(gameState) {

    var otherPlayer = gameState.getOtherPlayer(myIdent);
    var name = otherPlayer ? otherPlayer.name : "";
    if (gameState.status.winner === myIdent) {
      return m('div', "You won your game against " + name )
    } else if (gameState.hasPlayer(myIdent)) {
      return m('div', "You lost your game against " + name);
    } else {
      var winnerName = gameState.players[gameState.status.winner].name
      var otherPlayer = gameState.otherPlayer(gameState.status.winner).name;
      return m('div', winnerName + " won their game against " + otherPlayer);
    }
  }

  function renderResignMessage(gameState) {
    var otherPlayer = gameState.getOtherPlayer(myIdent);
    var name = otherPlayer ? otherPlayer.name : "";

    if (gameState.status.winner === myIdent) {
      return('div', name + " resigned their game against you.")
    } else if (gameState.hasPlayer(myIdent)) {
      return('div', "You resigned your game against " + name)
    } else {
      var winnerName = gameState.players[gameState.status.winner].name;
      var otherPlayer = gameState.otherPlayer(gameState.status.winner).name;

      return m('div', winnerName + " won their game against " + otherPlayer);
    }
  }

  function renderDrawMessage(gameState) {

  }

  function renderInformation(gameState) {
    if (gameState.status.status === "mate") {
      return m('div', {class: 'ssb-chess-game-activity-notification-text'}, renderMateMessage(gameState));
    }
    else if (gameState.status.status === "resigned") {
    return m('div', {class: 'ssb-chess-game-activity-notification-text'}, renderResignMessage(gameState));
    } else {

    }
  }

  function render() {
    if (!situation) {
      return loading()
    } else {
      var opts = {
        small: true
      }

      return m('div', {class: "ssb-chess-game-end-notification"}, [
        m('div', m(Miniboard(computed([situation], s=>s), situation, myIdent, opts))),
        renderInformation(situation)
      ]);
    }
  }

  return {
    view: render,
    oncreate: () => {
      if (situation) {

      }
    }
  }
}
