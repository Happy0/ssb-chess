const computed = require('mutant/computed');
const m = require('mithril');

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

  function renderStalemateMessage(gameState) {
    const otherPlayer = gameState.getOtherPlayer(myIdent);
    const name = otherPlayer ? otherPlayer.name : '';

    return ('div', `Your game with ${name} ended in a stalemate`);
  }

  function renderInformation(gameState) {
    let message;

    if (gameState.status.status === 'mate') {
      message = renderMateMessage(gameState);
    } if (gameState.status.status === 'resigned') {
      message = renderResignMessage(gameState);
    } if (gameState.status.status === 'stalemate') {
      message = renderStalemateMessage(gameState);
    }

    if (message) {
      const className = 'ssb-chess-game-activity-notification-text';
      return m('div', { class: className }, message);
    }
    throw new Error(`Unexpected game state: ${gameState.status.status}`);
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
