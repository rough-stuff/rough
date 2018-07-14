import { ResolvedOptions } from '../core';
import { PatternFiller, RenderHelper } from './filler-interface';
import { HachureFiller } from './hachure-filler';
import { ZigZagFiller } from './zigzag-filler';
import { HatchFiller } from './hatch-filler';
import { DotFiller } from './dot-filler';

const fillers: { [name: string]: PatternFiller } = {};

export function getFiller(renderer: RenderHelper, o: ResolvedOptions): PatternFiller {
  let fillerName = o.fillStyle || 'hachure';
  if (!fillers[fillerName]) {
    switch (fillerName) {
      case 'zigzag':
        if (!fillers[fillerName]) {
          fillers[fillerName] = new ZigZagFiller(renderer);
        }
        break;
      case 'cross-hatch':
        if (!fillers[fillerName]) {
          fillers[fillerName] = new HatchFiller(renderer);
        }
        break;
      case 'dots':
        if (!fillers[fillerName]) {
          fillers[fillerName] = new DotFiller(renderer);
        }
        break;
      case 'hachure':
      default:
        fillerName = 'hachure';
        if (!fillers[fillerName]) {
          fillers[fillerName] = new HachureFiller(renderer);
        }
        break;
    }
  }
  return fillers[fillerName];
}