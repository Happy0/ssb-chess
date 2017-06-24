import { Api } from 'chessground/api';

import * as basics from './basics'
import * as play from './play'
import * as perf from './perf'
import * as anim from './anim'
import * as svg from './svg'
import * as in3d from './in3d'
import * as fen from './fen'

export interface Unit {
  name: string;
  run: (el: HTMLElement) => Api
}

export const list: Unit[] = [
  basics.defaults, basics.fromFen, basics.lastMoveCrazyhouse,
  play.initial, play.castling, play.vsRandom, play.fullRandom, play.slowAnim, play.conflictingHold,
  perf.move, perf.select,
  anim.conflictingAnim, anim.withSameRole, anim.notSameRole,
  svg.presetUserShapes, svg.changingShapesHigh, svg.changingShapesLow, svg.brushModifiers, svg.autoShapes,
  in3d.defaults, in3d.vsRandom, in3d.fullRandom,
  fen.autoSwitch
];
