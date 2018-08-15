const computed = require('mutant/computed');
const m = require('mithril');
const resolve = require('mutant/resolve');
const when = require('mutant/when');

const Miniboard = require('../miniboard/miniboard');

module.exports = (msg, situation, myIdent) => {
  function loading() {
    return m('div', 'Loading...');
  }

  function renderMateMessage(gameState) {
    let otherPlayer = gameState.getOtherPlayer(myIdent);
    const name = otherPlayer ? otherPlayer.name : '';
    if (gameState.status.winner === myIdent) {
      return m('div', `You won your game against ${name}`);
    } if (gameState.hasPlayer(myIdent)) {
      return m('div', `You lost your game against ${name}`);
    }
    const winnerName = gameState.players[gameState.status.winner].name;
    otherPlayer = gameState.otherPlayer(gameState.status.winner).name;
    return m('div', `${winnerName} won their game against ${otherPlayer}`);
  }

  function renderResignMessage(gameState) {
    let otherPlayer = gameState.getOtherPlayer(myIdent);
    const name = otherPlayer ? otherPlayer.name : '';

    if (gameState.status.winner === myIdent) {
      return ('div', `${name} resigned their game against you.`);
    } if (gameState.hasPlayer(myIdent)) {
      return ('div', `You resigned your game against ${name}`);
    }
    const winnerName = gameState.players[gameState.status.winner].name;
    otherPlayer = gameState.otherPlayer(gameState.status.winner).name;

    return m('div', `${winnerName} won their game against ${otherPlayer}`);
  }

  function renderDrawMessage(gameState) {

  }

  function renderInformation(gameState) {
    if (gameState.status.status === 'mate') {
      return m('div', { class: 'ssb-chess-game-activity-notification-text' }, renderMateMessage(gameState));
    }
    if (gameState.status.status === 'resigned') {
      return m('div', { class: 'ssb-chess-game-activity-notification-text' }, renderResignMessage(gameState));
    }
  }

  function render() {
    if (!situation) {
      return loading();
    }
    const opts = {
      small: true,
    };

    return m('div', { class: 'ssb-chess-game-end-notification' }, [
      m('div', m(Miniboard(computed([situation], s => s), situation, myIdent, opts))),
      renderInformation(situation),
    ]);
  }

  return {
    view: render,
    oncreate: () => {},
  };
};
