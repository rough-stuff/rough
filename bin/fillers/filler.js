import { HachureFiller } from './hachure-filler';
import { ZigZagFiller } from './zigzag-filler';
import { HatchFiller } from './hatch-filler';
import { DotFiller } from './dot-filler';
const fillers = {};
export function getFiller(o) {
    let fillerName = o.fillStyle || 'hachure';
    if (!fillers[fillerName]) {
        switch (fillerName) {
            case 'zigzag':
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new ZigZagFiller();
                }
                break;
            case 'cross-hatch':
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new HatchFiller();
                }
                break;
            case 'dots':
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new DotFiller();
                }
                break;
            case 'hachure':
            default:
                fillerName = 'hachure';
                if (!fillers[fillerName]) {
                    fillers[fillerName] = new HachureFiller();
                }
                break;
        }
    }
    return fillers[fillerName];
}
