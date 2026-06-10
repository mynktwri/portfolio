import { CONSTANTS as C } from './constants.js';

// Returns a value in [-1, 1]. All tuning knobs live in constants.js.
function directionalWind(x, y, timeMs) {
  const angle = C.WIND_ANGLE_DEG * (Math.PI / 180);
  const cosA  = Math.cos(angle);
  const sinA  = Math.sin(angle);
  const dAlong = x * cosA - y * sinA;
  const dPerp  = x * sinA + y * cosA;
  const phase  = dAlong * C.WAVE_SPATIAL_FREQ
    - timeMs * C.WAVE_TIME_RATE
    + Math.sin(dPerp * C.TURB_SPATIAL_FREQ + timeMs * C.TURB_TIME_RATE) * C.TURB_AMOUNT;
  return Math.sin(phase);
}

export class WindSimulator {
  constructor() {
    this.gusts = [];
    this.timeMs = 0;
    this.screenWidth = window.innerWidth;
    this.nextGustAt = this.randInterval();
  }

  randInterval() {
    return this.timeMs + C.GUST_INTERVAL_MIN
      + Math.random() * (C.GUST_INTERVAL_MAX - C.GUST_INTERVAL_MIN);
  }

  update(deltaMS, screenWidth) {
    this.timeMs += deltaMS;
    this.screenWidth = screenWidth;

    if (this.timeMs >= this.nextGustAt) {
      this.gusts.push({
        originX: -screenWidth,
        speed: C.GUST_SPEED,
        strength: C.GUST_STRENGTH,
        width: C.GUST_WIDTH,
      });
      this.nextGustAt = this.randInterval();
    }

    const frames = deltaMS / (1000 / 60);
    for (let i = this.gusts.length - 1; i >= 0; i--) {
      const gust = this.gusts[i];
      gust.originX += gust.speed * frames;
      if (gust.originX > screenWidth + gust.width) this.gusts.splice(i, 1);
    }
  }

  getForce(bladeX, bladeY, timeMs) {
    let force = directionalWind(bladeX, bladeY, timeMs) * C.WIND_AMBIENT_STRENGTH;
    for (const gust of this.gusts) {
      const d = bladeX - gust.originX;
      const sigma = gust.width / 2;
      force += gust.strength * Math.exp(-(d * d) / (2 * sigma * sigma));
    }
    return force;
  }
}
