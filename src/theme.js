export const isDark = true;

export function hexColor(tone) {
  return '#' + tone.toString(16).padStart(6, '0');
}
