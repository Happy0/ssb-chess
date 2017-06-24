import { Chessground }  from 'chessground';
import { Chess } from 'chess.js';
import { Unit } from './unit';
import { toDests, aiPlay } from '../util'

export const defaults: Unit = {
  name: '3D theme',
  run(cont) {
    const el = wrapped(cont);
    const cg = Chessground(el, {
      addPieceZIndex: true,
    });
    cg.redrawAll();
    return cg;
  }
}

export const vsRandom: Unit = {
  name: '3D theme: play vs random AI',
  run(cont) {
    const el = wrapped(cont);
    const chess = new Chess();
    const cg = Chessground(el, {
      orientation: 'black',
      addPieceZIndex: true,
      movable: {
        color: 'white',
        free: false,
        dests: toDests(chess)
      }
    });
    cg.redrawAll();
    cg.set({
      movable: {
        events: {
          after: aiPlay(cg, chess, 1000, false)
        }
      }
    });
    return cg;
  }
};

export const fullRandom: Unit = {
  name: '3D theme: watch 2 random AIs',
  run(cont) {
    const el = wrapped(cont);
    const chess = new Chess();
    const delay = 300;
    const cg = Chessground(el, {
      orientation: 'black',
      addPieceZIndex: true,
      movable: {
        free: false
      }
    });
    cg.redrawAll();
    function makeMove() {
      if (!cg.state.dom.elements.board.offsetParent) return;
      const moves = chess.moves({verbose:true});
      const move = moves[Math.floor(Math.random() * moves.length)];
      chess.move(move.san);
      cg.move(move.from, move.to);
      setTimeout(makeMove, delay);
    }
    setTimeout(makeMove, delay);
    return cg;
  }
}

function wrapped(cont: HTMLElement) {
  const el = document.createElement('div');
  cont.className = 'in3d staunton';
  cont.innerHTML = '';
  cont.appendChild(el);
  return el;
}
