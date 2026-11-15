'use strict';
/* PNJ RAASU – โมดูลประเมิน PI / Phlebitis (หน้าแรก)
   เก็บข้อมูลในเครื่อง (IndexedDB แยกเป็นรายเดือน) ใช้ออฟไลน์ได้ ไม่ส่งข้อมูลออกนอกเครื่อง */
const PI = (() => {
  const DRAFT = 'pnj_pi_draft_v1', HAS = 'pnj_pi_has';
  const TIMES = [2, 6, 10, 14, 18, 22];
  const MN = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const LV = { h: ['gr.1','gr.2','gr.3','gr.4'] };
  const PI_TYPES = ['PI','MDRPI','MMPI','MARSI','IAD'];
  const PI_GRADE = { PI: ['Stage 1','Stage 2','Stage 3','Stage 4','Unstageable','DTI'], IAD: ['Cat 1','Cat 2'] };
  const LC = {
    p: ['ท้ายทอย','ใบหู','จมูก','ปาก/ริมฝีปาก','สะบัก','หลัง','ก้นกบ','สะโพกซ้าย','สะโพกขวา','ก้น','ฝีเย็บ','ข้อศอก','ข้อมือ','ส้นเท้าซ้าย','ส้นเท้าขวา','ตาตุ่ม','อื่นๆ (พิมพ์เอง)'],
    h: ['แขนซ้าย','แขนขวา','ขาซ้าย','ขาขวา','หลังมือซ้าย','หลังมือขวา','ข้อพับซ้าย','ข้อพับขวา','อื่นๆ (พิมพ์เอง)']
  };
  const REF_PI = [['PI 1','#fbd9b0','ผิวแดง กดแล้วไม่จางหาย ผิวยังไม่ถลอก'],['PI 2','#f5b36b','ผิวหนังถลอก/พุพอง สูญเสียผิวบางส่วน'],['PI 3','#e8872a','สูญเสียผิวทั้งชั้น เห็นไขมันใต้ผิว'],['PI 4','#8f3d05','ลึกถึงกล้ามเนื้อ/กระดูก/เอ็น']];
  const REF_PH = [['Gr 0','#cfd8dc','ไม่มีอาการ'],['Gr 1','#bbdcf7','แดงบริเวณที่แทงเข็ม มี/ไม่มีปวด'],['Gr 2','#7fb8ee','ปวด แดง และ/หรือบวม'],['Gr 3','#3d86d6','ปวด แดง บวม คลำได้เป็นลำ/เป็นแนว'],['Gr 4','#1a4f9c','คลำได้เป็นลำยาว >1 นิ้ว มีหนอง']];
  const CAUSES = ['Labetalol', 'KCl', 'Cordarone', 'Nicardipine', 'Omeprazole', 'Contrast'];
  const TREAT = {
    p: ['Cavilon No-Rinse Skin Cleanser', '3M Cavilon Durable Barrier Cream', 'Esenta Skin Barrier Spray', 'Stomahesive Powder', '3M Cavilon ADV Skin', 'Calmoseptine Ointment', 'ทำแผล'],
    h: ['เปลี่ยนตำแหน่งให้ยา', 'ประคบเย็น', 'ทายา Reparil Gel']
  };
  // สรุปการรักษาเป็นข้อความเดียวเก็บใน k+'R' (กำหนดเอง ใช้ข้อความที่พิมพ์แทน)
  const treatText = (p, k) => (p[k + 'Rl'] || []).map(v => v === 'กำหนดเอง' ? (p[k + 'Rc'] || '').trim() : v).filter(Boolean).join(', ');
  const KINDS = ['ครั้งแรก', 'ตำแหน่งเดิม', 'ตำแหน่งใหม่'];
  const FIELDS = ['pa','pad','pk','ptm','ps','psd','ha','had','hk','htm','hs','hsd','pat','pnw','pst','hat','hnw','hst','hac','hsc','paR','psR','haR','hsR'];

  const q = s => document.querySelector(s);
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const say = m => { try { toast(m); } catch (e) {} };
  const p2 = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const monthOf = d => d.slice(0, 7);
  const blank = () => ({ hn: '', pa: '', pad: '', paL: '', paP: '', paT: '', pk: 'แรกรับ', ptm: '', ps: '', psd: '', psL: '', psP: '', psT: '', ha: '', had: '', haL: '', haP: '', hk: 'แรกรับ', htm: '', paRl: [], paRc: '', paR: '', psRl: [], psRc: '', psR: '', haRl: [], haRc: '', haR: '', hsRl: [], hsRc: '', hsR: '', hacS: '', hac: '', hscS: '', hsc: '', pat: '', pnw: '', pst: '', hat: '', hnw: '', hst: '', hs: '', hsd: '', hsL: '', hsP: '' });
  const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
  const nowHM = () => { const d = new Date(); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
  const normTime = v => { const n = Number(v); if (TIMES.includes(n)) return n; return HM.test(String(v)) ? String(v) : null; };
  const mins = t => { t = String(t); return t.includes(':') ? +t.slice(0, 2) * 60 + +t.slice(3, 5) : +t * 60; };

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
  let S, IMG = {}, sub = 'form', RTOK = 0, repMonth = '', anaRange = 1;
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
    const date = String(r.date || ''), hn = String(r.hn || '').trim().slice(0, 30), time = normTime(r.time);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !hn || time === null) return null;
    const o = { id: date + '|' + time + '|' + hn, date, time, hn };
    FIELDS.forEach(k => o[k] = String(r[k] || '').slice(0, /R$/.test(k) ? 300 : 80));
    ['ptm', 'htm', 'pat', 'hat', 'pst', 'hst'].forEach(k => { if (!HM.test(o[k])) o[k] = ''; });
    ['pnw', 'hnw'].forEach(k => { if (o[k] !== 'เพิ่มใหม่' && !KINDS.includes(o[k])) o[k] = ''; });
    ['pk', 'hk'].forEach(k => { if (o[k] !== 'เพิ่มใหม่') o[k] = 'แรกรับ'; });
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

  /* ---------- สำรองอัตโนมัติ (ดาวน์โหลดไฟล์ลงเครื่อง) ---------- */
  const AUTO_KEY = 'pnj_pi_auto_v1';
  const autoCfg = () => { try { return Object.assign({ on: true, mode: 'daily', last: '' }, JSON.parse(localStorage.getItem(AUTO_KEY) || '{}')); } catch (e) { return { on: true, mode: 'daily', last: '' }; } };
  const setAuto = c => { try { localStorage.setItem(AUTO_KEY, JSON.stringify(c)); } catch (e) {} };
  async function autoBackup() {
    const c = autoCfg(); if (!c.on) return false;
    const t = today();
    const due = c.mode === 'every' ? true : c.mode === 'week' ? (!c.last || (Date.parse(t) - Date.parse(c.last)) >= 7 * 864e5) : c.last !== t;
    if (!due) return false;
    try { const how = await exportData(true); c.last = t; setAuto(c); return how; } catch (e) { return false; }
  }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

  /* ---------- โฟลเดอร์สำรองเฉพาะ (File System Access API: Chrome/Edge บน Android และคอมพิวเตอร์) ---------- */
  const FOLDER_NAME = 'PNJ-RAASU-Backup', KEEP = 30;
  let FOLDER = null;
  KV.get('dirMeta').then(m => { if (m && m.label) FOLDER = m; });
  const canFolder = () => { try { return 'showDirectoryPicker' in window && window.top === window && !!KV.db; } catch (e) { return false; } };
  async function pickFolder() {
    if (!canFolder()) return say('เครื่อง/เบราว์เซอร์นี้ไม่รองรับการเลือกโฟลเดอร์');
    let parent;
    try { parent = await window.showDirectoryPicker({ id: 'pnj-backup', mode: 'readwrite', startIn: 'documents' }); }
    catch (e) { if (e && e.name !== 'AbortError') say('เลือกโฟลเดอร์นี้ไม่ได้ ลองสร้าง/เลือกโฟลเดอร์อื่น (ไม่ใช่ Downloads)'); return; }
    try {
      const sub = await parent.getDirectoryHandle(FOLDER_NAME, { create: true });
      await KV.set('dir', sub); FOLDER = { label: parent.name + '/' + FOLDER_NAME }; await KV.set('dirMeta', FOLDER);
      const how = await exportData(true);
      say(how === 'folder' ? 'สร้างโฟลเดอร์แล้ว และสำรองไฟล์แรกเรียบร้อย ✓' : 'ตั้งโฟลเดอร์แล้ว (แต่เขียนไฟล์ไม่สำเร็จ ใช้ดาวน์โหลดแทน)');
    } catch (e) { say('สร้างโฟลเดอร์ไม่สำเร็จ ลองเลือกที่อื่น'); }
    drawBody();
  }
  async function clearFolder() { await KV.set('dir', null); await KV.set('dirMeta', null); FOLDER = null; say('เลิกใช้โฟลเดอร์แล้ว จะดาวน์โหลดไปที่ Downloads'); drawBody(); }
  async function writeBackup(name, text) {
    if (!FOLDER) return false;
    const h = await KV.get('dir'); if (!h || !h.getFileHandle) return false;
    let perm = h.queryPermission ? await h.queryPermission({ mode: 'readwrite' }) : 'granted';
    if (perm !== 'granted' && h.requestPermission) perm = await h.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return false;
    const fh = await h.getFileHandle(name, { create: true });
    const w = await fh.createWritable(); await w.write(text); await w.close();
    try {   // เก็บไฟล์สำรองล่าสุด KEEP ไฟล์ (ลบเฉพาะไฟล์ชื่อแบบเดียวกันในโฟลเดอร์นี้)
      const names = [];
      for await (const [n, e] of h.entries()) if (e.kind === 'file' && /^pnj-raasu-backup-\d{4}-\d{2}-\d{2}\.json$/.test(n)) names.push(n);
      names.sort().slice(0, Math.max(0, names.length - KEEP)).forEach(n => h.removeEntry(n).catch(() => {}));
    } catch (e) {}
    return true;
  }

  /* ---------- หน้าจอ ---------- */
  // ประกอบข้อความ ประเภท/เกรด/ตำแหน่ง ของแผลกดทับ เช่น PI2/ก้นกบ , IAD Cat 1/ก้น , MDRPI/ใบหู
  function composeP(p, k) {
    const T = p[k + 'T'] || 'PI', L = p[k + 'L'] || '', P = (p[k + 'P'] || '').startsWith('อื่นๆ') ? '' : (p[k + 'P'] || '');
    let tg = T;
    if (T === 'PI' && L) tg = /^Stage \d$/.test(L) ? 'PI' + L.slice(6) : 'PI ' + L;
    else if (T === 'IAD' && L) tg = 'IAD ' + L;
    return [tg, P].filter(Boolean).join('/');
  }
  function ynRow(i, k, label) {
    const p = S.p[i], t = k[0] === 'p' ? 'p' : 'h', dk = k + 'd';
    const b = (v, c) => `<button type="button" class="${c}${p[k] === v ? ' on' : ''}" data-pi="yn" data-i="${i}" data-k="${k}" data-v="${v}">${v}</button>`;
    const first = k === 'pa' || k === 'ha', nw = t + 'nw', tk = first ? t + 'at' : t + 'st';
    const kb = v => `<button type="button" class="${p[nw] === v ? 'on' : ''}" data-pi="kind" data-i="${i}" data-k="${k}" data-v="${v}">${v}</button>`;
    let h = `<div class="pi-yn wrap"><span class="pi-lh"><span class="pi-yl">${label}</span></span><span class="pi-seg">${b('ไม่มี', 'no')}${b('มี', 'yes')}</span></div>`;
    if (!first && p[k] === 'มี') h += `<div class="pi-kind pi-kinds">${KINDS.map(kb).join('')}</div>`;
    if (p[k] === 'มี' && (first || KINDS.includes(p[nw]))) h += `<div class="pi-kt"><span>เวลาที่พบ</span><input type="time" class="pi-in" data-pi="ktime" data-i="${i}" data-k="${tk}" value="${E(p[tk])}"></div>`;
    if (p[k] === 'มี') {
      const sel = (w, opts, val, ph, st) => `<select class="pi-in" data-pi="sel" data-i="${i}" data-k="${k}" data-w="${w}"${st ? ` style="${st}"` : ''}><option value="">${ph}</option>${opts.map(o => `<option${o === val ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
      const T = p[k + 'T'] || 'PI', grades = t === 'p' ? PI_GRADE[T] : LV.h;
      if (t === 'p') h += `<div class="pi-types">${PI_TYPES.map(v => `<button type="button" class="${T === v ? 'on' : ''}" data-pi="ptype" data-i="${i}" data-k="${k}" data-v="${v}">${v}</button>`).join('')}</div>`;
      if (t === 'h') {
        const cs = p[k + 'cS'] !== undefined ? p[k + 'cS'] : '', ck = k + 'c';
        h += `<div class="pi-lb" style="margin-top:8px">สาเหตุที่ทำให้เกิด</div><div class="pi-types pi-cause">${CAUSES.concat('กำหนดเอง').map(v => `<button type="button" class="${cs === v ? 'on' : ''}" data-pi="cause" data-i="${i}" data-k="${k}" data-v="${v}">${v}</button>`).join('')}</div>`;
        if (cs === 'กำหนดเอง') h += `<input type="text" class="pi-in" style="margin-top:8px" data-pi="det" data-i="${i}" data-k="${ck}" placeholder="ระบุสาเหตุ" maxlength="60" value="${E(p[ck])}">`;
      }
      h += `<div class="pi-det">${grades ? sel('L', grades, p[k + 'L'], t === 'p' ? 'เกรด' : 'ระดับ') : ''}${sel('P', LC[t], p[k + 'P'], 'ตำแหน่ง', grades ? '' : 'grid-column:1/-1')}
        <input type="text" class="pi-in" data-pi="det" data-i="${i}" data-k="${dk}" placeholder="ระดับ/ตำแหน่ง เช่น ${t === 'p' ? 'PI2/ก้นกบ' : 'gr.1/แขนซ้าย'}" value="${E(p[dk])}"></div>`;
      const rl = p[k + 'Rl'] || [];
      h += `<div class="pi-lb" style="margin-top:8px">การรักษา${t === 'p' ? ' (ใช้ยา / ทำแผล)' : ''} <small>เลือกได้หลายข้อ</small></div><div class="pi-types pi-treat">${TREAT[t].concat('กำหนดเอง').map(v => `<button type="button" class="${rl.includes(v) ? 'on' : ''}" data-pi="treat" data-i="${i}" data-k="${k}" data-v="${v}">${v}</button>`).join('')}</div>`;
      if (rl.includes('กำหนดเอง')) h += `<input type="text" class="pi-in" style="margin-top:8px" data-pi="rc" data-i="${i}" data-k="${k}" placeholder="ระบุการรักษา" maxlength="80" value="${E(p[k + 'Rc'])}">`;
    }
    return h;
  }
  // ดูภาพเต็มจอ: พอดีจอก่อน แล้วบีบนิ้ว/ล้อเมาส์/แตะสองครั้งเพื่อซูม ลากเพื่อเลื่อน
  function viewImg(k) {
    const src = IMG[k] || 'ref-' + k + '.jpg';
    const o = document.createElement('div'); o.className = 'pi-ov';
    o.innerHTML = `<button type="button" class="pi-ov-x" aria-label="ปิด">✕</button><div class="pi-ov-h">บีบนิ้วเพื่อซูม • ลากเพื่อเลื่อน • แตะสองครั้งเพื่อขยาย</div><div class="pi-ov-st"><img src="${src}" alt="" draggable="false"></div>`;
    o.querySelector('.pi-ov-x').onclick = () => o.remove();
    document.body.appendChild(o);
    const st = o.querySelector('.pi-ov-st'), im = st.querySelector('img');
    let s = 1, tx = 0, ty = 0; const ps = new Map(); let last = null, tap = 0, tapX = 0, tapY = 0, moved = 0;
    const clamp = () => {
      s = Math.min(6, Math.max(1, s));
      const W = st.clientWidth, H = st.clientHeight, w = im.clientWidth * s, h = im.clientHeight * s;
      const mx = Math.max(0, (w - W) / 2), my = Math.max(0, (h - H) / 2);
      tx = Math.min(mx, Math.max(-mx, tx)); ty = Math.min(my, Math.max(-my, ty));
      if (s === 1) { tx = 0; ty = 0; }
      im.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    };
    const zoomAt = (s2, mx, my) => { // mx,my: จุดกึ่งกลางการซูม (พิกัดเทียบกลาง stage)
      s2 = Math.min(6, Math.max(1, s2)); const f = s2 / s;
      tx = mx - (mx - tx) * f; ty = my - (my - ty) * f; s = s2; clamp();
    };
    const rel = e => { const r = st.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };
    const mid = () => { const v = [...ps.values()]; return v.length === 2 ? [(v[0][0] + v[1][0]) / 2, (v[0][1] + v[1][1]) / 2, Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1])] : [v[0][0], v[0][1], 0]; };
    st.addEventListener('pointerdown', e => { st.setPointerCapture(e.pointerId); ps.set(e.pointerId, rel(e)); last = mid(); moved = 0; });
    st.addEventListener('pointermove', e => {
      if (!ps.has(e.pointerId)) return; ps.set(e.pointerId, rel(e)); const m = mid();
      if (ps.size === 2 && last[2]) { zoomAt(s * m[2] / last[2], m[0], m[1]); tx += m[0] - last[0]; ty += m[1] - last[1]; clamp(); }
      else if (ps.size === 1) { tx += m[0] - last[0]; ty += m[1] - last[1]; clamp(); }
      moved += Math.abs(m[0] - last[0]) + Math.abs(m[1] - last[1]); last = m;
    });
    const up = e => {
      if (!ps.has(e.pointerId)) return;
      const wasOne = ps.size === 1; ps.delete(e.pointerId);
      if (wasOne && moved < 8) {
        const now = Date.now(), [x, y] = rel(e);
        if (now - tap < 320 && Math.hypot(x - tapX, y - tapY) < 30) { if (s > 1) { s = 1; clamp(); } else zoomAt(2.5, x, y); tap = 0; }
        else { tap = now; tapX = x; tapY = y; }
      }
      if (ps.size) last = mid();
    };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    st.addEventListener('wheel', e => { e.preventDefault(); const [x, y] = rel(e); zoomAt(s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), x, y); }, { passive: false });
    window.addEventListener('resize', clamp);
  }
  function formHTML() {
    const warn = (() => {
      let has = false; try { has = localStorage.getItem(HAS) === '1'; } catch (e) {}
      const lb = (typeof db !== 'undefined' && db.lastBackup) || 0;
      return has && Date.now() - lb > 30 * 864e5 ? `<div class="pi-warn pi-noprint">⚠️ ยังไม่ได้สำรองข้อมูลเกิน 30 วัน — ไปที่แท็บ “รายงาน” แล้วกดสำรองข้อมูล</div>` : '';
    })();
    return warn + `<div class="pi-card"><div class="pi-lb">วันที่ประเมิน</div><input type="date" class="pi-in" data-pi="date" value="${E(S.date)}">
      <div class="pi-lb" style="margin-top:12px">เวลาที่ประเมิน (ใช้กับทุกคน)</div>
      <div class="pi-chips">${TIMES.map(t => `<button type="button" class="pi-chip${S.time === t ? ' on' : ''}" data-pi="time" data-t="${t}">${t} น.</button>`).join('')}<button type="button" class="pi-chip${typeof S.time === 'string' && S.time ? ' on' : ''}" data-pi="ctimeon">✏️ กำหนดเอง</button></div>
      ${typeof S.time === 'string' && S.time ? `<div class="pi-kt"><span>เวลา</span><input type="time" class="pi-in" data-pi="ctime" value="${E(S.time)}"></div>` : ''}</div>`
      + S.p.map((p, i) => `<div class="pi-card"><div class="pi-pth"><span class="pi-n">${i + 1}</span>
        <input type="text" class="pi-in" inputmode="numeric" data-pi="hn" data-i="${i}" placeholder="HN ผู้ป่วยคนที่ ${i + 1}" value="${E(p.hn)}"></div>
        <div class="pi-g pi-gp"><div class="pi-gt"><span>🛏️ แผลกดทับ (PI)</span><button type="button" class="pi-view" data-pi="view" data-k="pi">🖼️ ดูภาพ</button></div>${ynRow(i, 'pa', 'แรกรับ')}${ynRow(i, 'ps', 'ขณะนอน รพ.')}</div>
        <div class="pi-g pi-gh"><div class="pi-gt"><span>💉 Phlebitis</span><button type="button" class="pi-view" data-pi="view" data-k="ph">🖼️ ดูภาพ</button></div>${ynRow(i, 'ha', 'แรกรับ')}${ynRow(i, 'hs', 'ขณะนอน รพ.')}</div></div>`).join('')
      + `<button class="btn" data-pi="save">💾 บันทึกข้อมูล</button><button class="btn alt" data-pi="reset">ล้างฟอร์ม (เริ่มชุดใหม่)</button>`;
  }
  function repHTML() {
    return `<div class="pi-card"><div class="pi-noprint"><div class="pi-lb">เลือกเดือน</div><input type="month" class="pi-in" id="piMonth" data-pi="month" value="${E(repMonth || monthOf(S.date))}"></div>
      <h2 class="pi-ptitle" id="piPT"></h2><div class="pi-stat" id="piStat"></div><div class="pi-tw" id="piTable"></div>
      <button class="btn pi-noprint" data-pi="print" style="margin-top:12px">🖨️ ส่งออกเป็น PDF</button>
      <p class="hint pi-noprint">กดแล้วเลือก “บันทึกเป็น PDF” ในหน้าต่างพิมพ์ของเครื่อง</p></div>
      ${autoHTML()}`;
  }
  function autoHTML() {
    const c = autoCfg(), lb = (typeof db !== 'undefined' && db.lastBackup) || 0;
    const opt = (v, l) => `<option value="${v}"${c.mode === v ? ' selected' : ''}>${l}</option>`;
    return `<div class="pi-card pi-noprint"><b>🔁 สำรองข้อมูลอัตโนมัติ</b>
      <label class="pi-sw"><input type="checkbox" data-pi="autoon"${c.on ? ' checked' : ''}><span>สำรองลงเครื่องอัตโนมัติ เมื่อกด “บันทึกข้อมูล”</span></label>
      <div class="pi-lb" style="margin-top:10px">ความถี่</div>
      <select class="pi-in" data-pi="automode">${opt('daily', 'วันละครั้ง (แนะนำ)')}${opt('week', 'สัปดาห์ละครั้ง')}${opt('every', 'ทุกครั้งที่บันทึก')}</select>
      <p class="hint">ไฟล์ <b>pnj-raasu-backup-วันที่.json</b> (รวมข้อมูล PI/Phlebitis และเมนู) ควรคัดลอกไปเก็บที่อื่นเป็นระยะ เช่น Google Drive</p>
      ${FOLDER ? `<p class="hint">📁 ที่เก็บไฟล์สำรอง: <b>${E(FOLDER.label)}</b><br>ไฟล์ของวันเดียวกันจะเขียนทับกัน และเก็บไว้ล่าสุด ${KEEP} ไฟล์</p>` : '<p class="hint">📁 ยังไม่ได้เลือกโฟลเดอร์ — ตอนนี้ไฟล์จะดาวน์โหลดไปที่ <b>Downloads</b></p>'}
      ${canFolder() ? `<button class="btn alt" data-pi="pickdir">📁 ${FOLDER ? 'เปลี่ยน' : 'เลือก'}ที่เก็บไฟล์สำรอง</button>${FOLDER ? '<button class="btn alt" data-pi="cleardir">เลิกใช้โฟลเดอร์ (กลับไปดาวน์โหลด)</button>' : ''}
      <p class="hint">กดแล้วเลือกที่เก็บ (เช่น Documents) แอพจะสร้างโฟลเดอร์ <b>${FOLDER_NAME}</b> ให้เอง แล้วสำรองลงโฟลเดอร์นี้อัตโนมัติ (Android อาจไม่ให้เลือก Downloads โดยตรง)</p>` : '<p class="hint">เครื่อง/เบราว์เซอร์นี้ไม่รองรับการเลือกโฟลเดอร์ (เช่น iPhone/iPad) จึงใช้การดาวน์โหลดแทน</p>'}
      <p class="hint">สำรองล่าสุด: ${lb ? new Date(lb).toLocaleString('th-TH') : 'ยังไม่เคย'}</p>
      <button class="btn alt" data-pi="backup">⬇️ สำรองตอนนี้</button>
      <p class="hint">กู้คืน: ปุ่ม ⚙️ มุมขวาบน › นำเข้าไฟล์สำรอง</p></div>`;
  }
  function refBox(arr, round) {
    return arr.map((a, ix) => `<div><svg viewBox="0 0 100 56"><rect width="100" height="56" rx="8" fill="#f1e4d6"/>${round
      ? `<circle cx="50" cy="28" r="${10 + ix * 4}" fill="${a[1]}"/>`
      : `<rect x="8" y="22" width="84" height="12" rx="6" fill="#d9b8a0"/><rect x="20" y="20" width="${14 + ix * 14}" height="16" rx="6" fill="${a[1]}"/>`}</svg><b style="color:var(--${round ? 'pi' : 'ph'})">${a[0]}</b>${a[2]}</div>`).join('');
  }
  function refHTML() {
    const up = (k, t) => { const c = k === 'pi' ? 'pi' : 'ph'; return `<div class="pi-card" style="border-left:6px solid var(--${c})"><b style="color:var(--${c})">${t}</b>
      <img class="pi-up" src="${IMG[k] || 'ref-' + k + '.jpg'}" alt="${t}"><div class="pi-lb" style="margin-top:8px">${IMG[k] ? 'เปลี่ยนรูป' : 'รูปมาตรฐานของแอพ — อัปโหลดรูปของหน่วยงานเพื่อเปลี่ยนได้'}</div>
      <input type="file" accept="image/*" data-pi="file" data-k="${k}">${IMG[k] ? `<button class="btn alt sm" style="margin-top:8px" data-pi="delimg" data-k="${k}">ลบรูป</button>` : ''}</div>`; };
    return up('pi', 'ภาพแผลกดทับ (PI)') + `<div class="pi-card" style="border-left:6px solid var(--pi)"><b style="color:var(--pi)">ประเภทแผลกดทับ</b><ul class="pi-defs"><li><b>PI</b> แผลกดทับ — เกรด Stage 1, 2, 3, 4, Unstageable, DTI</li><li><b>MDRPI</b> แผลกดทับที่เกี่ยวข้องกับอุปกรณ์ทางการแพทย์</li><li><b>MMPI</b> แผลกดทับที่เยื่อบุผิว</li><li><b>MARSI</b> การบาดเจ็บของผิวหนังจากการใช้อุปกรณ์ยึดติดทางการแพทย์</li><li><b>IAD</b> ผิวหนังอักเสบจากการสัมผัสสิ่งขับถ่าย — Cat 1, Cat 2</li></ul></div>`
      + up('ph', 'ระดับ Phlebitis') + `<div class="pi-card" style="border-left:6px solid var(--ph)"><b style="color:var(--ph)">แผนภาพย่อ ระดับ Phlebitis</b><div class="pi-ref">${refBox(REF_PH, false)}</div></div>`;
  }
  const MS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const addM = (m, n) => { const [y, mm] = m.split('-').map(Number), d = new Date(y, mm - 1 + n, 1); return d.getFullYear() + '-' + p2(d.getMonth() + 1); };
  const mLabel = m => { const [y, mm] = m.split('-'); return MS[+mm - 1] + ' ' + String(+y + 543).slice(2); };
  function anaHTML() {
    const m = repMonth || monthOf(S.date), opt = (v, l) => `<option value="${v}"${anaRange === v ? ' selected' : ''}>${l}</option>`;
    return `<div class="pi-card"><div class="pi-noprint pi-ana-ctl"><div><div class="pi-lb">สิ้นสุดเดือน</div><input type="month" class="pi-in" id="piAMonth" data-pi="amonth" value="${E(m)}"></div>
      <div><div class="pi-lb">ช่วงวิเคราะห์</div><select class="pi-in" id="piARange" data-pi="arange">${opt(1, '1 เดือน')}${opt(3, '3 เดือน')}${opt(6, '6 เดือน')}${opt(12, '12 เดือน')}</select></div></div>
      <h2 class="pi-ptitle" id="piAT"></h2><div id="piAna"><div class="empty" style="padding:24px 0">กำลังวิเคราะห์…</div></div>
      <button class="btn pi-noprint" data-pi="print" style="margin-top:12px">🖨️ ส่งออกเป็น PDF</button></div>`;
  }
  async function fillAna() {
    const inp = q('#piAMonth'); if (!inp) return;
    const m = inp.value || monthOf(S.date), n = anaRange, tok = ++RTOK; repMonth = m;
    const curM = Array.from({ length: n }, (_, i) => addM(m, i - n + 1)), prevM = Array.from({ length: n }, (_, i) => addM(m, i - 2 * n + 1));
    const load = async ms => Promise.all(ms.map(loadMonth));
    const [cl, pl] = await Promise.all([load(curM), load(prevM)]); if (tok !== RTOK || !q('#piAna')) return;
    const cur = PIS.analyze(cl.flat()), prev = PIS.analyze(pl.flat());
    let byBucket, every, trendLabel, perMonth = null;
    if (n === 1) {
      const [y, mm] = m.split('-').map(Number), days = new Date(y, mm, 0).getDate();
      byBucket = Array.from({ length: days }, (_, i) => { const d = m + '-' + p2(i + 1), on = k => new Set(cur.items.filter(x => x.date === d && x.kind === k).map(x => x.hn)).size; return { l: String(i + 1), pi: on('pi'), ph: on('ph') }; });
      every = 5; trendLabel = 'รายวัน (จำนวนผู้ป่วยที่พบ)';
    } else {
      perMonth = curM.map((mo, i) => ({ l: mLabel(mo), a: PIS.analyze(cl[i]) }));
      byBucket = perMonth.map(x => ({ l: x.l.split(' ')[0], pi: x.a.pi.pts, ph: x.a.ph.pts })); every = n > 6 ? 2 : 1; trendLabel = 'รายเดือน (จำนวนผู้ป่วยที่พบ)';
    }
    q('#piAT').textContent = 'วิเคราะห์สถิติ ' + (n === 1 ? 'เดือน' + MN[+m.split('-')[1] - 1] + ' ' + (+m.split('-')[0] + 543) : mLabel(curM[0]) + ' – ' + mLabel(m));
    q('#piAna').innerHTML = PIS.html(cur, prev, { byBucket, every, trendLabel, perMonth, prevLabel: n === 1 ? mLabel(prevM[0]) : mLabel(prevM[0]) + ' – ' + mLabel(prevM[n - 1]) });
  }
  const body = () => sub === 'ana' ? anaHTML() : sub === 'rep' ? repHTML() : sub === 'ref' ? refHTML() : formHTML();
  function drawBody() { const b = q('#piBody'); if (b) b.innerHTML = body(); if (sub === 'rep') fillReport(); else if (sub === 'ana') fillAna(); }

  function homeHTML() {
    const chip = (s, l) => `<button type="button" class="${sub === s ? 'on' : ''}" data-pi="sub" data-s="${s}">${l}</button>`;
    const chips = `<div class="cats pi-subs pi-noprint">${chip('form', '📝 บันทึก')}${chip('rep', '📊 รายงาน')}${chip('ana', '📈 วิเคราะห์')}${chip('ref', '🖼️ รูปอ้างอิง')}</div>`;
    return `<section class="hello small pi-noprint"><div class="ht"><h2 class="pi-h2"><span class="gt">ประเมิน PI / Phlebitis</span></h2><p class="pi-sub"><b style="color:var(--pi)">แผลกดทับ</b> • <b style="color:var(--ph)">หลอดเลือดดำอักเสบ</b></p></div><div class="art"><img src="brain-nurse.svg" alt=""></div></section>${chips}<div id="piBody">${body()}</div>`;
  }
  function after() { if (sub === 'rep') fillReport(); else if (sub === 'ana') fillAna(); }

  async function fillReport() {
    const inp = q('#piMonth'); if (!inp) return;
    const m = inp.value || monthOf(S.date), tok = ++RTOK; repMonth = m;
    let rows = await loadMonth(m); if (tok !== RTOK || !q('#piTable')) return;
    const key = r => r.date + String(mins(r.time)).padStart(4, '0') + r.hn;
    rows = rows.slice().sort((a, b) => key(a).localeCompare(key(b)));
    const [y, mm] = m.split('-');
    q('#piPT').textContent = 'รายงานติดตามแผลกดทับและ Phlebitis เดือน' + (MN[+mm - 1] || '') + ' ' + (+y + 543);
    const hs = new Set(rows.map(r => r.hn)), pi = new Set(rows.filter(r => r.pa === 'มี' || r.ps === 'มี').map(r => r.hn)), ph = new Set(rows.filter(r => r.ha === 'มี' || r.hs === 'มี').map(r => r.hn));
    q('#piStat').innerHTML = `<span>บันทึก ${rows.length}</span><span>ผู้ป่วย ${hs.size} ราย</span><span class="sp">พบ PI ${pi.size} ราย</span><span class="sh">พบ Phlebitis ${ph.size} ราย</span>`;
    const cell = (v, d) => v === 'มี' ? '<b>มี</b>' + (d ? ' (' + E(d) + ')' : '') : (v || '-');
    const tmS = tm => tm ? ' <span class="pi-tm">' + E(tm) + ' น.</span>' : '';
    const newS = (on, tm) => on ? ' <span class="pi-new">' + (on === true || on === 'เพิ่มใหม่' ? 'ใหม่' : E(on)) + (tm ? ' ' + E(tm) : '') + '</span>' : '';
    // แรกรับ: เวลาที่พบ (ข้อมูลเก่าที่เคยเลือก "เพิ่มใหม่" ที่แถวแรกรับ ยังแสดงเป็น ใหม่)
    const tr = r => r ? '<div class="pi-tr">รักษา: ' + E(r) + '</div>' : '';
    const cellA = (v, d, tm, kd, ktm, c, r) => v === 'มี' ? '<b>มี</b>' + tmS(tm) + newS(kd === 'เพิ่มใหม่', ktm) + (d ? ' (' + E(d) + ')' : '') + cs(c) + tr(r) : (v || '-');
    const cs = c => c ? ' <span class="pi-cs">' + E(c) + '</span>' : '';
    const cellS = (v, d, nw, tm, c, r) => v === 'มี' ? '<b>มี</b>' + newS(nw, tm) + (d ? ' (' + E(d) + ')' : '') + cs(c) + tr(r) : (v || '-');
    q('#piTable').innerHTML = rows.length ? `<table class="pi-t"><tr><th>วันที่</th><th>น.</th><th>HN</th><th class="tp">PI แรกรับ</th><th class="tp">PI ขณะนอน/ใหม่</th><th class="tq">Ph แรกรับ</th><th class="tq">Ph ขณะนอน/ใหม่</th><th class="pi-noprint"></th></tr>`
      + rows.map(r => `<tr><td>${r.date.split('-').reverse().join('/')}</td><td>${E(r.time)}</td><td>${E(r.hn)}</td><td class="cp">${cellA(r.pa, r.pad, r.pat, r.pk, r.ptm, '', r.paR)}</td><td class="cp">${cellS(r.ps, r.psd, r.pnw, r.pst, '', r.psR)}</td><td class="cq">${cellA(r.ha, r.had, r.hat, r.hk, r.htm, r.hac, r.haR)}</td><td class="cq">${cellS(r.hs, r.hsd, r.hnw, r.hst, r.hsc, r.hsR)}</td><td class="pi-noprint"><button class="pi-x" data-pi="del" data-id="${E(r.id)}" data-m="${m}">ลบ</button></td></tr>`).join('') + '</table>'
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
      const g = k[0];
      if (p[k] !== 'มี') { p[k + 'Rl'] = []; p[k + 'Rc'] = ''; p[k + 'R'] = ''; if (g === 'h') { p[k + 'cS'] = ''; p[k + 'c'] = ''; } p[k + 'T'] = ''; p[k + 'd'] = ''; p[k + 'L'] = ''; p[k + 'P'] = ''; if (k === 'pa' || k === 'ha') p[g + 'at'] = ''; else { p[g + 'nw'] = ''; p[g + 'st'] = ''; } }
      if ((k === 'pa' || k === 'ps') && p[k] === 'มี' && !p[k + 'T']) { p[k + 'T'] = 'PI'; p[k + 'd'] = composeP(p, k); }
      saveDraft(); drawBody();
    }
    else if (a === 'ptype') {
      const p = S.p[+d.i], k = d.k; p[k + 'T'] = d.v;
      if (!(PI_GRADE[d.v] || []).includes(p[k + 'L'])) p[k + 'L'] = '';
      p[k + 'd'] = composeP(p, k); saveDraft(); drawBody();
    }
    else if (a === 'treat') {
      const p = S.p[+d.i], k = d.k, l = (p[k + 'Rl'] || []).slice(), x = l.indexOf(d.v);
      if (x >= 0) l.splice(x, 1); else l.push(d.v);
      p[k + 'Rl'] = l; if (!l.includes('กำหนดเอง')) p[k + 'Rc'] = ''; p[k + 'R'] = treatText(p, k); saveDraft(); drawBody();
    }
    else if (a === 'cause') {
      const p = S.p[+d.i], k = d.k;
      if (p[k + 'cS'] === d.v) { p[k + 'cS'] = ''; p[k + 'c'] = ''; } else { p[k + 'cS'] = d.v; p[k + 'c'] = d.v === 'กำหนดเอง' ? '' : d.v; }
      saveDraft(); drawBody();
    }
    else if (a === 'view') { viewImg(d.k); }
    else if (a === 'kind') {
      const p = S.p[+d.i], k = d.k, g = k[0];
      if (p[g + 'nw'] === d.v) { p[g + 'nw'] = ''; p[g + 'st'] = ''; }
      else { p[g + 'nw'] = d.v; p[g + 'st'] = p[g + 'st'] || nowHM(); }
      saveDraft(); drawBody();
    }
    else if (a === 'ctimeon') { S.time = (typeof S.time === 'string' && S.time) ? '' : nowHM(); saveDraft(); drawBody(); }
    else if (a === 'save') {
      if (!S.time) return say('เลือกเวลาที่ประเมินก่อน');
      const ps = S.p.filter(p => p.hn.trim());
      if (!ps.length) return say('ยังไม่ได้ใส่ HN');
      const miss = ps.filter(p => !(p.pa && p.ps && p.ha && p.hs));
      if (miss.length && !confirm('HN ' + miss.map(p => p.hn.trim()).join(', ') + ' ยังเลือกไม่ครบทุกข้อ บันทึกเลยหรือไม่?')) return;
      const recs = ps.map(p => { const r = { date: S.date, time: S.time, hn: p.hn }; FIELDS.forEach(k => r[k] = p[k] || ''); return cleanRec(r); }).filter(Boolean);
      await saveRecords(recs);
      const bk = await autoBackup();
      say('บันทึกแล้ว ' + recs.length + ' คน ✓' + (bk === 'folder' ? ' • สำรองลงโฟลเดอร์แล้ว' : bk ? ' • สำรองไฟล์ลงเครื่องแล้ว (Downloads)' : ' (กด “ล้างฟอร์ม” เพื่อเริ่มชุดใหม่)')); drawBody();
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
    else if (a === 'backup') { const how = await exportData(); say(how === 'folder' ? 'สำรองลงโฟลเดอร์แล้ว ✓' : 'ดาวน์โหลดไฟล์สำรองแล้ว'); drawBody(); }
    else if (a === 'pickdir') { pickFolder(); }
    else if (a === 'cleardir') { if (confirm('เลิกใช้โฟลเดอร์สำรอง? (ไฟล์ที่สำรองไว้แล้วไม่ถูกลบ)')) clearFolder(); }
  });
  document.addEventListener('input', e => {
    const t = e.target; if (!t.dataset || !t.dataset.pi) return;
    if (t.dataset.pi === 'date') { S.date = t.value; saveDraft(); }
    else if (t.dataset.pi === 'hn') { S.p[+t.dataset.i].hn = t.value; saveDraft(); }
    else if (t.dataset.pi === 'ktime') { S.p[+t.dataset.i][t.dataset.k] = t.value; saveDraft(); }
    else if (t.dataset.pi === 'ctime') { S.time = HM.test(t.value) ? t.value : ''; saveDraft(); }
    else if (t.dataset.pi === 'rc') { const p = S.p[+t.dataset.i], k = t.dataset.k; p[k + 'Rc'] = t.value; p[k + 'R'] = treatText(p, k); saveDraft(); }
    else if (t.dataset.pi === 'det') { S.p[+t.dataset.i][t.dataset.k] = t.value; saveDraft(); }
  });
  document.addEventListener('change', e => {
    const t = e.target; if (!t.dataset || !t.dataset.pi) return;
    const a = t.dataset.pi;
    if (a === 'sel') {
      const p = S.p[+t.dataset.i], k = t.dataset.k; p[k + t.dataset.w] = t.value;
      const loc = (p[k + 'P'] || '').startsWith('อื่นๆ') ? '' : p[k + 'P'];
      p[k + 'd'] = k[0] === 'p' ? composeP(p, k) : [p[k + 'L'], loc].filter(Boolean).join('/'); saveDraft(); drawBody();
      if ((p[k + 'P'] || '').startsWith('อื่นๆ')) { const x = q(`input[data-pi="det"][data-i="${t.dataset.i}"][data-k="${k}d"]`); if (x) x.focus(); }
    }
    else if (a === 'month') { repMonth = t.value; fillReport(); }
    else if (a === 'amonth') { if (t.value) { repMonth = t.value; fillAna(); } }
    else if (a === 'arange') { anaRange = +t.value || 1; fillAna(); }
    else if (a === 'autoon') { const c = autoCfg(); c.on = t.checked; setAuto(c); say(c.on ? 'เปิดสำรองอัตโนมัติ' : 'ปิดสำรองอัตโนมัติ'); }
    else if (a === 'automode') { const c = autoCfg(); c.mode = t.value; setAuto(c); say('ตั้งความถี่แล้ว'); }
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

  return { homeHTML, after, exportObj, importObj, writeBackup, home() { sub = 'form'; } };
})();
