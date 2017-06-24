import { Chess } from 'chess.js';
import { Chessground }  from 'chessground';
import { Unit } from './unit';
import { toColor, toDests, aiPlay, playOtherSide } from '../util'

export const initial: Unit = {
  name: 'Play legal moves from initial position',
  run(el) {
    const chess = new Chess();
    const cg = Chessground(el, {
      movable: {
        color: 'white',
        free: false,
        dests: toDests(chess)
      }
    });
    cg.set({
      movable: { events: { after: playOtherSide(cg, chess) } }
    });
    return cg;
  }
};

export const castling: Unit = {
  name: 'Castling',
  run(el) {
    const fen = 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
    const chess = new Chess(fen);
    const cg = Chessground(el, {
      fen: fen,
      turnColor: toColor(chess),
      movable: {
        color: 'white',
        free: false,
        dests: toDests(chess)
      }
    });
    cg.set({
      movable: { events: { after: playOtherSide(cg, chess) } }
    });
    return cg;
  }
};

export const vsRandom: Unit = {
  name: 'Play vs random AI',
  run(el) {
    const chess = new Chess();
    const cg = Chessground(el, {
      movable: {
        color: 'white',
        free: false,
        dests: toDests(chess)
      }
    });
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
  name: 'Watch 2 random AIs',
  run(el) {
    const chess = new Chess();
    const cg = Chessground(el, {
      animation: {
        duration: 1000
      },
      movable: {
        free: false
      }
    });
    function makeMove() {
      if (!cg.state.dom.elements.board.offsetParent) return;
      const moves = chess.moves({verbose:true});
      const move = moves[Math.floor(Math.random() * moves.length)];
      chess.move(move.san);
      cg.move(move.from, move.to);
      setTimeout(makeMove, 700);
    }
    setTimeout(makeMove, 700);
    return cg;
  }
}

export const slowAnim: Unit = {
  name: 'Play vs random AI; slow animations',
  run(el) {
    const chess = new Chess();
    const cg = Chessground(el, {
      animation: {
        duration: 5000
      },
      movable: {
        color: 'white',
        free: false,
        dests: toDests(chess)
      }
    });
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

export const conflictingHold: Unit = {
  name: 'Conflicting hold/premove',
  run(el) {
    const cg = Chessground(el, {
      fen: '8/8/5p2/4P3/8/8/8/8',
      turnColor: 'black',
      movable: {
        color: 'white',
        free: false,
        dests: {e5: ['f6']}
      }
    });
    setTimeout(() => {
      cg.move('f6', 'e5');
      cg.playPremove();
      cg.set({
        turnColor: 'white',
        movable: {
          dests: undefined
        }
      });
    }, 1000);
    return cg;
  }
};
