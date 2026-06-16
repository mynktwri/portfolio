import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { CONSTANTS as C } from './constants.js';

// Read C dynamically so theme changes are reflected without a module reload.
function phaseColors(t) {
  if (t < 4 || t >= 20) return { sky: C.DARK_TONE, horizon: C.DARK_TONE };
  if (t < 7)            return { sky: C.MID_TONE,  horizon: C.BG_TONE };
  if (t < 17)           return { sky: C.FG_TONE,   horizon: C.BG_TONE };
  return                       { sky: C.MID_TONE,  horizon: C.BG_TONE };
}

const PHASE_BOUNDARIES = [4, 7, 17, 20];

const DITHER_PIXEL_SIZE = 7;

const BAYER_4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5],
];
const ORB_RADIUS = 14;
const ORB_Y_FRACTION = 0.06;
const HALO_ARM = 4;

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function smoothstep(x) {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
}

function lerpColor(a, b, f) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * f);
  const g = Math.round(ag + (bg - ag) * f);
  const bl = Math.round(ab + (bb - ab) * f);
  return (r << 16) | (g << 8) | bl;
}

// Blended sky/horizon tones, smoothstepped over a 1h window at each boundary.
function blendedColors(t) {
  for (const h of PHASE_BOUNDARIES) {
    if (t >= h - 0.5 && t < h + 0.5) {
      const f = smoothstep(t - (h - 0.5));
      const a = phaseColors(h - 0.5 - 0.01);
      const b = phaseColors(h + 0.5);
      return {
        sky: lerpColor(a.sky, b.sky, f),
        horizon: lerpColor(a.horizon, b.horizon, f),
      };
    }
  }
  return phaseColors(t);
}

// 0 = day styling, 1 = full night styling (clouds, etc.)
function nightness(t) {
  if (t >= 3.5 && t < 4.5) return 1 - smoothstep(t - 3.5);
  if (t >= 19.5 && t < 20.5) return smoothstep(t - 19.5);
  return (t < 4 || t >= 20) ? 1 : 0;
}

// 1 = sun visible (day 6h–18h), 0 = moon, ±30min crossfade
function sunAlpha(t) {
  if (t >= 6.5 && t < 17.5) return 1;
  if (t >= 5.5 && t < 6.5) return smoothstep(t - 5.5);
  if (t >= 17.5 && t < 18.5) return 1 - smoothstep(t - 17.5);
  return 0;
}

export class SkyLayer {
  constructor(app) {
    this.app = app;
    this.container = new Container();
    this.gradientCanvas  = null;
    this.gradientTexture = null;
    this.gradientSprite  = null;
    this.cloudLayer = new Container();
    this.orb = new Container();
    this.clouds = [];
    this.lastGradientKey = null;
    // debug override: ?hour=21.5 freezes the time-of-day for previewing phases
    const hourParam = new URLSearchParams(window.location.search).get('hour');
    this.hourOverride = hourParam !== null ? parseFloat(hourParam) : 21;
  }

  init() {
    this._initGradient();
    this.container.addChild(this.cloudLayer, this.orb);
    this.buildOrb();
    this.buildClouds();
  }

  rebuild() {
    this.lastGradientKey = null;
    this._initGradient();
    this.buildOrb();
    this.cloudLayer.removeChildren();
    this.clouds = [];
    this.buildClouds();
  }

  _initGradient() {
    if (this.gradientSprite) {
      this.container.removeChild(this.gradientSprite);
      this.gradientTexture.destroy(true);
    }
    const w    = this.app.screen.width;
    const skyH = Math.round(this.app.screen.height * C.SKY_FRACTION);
    this.gradientCanvas        = document.createElement('canvas');
    this.gradientCanvas.width  = w;
    this.gradientCanvas.height = skyH;
    this.gradientTexture       = Texture.from(this.gradientCanvas);
    this.gradientSprite        = new Sprite(this.gradientTexture);
    this.container.addChildAt(this.gradientSprite, 0);
  }

  buildOrb() {
    const R = ORB_RADIUS;
    this.orb.removeChildren();

    const sun = new Graphics();
    // 4-point star halo: cross with 4px-wide arms
    sun.rect(-HALO_ARM / 2, -(R + 7), HALO_ARM, 2 * (R + 7))
      .rect(-(R + 7), -HALO_ARM / 2, 2 * (R + 7), HALO_ARM)
      .fill(C.BG_TONE);
    sun.circle(0, 0, R).fill(C.FG_TONE).stroke({ width: 1, color: C.BG_TONE });

    const moon = new Graphics();
    moon.moveTo(0, -R).arc(0, 0, R, -Math.PI / 2, Math.PI / 2).closePath()
      .fill(C.FG_TONE);
    moon.moveTo(0, -R).arc(0, 0, R, Math.PI / 2, (3 * Math.PI) / 2).closePath()
      .fill(C.DARK_TONE);

    this.sun = sun;
    this.moon = moon;
    this.orb.addChild(moon, sun);
  }

  buildClouds() {
    const w = this.app.screen.width;
    const skyH = this.app.screen.height * C.SKY_FRACTION;

    for (let i = 0; i < C.CLOUD_COUNT; i++) {
      const cloud = new Container();
      const puffs = 3 + Math.floor(Math.random() * 3);
      const g = new Graphics();
      let left = 0, right = 0;
      for (let p = 0; p < puffs; p++) {
        const pw = Math.round(16 + Math.random() * 24);
        const ph = Math.round(8 + Math.random() * 8);
        const px = Math.round((p - puffs / 2) * pw * 0.6 + (Math.random() * 8 - 4));
        const py = Math.round(Math.random() * 8 - 4);
        g.rect(px, py, pw, ph).fill(C.FG_TONE).stroke({ width: 1, color: C.BG_TONE });
        left = Math.min(left, px);
        right = Math.max(right, px + pw);
      }
      cloud.addChild(g);
      cloud.x = Math.round(Math.random() * w);
      cloud.y = Math.round(skyH * (0.10 + Math.random() * 0.60));
      cloud.halfWidth = Math.max(-left, right);
      cloud.speed = C.CLOUD_SPEED_MIN + Math.random() * (C.CLOUD_SPEED_MAX - C.CLOUD_SPEED_MIN);
      this.clouds.push(cloud);
      this.cloudLayer.addChild(cloud);
    }
  }

  drawGradient(skyColor, horizonColor) {
    const canvas = this.gradientCanvas;
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    const sR = (skyColor >> 16) & 255, sG = (skyColor >> 8) & 255, sB = skyColor & 255;
    const hR = (horizonColor >> 16) & 255, hG = (horizonColor >> 8) & 255, hB = horizonColor & 255;

    for (let y = 0; y < h; y++) {
      const t = h <= 1 ? 0 : y / (h - 1);
      const eR = sR + (hR - sR) * t;
      const eG = sG + (hG - sG) * t;
      const eB = sB + (hB - sB) * t;
      const bRow = BAYER_4[(y / DITHER_PIXEL_SIZE | 0) & 3];
      for (let x = 0; x < w; x++) {
        const thr = bRow[(x / DITHER_PIXEL_SIZE | 0) & 3] / 16;
        const idx = (y * w + x) << 2;
        data[idx]     = Math.floor(eR) + (eR % 1 > thr ? 1 : 0);
        data[idx + 1] = Math.floor(eG) + (eG % 1 > thr ? 1 : 0);
        data[idx + 2] = Math.floor(eB) + (eB % 1 > thr ? 1 : 0);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    this.gradientTexture.source.update();
  }

  update(deltaMS) {
    const now = new Date();
    const t = this.hourOverride ?? (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600);
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // gradient — redraw only when the blended tones actually change
    const { sky, horizon } = blendedColors(t);
    const key = sky * 0x1000000 + horizon;
    if (key !== this.lastGradientKey) {
      this.drawGradient(sky, horizon);
      this.lastGradientKey = key;
    }

    // sun/moon orb
    const p = t / 24;
    this.orb.x = Math.round(p * w);
    this.orb.y = Math.round(h * ORB_Y_FRACTION);
    const sa = sunAlpha(t);
    this.sun.alpha = sa;
    this.moon.alpha = 1 - sa;

    // clouds
    const n = nightness(t);
    const cloudTint = lerpColor(0xFFFFFF, C.MID_TONE, n);
    const cloudAlpha = 1 - n * 0.6;
    const frames = deltaMS / (1000 / 60);
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * C.WIND_CLOUD_FACTOR * frames;
      if (cloud.x - cloud.halfWidth > w) cloud.x = -cloud.halfWidth;
      cloud.tint = cloudTint;
      cloud.alpha = cloudAlpha;
    }
  }
}
