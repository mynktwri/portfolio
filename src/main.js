import { Application } from 'pixi.js';
import { CONSTANTS as C } from './constants.js';
import { applyTheme, hexColor } from './theme.js';
import { ContentPanel } from './panel.js';
import { SkyLayer } from './sky.js';
import { WindSimulator } from './wind.js';
import { GrassField } from './grass.js';
import { NavLinks } from './links.js';
import { DarkModeToggle } from './toggle.js';
import { DebugPanel } from './debug.js';

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDark) {
  applyTheme(true);
  document.body.style.background = hexColor(C.BG_TONE);
}

const app = new Application();
await app.init({
  resizeTo: window,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: false,
  roundPixels: true,
  backgroundColor: C.BG_TONE,
});
document.body.appendChild(app.canvas);

const wind = new WindSimulator();
const sky = new SkyLayer(app);
const grass = new GrassField(app, wind);
const panel = new ContentPanel(app, grass);
const links = new NavLinks(app, grass, panel);
const toggle = new DarkModeToggle(app, (dark) => {
  applyTheme(dark);
  app.renderer.background.color = C.BG_TONE;
  document.body.style.background = hexColor(C.BG_TONE);
  sky.rebuild();
  grass.rebuild();
  links.reposition();
  links.updateColors();
  toggle.updateColors();
  toggle.reposition();
  panel.updateTheme();
  panel.reposition();
}, prefersDark);

const rebuildGrass = () => { grass.rebuild(); links.reposition(); toggle.reposition(); panel.reposition(); };
const rebuildSky   = () => { sky.rebuild(); };
const rebuildFull  = () => { sky.rebuild(); grass.rebuild(); links.reposition(); toggle.reposition(); panel.reposition(); };

const debug = new DebugPanel({ grass: rebuildGrass, sky: rebuildSky, full: rebuildFull });

sky.init();
grass.init();
panel.init();
links.init();
toggle.init();
debug.init();

// z-order: sky 0, grass 1, links 2, toggle 3
app.stage.addChild(sky.container, grass.container, links.container, toggle.container);

app.ticker.add((ticker) => {
  wind.update(ticker.deltaMS, app.screen.width);
  sky.update(ticker.deltaMS);
  grass.update(ticker.deltaMS);
});

// debug: ?fps logs the average frame time every 300 frames
if (new URLSearchParams(window.location.search).has('fps')) {
  let frames = 0;
  let acc = 0;
  app.ticker.add((ticker) => {
    frames++;
    acc += ticker.deltaMS;
    if (frames % 300 === 0) console.log(`avg frame ${(acc / 300).toFixed(2)}ms`);
    if (frames % 300 === 0) acc = 0;
  });
}

app.renderer.on('resize', () => {
  sky.rebuild();
  grass.rebuild();
  links.reposition();
  toggle.reposition();
  panel.reposition();
});

let lastX = 0;
let lastY = 0;
let lastT = performance.now();
window.addEventListener('mousemove', (e) => {
  const now = performance.now();
  const dtMs = Math.max(now - lastT, 1);
  const vx = ((e.clientX - lastX) / dtMs) * 1000; // px/s
  const vy = ((e.clientY - lastY) / dtMs) * 1000;
  grass.setMouseState(e.clientX, e.clientY, vx, vy);
  lastX = e.clientX;
  lastY = e.clientY;
  lastT = now;
});
