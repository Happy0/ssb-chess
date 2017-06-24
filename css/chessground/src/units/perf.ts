import { Unit } from './unit';
import { Chessground }  from 'chessground';

export const move: Unit = {
  name: 'Perf: piece move',
  run(cont) {
    const cg = Chessground(cont, {
      animation: { duration: 500 }
    });
    const delay = 400;
    function run() {
      if (!cg.state.dom.elements.board.offsetParent) return;
      cg.move('e2', 'a8');
      setTimeout(() => {
        cg.move('a8', 'e2');
        setTimeout(run, delay);
      }, delay);
    }
    setTimeout(run, delay);
    return cg;
  }
};
export const select: Unit = {
  name: 'Perf: square select',
  run(cont) {
    const cg = Chessground(cont, {
      movable: {
        free: false,
        dests: {
          e2: ['e3', 'e4', 'd3', 'f3']
        }
      }
    });
    const delay = 500;
    function run() {
      if (!cg.state.dom.elements.board.offsetParent) return;
      cg.selectSquare('e2');
      setTimeout(() => {
        cg.selectSquare('d4');
        setTimeout(run, delay);
      }, delay);
    }
    setTimeout(run, delay);
    return cg;
  }
};
