const m = require('mithril');

module.exports = (colour, onPromotionChoice) => {

  const roles = ["queen", "rook", "knight", "bishop"];

  function renderPiece(role) {
    return m('piece', {
      class: colour + ' ' + role,
      onclick: () => onPromotionChoice(role)
    });
  }

  function renderPromotionMenu() {
    return m('div', {
      id: "ssb-promotion-box"
    }, [
      m('div', {
        id: "ssb-promotion-box-pieces"
      }, roles.map(renderPiece))
    ]);
  }

  return {
    view: renderPromotionMenu
  }
}
