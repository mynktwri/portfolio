import { Container, Text } from 'pixi.js';
import { CONSTANTS as C } from './constants.js';

export class DarkModeToggle {
  constructor(app, onToggle, initialDark = false) {
    this.app = app;
    this.onToggle = onToggle;
    this.container = new Container();
    this.dark = initialDark;
    this.label = null;
  }

  init() {
    this._build();
    this.reposition();
  }

  _build() {
    this.container.removeChildren();
    this.label = new Text({
      text: this._labelText(),
      style: {
        fontFamily: 'monospace',
        fontSize: C.LINK_FONT_SIZE,
        fill: C.FG_TONE,
        letterSpacing: C.LINK_LETTER_SPACING,
      },
    });
    this.label.anchor.set(0, 0);
    this.label.eventMode = 'static';
    this.label.cursor = 'pointer';
    this.label.on('pointerover', () => { this.label.style.fill = C.MID_TONE; });
    this.label.on('pointerout', () => { this.label.style.fill = C.FG_TONE; });
    this.label.on('pointerup', () => {
      this.dark = !this.dark;
      this.onToggle(this.dark);
    });
    this.container.addChild(this.label);
  }

  _labelText() {
    return this.dark ? '[ light ]' : '[ dark ]';
  }

  updateColors() {
    if (!this.label) return;
    this.label.style.fill = C.FG_TONE;
    this.label.text = this._labelText();
  }

  reposition() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.container.x = Math.round(w * 0.80);
    this.container.y = Math.round(h * C.SKY_FRACTION);
  }
}
