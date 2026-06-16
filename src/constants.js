export const CONSTANTS = {
  // Palette (dark mode only)
  BG_TONE:   0x1C1A14,
  FG_TONE:   0xEBE3CE,
  DARK_TONE: 0x2D2A1E,
  MID_TONE:  0x8A7F5C,

  // Layout
  SKY_FRACTION:    0.15,   // sky takes top 15% of screen
  GRASS_FRACTION:  0.85,   // grass field takes bottom 85%

  // Grass
  BLADE_HEIGHT:         17,    // px at 1x
  BLADE_BASE_WIDTH:      1,
  BLADE_TIP_WIDTH:       8,
  BLADE_SPACING:         4,    // px between blade roots within a row
  GRASS_ROW_SPACING:     8,    // px between field rows
  BLADE_SPACING_MIN:     4,    // spacing never shrinks below this on small screens
  GRASS_ROW_SPACING_MIN: 8,    // row spacing never shrinks below this on small screens
  GRASS_JITTER:          3.5,    // ± random offset per blade root
  GRASS_MAX_BLADES:  20000,    // spacing widens on huge screens to stay under this
  CLEARANCE_SCALE:       1,  // invisible outline-suppression zone scale
  GRASS_OUTLINE_GAP:     10.5,    // px tip separation before a blade edge is drawn
  GRASS_TIPS_ONLY:   true,   // draw only tip caps, no blade-edge outlines
  GRASS_FADE_MS:      60,   // ms for a blade to fade in or out
  TIP_VELOCITY_SCALE: 0.1, // alpha = clamp(|velocity| * scale, 0, 1)

  // Spring physics
  SPRING_STIFFNESS:   8.0,
  SPRING_DAMPING:      1.8,
  MAX_BLADE_ANGLE:     0.85,   // radians, clamp

  // Mouse
  MOUSE_RADIUS:          5,   // px
  MOUSE_FORCE_MULTIPLIER: 2.55,
  MAX_MOUSE_FORCE:        2.75,
  MOUSE_SMOOTHING_FRAMES:  30,

  // Wind — ambient + directional wave
  WIND_AMBIENT_STRENGTH:  0.25,
  WIND_ANGLE_DEG:         69,      // direction: bottom-left → top-right
  WAVE_SPATIAL_FREQ:      0.011,   // rad/px along wind axis — lower = wider waves
  WAVE_TIME_RATE:         0.00088, // rad/ms — wave-front travel speed
  TURB_SPATIAL_FREQ:      0.001,   // rad/px perpendicular — lower = broader turbulence
  TURB_TIME_RATE:         0.00003, // rad/ms — turbulence oscillation speed
  TURB_AMOUNT:            2.9,     // max phase shift from turbulence (radians)

  // Wind — gusts
  GUST_INTERVAL_MIN:  8000,   // ms
  GUST_INTERVAL_MAX: 20000,   // ms
  GUST_SPEED:            2.5, // px/frame
  GUST_STRENGTH:         0,
  GUST_WIDTH:           400,  // px

  // Sky / clouds
  WIND_CLOUD_FACTOR:     0.9,
  CLOUD_COUNT:            5,
  CLOUD_SPEED_MIN:       0.08,
  CLOUD_SPEED_MAX:       0.25,

  // Nav links
  LINK_LEFT_FRACTION:  0.20,  // stack sits this far from the left edge
  LINK_TOP_FRACTION:   0.05,  // stack starts this far below the horizon line
  LINK_VERTICAL_SPACING: 28,  // px between stacked link tops
  LINK_SPACING:          80,  // px between link centers
  LINK_FONT_SIZE:        12,
  LINK_LETTER_SPACING:    2,
  LINK_CLEARANCE_MARGIN:  8,

  // Content panel
  PANEL_LEFT_OFFSET:       60,
  PANEL_WIDTH:            280,
  CONTACT_PANEL_WIDTH:    440,
  PANEL_HEIGHT:           220,
  CONTACT_ENDPOINT: '/api/contact',
};
