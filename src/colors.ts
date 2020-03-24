export type Color = [number, number, number, number];

export function parseColor(color: string): Color {
  color = color.toLowerCase().trim() || '';
  let rgba: Color | null = null;
  if (color.indexOf('rgb') === 0) {
    const regExp = /\(([^)]+)\)/;
    const matches = (regExp.exec(color)!)[1] || '';
    const tokens = matches.trim().split(',').map((d) => +(d.trim()));
    if (tokens.length === 4) {
      rgba = tokens as Color;
    } else if (tokens.length === 3) {
      rgba = [...tokens, 1] as Color;
    }
  }
  if (!rgba) {
    rgba = parseHex(color);
  }
  return [
    rgba[0] / 255,
    rgba[1] / 255,
    rgba[2] / 255,
    rgba[3]
  ];
}

function parseHex(hex: string): Color {
  let rgb: Color = [0, 0, 0, 0];
  if ((hex.length === 4) || hex.length > 6) {
    hex = hex.substring(1);
  }
  if (hex.length === 3) {
    rgb = [
      +`0x${hex[0]}${hex[0]}`,
      +`0x${hex[1]}${hex[1]}`,
      +`0x${hex[2]}${hex[2]}`,
      1
    ];
  } else if (hex.length >= 6) {
    rgb = [
      +`0x${hex[0]}${hex[1]}`,
      +`0x${hex[2]}${hex[3]}`,
      +`0x${hex[4]}${hex[5]}`,
      1
    ];
  }
  return rgb;
}