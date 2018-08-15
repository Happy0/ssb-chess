const m = require('mithril');
const watchAll = require('mutant/watch-all');

const opposite = require('chessground/util').opposite;

const R = require('ramda');

/**
 * A view of the pieces of the differences in pieces compared to the other
 * player.
 *
 * @param @chessGroundObservable The chessground observable becomes populated with a value when the
 *        board has been initialised.
 * @param @situationObservable Fires when the game has been updated with a new move, etc. This may have
 *         involved a piece being captured so we may have to update.
 * @param @moveSelectedObservable Fires when the user has chosen a move in the move history,
 *        so we display the material difference for that move in the history.
 * @param @myIdent The user's identity (used to decide the viewing perspective of the board.)
 * @param @bottom boolean of whether it is the bottom or top piece graveyard
 */
module.exports = (
  chessGroundObservable,
  situationObservable,
  moveSelectedObservable,
  myIdent,
  bottom,
) => {
  let materialDiff = {};

  let playerColour = null;
  let opponentColor = null;

  // Copied from lila (lichess) and translated to JavaScript from typescript :P
  // https://github.com/ornicar/lila/blob/c72ca979a846304a772e1c4f2b0d1851b076849d/ui/round/src/util.ts#L49
  function getMaterialDiff(pieces) {
    const diff = {
      white: {
        king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0,
      },
      black: {
        king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0,
      },
    };

    for (const k in pieces) {
      const p = pieces[k]; const
        them = diff[opposite(p.color)];
      if (them[p.role] > 0) them[p.role]--;
      else diff[p.color][p.role]++;
    }

    return diff;
  }

  function setPlayerColours(situation) {
    playerColour = situation.players[myIdent] ? situation.players[myIdent].colour : 'white';
    opponentColor = playerColour === 'white' ? 'black' : 'white';
  }

  function renderPiecesForColour(colour) {
    let pieces = [];

    for (const pieceName in materialDiff[colour]) {
      const numPieces = materialDiff[colour][pieceName];
      const repeated = R.repeat(pieceName, numPieces);

      pieces = pieces.concat(repeated);
    }

    return pieces.map(p => m('mono-piece', { class: p }));
  }

  return {
    view: () => m('div', {
      class: 'ssb-chess-graveyard',
    }, bottom ? renderPiecesForColour(playerColour) : renderPiecesForColour(opponentColor)),
    oncreate: () => {
      this.removeWatches = watchAll([chessGroundObservable, situationObservable, moveSelectedObservable],
        (chessground, situation, move) => {
          if (situation) {
            setPlayerColours(situation);
          }

          if (chessground) {
            const pieces = chessground.state.pieces;
            materialDiff = getMaterialDiff(pieces);
            m.redraw();
          }
        });
    },
    onremove: () => {
      if (this.removeWatches) {
        this.removeWatches();
      }
    },

  };
};
