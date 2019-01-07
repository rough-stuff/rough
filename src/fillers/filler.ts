import { ResolvedOptions } from '../core';
import { PatternFiller, RenderHelper } from './filler-interface';
import { HachureFiller } from './hachure-filler';
import { ZigZagFiller } from './zigzag-filler';
import { HatchFiller } from './hatch-filler';
import { DotFiller } from './dot-filler';

const fillers: { [name: string]: PatternFiller } = {};

export function getFiller(o: ResolvedOptions, helper: RenderHelper): PatternFiller {
  let fillerName = o.fillStyle || 'hachure';
  if (!fillers[fillerName]) {
    switch (fillerName) {
      case 'zigzag':
        if (!fillers[fillerName]) {
          fillers[fillerName] = new ZigZagFiller(helper);
        }
        break;
      case 'cross-hatch':
        if (!fillers[fillerName]) {
          fillers[fillerName] = new HatchFiller(helper);
        }
        break;
      case 'dots':
        if (!fillers[fillerName]) {
          fillers[fillerName] = new DotFiller(helper);
        }
        break;
      case 'hachure':
      default:
        fillerName = 'hachure';
        if (!fillers[fillerName]) {
          fillers[fillerName] = new HachureFiller(helper);
        }
        break;
    }
  }
  return fillers[fillerName];
}