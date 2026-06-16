import { Container, Graphics } from 'pixi.js';
import { CONSTANTS as C } from './constants.js';
import { isDark } from './theme.js';

const CLEARANCE_SIM_MARGIN = 4; // extra px around registered rects

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
    this.tipX   = new Float32Array(this.count);
    this.active = new Uint8Array(this.count);

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

  registerClearanceRect(x, y, w, h, id = null) {
    if (id !== null) this.clearanceRects = this.clearanceRects.filter(r => r.id !== id);
    const m = CLEARANCE_SIM_MARGIN;
    this.clearanceRects.push({ id, x: x - m, y: y - m, w: w + m * 2, h: h + m * 2 });
    this.applyClearance();
  }

  unregisterClearanceRect(id) {
    const before = this.clearanceRects.length;
    this.clearanceRects = this.clearanceRects.filter(r => r.id !== id);
    if (this.clearanceRects.length !== before) this.applyClearance();
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
    const baseHW = C.BLADE_BASE_WIDTH / 2;
    const tipHW = C.BLADE_TIP_WIDTH / 2;
    // a packed field reads as a solid mass: an edge is drawn only when wind,
    // jitter, or a clearance gap separates the tips by more than this
    const outlineGap = C.GRASS_OUTLINE_GAP;
    const tipsOnly = C.GRASS_TIPS_ONLY;
    const cols = this.cols;

    g.clear();

    for (let i = 0; i < this.count; i++) {
      this.tipX[i] = this.rootX[i] + Math.sin(this.angle[i]) * H;
    }

    for (let i = 0; i < this.count; i++) {
      if (!this.active[i]) continue;

      const col = i % cols;
      const leftVisible = col > 0 && (!this.active[i - 1]
        || this.tipX[i] - this.tipX[i - 1] >= outlineGap);
      const rightVisible = col < cols - 1 && (!this.active[i + 1]
        || this.tipX[i + 1] - this.tipX[i] >= outlineGap);
      // fully embedded in the mass — invisible
      if (!leftVisible && !rightVisible) continue;

      const cos = Math.cos(this.angle[i]);
      const sin = Math.sin(this.angle[i]);
      const rx = this.rootX[i];
      const ry = this.rootY[i];
      const tlx = Math.round(rx - tipHW * cos + H * sin);
      const tly = Math.round(ry - tipHW * sin - H * cos);
      const trx = Math.round(rx + tipHW * cos + H * sin);
      const try_ = Math.round(ry + tipHW * sin - H * cos);

      if (!tipsOnly) {
        if (leftVisible) {
          const blx = Math.round(rx - baseHW * cos);
          const bly = Math.round(ry - baseHW * sin);
          g.moveTo(blx, bly).lineTo(tlx, tly);
        }
        if (rightVisible) {
          const brx = Math.round(rx + baseHW * cos);
          const bry = Math.round(ry + baseHW * sin);
          g.moveTo(brx, bry).lineTo(trx, try_);
        }
      }
      g.moveTo(tlx, tly).lineTo(trx, try_); // tip cap always drawn on exposed blades
    }
    g.stroke(isDark
      ? { width: 1, color: C.FG_TONE, pixelLine: true }
      : { width: 3, color: C.FG_TONE });

  }
}
