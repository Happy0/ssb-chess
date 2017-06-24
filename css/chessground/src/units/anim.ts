import { Chessground }  from 'chessground';
import { Unit } from './unit';

export const conflictingAnim: Unit = {
  name: 'Animation: conflict',
  run(el) {
    const cg = Chessground(el, {
      animation: {
        duration: 500
      },
      fen: '8/8/5p2/4P3/4K3/8/8/8',
      turnColor: 'black',
      movable: {
        color: 'white',
        free: false
      }
    });
    setTimeout(() => {
      cg.move('f6', 'e5');
      cg.set({
        turnColor: 'white',
        movable: {
          dests: {e4: ['e5', 'd5', 'f5']}
        }
      });
      cg.playPremove();
    }, 3000);
    return cg;
  }
};

export const withSameRole: Unit = {
  name: 'Animation: same role',
  run(el) {
    const cg = Chessground(el, {
      animation: {
        duration: 2000
      },
      highlight: {
        lastMove: false
      },
      fen: '8/8/4p3/5p2/4B3/8/8/8',
      turnColor: 'white',
    });
    setTimeout(() => {
      cg.move('e4', 'f5');
      setTimeout(() => {
        cg.move('e6', 'f5');
      }, 500);
    }, 200);
    return cg;
  }
};

export const notSameRole: Unit = {
  name: 'Animation: different role',
  run(el) {
    const cg = Chessground(el, {
      animation: {
        duration: 2000
      },
      highlight: {
        lastMove: false
      },
      fen: '8/8/4n3/5p2/4P3/8/8/8',
      turnColor: 'white',
    });
    setTimeout(() => {
      cg.move('e4', 'f5');
      setTimeout(() => {
        cg.move('e6', 'f5');
      }, 500);
    }, 200);
    return cg;
  }
};
