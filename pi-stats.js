'use strict';
/* PNJ RAASU – วิเคราะห์สถิติ PI / Phlebitis (คำนวณในเครื่อง ไม่ส่งข้อมูลออกนอกเครื่อง)
   analyze(rows) → ตัวเลขสถิติ • html(cur, prev, meta) → หน้าจอวิเคราะห์ */
const PIS = (() => {
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SEVERE = ['Stage 3', 'Stage 4', 'Unstageable', 'DTI'];
  const SHIFTS = [['ดึก 00-08', 0, 8], ['เช้า 08-16', 8, 16], ['บ่าย 16-24', 16, 24]];
  const hourOf = t => { t = String(t); return t.includes(':') ? +t.slice(0, 2) + +t.slice(3, 5) / 60 : +t; };
  const shiftOf = t => { const h = hourOf(t); return SHIFTS.findIndex(s => h >= s[1] && h < s[2]); };
  const pct = (a, b) => b ? Math.round(a * 1000 / b) / 10 : 0;
  const rate = (a, b) => b ? Math.round(a * 10000 / b) / 10 : 0; // ต่อ 1000 วันนอน
  const uniq = a => [...new Set(a)];

  /* ---------- แปลงข้อความ เช่น "PI2/ก้นกบ" "IAD Cat 1/ก้น" "gr.2/แขนซ้าย" ---------- */
  function parsePI(d) {
    const s = String(d || '').trim(), parts = s.split('/'), tag = parts[0].trim();
    const m = tag.match(/^(MDRPI|MMPI|MARSI|IAD|PI)\s*(.*)$/i);
    if (!m) return { type: 'PI', grade: '', site: s };
    const type = m[1].toUpperCase(), rest = m[2].trim(), site = parts.slice(1).join('/').trim();
    let grade = '';
    if (/unstage/i.test(rest)) grade = 'Unstageable';
    else if (/dti/i.test(rest)) grade = 'DTI';
    else if (type === 'IAD') { const c = rest.match(/(\d)/); if (c) grade = 'Cat ' + c[1]; }
    else if (type === 'PI') { const c = rest.match(/(\d)/); if (c) grade = 'Stage ' + c[1]; }
    return { type, grade, site };
  }
  function parsePh(d) {
    const s = String(d || '').trim(), g = s.match(/gr\.?\s*(\d)/i);
    if (g) return { grade: 'gr.' + g[1], site: s.split('/').slice(1).join('/').trim() };
    return { grade: '', site: s };
  }
  const tokens = r => String(r || '').split(', ').map(x => x.trim()).filter(Boolean);

  /* ---------- คำนวณ ---------- */
  function analyze(rows) {
    const A = { rows: rows.length, pts: new Set(), pd: new Set(), items: [], byDay: {}, byHn: {} };
    rows.forEach(r => {
      A.pts.add(r.hn); A.pd.add(r.date + '|' + r.hn);
      const hn = r.hn, rec = (A.byHn[hn] = A.byHn[hn] || []); rec.push(r);
      const add = (kind, where, d, isNew, tm, treat, cause, kd) => {
        const x = kind === 'pi' ? parsePI(d) : parsePh(d);
        A.items.push({ kind, hn, where, isNew, kind2: kd || '', date: r.date, time: tm || r.time, row: r, type: x.type || '', grade: x.grade, site: x.site, treat: tokens(treat), cause: cause || '' });
      };
      if (r.pa === 'มี') add('pi', r.pk === 'เพิ่มใหม่' ? 'inp' : 'adm', r.pad, r.pk === 'เพิ่มใหม่', r.pk === 'เพิ่มใหม่' ? r.ptm : r.pat, r.paR);
      if (r.ps === 'มี') add('pi', 'inp', r.psd, !!r.pnw && r.pnw !== 'ตำแหน่งเดิม', r.pst, r.psR, '', r.pnw);
      if (r.ha === 'มี') add('ph', r.hk === 'เพิ่มใหม่' ? 'inp' : 'adm', r.had, r.hk === 'เพิ่มใหม่', r.hk === 'เพิ่มใหม่' ? r.htm : r.hat, r.haR, r.hac);
      if (r.hs === 'มี') add('ph', 'inp', r.hsd, !!r.hnw && r.hnw !== 'ตำแหน่งเดิม', r.hst, r.hsR, r.hsc, r.hnw);
    });
    const it = A.items, pi = it.filter(x => x.kind === 'pi'), ph = it.filter(x => x.kind === 'ph');
    const hnSet = a => new Set(a.map(x => x.hn));
    A.nPts = A.pts.size; A.nPd = A.pd.size;
    A.pi = { pts: hnSet(pi).size, adm: hnSet(pi.filter(x => x.where === 'adm')).size, inp: hnSet(pi.filter(x => x.where === 'inp')).size, nw: hnSet(pi.filter(x => x.isNew)).size, severe: hnSet(pi.filter(x => SEVERE.includes(x.grade))).size, severeNew: hnSet(pi.filter(x => x.isNew && SEVERE.includes(x.grade))).size };
    A.ph = { pts: hnSet(ph).size, adm: hnSet(ph.filter(x => x.where === 'adm')).size, inp: hnSet(ph.filter(x => x.where === 'inp')).size, nw: hnSet(ph.filter(x => x.isNew)).size, severe: hnSet(ph.filter(x => /gr\.[34]/.test(x.grade))).size };
    const kc = arr => { const m = { 'ครั้งแรก': 0, 'ตำแหน่งเดิม': 0, 'ตำแหน่งใหม่': 0 }; uniq(arr.filter(x => m[x.kind2] !== undefined).map(x => x.hn + '|' + x.kind2)).forEach(k => m[k.split('|')[1]]++); return m; };
    A.pi.kinds = kc(pi); A.ph.kinds = kc(ph);
    A.pi.prev = pct(A.pi.pts, A.nPts); A.pi.rate = rate(A.pi.nw, A.nPd);
    A.ph.prev = pct(A.ph.pts, A.nPts); A.ph.rate = rate(A.ph.nw, A.nPd);
    const dist = (arr, f) => { const m = {}; uniq(arr.map(x => f(x) ? x.hn + '|' + f(x) : '')).filter(Boolean).forEach(k => { const l = k.slice(k.indexOf('|') + 1); m[l] = (m[l] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    A.d = {
      piType: dist(pi, x => x.type), piGrade: dist(pi, x => x.grade ? (x.type === 'PI' || x.type === 'IAD' ? x.grade : x.type + ' ' + x.grade) : ''), piSite: dist(pi, x => x.site),
      phGrade: dist(ph, x => x.grade), phSite: dist(ph, x => x.site), phCause: dist(ph, x => x.cause),
      piTreat: (() => { const m = {}; uniq(pi.flatMap(x => x.treat.map(t => x.hn + '|' + t))).forEach(k => { const t = k.slice(k.indexOf('|') + 1); m[t] = (m[t] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); })(),
      phTreat: (() => { const m = {}; uniq(ph.flatMap(x => x.treat.map(t => x.hn + '|' + t))).forEach(k => { const t = k.slice(k.indexOf('|') + 1); m[t] = (m[t] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); })()
    };
    const shift = arr => { const c = [0, 0, 0]; uniq(arr.filter(x => x.isNew).map(x => x.hn + '|' + x.date + '|' + shiftOf(x.time))).forEach(k => { const s = +k.split('|')[2]; if (s >= 0) c[s]++; }); return c; };
    A.shiftPi = shift(pi); A.shiftPh = shift(ph);
    // คุณภาพข้อมูล
    A.q = {
      piNoGrade: hnSet(pi.filter(x => !x.grade && x.type !== 'MDRPI' && x.type !== 'MMPI' && x.type !== 'MARSI')).size,
      noSite: hnSet(it.filter(x => !x.site)).size,
      phNoCause: hnSet(ph.filter(x => !x.cause)).size,
      piNoTreat: hnSet(pi.filter(x => !x.treat.length)).size,
      phNoTreat: hnSet(ph.filter(x => !x.treat.length)).size
    };
    // ผู้ป่วยที่ควรติดตาม: ดูบันทึกล่าสุดของแต่ละ HN
    const key = r => r.date + String(Math.round(hourOf(r.time) * 60)).padStart(5, '0');
    A.follow = Object.entries(A.byHn).map(([hn, rs]) => {
      const last = rs.slice().sort((a, b) => key(b).localeCompare(key(a)))[0], li = it.filter(x => x.hn === hn && x.row === last);
      const tags = [];
      const lp = li.filter(x => x.kind === 'pi'), lh = li.filter(x => x.kind === 'ph');
      lp.forEach(x => { if (SEVERE.includes(x.grade)) tags.push(['r', 'PI รุนแรง ' + x.grade]); else if (x.isNew) tags.push(['y', 'PI ใหม่']); });
      lh.forEach(x => { if (/gr\.[34]/.test(x.grade)) tags.push(['r', 'Phlebitis ' + x.grade]); else if (x.isNew) tags.push(['y', 'Phlebitis ใหม่']); });
      if (lp.length && lh.length) tags.push(['y', 'พบทั้ง PI+Phlebitis']);
      return { hn, tags: tags.filter((t, i) => tags.findIndex(u => u[1] === t[1]) === i), last };
    }).filter(x => x.tags.length).sort((a, b) => b.tags.filter(t => t[0] === 'r').length - a.tags.filter(t => t[0] === 'r').length).slice(0, 20);
    return A;
  }

  /* ---------- ข้อเสนอแนะอัตโนมัติ (กฎอย่างง่าย) ---------- */
  const SITE_ADV = [
    [/ก้นกบ|สะโพก|ก้น|สะบัก|หลัง/, 'ส่วนหลัง/สะโพก: ทบทวนการพลิกตะแคงตามแผน (เช่น ทุก 2 ชม.), ลดการยกหัวเตียงสูงเกินจำเป็นเพื่อลดแรงเฉือน, พิจารณาที่นอนลดแรงกด'],
    [/ส้นเท้า|ตาตุ่ม/, 'ส้นเท้า/ตาตุ่ม: หนุนน่องให้ส้นเท้าลอย (offloading) และตรวจผิวทุกเวร'],
    [/ใบหู|จมูก|ปาก|ท้ายทอย/, 'ศีรษะ/ใบหน้า: ตรวจผิวใต้อุปกรณ์ (สาย O₂, ท่อ, ที่ยึด) ทุกเวร รองด้วยแผ่นโฟมและสลับตำแหน่งอุปกรณ์'],
    [/ข้อศอก|ข้อมือ/, 'ข้อศอก/ข้อมือ: ตรวจผิวใต้สายรัด/ที่ยึด/อุปกรณ์ตรึง ใช้แผ่นรอง'],
    [/ฝีเย็บ/, 'ฝีเย็บ: ดูแลความชื้นและสิ่งขับถ่าย (IAD) ทำความสะอาดทันทีและทา barrier']
  ];
  const TYPE_ADV = {
    MDRPI: 'MDRPI (จากอุปกรณ์): ตรวจผิวใต้อุปกรณ์ทุกเวรและทุกครั้งที่ปรับอุปกรณ์ รองด้วยแผ่นโฟม/เปลี่ยนตำแหน่งตามความเหมาะสม',
    MMPI: 'MMPI (เยื่อบุ): ตรวจเยื่อบุใต้ท่อ/สาย (ET, NG, O₂) ตรึงสายไม่ให้ดึงรั้ง และสลับตำแหน่งตามแนวปฏิบัติ',
    MARSI: 'MARSI (จากเทป/วัสดุยึดติด): ลดการใช้เทปกาว ใช้ barrier film ก่อนแปะ และลอกเทปช้าๆ ตามแนวขนานผิว',
    IAD: 'IAD (ผิวหนังอักเสบจากความชื้น): ทำความสะอาดหลังขับถ่ายทันที (cleanser ชนิดไม่ต้องล้างออก) แล้วทา barrier cream/spray'
  };
  const CAUSE_ADV = [
    [/labetalol|nicardipine|cordarone|amiodarone/i, 'ยากลุ่มที่ระคายเคืองหลอดเลือด (Labetalol/Nicardipine/Cordarone): ให้ผ่านหลอดเลือดเส้นใหญ่ตามข้อบ่งชี้, เจือจาง/ควบคุมอัตราตามข้อกำหนดยา, ปรึกษาเภสัชกรเรื่องการใช้ central line/PICC หากต้องให้ต่อเนื่อง'],
    [/kcl|potassium/i, 'KCl: เจือจางและควบคุมอัตราหยดตามข้อกำหนด, เลี่ยงหลอดเลือดเล็ก/ข้อพับ, ตรวจตำแหน่งแทงเข็มบ่อยขึ้น'],
    [/omeprazole/i, 'Omeprazole: ตรวจสอบการเจือจาง/อัตราการให้ตามเอกสารกำกับยา และล้างสายก่อน-หลังให้ยา'],
    [/contrast|contrart|สารทึบ/i, 'สารทึบรังสี: เลือกหลอดเลือดขนาดใหญ่ ยืนยันว่า IV ใช้งานได้ก่อนฉีด และเฝ้าระวังตำแหน่งหลังฉีด']
  ];
  const PHSITE_ADV = [[/ข้อพับ|หลังมือ/, 'ข้อพับ/หลังมือ เคลื่อนไหวมาก เสี่ยงสูงสำหรับยาที่ระคายเคือง — พิจารณาเลือกหลอดเลือดเส้นใหญ่/ตำแหน่งที่เคลื่อนไหวน้อยกว่า']];

  function insights(c, p, meta) {
    const L = [], add = (lv, t, adv) => L.push({ lv, t, adv: adv || [] });
    if (!c.rows) return L;
    const dlt = (a, b, unit) => b === undefined ? '' : a > b ? ` (เพิ่มขึ้นจากช่วงก่อน ${b}${unit})` : a < b ? ` (ลดลงจากช่วงก่อน ${b}${unit})` : ` (เท่ากับช่วงก่อน)`;
    const hasP = p && p.nPd;
    // แยกครั้งแรก / ตำแหน่งเดิม / ตำแหน่งใหม่ (ขณะนอน รพ.)
    [['แผลกดทับ', c.pi.kinds, 'pi'], ['Phlebitis', c.ph.kinds, 'ph']].forEach(([n, k, key]) => {
      const t = k['ครั้งแรก'] + k['ตำแหน่งเดิม'] + k['ตำแหน่งใหม่']; if (!t) return;
      const adv = [];
      if (k['ตำแหน่งเดิม']) adv.push(key === 'pi' ? 'พบที่ตำแหน่งเดิม: แผลเดิมอาจไม่ดีขึ้น/กลับเป็นซ้ำ — ทบทวนแผนการลดแรงกดและการรักษาแผลของผู้ป่วยกลุ่มนี้' : 'พบที่ตำแหน่งเดิม: ตรวจว่ายังใช้ตำแหน่ง/เส้นเลือดเดิมหรือไม่ และพิจารณาเปลี่ยนตำแหน่งให้ยา');
      if (k['ตำแหน่งใหม่']) adv.push(key === 'pi' ? 'พบที่ตำแหน่งใหม่: ตรวจผิวหนังทั้งตัวซ้ำ และทบทวนท่านอน/อุปกรณ์ที่อาจกดทับจุดใหม่' : 'พบที่ตำแหน่งใหม่: ทบทวนยา/สารที่ให้ และเทคนิคการแทงเข็มรอบใหม่');
      add(k['ตำแหน่งเดิม'] > k['ครั้งแรก'] + k['ตำแหน่งใหม่'] ? 'y' : 'g', `${n} ขณะนอน รพ. (รายผู้ป่วย): ครั้งแรก ${k['ครั้งแรก']} • ตำแหน่งเดิม ${k['ตำแหน่งเดิม']} • ตำแหน่งใหม่ ${k['ตำแหน่งใหม่']}`, adv);
    });
    // PI เกิดใหม่
    if (c.pi.nw) {
      const adv = ['ทบทวนการประเมินความเสี่ยง (เช่น Braden) และแผนป้องกันของผู้ป่วยรายนี้ซ้ำ'];
      const topT = c.d.piType.filter(x => TYPE_ADV[x[0]]); topT.forEach(x => adv.push(TYPE_ADV[x[0]]));
      add(c.pi.rate > (hasP ? p.pi.rate : 0) && hasP ? 'r' : 'y', `พบแผลกดทับเกิดใหม่ขณะนอน รพ. ${c.pi.nw} ราย (${c.pi.rate} ต่อ 1,000 วันนอน)${hasP ? dlt(c.pi.rate, p.pi.rate, '') : ''}`, adv);
    } else add('g', 'ไม่พบแผลกดทับเกิดใหม่ในช่วงนี้');
    if (c.pi.severeNew) add('r', `แผลกดทับรุนแรง (Stage 3-4 / Unstageable / DTI) ที่เกิดใหม่ ${c.pi.severeNew} ราย`, ['ควรทบทวนรายกรณี (เช่น RCA) และรายงานตามระบบอุบัติการณ์ของหน่วยงาน', 'แจ้งแพทย์/ทีมดูแลแผลเพื่อวางแผนรักษา']);
    else if (c.pi.severe) add('y', `พบแผลกดทับรุนแรง ${c.pi.severe} ราย (นับรวมที่มาจากแรกรับ)`, ['ติดตามระดับแผลต่อเนื่องและประสานทีมดูแลแผล']);
    // ตำแหน่ง PI
    const advSite = []; c.d.piSite.slice(0, 3).forEach(([s, n]) => { const m = SITE_ADV.find(a => a[0].test(s)); if (m && !advSite.includes(m[1])) advSite.push(m[1]); });
    if (c.d.piSite.length) add('y', `ตำแหน่งแผลกดทับที่พบบ่อย: ${c.d.piSite.slice(0, 3).map(x => x[0] + ' (' + x[1] + ' ราย)').join(', ')}`, advSite);
    // แรกรับ
    if (c.pi.pts && c.pi.adm) add('y', `แผลกดทับที่พบตั้งแต่แรกรับ ${c.pi.adm} จาก ${c.pi.pts} ราย (${pct(c.pi.adm, c.pi.pts)}%) — ไม่นับเป็นแผลที่เกิดใน รพ.`, ['บันทึกภาพ/ระดับแผลแรกรับให้ครบเพื่อแยกจากแผลที่เกิดใหม่', 'พิจารณาแจ้งหน่วยที่ส่งต่อผู้ป่วยหากพบบ่อย']);
    // Phlebitis
    if (c.ph.nw) {
      const adv = [], seenA = new Set();
      c.d.phCause.forEach(([cz]) => { const m = CAUSE_ADV.find(a => a[0].test(cz)); if (m && !seenA.has(m[1])) { seenA.add(m[1]); adv.push(m[1]); } });
      c.d.phSite.slice(0, 3).forEach(([s]) => { const m = PHSITE_ADV.find(a => a[0].test(s)); if (m && !seenA.has(m[1])) { seenA.add(m[1]); adv.push(m[1]); } });
      adv.push('ตรวจตำแหน่ง IV ตามรอบ (เช่น ทุกเวร) และเปลี่ยนตำแหน่งเมื่อพบอาการตาม Phlebitis Scale');
      add(c.ph.rate > (hasP ? p.ph.rate : 0) && hasP ? 'r' : 'y', `พบ Phlebitis เกิดใหม่ขณะนอน รพ. ${c.ph.nw} ราย (${c.ph.rate} ต่อ 1,000 วันนอน)${hasP ? dlt(c.ph.rate, p.ph.rate, '') : ''}`, adv);
    } else add('g', 'ไม่พบ Phlebitis เกิดใหม่ในช่วงนี้');
    if (c.ph.severe) add('r', `Phlebitis ระดับ 3-4 จำนวน ${c.ph.severe} ราย`, ['เปลี่ยน IV site และรายงานแพทย์ตามแนวทาง Phlebitis Scale', 'gr.4 (มีหนอง) แพทย์อาจพิจารณาส่งเพาะเชื้อ — ทบทวนรายกรณีและรายงานอุบัติการณ์']);
    if (c.d.phCause.length) add('y', `สาเหตุ Phlebitis ที่บันทึก: ${c.d.phCause.slice(0, 4).map(x => x[0] + ' (' + x[1] + ')').join(', ')}`, ['ถ้ายาตัวใดพบซ้ำ ควรปรึกษาเภสัชกรเรื่องความเข้มข้น อัตราการให้ และเส้นทางให้ยา']);
    // เวร
    [['PI', c.shiftPi], ['Phlebitis', c.shiftPh]].forEach(([n, s]) => {
      const tot = s[0] + s[1] + s[2], mx = Math.max(...s);
      if (tot >= 3 && mx / tot >= 0.5) add('y', `เคส${n}ใหม่พบมากในเวร${SHIFTS[s.indexOf(mx)][0]} (${mx} จาก ${tot} ครั้ง)`, ['ทบทวนภาระงาน/การพลิกตะแคง/รอบตรวจผิวหนังและ IV site ในเวรนั้น']);
    });
    // คุณภาพข้อมูล
    const q = c.q, miss = [];
    if (q.piNoGrade) miss.push(`PI ไม่ระบุเกรด ${q.piNoGrade}`); if (q.noSite) miss.push(`ไม่ระบุตำแหน่ง ${q.noSite}`);
    if (q.phNoCause) miss.push(`Phlebitis ไม่ระบุสาเหตุ ${q.phNoCause}`);
    if (q.piNoTreat) miss.push(`PI ไม่ระบุการรักษา ${q.piNoTreat}`); if (q.phNoTreat) miss.push(`Phlebitis ไม่ระบุการรักษา ${q.phNoTreat}`);
    if (miss.length) add('y', 'ข้อมูลที่ยังไม่ครบ (นับเป็นรายผู้ป่วย): ' + miss.join(' • '), ['ระบุเกรด ตำแหน่ง สาเหตุ และการรักษาให้ครบ จะทำให้สถิติและข้อเสนอแนะแม่นยำขึ้น']);
    return L;
  }

  /* ---------- วาดหน้าจอ ---------- */
  const bars = (list, cls, empty, max) => {
    if (!list.length) return `<div class="st-em">${empty || 'ยังไม่มีข้อมูล'}</div>`;
    const mx = Math.max(...list.map(x => x[1]));
    return list.slice(0, max || 8).map(([l, n]) => `<div class="st-b"><span class="st-l">${E(l)}</span><span class="st-t"><i class="${cls}" style="width:${Math.max(4, n * 100 / mx)}%"></i></span><b>${n}</b></div>`).join('');
  };
  const delta = (a, b, lowerBetter) => {
    if (b === undefined || b === null) return '';
    if (a === b) return '<em class="st-d">= ก่อนหน้า</em>';
    const up = a > b, good = lowerBetter ? !up : up;
    return `<em class="st-d ${good ? 'ok' : 'bad'}">${up ? '▲' : '▼'} ${Math.abs(Math.round((a - b) * 10) / 10)}</em>`;
  };
  const kpi = (v, l, cls, d, sub) => `<div class="st-k ${cls || ''}"><b>${v}</b><span>${l}</span>${d || ''}${sub ? `<small>${sub}</small>` : ''}</div>`;
  function trend(buckets, labelEvery) {
    if (!buckets.length) return '';
    const W = 340, H = 110, pl = 22, pb = 18, n = buckets.length, mx = Math.max(1, ...buckets.map(b => Math.max(b.pi, b.ph))), bw = (W - pl) / n;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="st-svg" role="img" aria-label="แนวโน้มจำนวนผู้ป่วยที่พบ"><line x1="${pl}" y1="${H - pb}" x2="${W}" y2="${H - pb}" stroke="#0002"/>`;
    s += `<text x="0" y="12" font-size="9" fill="#6b8088">${mx}</text><text x="0" y="${H - pb}" font-size="9" fill="#6b8088">0</text>`;
    buckets.forEach((b, i) => {
      const x = pl + i * bw, h = v => (H - pb - 14) * v / mx, w = Math.max(2, Math.min(10, bw * .38));
      s += `<rect x="${x + bw / 2 - w - .5}" y="${H - pb - h(b.pi)}" width="${w}" height="${h(b.pi)}" rx="1.5" fill="var(--pi)"/><rect x="${x + bw / 2 + .5}" y="${H - pb - h(b.ph)}" width="${w}" height="${h(b.ph)}" rx="1.5" fill="var(--ph)"/>`;
      if (i % labelEvery === 0) s += `<text x="${x + bw / 2}" y="${H - 5}" font-size="8.5" fill="#6b8088" text-anchor="middle">${E(b.l)}</text>`;
    });
    return s + '</svg><div class="st-lg"><span class="p">ผู้ป่วยที่พบ PI</span><span class="h">ผู้ป่วยที่พบ Phlebitis</span></div>';
  }
  function html(cur, prev, meta) {
    // meta: {months:[...], byBucket:[{l,pi,ph}], every, rangeLabel, perMonth:[...]}
    if (!cur.rows) return '<div class="empty" style="padding:24px 0">ยังไม่มีข้อมูลในช่วงที่เลือก — บันทึกผลประเมินแล้วหน้านี้จะวิเคราะห์ให้อัตโนมัติ</div>';
    const hp = prev && prev.nPd, pv = k => hp ? prev[k.split('.')[0]][k.split('.')[1]] : undefined;
    const ins = insights(cur, hp ? prev : null, meta);
    const ico = { r: '🔴', y: '🟡', g: '🟢' };
    let h = `<div class="st-kg">${kpi(cur.nPts, 'ผู้ป่วยที่ประเมิน', '', hp ? delta(cur.nPts, prev.nPts) : '', cur.nPd + ' วันนอน • ' + cur.rows + ' ครั้ง')}`
      + kpi(cur.pi.pts, 'ผู้ป่วยพบ PI', 'p', delta(cur.pi.prev, pv('pi.prev'), true), 'ความชุก ' + cur.pi.prev + '%')
      + kpi(cur.pi.nw, 'PI เกิดใหม่', 'p', delta(cur.pi.rate, pv('pi.rate'), true), cur.pi.rate + ' /1,000 วันนอน')
      + kpi(cur.ph.pts, 'ผู้ป่วยพบ Phlebitis', 'h', delta(cur.ph.prev, pv('ph.prev'), true), 'ความชุก ' + cur.ph.prev + '%')
      + kpi(cur.ph.nw, 'Phlebitis เกิดใหม่', 'h', delta(cur.ph.rate, pv('ph.rate'), true), cur.ph.rate + ' /1,000 วันนอน') + '</div>';
    h += `<div class="st-note">▲▼ เทียบกับช่วงก่อนหน้า (${E(meta.prevLabel || '-')}) • ลูกศรสีเขียว = ดีขึ้น สีแดง = แย่ลง • “เกิดใหม่” = ขณะนอน รพ. ที่เลือก ครั้งแรก หรือ ตำแหน่งใหม่ (ตำแหน่งเดิมไม่นับเป็นเกิดใหม่)</div>`;
    h += `<h3 class="st-h">💡 ข้อสังเกตและข้อเสนอแนะ</h3><div class="st-ins">${ins.map(i => `<div class="st-i ${i.lv}"><div>${ico[i.lv]} ${E(i.t)}</div>${i.adv.length ? '<ul>' + i.adv.map(a => `<li>${E(a)}</li>`).join('') + '</ul>' : ''}</div>`).join('')}</div>`;
    h += `<p class="st-note">ข้อเสนอแนะเป็นข้อมูลเบื้องต้นจากกฎอย่างง่าย ใช้ประกอบการประชุม/ทบทวนของทีม ไม่ทดแทนแนวปฏิบัติและดุลยพินิจทางวิชาชีพของหน่วยงาน</p>`;
    if (cur.follow.length) h += `<h3 class="st-h">🚩 ผู้ป่วยที่ควรติดตาม (จากบันทึกล่าสุด)</h3><div class="st-fl">${cur.follow.map(f => `<div><b>HN ${E(f.hn)}</b> ${f.tags.map(t => `<span class="st-tg ${t[0]}">${E(t[1])}</span>`).join('')}<small>${E(f.last.date.split('-').reverse().join('/'))}</small></div>`).join('')}</div>`;
    h += `<h3 class="st-h">📈 แนวโน้ม <small>${E(meta.trendLabel)}</small></h3>${trend(meta.byBucket, meta.every)}`;
    if (meta.perMonth && meta.perMonth.length > 1) h += `<div class="pi-tw"><table class="pi-t st-mt"><tr><th>เดือน</th><th>ผู้ป่วย</th><th class="tp">PI</th><th class="tp">ใหม่</th><th class="tp">/1,000</th><th class="tq">Ph</th><th class="tq">ใหม่</th><th class="tq">/1,000</th></tr>${meta.perMonth.map(m => `<tr><td>${E(m.l)}</td><td>${m.a.nPts}</td><td class="cp">${m.a.pi.pts}</td><td class="cp">${m.a.pi.nw}</td><td class="cp">${m.a.pi.rate}</td><td class="cq">${m.a.ph.pts}</td><td class="cq">${m.a.ph.nw}</td><td class="cq">${m.a.ph.rate}</td></tr>`).join('')}</table></div>`;
    h += `<div class="st-g2"><div><h3 class="st-h">🛏️ PI ตามประเภท</h3>${bars(cur.d.piType, 'p')}</div><div><h3 class="st-h">🛏️ PI ตามเกรด</h3>${bars(cur.d.piGrade, 'p')}</div></div>`
      + `<h3 class="st-h">🛏️ PI ตามตำแหน่ง</h3>${bars(cur.d.piSite, 'p', '', 8)}`
      + `<div class="st-g2"><div><h3 class="st-h">💉 Phlebitis ตามระดับ</h3>${bars(cur.d.phGrade, 'h')}</div><div><h3 class="st-h">💉 ตามตำแหน่ง</h3>${bars(cur.d.phSite, 'h')}</div></div>`
      + `<h3 class="st-h">💉 สาเหตุ Phlebitis (ยา/สาร)</h3>${bars(cur.d.phCause, 'h', 'ยังไม่มีการบันทึกสาเหตุ')}`
      + `<h3 class="st-h">⏰ เคสเกิดใหม่แยกตามเวร <small>(ตามเวลาที่พบ)</small></h3><div class="st-g2"><div class="st-sub">PI</div><div class="st-sub">Phlebitis</div></div><div class="st-g2"><div>${SHIFTS.map((s, i) => `<div class="st-b"><span class="st-l">${s[0]}</span><span class="st-t"><i class="p" style="width:${Math.max(cur.shiftPi[i] ? 6 : 0, cur.shiftPi[i] * 100 / Math.max(1, ...cur.shiftPi))}%"></i></span><b>${cur.shiftPi[i]}</b></div>`).join('')}</div><div>${SHIFTS.map((s, i) => `<div class="st-b"><span class="st-l">${s[0]}</span><span class="st-t"><i class="h" style="width:${Math.max(cur.shiftPh[i] ? 6 : 0, cur.shiftPh[i] * 100 / Math.max(1, ...cur.shiftPh))}%"></i></span><b>${cur.shiftPh[i]}</b></div>`).join('')}</div></div>`
      + `<div class="st-g2"><div><h3 class="st-h">🩹 การรักษา PI</h3>${bars(cur.d.piTreat, 'p', 'ยังไม่มีการบันทึก')}</div><div><h3 class="st-h">🩹 การรักษา Phlebitis</h3>${bars(cur.d.phTreat, 'h', 'ยังไม่มีการบันทึก')}</div></div>`;
    h += `<p class="st-note">วิธีนับ: นับเป็นรายผู้ป่วย (HN) ไม่ซ้ำในช่วงที่เลือก • วันนอน = จำนวนวัน-ผู้ป่วยที่มีการประเมิน (ประมาณจากข้อมูลที่บันทึก) • อัตรา = ผู้ป่วยเกิดใหม่ ÷ วันนอน × 1,000</p>`;
    return h;
  }
  return { analyze, html, parsePI, parsePh };
})();
if (typeof module !== 'undefined') module.exports = PIS;
