import { Container, Graphics } from 'pixi.js';
import { CONSTANTS as C } from './constants.js';

const CLEARANCE_SIM_MARGIN = 4; // extra px around registered rects
const ALPHA_BUCKETS = 8;        // number of alpha levels used for fade batching

export class GrassField {
  constructor(app, wind) {
    this.app = app;
    this.wind = wind;
    this.container = new Container();
    this.g = new Graphics();
    this.clearanceRects = [];
    this.timeMs = 0;
    this.mouse = { x: -9999, y: -9999, vx: 0, vy: 0, lastMoveMs: -9999 };
    this.velBuffer = [];
  }

  init() {
    this.container.addChild(this.g);
    this.build();
  }

  build() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const skyBottom = Math.round(h * C.SKY_FRACTION);
    // first row's tips just touch the horizon line
    const fieldTop = skyBottom + C.BLADE_HEIGHT;
    this.fieldTop = fieldTop;
    this.fieldW = w;
    this.fieldH = h;
    this.windGrid = null;

    let colSpacing = C.BLADE_SPACING;
    let rowSpacing = C.GRASS_ROW_SPACING;
    const countAt = () => {
      const cols = Math.ceil(w / colSpacing) + 1;
      const rows = Math.floor((h + C.BLADE_HEIGHT - fieldTop) / rowSpacing) + 1;
      return { cols, rows };
    };
    let { cols, rows } = countAt();
    // widen spacing uniformly on very large screens to keep the sim cheap
    if (cols * rows > C.GRASS_MAX_BLADES) {
      const f = Math.sqrt((cols * rows) / C.GRASS_MAX_BLADES);
      colSpacing *= f;
      rowSpacing *= f;
    }
    // never let spacing shrink below the minimums (prevents outline overlap on small screens)
    colSpacing = Math.max(colSpacing, C.BLADE_SPACING_MIN);
    rowSpacing = Math.max(rowSpacing, C.GRASS_ROW_SPACING_MIN);
    ({ cols, rows } = countAt());

    this.cols = cols;
    this.count = cols * rows;
    this.rootX = new Float32Array(this.count);
    this.rootY = new Float32Array(this.count);
    this.angle = new Float32Array(this.count);
    this.velocity = new Float32Array(this.count);
    this.active      = new Uint8Array(this.count);
    this._buckets    = Array.from({ length: ALPHA_BUCKETS }, () => []);

    const j = C.GRASS_JITTER;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        this.rootX[i] = Math.round(c * colSpacing + (Math.random() * 2 - 1) * j);
        this.rootY[i] = Math.round(fieldTop + r * rowSpacing + (Math.random() * 2 - 1) * j);
      }
    }
    this.applyClearance();
  }

  rebuild() {
    this.clearanceRects = [];
    this.build();
  }

  registerClearanceRect(x, y, w, h) {
    this.clearanceRects.push({
      x: x - CLEARANCE_SIM_MARGIN,
      y: y - CLEARANCE_SIM_MARGIN,
      w: w + CLEARANCE_SIM_MARGIN * 2,
      h: h + CLEARANCE_SIM_MARGIN * 2,
    });
    this.applyClearance();
  }

  applyClearance() {
    for (let i = 0; i < this.count; i++) {
      const rx = this.rootX[i];
      const ry = this.rootY[i];
      let inside = false;
      for (const r of this.clearanceRects) {
        // a blade spans rootY-BLADE_HEIGHT .. rootY, so roots up to one
        // blade-height below the rect can still poke into it
        if (rx >= r.x && rx <= r.x + r.w
          && ry >= r.y && ry <= r.y + r.h + C.BLADE_HEIGHT) {
          inside = true;
          break;
        }
      }
      this.active[i] = inside ? 0 : 1;
    }
  }

  setMouseState(x, y, vx, vy) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.vx = vx;
    this.mouse.vy = vy;
    this.mouse.lastMoveMs = this.timeMs;
  }

  update(deltaMS) {
    this.timeMs += deltaMS;
    const dt = Math.min(deltaMS / 1000, 1 / 30);

    // mouse velocity, smoothed over the last MOUSE_SMOOTHING_FRAMES frames;
    // decays to zero when no mousemove events arrive
    const stale = this.timeMs - this.mouse.lastMoveMs > 60;
    this.velBuffer.push(stale ? 0 : this.mouse.vx);
    if (this.velBuffer.length > C.MOUSE_SMOOTHING_FRAMES) this.velBuffer.shift();
    let avgVx = 0;
    for (const v of this.velBuffer) avgVx += v;
    avgVx /= this.velBuffer.length;
    const mouseForce = Math.sign(avgVx) * Math.min(
      Math.abs(avgVx) * C.MOUSE_FORCE_MULTIPLIER,
      C.MAX_MOUSE_FORCE,
    );
    const mr2 = C.MOUSE_RADIUS * C.MOUSE_RADIUS;
    const mx = this.mouse.x;
    const my = this.mouse.y;

    const k = C.SPRING_STIFFNESS;
    const damp = C.SPRING_DAMPING;
    const maxA = C.MAX_BLADE_ANGLE;

    // the noise field is smooth, so sample wind on a coarse grid once per
    // frame and bilinearly interpolate per blade instead of 30k+ noise calls
    const GRID = 32;
    const gw = Math.ceil(this.fieldW / GRID) + 2;
    const gh = Math.ceil((this.fieldH - this.fieldTop) / GRID) + 2;
    if (!this.windGrid || this.windGrid.length !== gw * gh) {
      this.windGrid = new Float32Array(gw * gh);
    }
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        this.windGrid[gy * gw + gx] = this.wind.getForce(
          gx * GRID, this.fieldTop + gy * GRID, this.timeMs,
        );
      }
    }
    const grid = this.windGrid;

    for (let i = 0; i < this.count; i++) {
      if (!this.active[i]) continue;

      const fx = Math.min(Math.max(this.rootX[i] / GRID, 0), gw - 1.001);
      const fy = Math.min(Math.max((this.rootY[i] - this.fieldTop) / GRID, 0), gh - 1.001);
      const x0 = fx | 0;
      const y0 = fy | 0;
      const tx = fx - x0;
      const ty = fy - y0;
      const g00 = grid[y0 * gw + x0];
      const g10 = grid[y0 * gw + x0 + 1];
      const g01 = grid[(y0 + 1) * gw + x0];
      const g11 = grid[(y0 + 1) * gw + x0 + 1];
      // wind/mouse values are rest-angle targets (radians); scaling by the
      // spring stiffness makes the blade settle at exactly that angle
      let drive = (g00 + (g10 - g00) * tx) * (1 - ty)
        + (g01 + (g11 - g01) * tx) * ty;
      if (mouseForce !== 0) {
        const dx = this.rootX[i] - mx;
        const dy = this.rootY[i] - my;
        if (dx * dx + dy * dy < mr2) drive += mouseForce;
      }

      const springForce = -k * this.angle[i];
      const dampingForce = -damp * this.velocity[i];
      const windForce = k * drive;
      this.velocity[i] += (springForce + dampingForce + windForce) * dt;
      this.angle[i] += this.velocity[i] * dt;

      if (this.angle[i] > maxA) { this.angle[i] = maxA; this.velocity[i] = 0; }
      else if (this.angle[i] < -maxA) { this.angle[i] = -maxA; this.velocity[i] = 0; }
    }

    this.draw();
  }

  draw() {
    const g = this.g;
    const H = C.BLADE_HEIGHT;
    const tipHW = C.BLADE_TIP_WIDTH / 2;
    // assign each moving blade to an alpha bucket for batched strokes
    for (let b = 0; b < ALPHA_BUCKETS; b++) this._buckets[b].length = 0;

    for (let i = 0; i < this.count; i++) {
      if (!this.active[i]) continue;
      const alpha = Math.min(1.0, Math.abs(this.velocity[i]) * C.TIP_VELOCITY_SCALE);
      if (alpha <= 0) continue;
      this._buckets[Math.min(ALPHA_BUCKETS - 1, Math.floor(alpha * ALPHA_BUCKETS))].push(i);
    }

    g.clear();
    for (let b = 0; b < ALPHA_BUCKETS; b++) {
      const bucket = this._buckets[b];
      if (bucket.length === 0) continue;

      for (let j = 0; j < bucket.length; j++) {
        const i = bucket[j];
        const cos = Math.cos(this.angle[i]);
        const sin = Math.sin(this.angle[i]);
        const rx = this.rootX[i];
        const ry = this.rootY[i];
        const tlx = Math.round(rx - tipHW * cos + H * sin);
        const tly = Math.round(ry - tipHW * sin - H * cos);
        const trx = Math.round(rx + tipHW * cos + H * sin);
        const try_ = Math.round(ry + tipHW * sin - H * cos);
        g.moveTo(tlx, tly).lineTo(trx, try_);
      }
      g.stroke({ width: 1, color: C.FG_TONE, alpha: (b + 1) / ALPHA_BUCKETS, pixelLine: true });
    }
  }
}
