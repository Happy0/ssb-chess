const m = require('mithril');

module.exports = (gameId, pgnString) => {
  function informationText() {
    return m('div', { class: 'ssb-chess-import-pgn-advice' }, [
      m('div', 'A chess PGN can be exported to another program chess for computer assisted game analysis. '),
      m('span', "If you are online, I recommend lichess.org's analysis tools which can recommend stronger moves and show you your mistakes. "),
      m('span', 'You can import your PGN here: '),
      m('a', { href: 'https://lichess.org/paste' }, 'https://lichess.org/paste'),
      m('span', ". There are offline tools available but I haven't used any."),
    ]);
  }

  function pgnBox() {
    return m('div', { class: 'ssb-chess-pgn-text-box-container' },
      m('textarea', { class: 'ssb-chess-pgn-text-box' }, pgnString));
  }

  function goBackButton() {
    const goBackToGame = () => m.route.set(`/games/${btoa(gameId)}`);

    return m('button', { class: 'ssb-chess-pgn-export-back-button', title: 'Go back to game', onclick: goBackToGame }, 'Go back to game');
  }

  return {
    view: () => m('div', { class: 'ssb-chess-pgn-export' }, [
      informationText(),
      pgnBox(),
      goBackButton(),
    ]),
  };
};
