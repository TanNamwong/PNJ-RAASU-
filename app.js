'use strict';
const APP_VERSION = '1.9.0';
const KEY = 'pnj_raasu_v1';
const ICONS = ['🌡️','❄️','🧊','🩸','💉','🛡️','📋','❤️','🛏️','💧','🩺','💊','🩹','🧰','🔬','🧪','🦷','🫁','🧠','🚑','🧼','🧴','🏥','⭐','👑','🏆','📅','📝','📊','🔔'];
const THEMES = {
  green:['#dff3e6','#2e9e5b'], blue:['#dcecff','#2f7fd6'], yellow:['#fff3c8','#d9a400'],
  orange:['#ffe4d3','#e8743b'], navy:['#dfe6f6','#1c3a7a']
};
const iconInline = i => String(i || '').split('|').join('');
function iconTile(i, cls = '') { const [p, s] = String(i || '📋').split('|'); return `<span class="tile ${cls}">${esc(p)}${s ? `<span class="b2">${esc(s)}</span>` : ''}</span>`; }
function mixHex(h, p) { const n = parseInt(h.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * (1 - p) + 255 * p)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); }
function colorOf(m) { const acc = /^#[0-9a-f]{6}$/i.test(m.color || '') ? m.color : (THEMES[m.theme] || THEMES.green)[1]; return [mixHex(acc, .86), acc]; }
const seg = s => window.Intl && Intl.Segmenter ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].map(x => x.segment) : Array.from(s);
const $ = (s, e = document) => e.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PALETTE = ['#1e9d57','#2f80d6','#1c3a7a','#00a3a3','#7b5cd6','#c2479b','#e8553b','#e8743b','#d99a00','#5d7a86','#8a5a3c','#d64545'];
const CATS = {
  'การแพทย์': ['🌡️','🩺','💉','💊','🩸','🩹','🩻','🦠','🧬','🔬','🧪','🧫','🏥','🚑','⚕️','🧑‍⚕️','👩‍⚕️','👨‍⚕️','🩼','♿','🛏️','😷','🧤','🧼','🧴','🚿','🚽','🧯'],
  'ร่างกาย': ['🫀','🫁','🧠','🦴','🦷','👁️','👂','👃','🦵','🦶','🤒','🤕','🤧','🥵','🥶','🤰','👶','🧒','🧓','👪','🙋','🫶','💪','🧎'],
  'อุปกรณ์/สถานที่': ['❄️','🧊','🥶','💧','🩸','🛡️','🧰','📟','🔦','⏱️','⚖️','🗑️','♻️','🔋','💡','🌡️','🚰','🧹','🔒','🔑','🏢','🏨','🚪','🛗','🩺','📡','🔔','⏰'],
  'เอกสาร': ['📋','📝','📄','📑','📂','🗂️','📁','🗒️','📊','📈','📉','📅','🗓️','✅','☑️','✔️','📌','📎','🔖','🖊️','✏️','🖨️','💻','📱','🔗','🌐','📤','📥'],
  'สัญลักษณ์': ['⭐','🌟','✨','🏆','👑','🎯','⚠️','🚨','❗','❓','💚','❤️','💙','💛','🟢','🔴','🟡','🔵','📣','📢','🎖️','🥇','🎓','📚','🔍','⚡','🔥','🌈']
};
const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- storage ---------- */
function defaults() {
  return {
    menus: [
      { id: 'm1', name: 'บันทึกอุณหภูมิตู้เย็น', url: '', icon: '🌡️|❄️', color: '#2f80d6' },
      { id: 'm2', name: 'บันทึก PI Phlebitis', url: '', icon: '💉|🩸', color: '#e8553b' },
      { id: 'm3', name: 'บันทึกประจำวัน IC', url: '', icon: '🛡️|🦠', color: '#d99a00' }
    ],
    guides: [
      { id: 'g1', name: 'ใส่สาย PICC Line', sub: 'สายสวนหลอดเลือดดำส่วนกลาง', url: '', wi: '', eq: [], cat: 'หลอดเลือดและหัวใจ', icon: '💉|🫀', color: '#c2479b' },
      { id: 'g2', name: 'เจาะน้ำในช่องท้อง', sub: 'Abdominal Paracentesis', url: '', wi: '', eq: [], cat: 'เจาะ/ดูดสิ่งคัดหลั่ง', icon: '🩺|💧', color: '#2f80d6' },
      { id: 'g3', name: 'เจาะน้ำเยื่อหุ้มปอด', sub: 'Thoracocentesis', url: '', wi: '', eq: [], cat: 'ทรวงอกและปอด', icon: '🫁|💧', color: '#00a3a3' },
      { id: 'g4', name: 'เจาะไขกระดูก', sub: 'Bone Marrow Aspiration', url: '', wi: '', eq: [], cat: 'เจาะ/ดูดสิ่งคัดหลั่ง', icon: '🦴|💉', color: '#d99a00' },
      { id: 'g5', name: 'เจาะน้ำไขสันหลัง', sub: 'Lumbar Puncture', url: '', wi: '', eq: [], cat: 'เจาะ/ดูดสิ่งคัดหลั่ง', icon: '🧠|💧', color: '#7b5cd6' },
      { id: 'g6', name: 'ใส่สายวัดความดันหลอดเลือดแดง', sub: 'Arterial Line', url: '', wi: '', eq: [], cat: 'หลอดเลือดและหัวใจ', icon: '❤️|📈', color: '#e8553b' },
      { id: 'g7', name: 'เจาะน้ำในข้อเข่า', sub: 'Arthrocentesis', url: '', wi: '', eq: [], cat: 'เจาะ/ดูดสิ่งคัดหลั่ง', icon: '🦵|💉', color: '#1e9d57' },
      { id: 'g8', name: 'ใส่สายระบายทรวงอก', sub: 'Intercostal Drainage: ICD', url: '', wi: '', eq: [], cat: 'ทรวงอกและปอด', icon: '🫁|🚰', color: '#1c3a7a' },
      { id: 'g9', name: 'เปลี่ยนน้ำยาล้างไตทางช่องท้อง', sub: 'Peritoneal Dialysis', url: '', wi: '', eq: [], cat: 'ไตและทางเดินปัสสาวะ', icon: '🧴|🔄', color: '#8a5a3c' },
      { id: 'g10', name: 'สวนล้างกระเพาะปัสสาวะ', sub: 'Bladder Irrigation', url: '', wi: '', eq: [], cat: 'ไตและทางเดินปัสสาวะ', icon: '🚽|💧', color: '#e8743b' },
      { id: 'g11', name: 'สวนล้างกระเพาะอาหาร', sub: 'Gastric Lavage', url: '', wi: '', eq: [], cat: 'ทางเดินอาหาร', icon: '🥤|💧', color: '#5d7a86' }
    ],
    gcats: ['หลอดเลือดและหัวใจ', 'เจาะ/ดูดสิ่งคัดหลั่ง', 'ทรวงอกและปอด', 'ไตและทางเดินปัสสาวะ', 'ทางเดินอาหาร'],
    phones: [],
    depts: ['ห้องฉุกเฉิน', 'พยาบาล/หอผู้ป่วย', 'โภชนาการ', 'เวรเปล', 'รปภ.', 'ช่าง/ซ่อมบำรุง', 'เภสัช', 'ห้องปฏิบัติการ', 'สำนักงาน/IT'],
    favs: [], history: [], notify: false, dismissInstall: 0
  };
}
let db = load();
function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r && Array.isArray(r.menus)) {
      const up = { m1: ['🌡️', '🌡️|❄️'], m2: ['🩸', '💉|🩸'], m3: ['🛡️', '🛡️|🦠'] };
      r.menus.forEach(m => { if (up[m.id] && m.icon === up[m.id][0]) m.icon = up[m.id][1]; });
      const GC = {"g1": "หลอดเลือดและหัวใจ", "g6": "หลอดเลือดและหัวใจ", "g2": "เจาะ/ดูดสิ่งคัดหลั่ง", "g4": "เจาะ/ดูดสิ่งคัดหลั่ง", "g5": "เจาะ/ดูดสิ่งคัดหลั่ง", "g7": "เจาะ/ดูดสิ่งคัดหลั่ง", "g3": "ทรวงอกและปอด", "g8": "ทรวงอกและปอด", "g9": "ไตและทางเดินปัสสาวะ", "g10": "ไตและทางเดินปัสสาวะ", "g11": "ทางเดินอาหาร"};
      if (Array.isArray(r.guides)) r.guides.forEach(g => { if (g.cat === undefined) g.cat = GC[g.id] || ''; });
      return Object.assign(defaults(), r);
    }
  } catch (e) {}
  return defaults();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('บันทึกข้อมูลในเครื่องไม่ได้'); } }

/* ---------- helpers ---------- */
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); }
function normUrl(u) {
  u = (u || '').trim(); if (!u) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (e) { return null; }
}
const fmt = t => new Date(t).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ---------- views ---------- */
const nurseHTML = alt => `<span class="nurse"><img class="base" src="nurse-base.png" alt="${esc(alt || '')}"><img class="hand" src="nurse-hand.png" alt=""><img class="snd" src="nurse-sound.png" alt=""></span>`;
let tab = 'home';
function setTab(t) {
  tab = t; col = t === 'guide' ? 'guides' : 'menus';
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  render(); scrollTo(0, 0);
}
const density = (n, g) => n <= 4 ? 1 : n <= (g ? 16 : 9) ? 2 : 3;
const allMenus = () => [...db.menus, ...db.guides];
let col = 'menus', phoneQ = ''; // ยิ่งมีเมนูมาก การ์ดยิ่งเล็กลงอัตโนมัติ
const isGuide = m => db.guides.some(x => x.id === m.id);
function cardHTML(m) {
  const th = colorOf(m), fav = db.favs.includes(m.id), g = isGuide(m);
  const ok = g ? !!(m.eq && m.eq.length) : !!m.url;
  const label = ok ? 'พร้อมใช้งาน' : (g ? 'ยังไม่มีข้อมูล' : 'ยังไม่ตั้งลิงก์');
  const a = g ? `<a class="card-link" href="#" data-guide="${m.id}">`
    : `<a class="card-link" href="${m.url ? esc(m.url) : '#'}" target="_blank" rel="noopener noreferrer" data-open="${m.id}">`;
  return `<div class="card" style="--tint:${th[0]};--acc:${th[1]}">
    ${a}
      ${iconTile(m.icon)}
      <span class="name">${esc(m.name)}</span>${m.sub ? `<span class="sub">${esc(m.sub)}</span>` : ''}
      <span class="row"><span class="st ${ok ? 'ok' : 'no'}">${label}</span><span class="go">›</span></span>
    </a>
    <button class="star ${fav ? 'on' : ''}" data-fav="${m.id}" aria-label="รายการโปรด">${fav ? '★' : '☆'}</button>
  </div>`;
}
let guideCat = '';
const gcatCount = c => db.guides.filter(g => (g.cat || '') === c).length;
function gcatChips() {
  const c = (v, label, n) => `<button type="button" data-gc="${esc(v)}" class="${guideCat === v ? 'on' : ''}">${esc(label)} <small>${n}</small></button>`;
  const none = db.guides.filter(g => !(g.cat || '') || !db.gcats.includes(g.cat)).length;
  return c('', 'ทั้งหมด', db.guides.length) + db.gcats.map(x => c(x, x, gcatCount(x))).join('') + (none && db.gcats.length ? c('__none', 'ไม่ระบุหมวด', none) : '') + `<button type="button" class="mg" data-gcm>⚙ จัดการหมวดหมู่</button>`;
}
function guideListHTML() {
  const d = density(db.guides.length + 1, true);
  const addCard = `<button class="card add" data-act="add"><span><span class="plus">+</span>เพิ่มหัตถการ</span></button>`;
  const known = new Set(db.gcats);
  const inGroup = (g, c) => c === '__none' ? (!(g.cat || '') || !known.has(g.cat)) : (g.cat || '') === c;
  if (guideCat) {
    const l = db.guides.filter(g => inGroup(g, guideCat));
    return `<div class="grid" data-d="${d}">${l.map(cardHTML).join('')}${addCard}</div>`;
  }
  const groups = [...db.gcats, '__none'].map(c => ({ c, l: db.guides.filter(g => inGroup(g, c)) })).filter(g => g.l.length);
  if (!groups.length || (groups.length === 1 && groups[0].c === '__none')) return `<div class="grid" data-d="${d}">${db.guides.map(cardHTML).join('')}${addCard}</div>`;
  return groups.map(g => `<h4 class="grp">📂 ${g.c === '__none' ? 'ไม่ระบุหมวดหมู่' : esc(g.c)} <small>${g.l.length}</small></h4><div class="grid" data-d="${d}">${g.l.map(cardHTML).join('')}</div>`).join('')
    + `<div class="grid" data-d="${d}" style="margin-top:14px">${addCard}</div>`;
}
function render() {
  const v = $('#view');
  if (tab === 'home') {
    v.innerHTML = `<section class="hello"><div class="ht"><h2><span class="gt">สวัสดี</span> <span class="wave">👋</span></h2><p class="chip">✨ เลือกเมนูเอกสาร<br>ที่ต้องการได้เลย</p></div><div class="art"><img src="brain-nurse.svg" alt="">${nurseHTML()}</div></section>
      <div class="grid" data-d="${density(db.menus.length + 1, false)}">${db.menus.map(cardHTML).join('')}
        <button class="card add" data-act="add"><span><span class="plus">+</span>เพิ่มลิงก์ใหม่</span></button></div>`;
  } else if (tab === 'guide') {
    v.innerHTML = `<section class="hello small"><div class="ht"><h2>📖 คู่มือ</h2><p>เตรียมอุปกรณ์ทำหัตถการ</p></div><div class="art"><img src="brain-nurse.svg" alt=""></div></section>
      <h3 class="sec">รายการหัตถการต่างๆ</h3>
      <div id="gcats" class="cats pd">${gcatChips()}</div>
      <div id="glist">${guideListHTML()}</div>`;
  } else if (tab === 'phone') {
    v.innerHTML = phoneHTML();
  } else if (tab === 'favs') {
    const l = allMenus().filter(m => db.favs.includes(m.id));
    v.innerHTML = l.length ? `<h3 class="sec">⭐ รายการโปรด</h3><div class="grid" data-d="${density(l.length)}">${l.map(cardHTML).join('')}</div>`
      : `<div class="empty"><b>⭐</b>ยังไม่มีรายการโปรด<br>กดดาวที่มุมการ์ดในหน้าหลักเพื่อเพิ่ม</div>`;
  } else if (tab === 'history') {
    v.innerHTML = db.history.length ? `<h3 class="sec">🕘 ประวัติการเปิด</h3><div class="list">${db.history.map((h, i) =>
      `<a class="item" href="${esc(h.url)}" target="_blank" rel="noopener noreferrer" data-hist="${i}"><span class="i">${iconInline(h.icon)}</span>
       <span class="t"><b>${esc(h.name)}</b><small>${fmt(h.t)}</small></span><span>›</span></a>`).join('')}</div>
       <button class="btn warn" style="margin-top:14px" data-act="clearhist">ล้างประวัติ</button>`
      : `<div class="empty"><b>🕘</b>ยังไม่มีประวัติการเปิดลิงก์</div>`;
  } else {
    v.innerHTML = aboutHTML();
  }
}
function aboutHTML() {
  const inst = isStandalone()
    ? '<p class="hint">✅ ติดตั้งแล้ว (กำลังใช้งานในโหมดแอพ)</p>'
    : '<button class="btn gold" data-act="install">📲 ติดตั้งแอพลงหน้าจอหลัก</button>';
  return `<div class="dev"><div class="stage">${nurseHTML('นายแทน นามวงค์')}</div>
      <div class="role">ผู้พัฒนาแอพ</div><h4>นายแทน นามวงค์</h4>
      <p>PNJ RAASU • Smart Link, Smart Care</p></div>
    <h3 class="sec">เกี่ยวกับแอพ</h3>
    <div class="list"><div class="item" style="display:block">
      <div class="ver"><span>เวอร์ชัน</span><b id="verNow">${APP_VERSION}</b></div>
      <div class="ver"><span>สถานะ</span><b id="verState">${lastState}</b></div></div></div>
    <div style="margin-top:12px">${inst}
      <button class="btn alt" data-act="checkupdate">🔄 ตรวจสอบอัพเดท</button></div>
    <p class="hint" style="margin-top:14px">ข้อมูลเมนูและประวัติเก็บในเครื่องนี้เท่านั้น สำรอง/ย้ายเครื่องได้ที่ ⚙️ จัดการเมนู</p>`;
}

/* ---------- sheets ---------- */
function openSheet(title, body, onClose) {
  closeSheet();
  const ov = document.createElement('div'); ov.className = 'ov';
  ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><header><button data-close aria-label="ปิด">‹</button><span>${esc(title)}</span></header><div class="body">${body}</div></div>`;
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('[data-close]')) { closeSheet(); } });
  $('#sheetRoot').appendChild(ov);
  return ov;
}
function closeSheet() { $('#sheetRoot').innerHTML = ''; }

function guideSheet(id) {
  const m = db.guides.find(x => x.id === id); if (!m) return;
  const eq = m.eq || [];
  const ov = openSheet(m.name, `
    ${m.sub ? `<p class="hint">${esc(m.sub)}</p>` : ''}
    <div class="wi ${m.wi ? '' : 'no'}">📄 อ้างอิง WI เลขที่ <b>${m.wi ? esc(m.wi) : 'ยังไม่ระบุ'}</b></div>
    <h3 class="sec">🧰 อุปกรณ์ที่ต้องเตรียม</h3>
    ${eq.length ? `<div class="list">${eq.map((r, i) => `<div class="item eq"><span class="n">${i + 1}</span>
      <span class="t"><b>${esc(r.n)}</b>${r.f ? `<small>สำหรับ ${esc(r.f)}</small>` : ''}</span><span class="qty">${esc(r.q || '-')}</span></div>`).join('')}</div>`
      : '<div class="empty"><b>🧰</b>ยังไม่มีข้อมูลอุปกรณ์</div>'}
    <button class="btn alt" style="margin-top:14px" data-gedit>✎ แก้ไขข้อมูล</button>`);
  ov.addEventListener('click', e => { if (e.target.closest('[data-gedit]')) editSheet(m.id); });
}
function manageSheet() {
  const ms = db[col], showList = tab !== 'phone';
  const ov = openSheet(col === 'guides' ? 'จัดการคู่มือ' : 'จัดการเมนู', (showList ? `
    <div class="list">${ms.map((m, i) => `<div class="item"><span class="i">${iconInline(m.icon)}</span>
      <span class="t"><b>${esc(m.name)}</b><small>${col === 'guides' ? ((m.cat ? esc(m.cat) + ' · ' : '') + (m.wi ? 'WI ' + esc(m.wi) + ' · ' : '') + ((m.eq || []).length ? (m.eq.length + ' รายการอุปกรณ์') : 'ยังไม่มีข้อมูล')) : (m.url ? esc(m.url) : 'ยังไม่ตั้งลิงก์')}</small></span>
      <button class="ib" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="เลื่อนขึ้น">↑</button>
      <button class="ib" data-down="${i}" ${i === ms.length - 1 ? 'disabled' : ''} aria-label="เลื่อนลง">↓</button>
      <button class="ib" data-edit="${m.id}" aria-label="แก้ไข">✎</button>
      <button class="ib del" data-del="${m.id}" aria-label="ลบ">🗑</button></div>`).join('') || '<div class="empty">ยังไม่มีเมนู</div>'}</div>
    <button class="btn" style="margin-top:14px" data-add>${col === 'guides' ? '＋ เพิ่มหัตถการ' : '＋ เพิ่มลิงก์ใหม่'}</button>` : '') + `
    <h3 class="sec">การแจ้งเตือน</h3>
    <div class="sw"><span>แจ้งเตือนเมื่อมีเวอร์ชันใหม่<br><small class="hint">iPhone ต้องติดตั้งแอพลงหน้าจอหลักก่อน (iOS 16.4+)</small></span><input type="checkbox" id="swNotify" ${db.notify ? 'checked' : ''}></div>
    <h3 class="sec">สำรองข้อมูล</h3>
    <button class="btn alt" data-export>⬇️ ส่งออกไฟล์สำรอง</button>
    <button class="btn alt" data-import>⬆️ นำเข้าไฟล์สำรอง</button>
    <input type="file" id="fileImp" accept="application/json,.json" hidden>
    <button class="btn warn" data-reset>คืนค่าเริ่มต้น</button>`);
  ov.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    const d = t.dataset;
    if (d.up !== undefined) { move(+d.up, -1); }
    else if (d.down !== undefined) { move(+d.down, 1); }
    else if (d.edit) editSheet(d.edit);
    else if (d.del !== undefined && d.del) {
      const m = db[col].find(x => x.id === d.del);
      if (m && confirm(`ลบเมนู "${m.name}" ?`)) { db[col] = db[col].filter(x => x.id !== m.id); db.favs = db.favs.filter(x => x !== m.id); save(); manageSheet(); render(); }
    }
    else if (d.add !== undefined) editSheet();
    else if (d.export !== undefined) exportData();
    else if (d.import !== undefined) $('#fileImp').click();
    else if (d.reset !== undefined) { if (confirm('คืนค่าทั้งหมดเป็นค่าเริ่มต้น? (ลิงก์ ข้อมูลคู่มือ และเบอร์โทรที่ตั้งไว้จะหาย)')) { const n = db.notify; db = defaults(); db.notify = n; save(); closeSheet(); render(); toast('คืนค่าแล้ว'); } }
  });
  $('#fileImp', ov).addEventListener('change', importData);
  $('#swNotify', ov).addEventListener('change', async e => {
    if (e.target.checked) {
      if (!('Notification' in window)) { toast('อุปกรณ์นี้ไม่รองรับการแจ้งเตือน'); e.target.checked = false; return; }
      const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (p !== 'granted') { toast('ไม่ได้รับอนุญาตให้แจ้งเตือน'); e.target.checked = false; return; }
    }
    db.notify = e.target.checked; save(); toast(db.notify ? 'เปิดแจ้งเตือนแล้ว' : 'ปิดแจ้งเตือนแล้ว');
  });
}
function move(i, d) {
  const j = i + d; if (j < 0 || j >= db[col].length) return;
  [db[col][i], db[col][j]] = [db[col][j], db[col][i]]; save(); manageSheet(); render();
}
function editSheet(id) {
  const old = allMenus().find(m => m.id === id);
  const isG = old ? isGuide(old) : col === 'guides';
  const m = old ? { ...old } : { name: '', url: '', icon: '📋', color: '#1e9d57' };
  let eq = (m.eq || []).map(r => ({ n: r.n || '', q: r.q || '', f: r.f || '' }));
  if (isG && !eq.length) eq.push({ n: '', q: '', f: '' });
  if (!/^#[0-9a-f]{6}$/i.test(m.color || '')) m.color = colorOf(m)[1];
  let [i1, i2] = String(m.icon || '📋').split('|'); i2 = i2 || '';
  let slot = 1, cat = Object.keys(CATS)[0];
  const ov = openSheet(isG ? (old ? 'แก้ไขหัตถการ' : 'เพิ่มหัตถการ') : (old ? 'แก้ไขลิงก์' : 'เพิ่มลิงก์ใหม่'), `
    <div id="pv" class="pvbox"></div>
    <label class="f" for="fName">${isG ? '🩺 ชื่อหัตถการ' : '🔗 ชื่อเมนู'}</label><input type="text" id="fName" maxlength="60" placeholder="เช่น บันทึกอุณหภูมิตู้เย็น" value="${esc(m.name)}">
    <label class="f" for="fSub">📝 คำอธิบายสั้น (ไม่บังคับ)</label><input type="text" id="fSub" maxlength="60" placeholder="เช่น ชื่อภาษาอังกฤษ" value="${esc(m.sub || '')}">
    ${isG ? `<label class="f">📂 หมวดหมู่</label><div id="gCats" class="cats wrapc"></div>
    <input type="text" id="gNewCat" maxlength="40" placeholder="หรือพิมพ์ชื่อหมวดหมู่ใหม่ (จะเพิ่มในรายการให้)">
    <label class="f" for="fWi">📄 อ้างอิง WI เลขที่</label><input type="text" id="fWi" maxlength="40" placeholder="เช่น WI-NS-001" value="${esc(m.wi || '')}">
    <label class="f">🧰 อุปกรณ์ที่ต้องเตรียม</label><div id="eqRows"></div>
    <button type="button" class="btn alt" data-eqadd>＋ เพิ่มอุปกรณ์</button>` : `<label class="f" for="fUrl">🌐 ลิงก์ (URL)</label><input type="url" id="fUrl" inputmode="url" autocapitalize="off" autocorrect="off" placeholder="https://..." value="${esc(m.url)}">`}
    <label class="f">เลือกไอคอน</label>
    <div id="slot" class="slotbar"></div>
    <div id="cats" class="cats"></div>
    <div id="grid" class="icons"></div>
    <input type="text" id="fEmoji" class="emo" placeholder="หรือพิมพ์/วางอีโมจิจากคีย์บอร์ดได้เลย 😀">
    <label class="f">สีเมนู</label>
    <div id="sw" class="colors"></div>
    <label class="pick"><input type="color" id="fColor" value="${m.color}"><span>🎨 เลือกสีเอง</span></label>
    <div class="err" id="fErr"></div>
    <button class="btn" id="fSave">✔ บันทึก</button>`);
  const paint = () => {
    const [tint, acc] = colorOf(m), ic = i2 ? i1 + '|' + i2 : i1;
    $('#pv', ov).innerHTML = `<div class="card" style="--tint:${tint};--acc:${acc};width:150px;margin:0 auto;min-height:0"><div class="card-link" style="min-height:0;align-items:center;text-align:center;padding:16px 12px">${iconTile(ic, 'big')}<span class="name" style="text-align:center">${esc($('#fName', ov).value || 'ตัวอย่างเมนู')}</span></div></div>`;
    $('#slot', ov).innerHTML = `<button data-slot="1" class="${slot === 1 ? 'on' : ''}">ไอคอนหลัก ${esc(i1)}</button><button data-slot="2" class="${slot === 2 ? 'on' : ''}">ไอคอนเสริม ${i2 ? esc(i2) : '＋'}</button>${i2 ? '<button data-slot="x" class="clr">ล้างเสริม</button>' : ''}`;
    $('#cats', ov).innerHTML = Object.keys(CATS).map(c => `<button data-cat="${c}" class="${c === cat ? 'on' : ''}">${c}</button>`).join('');
    $('#grid', ov).innerHTML = CATS[cat].map(e => `<button type="button" data-e="${e}" class="${e === (slot === 1 ? i1 : i2) ? 'on' : ''}">${e}</button>`).join('');
    $('#sw', ov).innerHTML = PALETTE.map(c => `<button type="button" data-c="${c}" class="${c.toLowerCase() === m.color.toLowerCase() ? 'on' : ''}" style="background:${c}" aria-label="${c}"></button>`).join('');
  };
  if (isG && !old) m.cat = guideCat && guideCat !== '__none' ? guideCat : '';
  const paintC = () => {
    const box = $('#gCats', ov); if (!box) return;
    const c = (v, label) => `<button type="button" data-gs="${esc(v)}" class="${(m.cat || '') === v ? 'on' : ''}">${esc(label)}</button>`;
    const extra = m.cat && !db.gcats.includes(m.cat) ? [m.cat] : [];
    box.innerHTML = c('', 'ไม่ระบุ') + [...db.gcats, ...extra].map(x => c(x, x)).join('');
  };
  const paintEq = () => {
    const box = $('#eqRows', ov); if (!box) return;
    box.innerHTML = eq.map((r, i) => `<div class="eqrow"><div class="eqtop"><span class="n">${i + 1}</span>
      <input type="text" data-eq="n" data-i="${i}" maxlength="80" placeholder="ชื่ออุปกรณ์" value="${esc(r.n)}">
      <button type="button" class="ib del" data-eqdel="${i}" aria-label="ลบ">🗑</button></div>
      <div class="eqbot"><input type="text" data-eq="q" data-i="${i}" maxlength="20" placeholder="จำนวน" value="${esc(r.q)}">
      <input type="text" data-eq="f" data-i="${i}" maxlength="80" placeholder="สำหรับ (ใช้ทำอะไร)" value="${esc(r.f)}"></div></div>`).join('');
  };
  paint(); paintEq(); paintC();
  if ($('#gNewCat', ov)) $('#gNewCat', ov).addEventListener('input', e => { if (e.target.value.trim()) { m.cat = ''; paintC(); } });
  ov.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.eq) eq[+t.dataset.i][t.dataset.eq] = t.value; });
  $('#fName', ov).addEventListener('input', paint);
  $('#fColor', ov).addEventListener('input', e => { m.color = e.target.value; paint(); });
  $('#fEmoji', ov).addEventListener('input', e => {
    const g = seg(e.target.value.trim())[0]; if (!g) return;
    if (slot === 1) i1 = g; else i2 = g; e.target.value = ''; paint();
  });
  ov.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.gs !== undefined) { m.cat = d.gs; $('#gNewCat', ov).value = ''; paintC(); }
    else if (d.eqadd !== undefined) { eq.push({ n: '', q: '', f: '' }); paintEq(); const ins = ov.querySelectorAll('[data-eq="n"]'); ins[ins.length - 1]?.focus(); }
    else if (d.eqdel !== undefined) { eq.splice(+d.eqdel, 1); paintEq(); }
    else if (d.slot) { if (d.slot === 'x') { i2 = ''; slot = 1; } else slot = +d.slot; paint(); }
    else if (d.cat) { cat = d.cat; paint(); }
    else if (d.e) { if (slot === 1) i1 = d.e; else i2 = d.e; paint(); }
    else if (d.c) { m.color = d.c; $('#fColor', ov).value = d.c; paint(); }
    else if (b.id === 'fSave') {
      const name = $('#fName', ov).value.trim(), url = isG ? '' : normUrl($('#fUrl', ov).value);
      if (!name) { $('#fErr', ov).textContent = 'กรุณาใส่ชื่อเมนู'; return; }
      if (url === null) { $('#fErr', ov).textContent = 'ลิงก์ไม่ถูกต้อง (ต้องเป็น http หรือ https)'; return; }
      Object.assign(m, { name, url, sub: $('#fSub', ov).value.trim(), icon: i2 ? i1 + '|' + i2 : i1 }); delete m.theme;
      if (isG) { const nc = $('#gNewCat', ov).value.trim().slice(0, 40); if (nc) { m.cat = nc; if (!db.gcats.includes(nc)) db.gcats.push(nc); } m.cat = m.cat || ''; m.wi = $('#fWi', ov).value.trim(); m.eq = eq.map(r => ({ n: r.n.trim(), q: r.q.trim(), f: r.f.trim() })).filter(r => r.n); }
      if (old) { delete old.theme; Object.assign(old, m); } else db[col].push({ ...m, id: uid() });
      save(); closeSheet(); render(); toast('บันทึกแล้ว');
    }
  });
  if (!old) setTimeout(() => $('#fName', ov).focus(), 50);
}
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'PNJ RAASU', menus: db.menus, guides: db.guides, gcats: db.gcats, phones: db.phones, depts: db.depts, favs: db.favs }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pnj-raasu-backup.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function importData(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      if (!Array.isArray(j.menus)) throw 0;
      const clean = l => (Array.isArray(l) ? l : []).filter(m => m && m.name).map(m => ({
        id: String(m.id || uid()), name: String(m.name).slice(0, 60), sub: String(m.sub || '').slice(0, 60),
        icon: typeof m.icon === 'string' && m.icon.length <= 24 ? m.icon : '📋',
        color: /^#[0-9a-f]{6}$/i.test(m.color || '') ? m.color : colorOf(m)[1], url: normUrl(m.url) || '',
        wi: String(m.wi || '').slice(0, 40), cat: String(m.cat || '').slice(0, 40),
        eq: (Array.isArray(m.eq) ? m.eq : []).filter(r => r && r.n).map(r => ({ n: String(r.n).slice(0, 80), q: String(r.q || '').slice(0, 20), f: String(r.f || '').slice(0, 80) }))
      }));
      db.menus = clean(j.menus);
      if (Array.isArray(j.guides)) db.guides = clean(j.guides);
      if (Array.isArray(j.phones)) db.phones = j.phones.filter(p => p && p.name && p.num).map(p => ({ id: String(p.id || uid()), name: String(p.name).slice(0, 60), num: String(p.num).slice(0, 40), note: String(p.note || '').slice(0, 60), icon: String(p.icon || '📞').slice(0, 8), dept: String(p.dept || '').slice(0, 40) }));
      if (Array.isArray(j.gcats)) db.gcats = [...new Set(j.gcats.map(d => String(d).trim().slice(0, 40)).filter(Boolean))];
      db.guides.forEach(g => { if (g.cat && !db.gcats.includes(g.cat)) db.gcats.push(g.cat); });
      if (Array.isArray(j.depts)) db.depts = [...new Set(j.depts.map(d => String(d).trim().slice(0, 40)).filter(Boolean))];
      db.phones.forEach(p => { if (p.dept && !db.depts.includes(p.dept)) db.depts.push(p.dept); });
      db.favs = (j.favs || []).filter(x => allMenus().some(m => m.id === x));
      save(); closeSheet(); render(); toast('นำเข้าข้อมูลแล้ว');
    } catch (x) { toast('ไฟล์สำรองไม่ถูกต้อง'); }
  };
  r.readAsText(f);
}

/* ---------- phone ---------- */
const PCATS = {
  'ฉุกเฉิน': ['🚨','🚑','🆘','⚡','🔥','🫀','🩸','🧯','☎️','📟','⚠️','🏥'],
  'พยาบาล': ['💉','💧','👩‍⚕️','👨‍⚕️','🩺','💊','🩹','🌡️','🧤','😷','🛏️','🩼'],
  'แผนก': ['🏥','🫀','🫁','🧠','🦴','🦷','👁️','👂','🤰','👶','🧒','🧓','🩻','🧬','🔬','🧪','🧫','💊','🩸','♿','🧖','🚿','🧘','🦠'],
  'โภชนาการ': ['🍽️','🥗','🍚','🥣','🍎','🥛','🥤','🍞','🥄','🍳','🛒','🧂'],
  'เวรเปล/รปภ.': ['🛏️','♿','🚪','🛗','🚶','🧳','🚐','🛡️','👮','💂','🚓','🔒','🔑','📹','🔦','🚧'],
  'ช่าง': ['🔧','🛠️','🧰','⚙️','🔌','💡','🔋','❄️','🚰','🚽','🔥','🧱','🪜','🧹','🗑️','♻️','🚗','🚚'],
  'สำนักงาน': ['💻','🖥️','🖨️','📠','📋','🗂️','📅','💰','🧾','👥','📚','📢','🧼','🧺','📞','🏢']
};
const PICONS = Object.values(PCATS).flat();
const telOf = n => String(n).replace(/[^\d+*#,;]/g, '');
let phoneDept = '';
const deptCount = d => db.phones.filter(p => (p.dept || '') === d).length;
function deptChips() {
  const c = (v, label, n) => `<button type="button" data-pd="${esc(v)}" class="${phoneDept === v ? 'on' : ''}">${esc(label)}${n !== undefined ? ` <small>${n}</small>` : ''}</button>`;
  return c('', 'ทั้งหมด', db.phones.length) + db.depts.map(d => c(d, d, deptCount(d))).join('') + `<button type="button" class="mg" data-pdm>⚙ จัดการหน่วยงาน</button>`;
}
function phoneRow(p) {
  return `<div class="item"><span class="av">${esc(p.icon || '📞')}</span>
    <span class="t"><b>${esc(p.name)}</b><small>${esc(p.num)}${p.note ? ' · ' + esc(p.note) : ''}</small></span>
    <button class="ib" data-pedit="${p.id}" aria-label="แก้ไข">✎</button>
    <a class="callbtn" href="tel:${esc(telOf(p.num))}" aria-label="โทร ${esc(p.name)}">📞</a></div>`;
}
function phoneItems() {
  const q = phoneQ.trim().toLowerCase();
  const l = db.phones.filter(p => (!phoneDept || (p.dept || '') === phoneDept) && (!q || (p.name + ' ' + p.num + ' ' + (p.note || '') + ' ' + (p.dept || '')).toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name, 'th'));
  if (!db.phones.length) return '<div class="empty"><b>📞</b>ยังไม่มีเบอร์โทร<br>กด ＋ เพื่อเพิ่มเบอร์ภายใน/เบอร์ติดต่อที่ใช้บ่อย</div>';
  if (!l.length) return '<div class="empty"><b>🔍</b>ไม่พบรายการที่ค้นหา</div>';
  if (phoneDept) return `<div class="list">${l.map(phoneRow).join('')}</div>`;
  const known = new Set(db.depts), groups = [...db.depts, ...new Set(l.map(p => p.dept || '').filter(d => d && !known.has(d))), ''];
  return groups.map(d => {
    const g = l.filter(p => (p.dept || '') === d); if (!g.length) return '';
    return `<h4 class="grp">🏷 ${d ? esc(d) : 'ไม่ระบุหน่วยงาน'} <small>${g.length}</small></h4><div class="list">${g.map(phoneRow).join('')}</div>`;
  }).join('');
}
function phoneHTML() {
  return `<h3 class="sec">📞 สมุดโทรศัพท์</h3>
    <div class="pbar"><input type="search" id="pq" placeholder="ค้นหาชื่อ / เบอร์ / หน่วยงาน" value="${esc(phoneQ)}" autocomplete="off"><button class="padd" data-padd aria-label="เพิ่มเบอร์">＋</button></div>
    <div id="pdepts" class="cats pd">${deptChips()}</div>
    <div id="plist">${phoneItems()}</div>`;
}
function listManager(cfg) {
  const L = () => db[cfg.key], items = () => db[cfg.itemKey];
  const cnt = n => items().filter(x => (x[cfg.field] || '') === n).length;
  const ov = openSheet(cfg.title, `
    <div class="list">${L().map((d, i) => `<div class="item"><span class="t"><b>${esc(d)}</b><small>${cnt(d)} ${cfg.unit}</small></span>
      <button class="ib" data-dup="${i}" ${i === 0 ? 'disabled' : ''} aria-label="เลื่อนขึ้น">↑</button>
      <button class="ib" data-ddown="${i}" ${i === L().length - 1 ? 'disabled' : ''} aria-label="เลื่อนลง">↓</button>
      <button class="ib" data-dren="${i}" aria-label="เปลี่ยนชื่อ">✎</button>
      <button class="ib del" data-ddel="${i}" aria-label="ลบ">🗑</button></div>`).join('') || '<div class="empty">ยังไม่มีรายการ</div>'}</div>
    <label class="f" for="dNew">＋ ${cfg.addLabel}</label>
    <input type="text" id="dNew" maxlength="40" placeholder="${cfg.placeholder}">
    <div class="err" id="dErr"></div>
    <button class="btn" data-dadd>＋ เพิ่ม</button>`);
  const done = () => { save(); listManager(cfg); cfg.refresh(); };
  ov.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.dup !== undefined || d.ddown !== undefined) {
      const i = +(d.dup ?? d.ddown), j = i + (d.dup !== undefined ? -1 : 1);
      if (j >= 0 && j < L().length) { [L()[i], L()[j]] = [L()[j], L()[i]]; done(); }
    } else if (d.dren !== undefined) {
      const old = L()[+d.dren], n = (prompt('ชื่อใหม่', old) || '').trim().slice(0, 40);
      if (!n || n === old) return;
      if (L().includes(n)) { toast('มีชื่อนี้อยู่แล้ว'); return; }
      L()[+d.dren] = n; items().forEach(p => { if (p[cfg.field] === old) p[cfg.field] = n; }); cfg.renamed(old, n); done();
    } else if (d.ddel !== undefined) {
      const old = L()[+d.ddel];
      if (confirm(`ลบ "${old}" ?\n(${cfg.unit}ในนี้จะกลายเป็น "ไม่ระบุ" ไม่ถูกลบ)`)) {
        L().splice(+d.ddel, 1); items().forEach(p => { if (p[cfg.field] === old) p[cfg.field] = ''; }); cfg.renamed(old, ''); done();
      }
    } else if (d.dadd !== undefined) {
      const n = $('#dNew', ov).value.trim();
      if (!n) { $('#dErr', ov).textContent = 'กรุณาใส่ชื่อ'; return; }
      if (L().includes(n)) { $('#dErr', ov).textContent = 'มีชื่อนี้อยู่แล้ว'; return; }
      L().push(n); done(); toast('เพิ่มแล้ว');
    }
  });
}
const deptSheet = () => listManager({ title: 'จัดการหน่วยงาน', key: 'depts', itemKey: 'phones', field: 'dept', unit: 'เบอร์', addLabel: 'เพิ่มหน่วยงานใหม่', placeholder: 'เช่น ห้องผ่าตัด, ไอซียู',
  renamed: (o, n) => { if (phoneDept === o) phoneDept = n; }, refresh: () => { if (tab === 'phone') render(); } });
const gcatSheet = () => listManager({ title: 'จัดการหมวดหมู่คู่มือ', key: 'gcats', itemKey: 'guides', field: 'cat', unit: 'หัตถการ', addLabel: 'เพิ่มหมวดหมู่ใหม่', placeholder: 'เช่น ระบบประสาท, แผลและการพันแผล',
  renamed: (o, n) => { if (guideCat === o) guideCat = n; }, refresh: () => { if (tab === 'guide') render(); } });
document.addEventListener('input', e => { if (e.target.id === 'pq') { phoneQ = e.target.value; $('#plist').innerHTML = phoneItems(); } });
function phoneSheet(id) {
  const old = db.phones.find(p => p.id === id);
  const p = old ? { ...old } : { name: '', num: '', note: '', icon: '📞', dept: phoneDept };
  const ov = openSheet(old ? 'แก้ไขเบอร์โทร' : 'เพิ่มเบอร์โทร', `
    <label class="f" for="pName">👤 ชื่อ / แผนก</label><input type="text" id="pName" maxlength="60" placeholder="เช่น ห้องฉุกเฉิน, คุณหมอสมชาย" value="${esc(p.name)}">
    <label class="f" for="pNum">📞 เบอร์โทร</label><input type="text" id="pNum" inputmode="tel" maxlength="40" placeholder="เช่น 1234 หรือ 02-123-4567" value="${esc(p.num)}">
    <label class="f">🏷 หน่วยงาน</label><div id="pDepts" class="cats wrapc"></div>
    <input type="text" id="pNewDept" maxlength="40" placeholder="หรือพิมพ์ชื่อหน่วยงานใหม่ (จะเพิ่มในรายการให้)">
    <label class="f" for="pNote">📝 หมายเหตุ (ไม่บังคับ)</label><input type="text" id="pNote" maxlength="60" placeholder="เช่น ตึก A ชั้น 3" value="${esc(p.note || '')}">
    <label class="f">ไอคอน <span id="pCur" style="font-size:22px;vertical-align:middle"></span></label>
    <div id="pCats" class="cats"></div><div class="icons" id="pIcons"></div>
    <input type="text" id="pEmoji" class="emo" placeholder="หรือพิมพ์/วางอีโมจิจากคีย์บอร์ดได้เลย 😀">
    <div class="err" id="pErr"></div>
    <button class="btn" id="pSave">✔ บันทึก</button>${old ? '<button class="btn warn" id="pDel">🗑 ลบเบอร์นี้</button>' : ''}`);
  let pcat = Object.keys(PCATS).find(c => PCATS[c].includes(p.icon)) || Object.keys(PCATS)[0];
  const paintP = () => {
    $('#pCur', ov).textContent = p.icon;
    $('#pCats', ov).innerHTML = Object.keys(PCATS).map(c => `<button type="button" data-pc="${c}" class="${c === pcat ? 'on' : ''}">${c}</button>`).join('');
    $('#pIcons', ov).innerHTML = PCATS[pcat].map(i => `<button type="button" data-i="${i}" class="${i === p.icon ? 'on' : ''}">${i}</button>`).join('');
  };
  const paintD = () => {
    const c = (v, label) => `<button type="button" data-ds="${esc(v)}" class="${(p.dept || '') === v ? 'on' : ''}">${esc(label)}</button>`;
    const extra = p.dept && !db.depts.includes(p.dept) ? [p.dept] : [];
    $('#pDepts', ov).innerHTML = c('', 'ไม่ระบุ') + [...db.depts, ...extra].map(d => c(d, d)).join('');
  };
  paintD(); paintP();
  $('#pNewDept', ov).addEventListener('input', e => { if (e.target.value.trim()) { p.dept = ''; paintD(); } });
  $('#pEmoji', ov).addEventListener('input', e => { const g = seg(e.target.value.trim())[0]; if (!g) return; p.icon = g; e.target.value = ''; paintP(); });
  ov.addEventListener('click', e => {
    const ds = e.target.closest('[data-ds]');
    if (ds) { p.dept = ds.dataset.ds; $('#pNewDept', ov).value = ''; paintD(); }
    const pc = e.target.closest('[data-pc]');
    if (pc) { pcat = pc.dataset.pc; paintP(); }
    const i = e.target.closest('[data-i]');
    if (i) { p.icon = i.dataset.i; paintP(); }
    if (e.target.closest('#pDel')) { if (confirm(`ลบ "${old.name}" ?`)) { db.phones = db.phones.filter(x => x.id !== old.id); save(); closeSheet(); render(); toast('ลบแล้ว'); } }
    if (e.target.closest('#pSave')) {
      const name = $('#pName', ov).value.trim(), num = $('#pNum', ov).value.trim();
      if (!name) { $('#pErr', ov).textContent = 'กรุณาใส่ชื่อ'; return; }
      if (!telOf(num)) { $('#pErr', ov).textContent = 'กรุณาใส่เบอร์โทร'; return; }
      const nd = $('#pNewDept', ov).value.trim().slice(0, 40); if (nd) { p.dept = nd; if (!db.depts.includes(nd)) db.depts.push(nd); }
      Object.assign(p, { name, num, note: $('#pNote', ov).value.trim(), dept: p.dept || '' });
      if (old) Object.assign(old, p); else db.phones.push({ ...p, id: uid() });
      save(); closeSheet(); render(); toast('บันทึกแล้ว');
    }
  });
  if (!old) setTimeout(() => $('#pName', ov).focus(), 50);
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const gd = e.target.closest('[data-guide]');
  if (gd) { e.preventDefault(); guideSheet(gd.dataset.guide); return; }
  const open = e.target.closest('[data-open]');
  if (open) {
    const m = allMenus().find(x => x.id === open.dataset.open);
    if (!m) return;
    if (!m.url) { e.preventDefault(); editSheet(m.id); toast('ตั้งลิงก์ก่อนใช้งาน'); return; }
    db.history.unshift({ name: m.name, url: m.url, icon: m.icon, t: Date.now() });
    db.history = db.history.slice(0, 100); save();
    return; // ปล่อยให้ <a target=_blank> ทำงานตามปกติ (ใช้ได้ทั้ง iOS/Android)
  }
  const hist = e.target.closest('[data-hist]');
  if (hist) { const h = db.history[+hist.dataset.hist]; if (h) { db.history.unshift({ ...h, t: Date.now() }); db.history = db.history.slice(0, 100); save(); } return; }
  const fav = e.target.closest('[data-fav]');
  if (fav) {
    const id = fav.dataset.fav, i = db.favs.indexOf(id);
    if (i < 0) db.favs.push(id); else db.favs.splice(i, 1);
    save(); render(); toast(i < 0 ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว'); return;
  }
  const gc = e.target.closest('[data-gc]');
  if (gc) { guideCat = gc.dataset.gc; $('#gcats').innerHTML = gcatChips(); $('#glist').innerHTML = guideListHTML(); return; }
  if (e.target.closest('[data-gcm]')) return gcatSheet();
  const pd = e.target.closest('[data-pd]');
  if (pd) { phoneDept = pd.dataset.pd; $('#pdepts').innerHTML = deptChips(); $('#plist').innerHTML = phoneItems(); return; }
  if (e.target.closest('[data-pdm]')) return deptSheet();
  const pe = e.target.closest('[data-pedit]'); if (pe) return phoneSheet(pe.dataset.pedit);
  if (e.target.closest('[data-padd]')) return phoneSheet();
  const tb = e.target.closest('#tabs button'); if (tb) return setTab(tb.dataset.tab);
  if (e.target.closest('#btnManage')) return manageSheet();
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'add') editSheet();
  else if (act === 'clearhist') { if (confirm('ล้างประวัติทั้งหมด?')) { db.history = []; save(); render(); } }
  else if (act === 'install') doInstall();
  else if (act === 'checkupdate') checkUpdate(true);
});

/* ---------- banners ---------- */
function banner(id, cls, html, onClick) {
  removeBanner(id);
  const d = document.createElement('div'); d.className = 'bn ' + cls; d.id = 'bn-' + id;
  d.innerHTML = html; $('#banners').appendChild(d);
  d.addEventListener('click', e => { const b = e.target.closest('button'); if (b) onClick(b.dataset.b, d); });
}
function removeBanner(id) { $('#bn-' + id)?.remove(); }

/* ---------- install ---------- */
let deferredPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; showInstallBanner(); });
addEventListener('appinstalled', () => { deferredPrompt = null; removeBanner('install'); toast('ติดตั้งแอพเรียบร้อย 🎉'); if (tab === 'about') render(); });
function showInstallBanner() {
  if (isStandalone() || Date.now() - db.dismissInstall < 7 * 864e5) return;
  banner('install', '', `<span style="font-size:28px">📲</span><div class="tx"><b>ติดตั้ง PNJ RAASU</b>เปิดใช้งานได้เร็ว เหมือนแอพบนหน้าจอหลัก</div>
    <button class="btn sm" data-b="go">ติดตั้ง</button><button class="x" data-b="x" aria-label="ปิด">×</button>`,
    b => { if (b === 'go') doInstall(); else { db.dismissInstall = Date.now(); save(); removeBanner('install'); } });
}
async function doInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    try { const r = await deferredPrompt.userChoice; if (r.outcome === 'accepted') removeBanner('install'); } catch (e) {}
    deferredPrompt = null; return;
  }
  const ios = isIOS();
  openSheet('วิธีติดตั้งแอพ', ios ? `
    <ol class="steps"><li>เปิดหน้านี้ใน <b>Safari</b></li><li>แตะปุ่ม <b>แชร์</b> (สี่เหลี่ยมมีลูกศรขึ้น ⬆️) ที่แถบด้านล่าง</li>
    <li>เลื่อนลงแล้วเลือก <b>“เพิ่มลงในหน้าจอโฮม”</b></li><li>แตะ <b>เพิ่ม</b> ที่มุมขวาบน</li></ol>
    <p class="hint">ต้องใช้ iOS 16.4 ขึ้นไปจึงจะได้รับการแจ้งเตือนอัพเดทแบบแจ้งเตือนระบบ</p>` : `
    <ol class="steps"><li>เปิดหน้านี้ใน <b>Chrome</b></li><li>แตะเมนู <b>⋮</b> มุมขวาบน</li>
    <li>เลือก <b>“ติดตั้งแอป”</b> หรือ <b>“เพิ่มลงในหน้าจอหลัก”</b></li></ol>
    <p class="hint">ถ้าไม่เห็นตัวเลือก ให้ตรวจสอบว่าเปิดผ่านลิงก์ https และยังไม่ได้ติดตั้งไว้</p>`);
}
if (isIOS() && !isStandalone()) setTimeout(() => {
  if (Date.now() - db.dismissInstall < 7 * 864e5) return;
  banner('install', '', `<span style="font-size:28px">📲</span><div class="tx"><b>ติดตั้ง PNJ RAASU</b>แตะแชร์ แล้วเลือก “เพิ่มลงในหน้าจอโฮม”</div>
    <button class="btn sm" data-b="go">วิธีทำ</button><button class="x" data-b="x" aria-label="ปิด">×</button>`,
    b => { if (b === 'go') doInstall(); else { db.dismissInstall = Date.now(); save(); removeBanner('install'); } });
}, 1800);

/* ---------- update ---------- */
let reg = null, notified = '';
let lastState = '—';
function setVerState(t) { lastState = t; const e = $('#verState'); if (e) e.textContent = t; }
async function checkUpdate(manual) {
  if (manual) setVerState('กำลังตรวจสอบ…');
  try {
    if (reg) reg.update().catch(() => {});
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    const j = await r.json();
    if (j.version && j.version !== APP_VERSION) { showUpdate(j); setVerState('มีเวอร์ชันใหม่ ' + j.version); }
    else { setVerState('เป็นเวอร์ชันล่าสุด ✔'); if (manual) toast('คุณใช้เวอร์ชันล่าสุดแล้ว'); }
  } catch (e) { setVerState('ตรวจสอบไม่ได้ (ออฟไลน์)'); if (manual) toast('ตรวจสอบไม่ได้ กรุณาเชื่อมต่ออินเทอร์เน็ต'); }
}
function showUpdate(info) {
  if ($('#bn-update')) return;
  banner('update', 'up', `<span style="font-size:28px">🔔</span><div class="tx"><b>มีเวอร์ชันใหม่${info?.version ? ' ' + esc(info.version) : ''}</b>${esc(info?.notes || 'กดอัพเดทเพื่อใช้งานเวอร์ชันล่าสุด')}</div>
    <button class="btn gold sm" data-b="go">อัพเดท</button><button class="x" data-b="x" aria-label="ปิด">×</button>`,
    b => { if (b === 'go') applyUpdate(); else removeBanner('update'); });
  if (db.notify && 'Notification' in window && Notification.permission === 'granted' && notified !== info?.version) {
    notified = info?.version;
    const opt = { body: 'มีเวอร์ชันใหม่ของ PNJ RAASU เปิดแอพเพื่ออัพเดท', icon: 'icon-192.png', badge: 'icon-192.png', tag: 'pnj-update' };
    (reg ? reg.showNotification('PNJ RAASU อัพเดท', opt) : Promise.resolve(new Notification('PNJ RAASU อัพเดท', opt))).catch(() => {});
  }
}
let reloading = false;
function applyUpdate() {
  toast('กำลังอัพเดท…');
  const reload = () => { if (reloading) return; reloading = true; location.reload(); };
  const hard = () => (window.caches ? caches.keys().then(k => Promise.all(k.map(x => caches.delete(x)))) : Promise.resolve())
    .then(() => reg ? reg.unregister() : 0).catch(() => {}).then(reload);
  if (!reg) return hard();
  const go = w => { navigator.serviceWorker.addEventListener('controllerchange', reload); w.postMessage('SKIP_WAITING'); };
  reg.update().catch(() => {}).then(() => {
    if (reg.waiting) return go(reg.waiting);
    const w = reg.installing;
    if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && reg.waiting) go(reg.waiting); });
  });
  setTimeout(hard, 8000); // เผื่อกรณี SW ค้าง
}
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', async () => {
    try {
      reg = await navigator.serviceWorker.register('sw.js');
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate({});
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate({}); });
      });
    } catch (e) { /* ใช้งานต่อได้ตามปกติ */ }
    checkUpdate(false);
    setInterval(() => checkUpdate(false), 30 * 60 * 1000);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(false); });
} else addEventListener('load', () => checkUpdate(false));

/* ---------- start ---------- */
const q = new URLSearchParams(location.search).get('tab');
setTab(['home', 'guide', 'phone', 'favs', 'history', 'about'].includes(q) ? q : 'home');
