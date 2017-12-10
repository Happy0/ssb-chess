var m = require("mithril");
var watchAll = require("mutant/watch-all");

var opposite = require('chessground/util').opposite;

var R = require('ramda');

module.exports = (
  chessGroundObservable,
  situationObservable,
  moveSelectedObservable,
  myIdent,
  bottom) => {

  var materialDiff = {};

  var playerColour = null;
  var opponentColor = null;

  // Copied from lila (lichess) and translated to JavaScript from typescript :P
  // https://github.com/ornicar/lila/blob/c72ca979a846304a772e1c4f2b0d1851b076849d/ui/round/src/util.ts#L49
  function getMaterialDiff(pieces) {

    var diff = {
      white: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 },
      black: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 },
    };

    for (let k in pieces) {
      const p = pieces[k], them = diff[opposite(p.color)];
      if (them[p.role] > 0) them[p.role]--;
      else diff[p.color][p.role]++;
    }

    return diff;
  }

  function setPlayerColours(situation) {
      playerColour = situation.players[myIdent] ? situation.players[myIdent].colour : 'white';
      opponentColor = playerColour === "white" ? "black" : "white";
  }

  function renderPiecesForColour(colour) {
    var pieces = [];

    for (var pieceName in materialDiff[colour]) {
      var numPieces = materialDiff[colour][pieceName];
      var repeated = R.repeat(pieceName, numPieces);

      pieces = pieces.concat(repeated);
    }

    return pieces.map(p => m('mono-piece', {class: p}));
  }

  return {
    view: () => {
      return m("div", {
        class: "ssb-chess-graveyard",
      }, bottom ? renderPiecesForColour(playerColour) : renderPiecesForColour(opponentColor))
    },
    oncreate: () => {
      watchAll([chessGroundObservable, situationObservable, moveSelectedObservable], (chessground, situation, move) => {
        if (situation) {
          setPlayerColours(situation);
        }

        if (chessground) {
          var pieces = chessground.state.pieces;
          materialDiff = getMaterialDiff(pieces);

          console.log(materialDiff);
        }
      });
    }

  }
}
