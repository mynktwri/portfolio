import { Container, Text } from 'pixi.js';
import { CONSTANTS as C } from './constants.js';

const LINKS = [
  { label: 'About',    href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact',  href: '#contact' },
  { label: 'Resume',   href: '/resume.pdf' },
];

export class NavLinks {
  constructor(app, grassField) {
    this.app = app;
    this.grass = grassField;
    this.container = new Container();
    this.texts = [];
  }

  init() {
    for (const { label, href } of LINKS) {
      const text = new Text({
        text: label,
        style: {
          fontFamily: 'monospace',
          fontSize: C.LINK_FONT_SIZE,
          fill: C.FG_TONE,
          letterSpacing: C.LINK_LETTER_SPACING,
        },
      });
      text.anchor.set(0, 0);
      text.eventMode = 'static';
      text.cursor = 'pointer';
      text.on('pointerover', () => { text.style.fill = C.MID_TONE; });
      text.on('pointerout', () => { text.style.fill = C.FG_TONE; });
      text.on('pointerup', () => { window.location.href = href; });
      this.texts.push(text);
      this.container.addChild(text);
    }
    this.reposition();
  }

  updateColors() {
    for (const t of this.texts) t.style.fill = C.FG_TONE;
  }

  reposition() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const margin = C.LINK_CLEARANCE_MARGIN;
    const x = Math.round(w * C.LINK_LEFT_FRACTION);
    // stack starts LINK_TOP_FRACTION below the horizon line
    let y = Math.round(h * (C.SKY_FRACTION + C.LINK_TOP_FRACTION));

    for (const t of this.texts) {
      t.x = x;
      t.y = y;
      this.grass.registerClearanceRect(
        t.x - margin, t.y - margin, t.width + margin * 2, t.height + margin * 2,
      );
      y += C.LINK_VERTICAL_SPACING;
    }
  }
}
