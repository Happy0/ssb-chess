import { Chessground }  from 'chessground';
import { DrawShape } from 'chessground/draw';
import { Unit } from './unit';

export const presetUserShapes: Unit = {
  name: 'Preset user shapes',
  run: el => Chessground(el, { drawable: { shapes: shapeSet1 } })
};

export const changingShapesHigh: Unit = {
  name: 'Automatically changing shapes (high diff)',
  run(el) {
    const cg = Chessground(el, { drawable: { shapes: shapeSet1 } });
    const delay = 1000;
    const sets = [shapeSet1, shapeSet2, shapeSet3];
    let i = 0;
    function run() {
      if (!cg.state.dom.elements.board.offsetParent) return;
      cg.setShapes(sets[++i % sets.length]);
      setTimeout(run, delay);
    }
    setTimeout(run, delay);
    return cg;
  }
};

export const changingShapesLow: Unit = {
  name: 'Automatically changing shapes (low diff)',
  run(el) {
    const cg = Chessground(el, { drawable: { shapes: shapeSet1 } });
    const delay = 1000;
    const sets = [shapeSet1, shapeSet1b, shapeSet1c];
    let i = 0;
    function run() {
      if (!cg.state.dom.elements.board.offsetParent) return;
      cg.setShapes(sets[++i % sets.length]);
      setTimeout(run, delay);
    }
    setTimeout(run, delay);
    return cg;
  }
};

export const brushModifiers: Unit = {
  name: 'Brush modifiers',
  run(el) {
    function sets() {
      return [shapeSet1, shapeSet1b, shapeSet1c].map(set => set.map(shape => {
        shape.modifiers = Math.round(Math.random()) ? undefined : {
          lineWidth: 2 + Math.round(Math.random() * 3) * 4
        };
        return shape;
      }));
    };
    const cg = Chessground(el, { drawable: { shapes: sets()[0] } });
    const delay = 1000;
    let i = 0;
    function run() {
      if (!cg.state.dom.elements.board.offsetParent) return;
      cg.setShapes(sets()[++i % sets().length]);
      setTimeout(run, delay);
    }
    setTimeout(run, delay);
    return cg;
  }
};

export const autoShapes: Unit = {
  name: 'Autoshapes',
  run(el) {
    function sets() {
      return [shapeSet1, shapeSet1b, shapeSet1c].map(set => set.map(shape => {
        shape.modifiers = Math.round(Math.random()) ? undefined : {
          lineWidth: 2 + Math.round(Math.random() * 3) * 4
        };
        return shape;
      }));
    };
    const cg = Chessground(el);
    const delay = 1000;
    let i = 0;
    function run() {
      if (!cg.state.dom.elements.board.offsetParent) return;
      cg.setAutoShapes(sets()[++i % sets().length]);
      setTimeout(run, delay);
    }
    setTimeout(run, delay);
    return cg;
  }
};

const shapeSet1: DrawShape[] = [
  { orig: 'a3', brush: 'green' },
  { orig: 'a4', brush: 'blue' },
  { orig: 'a5', brush: 'yellow' },
  { orig: 'a6', brush: 'red' },
  { orig: 'e2', dest: 'e4', brush: 'green' },
  { orig: 'a6', dest: 'c8', brush: 'blue' },
  { orig: 'f8', dest: 'f4', brush: 'yellow' },
  { orig: 'h5', brush: 'green', piece: {
    color: 'white',
    role: 'knight'
  }},
  { orig: 'h6', brush: 'red', piece: {
    color: 'black',
    role: 'queen',
    scale: 0.6
  }}
];

const shapeSet2: DrawShape[] = [
  { orig: 'c1', brush: 'green' },
  { orig: 'd1', brush: 'blue' },
  { orig: 'e1', brush: 'yellow' },
  { orig: 'e2', dest: 'e4', brush: 'green' },
  { orig: 'h6', dest: 'h8', brush: 'blue' },
  { orig: 'b3', dest: 'd6', brush: 'red' },
  { orig: 'a1', dest: 'e1', brush: 'red' },
  { orig: 'f5', brush: 'green', piece: {
    color: 'black',
    role: 'bishop'
  }}
];

const shapeSet3: DrawShape[] = [
  { orig: 'e5', brush: 'blue' }
];

const shapeSet1b: DrawShape[] = [
  { orig: 'a3', brush: 'green' },
  { orig: 'a5', brush: 'yellow' },
  { orig: 'a6', brush: 'red' },
  { orig: 'e2', dest: 'e4', brush: 'green' },
  { orig: 'a6', dest: 'c8', brush: 'blue' },
  { orig: 'f8', dest: 'f4', brush: 'yellow' },
  { orig: 'h5', brush: 'green', piece: {
    color: 'white',
    role: 'knight'
  }},
  { orig: 'h6', brush: 'red', piece: {
    color: 'black',
    role: 'queen',
    scale: 0.6
  }}
];

const shapeSet1c: DrawShape[] = [
  { orig: 'a3', brush: 'green' },
  { orig: 'a5', brush: 'yellow' },
  { orig: 'a6', brush: 'red' },
  { orig: 'e2', dest: 'e4', brush: 'green' },
  { orig: 'a6', dest: 'c8', brush: 'blue' },
  { orig: 'b6', dest: 'd8', brush: 'blue' },
  { orig: 'f8', dest: 'f4', brush: 'yellow' },
  { orig: 'h5', brush: 'green', piece: {
    color: 'white',
    role: 'knight'
  }},
  { orig: 'h6', brush: 'red', piece: {
    color: 'black',
    role: 'queen',
    scale: 0.6
  }}
];
