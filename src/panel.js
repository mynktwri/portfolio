import { CONSTANTS as C } from './constants.js';
import { hexColor } from './theme.js';

export class ContentPanel {
  constructor(app, grass) {
    this.app = app;
    this.grass = grass;
    this.el = null;
    this.content = null;
    this.currentSection = null;
  }

  init() {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position:    'fixed',
      display:     'none',
      zIndex:      '10',
      boxSizing:   'border-box',
      fontFamily:  'monospace',
      fontSize:    '12px',
      letterSpacing: '1px',
      padding:     '12px',
      overflowY:   'auto',
      width:       C.PANEL_WIDTH + 'px',
      maxHeight:   C.PANEL_HEIGHT + 'px',
    });
    this._applyColors(el);

    const close = document.createElement('button');
    close.textContent = '[×]';
    Object.assign(close.style, {
      position:   'absolute',
      top:        '4px',
      right:      '6px',
      background: 'none',
      border:     'none',
      fontFamily: 'monospace',
      fontSize:   '12px',
      cursor:     'pointer',
      padding:    '0',
    });
    close.style.color = hexColor(C.FG_TONE);
    close.addEventListener('mouseenter', () => { close.style.color = hexColor(C.MID_TONE); });
    close.addEventListener('mouseleave', () => { close.style.color = hexColor(C.FG_TONE); });
    close.addEventListener('click', () => this.close());

    const content = document.createElement('div');
    Object.assign(content.style, { marginTop: '4px' });

    el.appendChild(close);
    el.appendChild(content);
    document.body.appendChild(el);

    this.el = el;
    this.closeBtn = close;
    this.content = content;
    this.reposition();
  }

  open(section) {
    if (this.currentSection === section && this.el.style.display !== 'none') {
      this.close();
      return;
    }
    this.currentSection = section;
    this._buildContent(section);
    this.el.style.display = 'block';
    this.reposition();
  }

  close() {
    this.el.style.display = 'none';
    this.grass.unregisterClearanceRect('panel');
    this.currentSection = null;
  }

  reposition() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const navX   = Math.round(w * C.LINK_LEFT_FRACTION);
    const navY   = Math.round(h * (C.SKY_FRACTION + C.LINK_TOP_FRACTION));
    const anchor = this.leftEdge ?? (navX + C.PANEL_LEFT_OFFSET);
    const top    = navY;

    const RIGHT_MARGIN  = 16;
    const BOTTOM_MARGIN = 16;
    const targetW    = this.currentSection === 'contact' ? C.CONTACT_PANEL_WIDTH : C.PANEL_WIDTH;
    const available  = Math.max(0, w - anchor - RIGHT_MARGIN);
    const panelW     = Math.min(targetW, available);
    const panelH     = Math.min(C.PANEL_HEIGHT, h - top - BOTTOM_MARGIN);
    const idealLeft  = Math.round((w - panelW) / 2);
    const left       = Math.max(anchor, Math.min(idealLeft, w - panelW - RIGHT_MARGIN));

    this.el.style.left      = left    + 'px';
    this.el.style.top       = top     + 'px';
    this.el.style.width     = panelW  + 'px';
    this.el.style.maxHeight = panelH  + 'px';

    if (this.el.style.display !== 'none') {
      this.grass.registerClearanceRect(left, top, panelW, panelH, 'panel');
    }
  }

  updateTheme() {
    this._applyColors(this.el);
    this.closeBtn.style.color = hexColor(C.FG_TONE);
    for (const el of this.el.querySelectorAll('input, textarea')) {
      el.style.background = hexColor(C.BG_TONE);
      el.style.color       = hexColor(C.FG_TONE);
      el.style.borderColor = hexColor(C.MID_TONE);
    }
    for (const btn of this.el.querySelectorAll('button:not([data-close])')) {
      btn.style.color       = hexColor(C.FG_TONE);
      btn.style.borderColor = hexColor(C.FG_TONE);
    }
    for (const a of this.el.querySelectorAll('a')) {
      a.style.color = hexColor(C.FG_TONE);
    }
    for (const el of this.el.querySelectorAll('[data-muted]')) {
      el.style.color = hexColor(C.MID_TONE);
    }
  }

  _applyColors(el) {
    el.style.background  = hexColor(C.BG_TONE);
    el.style.color       = hexColor(C.FG_TONE);
    el.style.border      = '2px solid ' + hexColor(C.FG_TONE);
  }

  _inputStyle(el) {
    Object.assign(el.style, {
      display:     'block',
      width:       '100%',
      boxSizing:   'border-box',
      fontFamily:  'monospace',
      fontSize:    '12px',
      letterSpacing: '1px',
      padding:     '4px',
      marginBottom: '6px',
      background:  hexColor(C.BG_TONE),
      color:       hexColor(C.FG_TONE),
      border:      '1px solid ' + hexColor(C.MID_TONE),
      outline:     'none',
    });
  }

  _buildContent(section) {
    this.content.innerHTML = '';

    const heading = document.createElement('div');
    heading.textContent = section.charAt(0).toUpperCase() + section.slice(1);
    Object.assign(heading.style, {
      fontFamily:    'monospace',
      fontSize:      '13px',
      letterSpacing: '2px',
      marginBottom:  '10px',
      borderBottom:  '1px solid ' + hexColor(C.MID_TONE),
      paddingBottom: '4px',
    });
    this.content.appendChild(heading);

    if (section === 'about') {
      const img = document.createElement('img');
      img.src = 'src/banner2.jpeg';
      img.alt = '';
      Object.assign(img.style, {
        width:        '100%',
        height:       '70px',
        objectFit:    'cover',
        objectPosition: 'center',
        display:      'block',
        marginBottom: '8px',
      });
      this.content.appendChild(img);

      const text = document.createElement('p');

      text.textContent = 'Mayank Tiwari is a software engineer with 6+ years of expertise in software development and AI. His previous work includes leading the AI team at e.l.f. Beauty, Inc., DevOps at Walmart, and backend at ServiceTitan. In his free time he enjoys many different genres of video games, espressos with his two cats, and spending time in the wilderness. He is passionate about community, responsible technology, and sustainability.';
      
      Object.assign(text.style, { margin: '0', lineHeight: '1.6' });
      this.content.appendChild(text);
    } else if (section === 'projects') {
      const text = document.createElement('p');
      text.textContent = 'Projects coming soon.';
      Object.assign(text.style, { margin: '0' });
      this.content.appendChild(text);
    } else if (section === 'contact') {
      const form = document.createElement('form');

      const msg = document.createElement('textarea');
      msg.placeholder = 'Write your message here';
      msg.rows = 4;
      this._inputStyle(msg);
      msg.style.resize = 'none';
      form.appendChild(msg);

      const email = document.createElement('input');
      email.type = 'email';
      email.placeholder = 'your@email.com';
      this._inputStyle(email);
      form.appendChild(email);

      const status = document.createElement('div');
      Object.assign(status.style, { fontSize: '11px', marginBottom: '6px', minHeight: '14px' });
      form.appendChild(status);

      const submit = document.createElement('button');
      submit.type = 'button';
      submit.textContent = '[ send ]';
      Object.assign(submit.style, {
        background:    'none',
        border:        '1px solid ' + hexColor(C.FG_TONE),
        color:         hexColor(C.FG_TONE),
        fontFamily:    'monospace',
        fontSize:      '12px',
        letterSpacing: '1px',
        padding:       '3px 8px',
        cursor:        'pointer',
      });
      submit.addEventListener('mouseenter', () => {
        submit.style.background = hexColor(C.FG_TONE);
        submit.style.color      = hexColor(C.BG_TONE);
      });
      submit.addEventListener('mouseleave', () => {
        submit.style.background = 'none';
        submit.style.color      = hexColor(C.FG_TONE);
      });
      submit.addEventListener('click', async () => {
        const payload = { message: msg.value, email: email.value };
        submit.textContent = '[ ... ]';
        submit.disabled = true;
        try {
          const res = await fetch(C.CONTACT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          status.textContent = res.ok ? '[ sent ]' : '[ error — try again ]';
        } catch {
          status.textContent = '[ error — try again ]';
        }
        submit.textContent = '[ send ]';
        submit.disabled = false;
      });
      form.appendChild(submit);

      const row = document.createElement('div');
      Object.assign(row.style, { display: 'flex', gap: '16px', alignItems: 'flex-start' });

      form.style.flexShrink = '0';
      form.style.width = '240px';

      const aside = document.createElement('div');
      Object.assign(aside.style, {
        flexShrink:    '0',
        width:         '152px',
        paddingTop:    '2px',
        fontFamily:    'monospace',
        fontSize:      '11px',
        letterSpacing: '1px',
        lineHeight:    '1.5',
      });

      const asideLabel = document.createElement('div');
      asideLabel.setAttribute('data-muted', '');
      asideLabel.textContent = 'or schedule time with me:';
      Object.assign(asideLabel.style, { marginBottom: '8px', color: hexColor(C.MID_TONE) });

      const calLink = document.createElement('a');
      calLink.href = 'https://calendly.com/twri-mynk/coffee-chat';
      calLink.target = '_blank';
      calLink.rel = 'noopener noreferrer';
      calLink.textContent = '[ coffee chat → ]';
      Object.assign(calLink.style, {
        display:       'inline-block',
        color:         hexColor(C.FG_TONE),
        textDecoration: 'none',
        fontFamily:    'monospace',
        fontSize:      '11px',
        letterSpacing: '1px',
      });
      calLink.addEventListener('mouseenter', () => { calLink.style.color = hexColor(C.MID_TONE); });
      calLink.addEventListener('mouseleave', () => { calLink.style.color = hexColor(C.FG_TONE); });

      aside.appendChild(asideLabel);
      aside.appendChild(calLink);

      row.appendChild(form);
      row.appendChild(aside);
      this.content.appendChild(row);
    }
  }
}
