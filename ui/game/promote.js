const m = require('mithril');

module.exports = (chessBoardDomElement, colour, column, onChoice) => {

  const roles = ["queen", "rook", "knight", "bishop"];

  function renderPiece(role, cb) {
    return m('piece', {
      class: colour + ' ' + role,
      onclick: () => cb(role)
    });
  }

  const PromotionBox = (cb) => {
    var component = {
      view: () => m('div', {
        id: "ssb-promotion-box"
      }, [
        m('div', {
          id: "ssb-promotion-box-pieces"
        }, roles.map(role => renderPiece(role, cb)))
      ])
    }

    return component;
  }


  function columnLetterToNumberFromZero(columnLetter) {
    return columnLetter.codePointAt(0) - 97;
  }

  function renderPromotionOptionsOverlay() {
    var chessBoardDomElement = document.getElementsByClassName("cg-board-wrap")[0];

    var prom = document.createElement('div');

    var cb = (piece) => {
      chessBoardDomElement.removeChild(prom);
      onChoice(piece);
    }

    var box = PromotionBox(cb);

    var left = colour === "white" ? 75 * columnLetterToNumberFromZero(column) : ((75 * 7) - (75 * columnLetterToNumberFromZero(column)));
    var promotionBox = m('div', {
      style: 'z-index: 100; position: absolute; left: ' + left + 'px; top: 0px;'
    }, m(box));

    chessBoardDomElement.appendChild(prom);

    m.render(prom, promotionBox);
  }

  return {
    renderPromotionOptionsOverlay: renderPromotionOptionsOverlay
  }
}
