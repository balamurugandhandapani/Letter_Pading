(function () {
  'use strict';

  var MM = 96 / 25.4;
  var COLOR_KEYS = ['c_header', 'c_footer', 'c_main', 'c_secondary', 'c_gold', 'c_heading', 'c_foottext'];
  /* order: header rules, footer rule, header text, secondary, gold, letter heading, footer text */
  function mono(c, sec, gold) { return [c, c, c, sec, gold, c, c]; }
  var PRESETS = [
    { id: 'classic',  name: 'Classic Blue & Gold',      c: mono('#0c2650', '#0c2650', '#c49a3a') },
    { id: 'navy',     name: 'Navy & Champagne Gold',    c: mono('#14213d', '#2b3a67', '#c8a96a') },
    { id: 'forest',   name: 'Forest Green & Gold',      c: mono('#14532d', '#2f6f4f', '#b8903a') },
    { id: 'maroon',   name: 'Maroon & Gold',            c: mono('#6b1020', '#8a2c3a', '#c49a3a') },
    { id: 'mono',     name: 'Monochrome',               c: mono('#111111', '#555555', '#8a8a8a') },
    { id: 'purple',   name: 'Royal Purple & Gold',      c: mono('#3b1f6b', '#5b3a94', '#c49a3a') },
    { id: 'teal',     name: 'Deep Teal & Gold',         c: mono('#0b4f5c', '#1a7a8a', '#c49a3a') },
    { id: 'ocean',    name: 'Ocean Blue & Silver',      c: mono('#0a3d62', '#3c6e9c', '#9aa5b1') },
    { id: 'charcoal', name: 'Charcoal & Copper',        c: mono('#2b2b2b', '#4a4a4a', '#b87333') },
    { id: 'burgundy', name: 'Navy Heading, Maroon Rules', c: ['#6b1020', '#6b1020', '#14213d', '#8a2c3a', '#c49a3a', '#14213d', '#14213d'] }
  ];

  var DEFAULTS = {
    date: '',
    headingOn: true,
    heading: '',
    rDesig: '',
    rName: '',
    rInst: '',
    rDept: '',
    rStreet: '',
    rCity: '',
    subLabel: '',
    subject: '',
    subUnderline: true,
    subPos: 'after',
    salOn: true,
    salutation: '',
    body: '',
    bodySize: 12.7,
    bodyLH: 1.68,
    indent: true,
    repeatHeader: true,
    logoUrl: 'Gacnlogo.jpg',
    fontUrl: 'https://fonts.googleapis.com/css?family=Tinos:400,400i,700,700i',
    fontName: 'Tinos',
    wmOn: true, wmSize: 110, wmOpacity: 8, wmY: 0,
    sigOn: true,
    sigPlace: 'after',
    sigAbove: 2,
    sigBelow: 4,
    stampOn: true,
    nameOn: true,
    desigOn: true,
    sigLOn: false, sigLName: '', sigLDesig: '',
    sigCOn: false, sigCName: '', sigCDesig: '',
    sigROn: true,  sigRName: '', sigRDesig: '',
    c_header: PRESETS[0].c[0], c_footer: PRESETS[0].c[1], c_main: PRESETS[0].c[2],
    c_secondary: PRESETS[0].c[3], c_gold: PRESETS[0].c[4], c_heading: PRESETS[0].c[5], c_foottext: PRESETS[0].c[6]
  };

  var S = JSON.parse(JSON.stringify(DEFAULTS));
  var $ = function (id) { return document.getElementById(id); };
  var pagesEl = $('pages'), scaler = $('scaler'), wrap = $('wrap');
  var tplHeader = $('tpl-header'), tplFooter = $('tpl-footer');
  var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-k]'));
  var pageCount = 1, forced = false;

  /* ---------- form <-> state ---------- */
  function writeInputs() {
    inputs.forEach(function (el) {
      var k = el.getAttribute('data-k');
      if (el.type === 'checkbox') el.checked = !!S[k]; else el.value = S[k];
    });
  }
  function readInputs() {
    inputs.forEach(function (el) {
      var k = el.getAttribute('data-k');
      if (el.type === 'checkbox') S[k] = el.checked;
      else if (el.type === 'range') S[k] = parseFloat(el.value);
      else S[k] = el.value;
    });
  }

  /* ---------- helpers ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function ordinal(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return 'th';
    return ({1: 'st', 2: 'nd', 3: 'rd'})[n % 10] || 'th';
  }
  function buildDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    if (!m) return null;
    var d = el('div', 'date');
    var day = parseInt(m[3], 10);
    d.appendChild(document.createTextNode(String(day)));
    d.appendChild(el('sup', null, ordinal(day)));
    d.appendChild(document.createTextNode(' ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1]));
    return d;
  }
  function todayISO() {
    var t = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
  }
  function buildRecipient() {
    var lines = [S.rDesig, S.rName, S.rInst, S.rDept, S.rStreet, S.rCity]
      .map(function (s) { return (s || '').trim(); }).filter(Boolean);
    if (!lines.length) return null;
    var sec = el('section', 'recipient');
    sec.appendChild(el('div', 'to', 'To'));
    var addr = el('div', 'address');
    lines.forEach(function (l, i) {
      if (i) addr.appendChild(document.createElement('br'));
      addr.appendChild(document.createTextNode(l));
    });
    sec.appendChild(addr);
    return sec;
  }
  function buildSubject(pre) {
    var txt = (S.subject || '').trim();
    if (!txt) return null;
    var d = el('div', 'subject' + (S.subUnderline ? ' underlined' : '') + (pre ? ' before-salutation' : ''));
    var lab = (S.subLabel || '').trim();
    if (lab) { d.appendChild(el('span', 'sub-label', lab)); d.appendChild(document.createTextNode(' ')); }
    d.appendChild(el('span', 'sub-text', txt));
    return d;
  }
  function buildSalutation(afterSubject) {
    var t = (S.salutation || '').trim();
    if (!S.salOn || !t) return null;
    return el('div', 'salutation' + (afterSubject ? ' after-subject' : ''), t);
  }
  function buildSignature() {
    if (!S.sigOn) return null;
    var s = el('div', 'signoff ' + (S.sigPlace === 'bottom' ? 'at-bottom' : 'after-body'));
    ['L', 'C', 'R'].forEach(function (x, i) {
      var cell = el('div', 'sig-cell pos-' + x);
      cell.style.gridColumn = String(i + 1); cell.style.gridRow = '1';
      if (S['sig' + x + 'On']) {
        var sp = el('div', 'sig-space'); sp.setAttribute('aria-hidden', 'true'); cell.appendChild(sp);
        var nm = (S['sig' + x + 'Name'] || '').trim(), ds = (S['sig' + x + 'Desig'] || '').trim();
        if (S.nameOn && nm) cell.appendChild(el('div', 'name', nm));
        if (S.desigOn && ds) cell.appendChild(el('div', 'role', ds));
        s.appendChild(cell);
      }
    });
    if (S.stampOn) { var st = el('div', 'stamp-area' + (S.sigCOn ? '' : ' beside')); st.setAttribute('aria-label', 'Space for office stamp'); s.appendChild(st); }
    return s;
  }

  /* body text: **bold**, *italic*, ***both*** -> words made of runs (safe: text nodes only) */
  function tokenize(line) {
    var words = [], bold = false, ital = false, space = false;
    line.split(/(\*{1,3})/).forEach(function (seg) {
      if (/^\*{1,3}$/.test(seg)) {
        if (seg.length === 3) { bold = !bold; ital = !ital; } else if (seg.length === 2) bold = !bold; else ital = !ital;
        return;
      }
      (seg.match(/\s+|\S+/g) || []).forEach(function (part) {
        if (/^\s/.test(part)) { space = true; return; }
        var run = { t: part, b: bold, i: ital };
        if (space || !words.length) words.push([run]); else words[words.length - 1].push(run);
        space = false;
      });
    });
    return words;
  }
  function fill(p, words, a, b) {
    p.textContent = '';
    for (var i = a; i < b; i++) {
      if (i > a) p.appendChild(document.createTextNode(' '));
      words[i].forEach(function (r) {
        var node = document.createTextNode(r.t);
        if (r.i) { var e = document.createElement('em'); e.appendChild(node); node = e; }
        if (r.b) { var s = document.createElement('strong'); s.appendChild(node); node = s; }
        p.appendChild(node);
      });
    }
  }

  /* ---------- logo: Gacnlogo.jpg beside this file; embedded copy is the offline fallback ---------- */
  var LOGO_IMG = tplHeader.content.querySelector('.emblem');
  var logoFailed = false;
  function safeUrl(u, allowData) {
    u = (u || '').trim();
    if (!u) return '';
    if (/^(javascript|vbscript|file):/i.test(u)) return '';
    if (/^data:/i.test(u)) return allowData && /^data:image\//i.test(u) ? u : '';
    return u;
  }
  function logoSrc() { return safeUrl(S.logoUrl, true) || 'Gacnlogo.jpg'; }
  function applyFont() {
    var name = (S.fontName || '').replace(/[^A-Za-z0-9 \-]/g, '').trim();
    document.documentElement.style.setProperty('--letter-font',
      (name ? '"' + name + '", ' : '') + '"Times New Roman", Times, serif');
    var url = safeUrl(S.fontUrl, false);
    if (url && !/^https?:\/\//i.test(url) && !/^[\w.\/-]+\.css(\?.*)?$/i.test(url)) url = '';
    var l = document.getElementById('font-link');
    if (!url) { if (l) l.remove(); return; }
    if (!l) {
      l = document.createElement('link'); l.id = 'font-link'; l.rel = 'stylesheet';
      l.addEventListener('load', function () {
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(render, 30); });
      });
      document.head.appendChild(l);
    }
    if (l.getAttribute('href') !== url) l.setAttribute('href', url);
  }
  function wire(img) {
    img.onerror = function () {
      img.onerror = null; img.style.visibility = 'hidden';
      if (!logoFailed) { logoFailed = true; $('logo-warn').hidden = false; updateStatus(); }
    };
  }

  /* ---------- pagination ---------- */
  var cur = null;
  function newPage(first) {
    var sheet = el('div', 'sheet' + (S.indent ? '' : ' no-indent'));
    if (S.wmOn) {
      var wm = document.createElement('img');
      wm.className = 'watermark'; wm.alt = ''; wm.setAttribute('aria-hidden', 'true');
      wm.src = logoSrc(); wire(wm);
      sheet.appendChild(wm);
    }
    if (first || S.repeatHeader) {
      var hdr = tplHeader.content.cloneNode(true);
      var em = hdr.querySelector('.emblem'); em.src = logoSrc(); wire(em);
      sheet.appendChild(hdr);
    }
    var flow = el('div', 'flow');
    sheet.appendChild(flow);
    sheet.appendChild(tplFooter.content.cloneNode(true));
    pagesEl.appendChild(sheet);
    cur = { sheet: sheet, flow: flow };
    return cur;
  }
  function fits() { return cur.flow.scrollHeight <= cur.flow.clientHeight + 1; }

  function addAtomic(node) {
    if (!node) return;
    var hadContent = cur.flow.children.length > 0;
    cur.flow.appendChild(node);
    if (!fits()) {
      if (hadContent) { node.remove(); newPage(false); cur.flow.appendChild(node); if (!fits()) forced = true; }
      else forced = true;
    }
  }

  var lastPara = null;
  function placeParagraph(words) {
    var start = 0, cont = false, guard = 0;
    while (start < words.length && guard++ < 500) {
      var p = el('p', 'body-text' + (cont ? ' cont' : ''));
      cur.flow.appendChild(p);
      fill(p, words, start, words.length);
      if (fits()) { lastPara = { p: p, words: words, start: start }; return; }
      var hasOther = cur.flow.children.length > 1;
      var lo = 0, hi = words.length - start - 1;
      while (lo < hi) {
        var mid = Math.ceil((lo + hi) / 2);
        fill(p, words, start, start + mid);
        if (fits()) lo = mid; else hi = mid - 1;
      }
      var k = lo, lines = 0;
      if (k > 0) {
        fill(p, words, start, start + k);
        var lh = parseFloat(getComputedStyle(p).lineHeight) || 20;
        lines = Math.round(p.offsetHeight / lh);
      }
      if (k === 0 || lines < 2) {
        if (hasOther) { p.remove(); newPage(false); continue; }
        fill(p, words, start, words.length); forced = true; lastPara = { p: p, words: words, start: start }; return; /* nothing else can be done: keep, never delete */
      }
      p.classList.add('more');
      start += k; cont = true;
      newPage(false);
    }
  }

  function render() {
    var root = document.documentElement.style;
    root.setProperty('--header-accent', S.c_header);
    root.setProperty('--footer-accent', S.c_footer);
    root.setProperty('--main', S.c_main);
    root.setProperty('--secondary', S.c_secondary);
    root.setProperty('--gold', S.c_gold);
    root.setProperty('--heading', S.c_heading);
    root.setProperty('--foot-text', S.c_foottext);
    root.setProperty('--body-size', S.bodySize + 'pt');
    root.setProperty('--body-lh', String(S.bodyLH));
    applyFont();
    root.setProperty('--sig-above', String(S.sigAbove));
    root.setProperty('--sig-below', String(S.sigBelow));
    $('o-sigabove').textContent = S.sigAbove;
    $('o-sigbelow').textContent = S.sigBelow;
    root.setProperty('--wm-size', S.wmSize + 'mm');
    root.setProperty('--wm-opacity', String(S.wmOpacity / 100));
    root.setProperty('--wm-y', S.wmY + 'mm');
    $('o-wmsize').textContent = S.wmSize + ' mm';
    $('o-wmop').textContent = S.wmOpacity + '%';
    $('o-wmy').textContent = (S.wmY > 0 ? '+' : '') + S.wmY + ' mm';
    $('o-size').textContent = S.bodySize.toFixed(1) + ' pt';
    $('o-lh').textContent = S.bodyLH.toFixed(2);

    pagesEl.textContent = '';
    forced = false; logoFailed = false; $('logo-warn').hidden = true;
    newPage(true);

    if (S.headingOn && (S.heading || '').trim()) addAtomic(el('h1', 'purpose', S.heading.trim()));
    addAtomic(buildDate(S.date));
    addAtomic(buildRecipient());
    var salAfterSub = S.subPos === 'before';
    if (S.subPos === 'before') addAtomic(buildSubject(true));
    addAtomic(buildSalutation(salAfterSub));
    if (S.subPos !== 'before') addAtomic(buildSubject(false));

    (S.body || '').split(/\r?\n/).forEach(function (line) {
      if (!line.trim()) { if (cur.flow.querySelector('.body-text')) addAtomic(el('div', 'body-gap')); return; }
      placeParagraph(tokenize(line));
    });

    var sig = buildSignature();
    if (sig) {
      cur.flow.appendChild(sig);
      if (!fits()) sig.classList.add('tight'); /* first reduce only the gap below the signature (to 1 line) */
      if (!fits()) {
        sig.classList.remove('tight');
        sig.remove();
        var lp = lastPara;
        if (lp && lp.p.parentNode === cur.flow && lp.p === cur.flow.lastElementChild) {
          /* keep most of the paragraph on this page; carry only its last two lines to the next page with the signature */
          var lh = parseFloat(getComputedStyle(lp.p).lineHeight) || 20;
          var fullH = lp.p.offsetHeight, lines = Math.round(fullH / lh), n = lp.words.length;
          if (lines >= 4) {
            var j = n - lp.start - 1;
            while (j > 1) {
              fill(lp.p, lp.words, lp.start, lp.start + j);
              if (lp.p.offsetHeight <= fullH - 2 * lh + 1) break;
              j--;
            }
            lp.p.classList.add('more');
            newPage(false);
            var q = el('p', 'body-text cont');
            fill(q, lp.words, lp.start + j, n);
            cur.flow.appendChild(q); cur.flow.appendChild(sig);
          } else {
            lp.p.remove(); newPage(false);
            cur.flow.appendChild(lp.p); cur.flow.appendChild(sig);
          }
        } else if (cur.flow.children.length > 0) {
          newPage(false); cur.flow.appendChild(sig);
        } else { cur.flow.appendChild(sig); }
        if (!fits()) forced = true;
      }
    }

    pageCount = pagesEl.children.length;
    updateStatus();
    updateContrast();
    markPreset();
    fit();
  }

  function updateStatus() {
    var st = $('status'), bw = $('body-warn'), msg, cls;
    if (forced) {
      cls = 'bad';
      msg = 'Some content is larger than one page area and may overlap the footer. Shorten that section before printing.';
    } else if (pageCount > 1) {
      cls = 'warn';
      msg = 'Letter runs to ' + pageCount + ' A4 pages. To fit one page, shorten the text or reduce the font size.';
    } else { cls = 'ok'; msg = 'Fits on one A4 page'; }
    if (logoFailed) { msg += ' Logo not loaded: check the logo link.'; if (cls === 'ok') cls = 'warn'; }
    st.className = 'status ' + cls; st.textContent = msg;
    if (cls === 'ok' || (cls === 'warn' && !forced && pageCount === 1)) { bw.hidden = true; }
    else { bw.hidden = false; bw.className = 'warnbox ' + (cls === 'bad' ? 'bad' : 'warn'); bw.textContent = msg; }
  }

  /* ---------- colour helpers ---------- */
  function lum(hex) {
    var n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(hex) { return 1.05 / (lum(hex) + 0.05); }
  function updateContrast() {
    var bad = [];
    [['Header text', S.c_main], ['Letter heading', S.c_heading], ['Footer text', S.c_foottext], ['Secondary decorative', S.c_secondary]].forEach(function (x) {
      if (contrast(x[1]) < 4.5) bad.push(x[0]);
    });
    var c = $('contrast');
    c.hidden = !bad.length;
    c.textContent = bad.length ? 'Low contrast on white paper: ' + bad.join(', ') + '. These colours colour printed text and may be hard to read.' : '';
  }
  function markPreset() {
    var cur = COLOR_KEYS.map(function (k) { return S[k].toLowerCase(); }).join();
    Array.prototype.forEach.call(document.querySelectorAll('.preset'), function (b) {
      var p = PRESETS.filter(function (x) { return x.id === b.getAttribute('data-preset'); })[0];
      b.setAttribute('aria-pressed', String(p.c.join() === cur));
    });
  }
  function applyColours(arr) {
    COLOR_KEYS.forEach(function (k, i) { S[k] = arr[i]; });
    writeInputs(); render();
  }

  /* ---------- scale preview to fit narrow screens ---------- */
  function fit() {
    var cs = getComputedStyle(wrap);
    var avail = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var w = 210 * MM, s = Math.min(1, avail / w);
    pagesEl.style.transform = s < 1 ? 'scale(' + s + ')' : 'none';
    scaler.style.width = (w * s) + 'px';
    scaler.style.height = (pagesEl.offsetHeight * s) + 'px';
  }

  /* ---------- events ---------- */
  var timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(function () { readInputs(); render(); }, 40); }
  var panel = $('panel');
  panel.addEventListener('input', schedule);
  panel.addEventListener('change', schedule);

  var pc = $('presets');
  PRESETS.forEach(function (p) {
    var b = el('button', 'preset'); b.type = 'button'; b.setAttribute('data-preset', p.id);
    var sw = el('span', 'sw');
    p.c.forEach(function (c) { var i = document.createElement('i'); i.style.background = c; sw.appendChild(i); });
    b.appendChild(sw); b.appendChild(document.createTextNode(p.name));
    b.addEventListener('click', function () { readInputs(); applyColours(p.c); });
    pc.appendChild(b);
  });

  function wrapSel(m) {
    var ta = $('f-body'), s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    ta.value = v.slice(0, s) + m + v.slice(s, e) + m + v.slice(e);
    ta.focus(); ta.setSelectionRange(s + m.length, e + m.length);
    readInputs(); render();
  }
  $('fmt-b').addEventListener('click', function () { wrapSel('**'); });
  $('fmt-i').addEventListener('click', function () { wrapSel('*'); });
  $('f-body').addEventListener('keydown', function (ev) {
    if (!(ev.ctrlKey || ev.metaKey)) return;
    var k = ev.key.toLowerCase();
    if (k === 'b') { ev.preventDefault(); wrapSel('**'); }
    else if (k === 'i') { ev.preventDefault(); wrapSel('*'); }
  });
  $('btn-today').addEventListener('click', function () { S.date = todayISO(); writeInputs(); render(); });
  $('btn-reset-colours').addEventListener('click', function () { readInputs(); applyColours(PRESETS[0].c); });
  $('btn-clear').addEventListener('click', function () {
    if (!window.confirm('Clear all letter text (date, heading, address, subject, salutation, body and signatory names)? Colours and on/off settings are kept. "Reset letter" brings the sample back.')) return;
    ['date', 'heading', 'rDesig', 'rName', 'rInst', 'rDept', 'rStreet', 'rCity', 'subject', 'salutation', 'body',
     'sigLName', 'sigLDesig', 'sigCName', 'sigCDesig', 'sigRName', 'sigRDesig'].forEach(function (k) { S[k] = ''; });
    writeInputs(); render(); $('f-date').focus();
  });
  $('btn-reset').addEventListener('click', function () {
    if (!window.confirm('Reset everything (all fields, settings and colours) to the blank defaults?')) return;
    S = JSON.parse(JSON.stringify(DEFAULTS)); writeInputs(); render();
  });
  $('btn-mode').addEventListener('click', function () {
    var on = document.body.classList.toggle('preview-mode');
    this.textContent = on ? 'Edit mode' : 'Preview mode';
    fit();
  });
  $('btn-print').addEventListener('click', function () {
    readInputs(); render();
    if (forced && !window.confirm('Some content does not fit its page area and may overlap. Print anyway?')) return;
    if (!forced && pageCount > 1 && !window.confirm('This letter runs to ' + pageCount + ' A4 pages. Print all ' + pageCount + ' pages?')) return;
    window.print();
  });
  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap);
  window.addEventListener('load', function () { render(); });
  /* the linked font loads asynchronously: measure again once it is ready so pagination matches the final text */
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(function () { render(); });
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { render(); });
  }

  writeInputs();
  render();
})();
