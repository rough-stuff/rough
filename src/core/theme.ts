import type { Box } from './strokes';

export interface Format { name: string; W: number; H: number; /** 画板：元素坐标系的原点与范围，已避开平台界面与字幕区 */ board: Box; subY: number; subSize: number; subMax: number }
export const FORMATS: Record<string, Format> = {
  portrait:  { name: 'portrait',  W: 1080, H: 1920, board: { x: 60, y: 210, w: 960, h: 1250 }, subY: 1590, subSize: 66, subMax: 13 },
  landscape: { name: 'landscape', W: 1920, H: 1080, board: { x: 110, y: 60, w: 1700, h: 800 }, subY: 968, subSize: 58, subMax: 24 },
};

export const THEME = {
  paper: '#f8f5ed',
  ink: '#24211e',
  colors: { ink: '#24211e', red: '#d9433a', blue: '#2f6fb7', green: '#3c8f4f', yellow: '#f2b830', orange: '#e8792b', purple: '#7556c2', gray: '#8a8580', paper: '#f8f5ed' } as Record<string, string>,
  pen: 7,
  rough: 0.9,
  textSize: 84,
  /** “自然”书写速度：用来估算每个动作本来要画多久 */
  pace: { px: 2400, penUp: 0.05, min: 0.2 },
};
export const color = (c: string | undefined, fallback = THEME.ink): string => (c ? THEME.colors[c] ?? c : fallback);
