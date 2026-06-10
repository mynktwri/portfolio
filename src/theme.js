import { CONSTANTS as C } from './constants.js';

const LIGHT = {
  BG_TONE:   0xEBE3CE,
  FG_TONE:   0x000000,
  DARK_TONE: 0x2D2A1E,
  MID_TONE:  0x8A7F5C,
};

const DARK = {
  BG_TONE:   0x1C1A14,
  FG_TONE:   0xEBE3CE,
  DARK_TONE: 0x2D2A1E,
  MID_TONE:  0x8A7F5C,
};

export let isDark = false;

export function applyTheme(dark) {
  isDark = dark;
  const p = dark ? DARK : LIGHT;
  C.BG_TONE   = p.BG_TONE;
  C.FG_TONE   = p.FG_TONE;
  C.DARK_TONE = p.DARK_TONE;
  C.MID_TONE  = p.MID_TONE;
}
