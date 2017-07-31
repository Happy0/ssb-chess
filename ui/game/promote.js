const m = require('mithril');

module.exports = (colour, onPromotionChoice, onCancel) => {

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

  function detectClicksOutsidePromotionBox(event) {
    var promotionBox = document.getElementById("ssb-promotion-box");

    var isClickInside = promotionBox.contains(event.target);

    if (!isClickInside) {
      onCancel();
    }
  }

  function wholeAppArea() {
    return document.getElementById('ssb-chess-container');
  }

  return {
    view: renderPromotionMenu,
    oncreate: (vNode) => {
      wholeAppArea().addEventListener('click', detectClicksOutsidePromotionBox);
    },
    onremove: () => {
      wholeAppArea().removeEventListener('click', detectClicksOutsidePromotionBox);
    }
  }
}
