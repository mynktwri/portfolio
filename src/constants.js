export const CONSTANTS = {
  // Palette
  BG_TONE:   0xEBE3CE,
  FG_TONE:   0x000000,
  DARK_TONE: 0x2D2A1E,
  MID_TONE:  0x8A7F5C,

  // Layout
  SKY_FRACTION:    0.15,   // sky takes top 15% of screen
  GRASS_FRACTION:  0.85,   // grass field takes bottom 85%

  // Grass
  BLADE_HEIGHT:         15,    // px at 1x
  BLADE_BASE_WIDTH:      3,
  BLADE_TIP_WIDTH:       1,
  BLADE_SPACING:         3,    // px between blade roots within a row
  GRASS_ROW_SPACING:     8,    // px between field rows
  BLADE_SPACING_MIN:     4,    // spacing never shrinks below this on small screens
  GRASS_ROW_SPACING_MIN: 9,    // row spacing never shrinks below this on small screens
  GRASS_JITTER:          2,    // ± random offset per blade root
  GRASS_MAX_BLADES:  40000,    // spacing widens on huge screens to stay under this
  CLEARANCE_SCALE:       1,  // invisible outline-suppression zone scale
  GRASS_OUTLINE_GAP:     8,    // px tip separation before a blade edge is drawn

  // Spring physics
  SPRING_STIFFNESS:   30.0,
  SPRING_DAMPING:      4.5,
  MAX_BLADE_ANGLE:     1.2,   // radians, clamp

  // Mouse
  MOUSE_RADIUS:          25,   // px
  MOUSE_FORCE_MULTIPLIER: 0.8,
  MAX_MOUSE_FORCE:        1.5,
  MOUSE_SMOOTHING_FRAMES:  3,

  // Wind — ambient + directional wave
  WIND_AMBIENT_STRENGTH:  0.3,
  WIND_ANGLE_DEG:         25,      // direction: bottom-left → top-right
  WAVE_SPATIAL_FREQ:      0.004,   // rad/px along wind axis — lower = wider waves
  WAVE_TIME_RATE:         0.00025, // rad/ms — wave-front travel speed
  TURB_SPATIAL_FREQ:      0.002,   // rad/px perpendicular — lower = broader turbulence
  TURB_TIME_RATE:         0.00020, // rad/ms — turbulence oscillation speed
  TURB_AMOUNT:            2.0,     // max phase shift from turbulence (radians)

  // Wind — gusts
  GUST_INTERVAL_MIN:  8000,   // ms
  GUST_INTERVAL_MAX: 20000,   // ms
  GUST_SPEED:            2.5, // px/frame
  GUST_STRENGTH:         0.055,
  GUST_WIDTH:           400,  // px

  // Sky / clouds
  WIND_CLOUD_FACTOR:     1.0,
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
};
