import { Options } from '../core';
import { PatternFiller, RenderHelper } from './filler-interface';
import { HachureFiller } from './hachure-filler';

const fillers: { [name: string]: PatternFiller } = {};

export function getFiller(renderer: RenderHelper, o: Options): PatternFiller {
  let fillerName = o.fillStyle || 'hachure';
  if (!fillers[fillerName]) {
    switch (fillerName) {
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