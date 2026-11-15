'use strict';
/* PNJ RAASU – โมดูลประเมิน PI / Phlebitis (หน้าแรก)
   เก็บข้อมูลในเครื่อง (IndexedDB แยกเป็นรายเดือน) ใช้ออฟไลน์ได้ ไม่ส่งข้อมูลออกนอกเครื่อง */
const PI = (() => {
  const DRAFT = 'pnj_pi_draft_v1', HAS = 'pnj_pi_has';
  const TIMES = [2, 6, 10, 14, 18, 22];
  const MN = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const LV = { p: ['PI1','PI2','PI3','PI4'], h: ['gr.1','gr.2','gr.3','gr.4'] };
  const LC = {
    p: ['ท้ายทอย','ใบหู','สะบัก','หลัง','ก้นกบ','สะโพกซ้าย','สะโพกขวา','ข้อศอก','ส้นเท้าซ้าย','ส้นเท้าขวา','ตาตุ่ม','อื่นๆ (พิมพ์เอง)'],
    h: ['แขนซ้าย','แขนขวา','ขาซ้าย','ขาขวา','หลังมือซ้าย','หลังมือขวา','ข้อพับซ้าย','ข้อพับขวา','อื่นๆ (พิมพ์เอง)']
  };
  const REF_PI = [['PI 1','#fbd9b0','ผิวแดง กดแล้วไม่จางหาย ผิวยังไม่ถลอก'],['PI 2','#f5b36b','ผิวหนังถลอก/พุพอง สูญเสียผิวบางส่วน'],['PI 3','#e8872a','สูญเสียผิวทั้งชั้น เห็นไขมันใต้ผิว'],['PI 4','#8f3d05','ลึกถึงกล้ามเนื้อ/กระดูก/เอ็น']];
  const REF_PH = [['Gr 0','#cfd8dc','ไม่มีอาการ'],['Gr 1','#bbdcf7','แดงบริเวณที่แทงเข็ม มี/ไม่มีปวด'],['Gr 2','#7fb8ee','ปวด แดง และ/หรือบวม'],['Gr 3','#3d86d6','ปวด แดง บวม คลำได้เป็นลำ/เป็นแนว'],['Gr 4','#1a4f9c','คลำได้เป็นลำยาว >1 นิ้ว มีหนอง']];
  const FIELDS = ['pa','pad','ps','psd','ha','had','hs','hsd'];

  const q = s => document.querySelector(s);
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const say = m => { try { toast(m); } catch (e) {} };
  const p2 = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const monthOf = d => d.slice(0, 7);
  const blank = () => ({ hn: '', pa: '', pad: '', paL: '', paP: '', ps: '', psd: '', psL: '', psP: '', ha: '', had: '', haL: '', haP: '', hs: '', hsd: '', hsL: '', hsP: '' });

  /* ---------- ที่เก็บข้อมูล ---------- */
  const KV = {
    db: null, ready: null,
    open() {
      if (this.ready) return this.ready;
      return this.ready = new Promise(res => {
        try {
          const r = indexedDB.open('pnj_pi', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('kv');
          r.onsuccess = () => { this.db = r.result; res(); };
          r.onerror = () => res(); r.onblocked = () => res();
        } catch (e) { res(); }
      });
    },
    async get(k) {
      await this.open();
      return new Promise(res => {
        if (!this.db) { try { res(JSON.parse(localStorage.getItem('pnj_pi:' + k))); } catch (e) { res(null); } return; }
        try { const r = this.db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result === undefined ? null : r.result); r.onerror = () => res(null); } catch (e) { res(null); }
      });
    },
    async set(k, v) {
      await this.open();
      return new Promise(res => {
        if (!this.db) { try { localStorage.setItem('pnj_pi:' + k, JSON.stringify(v)); } catch (e) { say('บันทึกลงเครื่องไม่สำเร็จ'); } res(); return; }
        try { const t = this.db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(); t.onerror = () => { say('บันทึกลงเครื่องไม่สำเร็จ'); res(); }; } catch (e) { res(); }
      });
    },
    async keys() {
      await this.open();
      return new Promise(res => {
        if (!this.db) { const o = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('pnj_pi:')) o.push(k.slice(7)); } } catch (e) {} res(o); return; }
        try { const r = this.db.transaction('kv').objectStore('kv').getAllKeys(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); } catch (e) { res([]); }
      });
    }
  };

  /* ---------- ข้อมูลฟอร์ม (ร่าง) ---------- */
  let S, IMG = {}, sub = 'form', RTOK = 0, repMonth = '';
  (function loadDraft() {
    try {
      const r = JSON.parse(localStorage.getItem(DRAFT));
      if (r && Array.isArray(r.p) && r.p.length === 6) { r.p = r.p.map(p => Object.assign(blank(), p)); S = r; }
    } catch (e) {}
    if (!S) S = { date: today(), time: '', p: Array.from({ length: 6 }, blank) };
    if (!S.date || (!S.time && !S.p.some(p => p.hn))) S.date = today();
  })();
  const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify(S)); } catch (e) {} };
  KV.get('img').then(v => { if (v && typeof v === 'object') { IMG = v; if (sub === 'ref') drawBody(); } });

  /* ---------- รายการที่บันทึก (แยกเก็บรายเดือน) ---------- */
  const loadMonth = async m => (await KV.get('h:' + m)) || [];
  async function saveRecords(recs) {
    const by = {};
    recs.forEach(r => (by[monthOf(r.date)] = by[monthOf(r.date)] || []).push(r));
    for (const m in by) {
      const arr = await loadMonth(m);
      by[m].forEach(r => { const k = arr.findIndex(x => x.id === r.id); k >= 0 ? arr[k] = r : arr.push(r); });
      await KV.set('h:' + m, arr);
    }
    try { localStorage.setItem(HAS, '1'); } catch (e) {}
  }
  function cleanRec(r) {
    const date = String(r.date || ''), hn = String(r.hn || '').trim().slice(0, 30), time = Number(r.time);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !hn || !TIMES.includes(time)) return null;
    const o = { id: date + '|' + time + '|' + hn, date, time, hn };
    FIELDS.forEach(k => o[k] = String(r[k] || '').slice(0, 80));
    return o;
  }
  async function exportObj() {
    const o = { v: 1, hist: {}, img: IMG };
    for (const k of await KV.keys()) if (String(k).startsWith('h:')) o.hist[k] = await KV.get(k);
    return o;
  }
  async function importObj(o) {
    if (!o || typeof o !== 'object') return 0;
    let n = 0;
    const hist = o.hist && typeof o.hist === 'object' ? o.hist : {};
    for (const k in hist) {
      if (!/^h:\d{4}-\d{2}$/.test(k) || !Array.isArray(hist[k])) continue;
      const arr = (await KV.get(k)) || [];
      hist[k].forEach(r => { const c = r && cleanRec(r); if (!c) return; const i = arr.findIndex(x => x.id === c.id); i >= 0 ? arr[i] = c : arr.push(c); n++; });
      await KV.set(k, arr);
    }
    if (o.img && typeof o.img === 'object') {
      ['pi', 'ph'].forEach(k => { if (typeof o.img[k] === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(o.img[k])) IMG[k] = o.img[k]; });
      await KV.set('img', IMG);
    }
    if (n) { try { localStorage.setItem(HAS, '1'); } catch (e) {} }
    return n;
  }

  /* ---------- หน้าจอ ---------- */
  function ynRow(i, k, label) {
    const p = S.p[i], t = k[0] === 'p' ? 'p' : 'h', dk = k + 'd';
    const b = (v, c) => `<button type="button" class="${c}${p[k] === v ? ' on' : ''}" data-pi="yn" data-i="${i}" data-k="${k}" data-v="${v}">${v}</button>`;
    let h = `<div class="pi-yn"><span class="pi-yl">${label}</span><span class="pi-seg">${b('ไม่มี', 'no')}${b('มี', 'yes')}</span></div>`;
    if (p[k] === 'มี') {
      const sel = (w, opts, val, ph) => `<select class="pi-in" data-pi="sel" data-i="${i}" data-k="${k}" data-w="${w}"><option value="">${ph}</option>${opts.map(o => `<option${o === val ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
      h += `<div class="pi-det">${sel('L', LV[t], p[k + 'L'], 'ระดับ')}${sel('P', LC[t], p[k + 'P'], 'ตำแหน่ง')}
        <input type="text" class="pi-in" data-pi="det" data-i="${i}" data-k="${dk}" placeholder="ระดับ/ตำแหน่ง เช่น ${t === 'p' ? 'PI1/หลัง' : 'gr.1/แขนซ้าย'}" value="${E(p[dk])}"></div>`;
    }
    return h;
  }
  function formHTML() {
    const warn = (() => {
      let has = false; try { has = localStorage.getItem(HAS) === '1'; } catch (e) {}
      const lb = (typeof db !== 'undefined' && db.lastBackup) || 0;
      return has && Date.now() - lb > 30 * 864e5 ? `<div class="pi-warn pi-noprint">⚠️ ยังไม่ได้สำรองข้อมูลเกิน 30 วัน — ไปที่แท็บ “รายงาน” แล้วกดสำรองข้อมูล</div>` : '';
    })();
    return warn + `<div class="pi-card"><div class="pi-lb">วันที่ประเมิน</div><input type="date" class="pi-in" data-pi="date" value="${E(S.date)}">
      <div class="pi-lb" style="margin-top:12px">เวลาที่ประเมิน (ใช้กับทุกคน)</div>
      <div class="pi-chips">${TIMES.map(t => `<button type="button" class="pi-chip${S.time === t ? ' on' : ''}" data-pi="time" data-t="${t}">${t} น.</button>`).join('')}</div></div>`
      + S.p.map((p, i) => `<div class="pi-card"><div class="pi-pth"><span class="pi-n">${i + 1}</span>
        <input type="text" class="pi-in" inputmode="numeric" data-pi="hn" data-i="${i}" placeholder="HN ผู้ป่วยคนที่ ${i + 1}" value="${E(p.hn)}"></div>
        <div class="pi-g pi-gp"><div class="pi-gt">🛏️ แผลกดทับ (PI)</div>${ynRow(i, 'pa', 'แรกรับ')}${ynRow(i, 'ps', 'ขณะนอน รพ.')}</div>
        <div class="pi-g pi-gh"><div class="pi-gt">💉 Phlebitis</div>${ynRow(i, 'ha', 'แรกรับ')}${ynRow(i, 'hs', 'ขณะนอน รพ.')}</div></div>`).join('')
      + `<button class="btn" data-pi="save">💾 บันทึกข้อมูล</button><button class="btn alt" data-pi="reset">ล้างฟอร์ม (เริ่มชุดใหม่)</button>`;
  }
  function repHTML() {
    return `<div class="pi-card"><div class="pi-noprint"><div class="pi-lb">เลือกเดือน</div><input type="month" class="pi-in" id="piMonth" data-pi="month" value="${E(repMonth || monthOf(S.date))}"></div>
      <h2 class="pi-ptitle" id="piPT"></h2><div class="pi-stat" id="piStat"></div><div class="pi-tw" id="piTable"></div>
      <button class="btn pi-noprint" data-pi="print" style="margin-top:12px">🖨️ ส่งออกเป็น PDF</button>
      <p class="hint pi-noprint">กดแล้วเลือก “บันทึกเป็น PDF” ในหน้าต่างพิมพ์ของเครื่อง</p></div>
      <div class="pi-card pi-noprint"><b>สำรองข้อมูล</b><p class="hint">ไฟล์สำรองรวมข้อมูล PI/Phlebitis ทั้งหมดและเมนูของแอพ ข้อมูลอยู่ในเครื่องนี้เท่านั้น ควรสำรองอย่างน้อยเดือนละครั้ง</p>
      <button class="btn alt" data-pi="backup">⬇️ ส่งออกไฟล์สำรอง</button><p class="hint">กู้คืน: ปุ่ม ⚙️ มุมขวาบน › นำเข้าไฟล์สำรอง</p></div>`;
  }
  function refBox(arr, round) {
    return arr.map((a, ix) => `<div><svg viewBox="0 0 100 56"><rect width="100" height="56" rx="8" fill="#f1e4d6"/>${round
      ? `<circle cx="50" cy="28" r="${10 + ix * 4}" fill="${a[1]}"/>`
      : `<rect x="8" y="22" width="84" height="12" rx="6" fill="#d9b8a0"/><rect x="20" y="20" width="${14 + ix * 14}" height="16" rx="6" fill="${a[1]}"/>`}</svg><b style="color:var(--${round ? 'pi' : 'ph'})">${a[0]}</b>${a[2]}</div>`).join('');
  }
  function refHTML() {
    const up = (k, t) => { const c = k === 'pi' ? 'pi' : 'ph'; return `<div class="pi-card" style="border-left:6px solid var(--${c})"><b style="color:var(--${c})">${t}</b>
      ${IMG[k] ? `<img class="pi-up" src="${IMG[k]}" alt="${t}">` : ''}<div class="pi-lb" style="margin-top:8px">${IMG[k] ? 'เปลี่ยนรูป' : 'อัปโหลดรูปจากฟอร์ม/โรงพยาบาล'}</div>
      <input type="file" accept="image/*" data-pi="file" data-k="${k}">${IMG[k] ? `<button class="btn alt sm" style="margin-top:8px" data-pi="delimg" data-k="${k}">ลบรูป</button>` : ''}</div>`; };
    return up('pi', 'ภาพแผลกดทับ (PI)') + `<div class="pi-card" style="border-left:6px solid var(--pi)"><b style="color:var(--pi)">แผนภาพย่อ ระดับ PI</b><div class="pi-ref">${refBox(REF_PI, true)}</div></div>`
      + up('ph', 'ระดับ Phlebitis') + `<div class="pi-card" style="border-left:6px solid var(--ph)"><b style="color:var(--ph)">แผนภาพย่อ ระดับ Phlebitis</b><div class="pi-ref">${refBox(REF_PH, false)}</div></div>`;
  }
  const body = () => sub === 'rep' ? repHTML() : sub === 'ref' ? refHTML() : formHTML();
  function drawBody() { const b = q('#piBody'); if (b) b.innerHTML = body(); if (sub === 'rep') fillReport(); }

  function homeHTML() {
    const chip = (s, l) => `<button type="button" class="${sub === s ? 'on' : ''}" data-pi="sub" data-s="${s}">${l}</button>`;
    const chips = `<div class="cats pi-subs pi-noprint">${chip('form', '📝 บันทึก')}${chip('rep', '📊 รายงาน')}${chip('ref', '🖼️ รูปอ้างอิง')}${chip('links', '🔗 ลิงก์อื่น')}</div>`;
    if (sub === 'links') return chips + linksHTML();
    return `<section class="hello small pi-noprint"><div class="ht"><h2>📋 ประเมิน PI / Phlebitis</h2><p>แผลกดทับ • หลอดเลือดดำอักเสบ</p></div><div class="art"><img src="brain-nurse.svg" alt=""></div></section>${chips}<div id="piBody">${body()}</div>`;
  }
  function after() { if (sub === 'rep') fillReport(); }

  async function fillReport() {
    const inp = q('#piMonth'); if (!inp) return;
    const m = inp.value || monthOf(S.date), tok = ++RTOK; repMonth = m;
    let rows = await loadMonth(m); if (tok !== RTOK || !q('#piTable')) return;
    const key = r => r.date + p2(r.time) + r.hn;
    rows = rows.slice().sort((a, b) => key(a).localeCompare(key(b)));
    const [y, mm] = m.split('-');
    q('#piPT').textContent = 'รายงานติดตามแผลกดทับและ Phlebitis เดือน' + (MN[+mm - 1] || '') + ' ' + (+y + 543);
    const hs = new Set(rows.map(r => r.hn)), pi = new Set(rows.filter(r => r.pa === 'มี' || r.ps === 'มี').map(r => r.hn)), ph = new Set(rows.filter(r => r.ha === 'มี' || r.hs === 'มี').map(r => r.hn));
    q('#piStat').innerHTML = `<span>บันทึก ${rows.length}</span><span>ผู้ป่วย ${hs.size} ราย</span><span class="sp">พบ PI ${pi.size} ราย</span><span class="sh">พบ Phlebitis ${ph.size} ราย</span>`;
    const cell = (v, d) => v === 'มี' ? '<b>มี</b>' + (d ? ' (' + E(d) + ')' : '') : (v || '-');
    q('#piTable').innerHTML = rows.length ? `<table class="pi-t"><tr><th>วันที่</th><th>น.</th><th>HN</th><th class="tp">PI แรกรับ</th><th class="tp">PI ขณะนอน</th><th class="tq">Ph แรกรับ</th><th class="tq">Ph ขณะนอน</th><th class="pi-noprint"></th></tr>`
      + rows.map(r => `<tr><td>${r.date.split('-').reverse().join('/')}</td><td>${E(r.time)}</td><td>${E(r.hn)}</td><td class="cp">${cell(r.pa, r.pad)}</td><td class="cp">${cell(r.ps, r.psd)}</td><td class="cq">${cell(r.ha, r.had)}</td><td class="cq">${cell(r.hs, r.hsd)}</td><td class="pi-noprint"><button class="pi-x" data-pi="del" data-id="${E(r.id)}" data-m="${m}">ลบ</button></td></tr>`).join('') + '</table>'
      : '<div class="empty" style="padding:24px 0">ยังไม่มีข้อมูลในเดือนนี้</div>';
  }

  /* ---------- เหตุการณ์ ---------- */
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-pi]'); if (!t) return;
    const a = t.dataset.pi, d = t.dataset;
    if (a === 'sub') { sub = d.s; render(); scrollTo(0, 0); }
    else if (a === 'time') { S.time = S.time === +d.t ? '' : +d.t; saveDraft(); drawBody(); }
    else if (a === 'yn') {
      const p = S.p[+d.i], k = d.k; p[k] = p[k] === d.v ? '' : d.v;
      if (p[k] !== 'มี') { p[k + 'd'] = ''; p[k + 'L'] = ''; p[k + 'P'] = ''; }
      saveDraft(); drawBody();
    }
    else if (a === 'save') {
      if (!S.time) return say('เลือกเวลาที่ประเมินก่อน');
      const ps = S.p.filter(p => p.hn.trim());
      if (!ps.length) return say('ยังไม่ได้ใส่ HN');
      const miss = ps.filter(p => !(p.pa && p.ps && p.ha && p.hs));
      if (miss.length && !confirm('HN ' + miss.map(p => p.hn.trim()).join(', ') + ' ยังเลือกไม่ครบทุกข้อ บันทึกเลยหรือไม่?')) return;
      const recs = ps.map(p => { const r = { date: S.date, time: S.time, hn: p.hn }; FIELDS.forEach(k => r[k] = p[k] || ''); return cleanRec(r); }).filter(Boolean);
      await saveRecords(recs);
      say('บันทึกแล้ว ' + recs.length + ' คน ✓ (กด “ล้างฟอร์ม” เพื่อเริ่มชุดใหม่)'); drawBody();
    }
    else if (a === 'reset') {
      if (!confirm('ล้างฟอร์มผู้ป่วยทั้ง 6 คน? (ข้อมูลที่บันทึกแล้วไม่หาย)')) return;
      S.p = Array.from({ length: 6 }, blank); S.time = ''; S.date = today(); saveDraft(); drawBody(); scrollTo(0, 0);
    }
    else if (a === 'del') {
      if (!confirm('ลบรายการนี้?')) return;
      await KV.set('h:' + d.m, (await loadMonth(d.m)).filter(r => r.id !== d.id)); say('ลบแล้ว'); fillReport();
    }
    else if (a === 'delimg') { delete IMG[d.k]; await KV.set('img', IMG); drawBody(); }
    else if (a === 'print') { try { window.print(); } catch (x) { say('เครื่องนี้พิมพ์ไม่ได้'); } }
    else if (a === 'backup') { exportData(); }
  });
  document.addEventListener('input', e => {
    const t = e.target; if (!t.dataset || !t.dataset.pi) return;
    if (t.dataset.pi === 'date') { S.date = t.value; saveDraft(); }
    else if (t.dataset.pi === 'hn') { S.p[+t.dataset.i].hn = t.value; saveDraft(); }
    else if (t.dataset.pi === 'det') { S.p[+t.dataset.i][t.dataset.k] = t.value; saveDraft(); }
  });
  document.addEventListener('change', e => {
    const t = e.target; if (!t.dataset || !t.dataset.pi) return;
    const a = t.dataset.pi;
    if (a === 'sel') {
      const p = S.p[+t.dataset.i], k = t.dataset.k; p[k + t.dataset.w] = t.value;
      const loc = (p[k + 'P'] || '').startsWith('อื่นๆ') ? '' : p[k + 'P'];
      p[k + 'd'] = [p[k + 'L'], loc].filter(Boolean).join('/'); saveDraft(); drawBody();
      if ((p[k + 'P'] || '').startsWith('อื่นๆ')) { const x = q(`input[data-pi="det"][data-i="${t.dataset.i}"][data-k="${k}d"]`); if (x) x.focus(); }
    }
    else if (a === 'month') { repMonth = t.value; fillReport(); }
    else if (a === 'file' && t.files && t.files[0]) {
      const k = t.dataset.k, img = new Image(), u = URL.createObjectURL(t.files[0]);
      img.onload = async () => {
        const m = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = img.width * m; c.height = img.height * m; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        IMG[k] = c.toDataURL('image/jpeg', .8); await KV.set('img', IMG); URL.revokeObjectURL(u); drawBody();
      };
      img.onerror = () => say('เปิดรูปไม่ได้'); img.src = u;
    }
  });

  return { homeHTML, after, exportObj, importObj, home() { sub = 'form'; } };
})();
