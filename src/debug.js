import { CONSTANTS as C } from './constants.js';

// { g: group label, k: CONSTANTS key, min, max, step, rb: rebuild key or undefined }
const PARAMS = [
  { g: 'Grass',   k: 'BLADE_HEIGHT',          min: 5,       max: 40,    step: 1,       rb: 'grass' },
  { g: 'Grass',   k: 'BLADE_BASE_WIDTH',       min: 1,       max: 8,     step: 1,       rb: 'grass' },
  { g: 'Grass',   k: 'BLADE_TIP_WIDTH',        min: 0,       max: 4,     step: 1,       rb: 'grass' },
  { g: 'Grass',   k: 'BLADE_SPACING',          min: 1,       max: 20,    step: 1,       rb: 'grass' },
  { g: 'Grass',   k: 'GRASS_ROW_SPACING',      min: 3,       max: 30,    step: 1,       rb: 'grass' },
  { g: 'Grass',   k: 'GRASS_JITTER',           min: 0,       max: 10,    step: 0.5,     rb: 'grass' },
  { g: 'Grass',   k: 'GRASS_OUTLINE_GAP',      min: 0,       max: 30,    step: 0.5 },
  { g: 'Grass',   k: 'GRASS_TIPS_ONLY',       type: 'bool' },
  { g: 'Physics', k: 'SPRING_STIFFNESS',       min: 1,       max: 200,   step: 1 },
  { g: 'Physics', k: 'SPRING_DAMPING',         min: 0,       max: 20,    step: 0.1 },
  { g: 'Physics', k: 'MAX_BLADE_ANGLE',        min: 0.1,     max: 3,     step: 0.05 },
  { g: 'Mouse',   k: 'MOUSE_RADIUS',           min: 5,       max: 150,   step: 1 },
  { g: 'Mouse',   k: 'MOUSE_FORCE_MULTIPLIER', min: 0,       max: 5,     step: 0.05 },
  { g: 'Mouse',   k: 'MAX_MOUSE_FORCE',        min: 0,       max: 5,     step: 0.05 },
  { g: 'Wind',    k: 'WIND_AMBIENT_STRENGTH',  min: 0,       max: 3,     step: 0.05 },
  { g: 'Wind',    k: 'WIND_ANGLE_DEG',         min: 0,       max: 90,    step: 1 },
  { g: 'Wind',    k: 'WAVE_SPATIAL_FREQ',      min: 0.001,   max: 0.02,  step: 0.0005 },
  { g: 'Wind',    k: 'WAVE_TIME_RATE',         min: 0.00001, max: 0.002, step: 0.00001 },
  { g: 'Wind',    k: 'TURB_SPATIAL_FREQ',      min: 0.0005,  max: 0.01,  step: 0.0001 },
  { g: 'Wind',    k: 'TURB_TIME_RATE',         min: 0.00001, max: 0.002, step: 0.00001 },
  { g: 'Wind',    k: 'TURB_AMOUNT',            min: 0,       max: 10,    step: 0.1 },
  { g: 'Gusts',   k: 'GUST_STRENGTH',          min: 0,       max: 2,     step: 0.005 },
  { g: 'Gusts',   k: 'GUST_SPEED',             min: 0.5,     max: 10,    step: 0.1 },
  { g: 'Gusts',   k: 'GUST_WIDTH',             min: 50,      max: 1000,  step: 10 },
  { g: 'Gusts',   k: 'GUST_INTERVAL_MIN',      min: 500,     max: 20000, step: 500 },
  { g: 'Gusts',   k: 'GUST_INTERVAL_MAX',      min: 1000,    max: 60000, step: 500 },
  { g: 'Sky',     k: 'SKY_FRACTION',           min: 0.05,    max: 0.5,   step: 0.01, rb: 'full' },
  { g: 'Sky',     k: 'CLOUD_COUNT',            min: 0,       max: 20,    step: 1,    rb: 'sky' },
  { g: 'Sky',     k: 'CLOUD_SPEED_MIN',        min: 0,       max: 1,     step: 0.01 },
  { g: 'Sky',     k: 'CLOUD_SPEED_MAX',        min: 0,       max: 2,     step: 0.01 },
  { g: 'Sky',     k: 'WIND_CLOUD_FACTOR',      min: 0,       max: 3,     step: 0.1 },
];

const PANEL_W = 272;

export class DebugPanel {
  // callbacks: { grass: fn, sky: fn, full: fn }
  constructor(callbacks) {
    this.cbs  = callbacks;
    this.open = false;
    this.btn  = null;
    this.panel = null;
  }

  init() {
    this._buildButton();
    this._buildPanel();
  }

  _buildButton() {
    const btn = document.createElement('button');
    btn.title = 'Debug panel';
    const img = document.createElement('img');
    img.src = 'src/bug.png';
    img.width = 20;
    img.height = 20;
    img.style.display = 'block';
    img.style.imageRendering = 'pixelated';
    btn.appendChild(img);
    Object.assign(btn.style, {
      position:   'fixed',
      bottom:     '12px',
      right:      '12px',
      background: 'none',
      border:     'none',
      lineHeight: '1',
      opacity:    '0.55',
      cursor:     'pointer',
      zIndex:     '1001',
      padding:    '4px',
      transition: 'opacity 0.15s',
      userSelect: 'none',
    });
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '0.85'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = this.open ? '0.85' : '0.25'; });
    btn.addEventListener('click', () => this._toggle());
    this.btn = btn;
    document.body.appendChild(btn);
  }

  _buildPanel() {
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position:   'fixed',
      top:        '0',
      right:      '0',
      width:      `${PANEL_W}px`,
      height:     '100%',
      background: '#1c1a14f0',
      color:      '#ebe3ce',
      fontFamily: 'monospace',
      fontSize:   '11px',
      overflowY:  'auto',
      zIndex:     '1000',
      transform:  'translateX(100%)',
      transition: 'transform 0.18s ease',
      boxSizing:  'border-box',
      padding:    '10px 10px 48px',
      borderLeft: '1px solid #8a7f5c55',
    });

    let currentGroup = null;
    for (const p of PARAMS) {
      if (p.g !== currentGroup) {
        currentGroup = p.g;
        const hdr = document.createElement('div');
        hdr.textContent = p.g.toUpperCase();
        Object.assign(hdr.style, {
          color:        '#8a7f5c',
          fontSize:     '9px',
          letterSpacing:'2px',
          padding:      '12px 0 4px',
          borderBottom: '1px solid #8a7f5c44',
          marginBottom: '6px',
        });
        panel.appendChild(hdr);
      }
      panel.appendChild(this._buildRow(p));
    }

    this.panel = panel;
    document.body.appendChild(panel);
  }

  _buildRow(p) {
    if (p.type === 'bool') return this._buildBoolRow(p);

    const row = document.createElement('div');
    Object.assign(row.style, {
      display:             'grid',
      gridTemplateColumns: '1fr 72px',
      gridTemplateRows:    'auto auto',
      columnGap:           '6px',
      rowGap:              '1px',
      marginBottom:        '9px',
    });

    const label = document.createElement('span');
    label.textContent = p.k.toLowerCase().replace(/_/g, ' ');
    Object.assign(label.style, {
      gridColumn: '1', gridRow: '1',
      opacity: '0.65', fontSize: '10px',
      alignSelf: 'center',
      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
    });

    const numInput = document.createElement('input');
    numInput.type  = 'number';
    numInput.value = C[p.k];
    numInput.min   = p.min;
    numInput.max   = p.max;
    numInput.step  = p.step;
    Object.assign(numInput.style, {
      gridColumn: '2', gridRow: '1',
      width: '100%', boxSizing: 'border-box',
      background: '#2d2a1e', color: '#ebe3ce',
      border: '1px solid #8a7f5c55',
      fontFamily: 'monospace', fontSize: '11px',
      padding: '1px 4px', textAlign: 'right',
    });

    const slider = document.createElement('input');
    slider.type  = 'range';
    slider.min   = p.min;
    slider.max   = p.max;
    slider.step  = p.step;
    slider.value = C[p.k];
    Object.assign(slider.style, {
      gridColumn: '1 / 3', gridRow: '2',
      width: '100%', accentColor: '#8a7f5c', cursor: 'pointer',
      margin: '0',
    });

    const apply = (raw) => {
      const v = Math.min(p.max, Math.max(p.min, parseFloat(raw)));
      if (isNaN(v)) return;
      C[p.k] = v;
      slider.value   = v;
      numInput.value = v;
      if (p.rb) this.cbs[p.rb]?.();
    };

    slider.addEventListener('input',  () => apply(slider.value));
    numInput.addEventListener('change', () => apply(numInput.value));

    row.appendChild(label);
    row.appendChild(numInput);
    row.appendChild(slider);
    return row;
  }

  _buildBoolRow(p) {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      marginBottom:   '9px',
    });

    const label = document.createElement('span');
    label.textContent = p.k.toLowerCase().replace(/_/g, ' ');
    Object.assign(label.style, {
      opacity:      '0.65',
      fontSize:     '10px',
      overflow:     'hidden',
      whiteSpace:   'nowrap',
      textOverflow: 'ellipsis',
    });

    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = C[p.k];
    Object.assign(cb.style, {
      accentColor: '#8a7f5c',
      cursor:      'pointer',
      width:       '16px',
      height:      '16px',
      flexShrink:  '0',
    });
    cb.addEventListener('change', () => {
      C[p.k] = cb.checked;
      if (p.rb) this.cbs[p.rb]?.();
    });

    row.appendChild(label);
    row.appendChild(cb);
    return row;
  }

  _toggle() {
    this.open = !this.open;
    this.panel.style.transform = this.open ? 'translateX(0)' : 'translateX(100%)';
    this.btn.style.opacity = this.open ? '0.85' : '0.25';
  }
}
