import { Options, OpSet } from '../core';
import { Rectangle } from '../geometry';

export interface PatternFiller {
  fill(box: Rectangle, o: Options): OpSet;
}