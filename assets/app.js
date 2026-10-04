/* ระบบจองห้องประชุม — Mock data & shared helpers
   ข้อมูลทั้งหมดเก็บใน localStorage ของเบราว์เซอร์ (เป็น mock ยังไม่มี backend) */
(function () {
  'use strict';

  const STORE_KEY = 'mrb_data_v1';
  const SESSION_KEY = 'mrb_session_v1';
  const ROOT = document.body.dataset.root || '';

  const OPEN_TIME = '08:00';
  const CLOSE_TIME = '18:00';
  const SLOT_MIN = 30;

  const AMENITIES = ['โปรเจคเตอร์', 'จอทีวี', 'ไวท์บอร์ด', 'ระบบประชุมออนไลน์', 'ไมโครโฟน/ลำโพง', 'เครื่องปรับอากาศ', 'Wi-Fi'];
  const DEPARTMENTS = ['ฝ่ายบริหาร', 'ฝ่ายบุคคล', 'ฝ่ายบัญชีและการเงิน', 'ฝ่ายการตลาด', 'ฝ่ายขาย', 'ฝ่ายเทคโนโลยีสารสนเทศ', 'ฝ่ายจัดซื้อ', 'ฝ่ายปฏิบัติการ'];
  const STATUS = {
    confirmed: { label: 'ยืนยันแล้ว', cls: 'pill-free' },
    cancel_requested: { label: 'รออนุมัติยกเลิก', cls: 'pill-warn' },
    cancelled: { label: 'ยกเลิกแล้ว', cls: 'pill-off' },
  };
  const ACTIVE_STATUSES = ['confirmed', 'cancel_requested'];

  /* ---------------- date / time helpers ---------------- */
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const today = () => iso(new Date());
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const startOfWeek = (d) => { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; };

  function slots() {
    const out = [];
    for (let m = toMin(OPEN_TIME); m < toMin(CLOSE_TIME); m += SLOT_MIN) out.push(fromMin(m));
    return out;
  }
  function timeOptions(includeEnd) {
    const out = [];
    const start = toMin(OPEN_TIME) + (includeEnd ? SLOT_MIN : 0);
    const end = toMin(CLOSE_TIME) - (includeEnd ? 0 : SLOT_MIN);
    for (let m = start; m <= end; m += SLOT_MIN) out.push(fromMin(m));
    return out;
  }

  const TH_FMT_LONG = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const TH_FMT = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const TH_MONTH = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' });
  const TH_DOW = new Intl.DateTimeFormat('th-TH', { weekday: 'short' });
  const fmtDateLong = (s) => TH_FMT_LONG.format(parseISO(s));
  const fmtDate = (s) => TH_FMT.format(parseISO(s));
  const fmtMonth = (d) => TH_MONTH.format(d);
  const fmtDow = (d) => TH_DOW.format(d);
  const fmtDateTime = (ts) => {
    const d = new Date(ts);
    return `${TH_FMT.format(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  /* ---------------- seed data ---------------- */
  function rng(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

  function seed() {
    const rooms = [
      { id: 1, name: 'ห้องประชุม 1', capacity: 13, capacityLabel: '13 คน', floor: 'ชั้น 3', open: true,
        amenities: ['โปรเจคเตอร์', 'จอทีวี', 'ไวท์บอร์ด', 'ระบบประชุมออนไลน์', 'ไมโครโฟน/ลำโพง', 'เครื่องปรับอากาศ', 'Wi-Fi'],
        note: 'ห้องประชุมใหญ่ เหมาะสำหรับประชุมทีม/นำเสนองาน' },
      { id: 2, name: 'ห้องประชุม 2', capacity: 6, capacityLabel: '5–6 คน', floor: 'ชั้น 3', open: false,
        amenities: ['จอทีวี', 'ไวท์บอร์ด', 'เครื่องปรับอากาศ', 'Wi-Fi'],
        note: 'ห้องประชุมเล็ก (ยังไม่เปิดให้จอง)' },
    ];
    const users = [
      { id: 1, role: 'admin', email: 'admin@company.co.th', password: 'admin1234', name: 'ผู้ดูแลระบบ', department: 'ฝ่ายบริหาร', phone: '02-000-0000' },
      { id: 2, role: 'user', email: 'somchai@company.co.th', password: '1234', name: 'สมชาย ใจดี', department: 'ฝ่ายการตลาด', phone: '081-234-5678' },
      { id: 3, role: 'user', email: 'suda@company.co.th', password: '1234', name: 'สุดา มีสุข', department: 'ฝ่ายบุคคล', phone: '089-111-2233' },
      { id: 4, role: 'user', email: 'anan@company.co.th', password: '1234', name: 'อนันต์ ศรีสวัสดิ์', department: 'ฝ่ายเทคโนโลยีสารสนเทศ', phone: '086-555-7788' },
      { id: 5, role: 'user', email: 'pim@company.co.th', password: '1234', name: 'พิมพ์ชนก แก้วมณี', department: 'ฝ่ายบัญชีและการเงิน', phone: '092-345-6789' },
      { id: 6, role: 'user', email: 'wichai@company.co.th', password: '1234', name: 'วิชัย ทองคำ', department: 'ฝ่ายขาย', phone: '084-987-6543' },
    ];
    const purposes = ['ประชุมทีมประจำสัปดาห์', 'นำเสนอแผนการตลาด Q4', 'สัมภาษณ์งานผู้สมัคร', 'ประชุมปิดงบประมาณ', 'อบรมระบบใหม่', 'ประชุมลูกค้า (Online)', 'Workshop ออกแบบผลิตภัณฑ์', 'ประชุมผู้บริหาร', 'ติดตามความคืบหน้าโปรเจกต์', 'ประชุมคณะกรรมการสวัสดิการ'];
    const templates = [['09:00', '10:30'], ['10:30', '12:00'], ['13:00', '14:00'], ['14:00', '15:30'], ['15:30', '17:00'], ['09:30', '11:00'], ['13:30', '15:00']];

    const data = { rooms, users, bookings: [], logs: [], emails: [], seq: 1, logSeq: 1, emailSeq: 1 };
    const r = rng(42);
    const t0 = new Date();
    const todayStr = iso(t0);

    for (let off = -35; off <= 30; off++) {
      const d = addDays(t0, off);
      const ds = iso(d);
      const wd = d.getDay();
      if ((wd === 0 || wd === 6) && ds !== todayStr) continue;
      let count = Math.floor(r() * 4); // 0..3 bookings per day
      if (ds === todayStr) count = 3;
      const used = [];
      for (let i = 0; i < count; i++) {
        const tpl = templates[Math.floor(r() * templates.length)];
        if (used.some(([s, e]) => toMin(s) < toMin(tpl[1]) && toMin(e) > toMin(tpl[0]))) continue;
        used.push(tpl);
        const u = users[1 + Math.floor(r() * (users.length - 1))];
        pushSeedBooking(data, {
          roomId: 1, user: u, date: ds, start: tpl[0], end: tpl[1],
          purpose: purposes[Math.floor(r() * purposes.length)],
          attendees: 3 + Math.floor(r() * 10),
          createdAt: Math.min(addDays(d, -(2 + Math.floor(r() * 7))).getTime() + (9 + Math.floor(r() * 8)) * 3600e3 + Math.floor(r() * 60) * 60e3, Date.now() - Math.floor(1 + r() * 72) * 3600e3),
          status: off < 0 && r() < 0.1 ? 'cancelled' : 'confirmed',
        });
      }
    }

    // การจองของผู้ใช้ตัวอย่าง (สมชาย) — พรุ่งนี้ (สำหรับทดสอบอีเมลเตือนล่วงหน้า 1 วัน)
    const tmr = iso(addDays(t0, 1));
    data.bookings = data.bookings.filter((b) => !(b.date === tmr && toMin(b.start) < toMin('12:00') && toMin(b.end) > toMin('10:00')));
    pushSeedBooking(data, { roomId: 1, user: users[1], date: tmr, start: '10:00', end: '12:00', purpose: 'นำเสนอแผนการตลาด Q4 ให้ผู้บริหาร', attendees: 10, createdAt: Date.now() - 3 * 864e5, status: 'confirmed' });

    // คำขอยกเลิกที่รออนุมัติ
    const d3 = iso(addDays(t0, 3));
    data.bookings = data.bookings.filter((b) => !(b.date === d3 && toMin(b.start) < toMin('17:00') && toMin(b.end) > toMin('15:30')));
    const req = pushSeedBooking(data, { roomId: 1, user: users[2], date: d3, start: '15:30', end: '17:00', purpose: 'สัมภาษณ์งานผู้สมัคร ตำแหน่ง HR Officer', attendees: 4, createdAt: Date.now() - 4 * 864e5, status: 'cancel_requested' });
    req.status = 'cancel_requested';
    req.cancelReason = 'ผู้สมัครขอเลื่อนวันสัมภาษณ์';
    req.cancelRequestedAt = Date.now() - 3 * 3600e3;
    addLog(data, req, 'cancel_requested', users[2], 'ขอยกเลิก: ' + req.cancelReason, req.cancelRequestedAt);

    data.bookings.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    return data;
  }

  function pushSeedBooking(data, o) {
    const b = {
      id: data.seq, code: makeCode(o.date, data.seq), roomId: o.roomId, userId: o.user.id,
      name: o.user.name, department: o.user.department, phone: o.user.phone, email: o.user.email,
      purpose: o.purpose, attendees: o.attendees, date: o.date, start: o.start, end: o.end,
      status: 'confirmed', createdAt: o.createdAt, token: Math.random().toString(36).slice(2, 10),
    };
    data.seq++;
    data.bookings.push(b);
    addLog(data, b, 'created', o.user, `จอง ${roomName(data, b.roomId)} ${b.date} ${b.start}-${b.end}`, o.createdAt);
    addEmail(data, b, 'confirmed', o.createdAt + 5000);
    if (o.status === 'cancelled') {
      const admin = data.users[0];
      b.status = 'cancelled';
      b.cancelReason = 'ไม่ได้ใช้ห้องแล้ว';
      b.cancelledAt = o.createdAt + 864e5;
      b.cancelledBy = admin.name;
      addLog(data, b, 'cancel_requested', o.user, 'ขอยกเลิก: ไม่ได้ใช้ห้องแล้ว', o.createdAt + 3600e3);
      addLog(data, b, 'cancel_approved', admin, 'อนุมัติการยกเลิก', b.cancelledAt);
      addEmail(data, b, 'cancelled', b.cancelledAt + 5000);
    }
    return b;
  }

  function makeCode(date, seq) { return 'BK' + date.replace(/-/g, '').slice(2) + '-' + String(seq).padStart(4, '0'); }
  function roomName(data, id) { const r = data.rooms.find((x) => x.id === id); return r ? r.name : '-'; }

  /* ---------------- store ---------------- */
  let DATA;
  function load() {
    try { DATA = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { DATA = null; }
    if (!DATA || !DATA.rooms) { DATA = seed(); save(); }
    return DATA;
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(DATA)); } catch (e) { /* ignore */ } }
  function storeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  function storeDel(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
  function reset() { storeDel(STORE_KEY); storeDel(SESSION_KEY); location.reload(); }

  /* ---------------- logs & emails ---------------- */
  const LOG_LABEL = {
    created: 'สร้างการจอง',
    cancel_requested: 'ขอยกเลิกการจอง',
    cancel_approved: 'อนุมัติการยกเลิก',
    cancel_rejected: 'ปฏิเสธคำขอยกเลิก',
    admin_cancelled: 'แอดมินยกเลิกการจอง',
    reminder_sent: 'ส่งอีเมลเตือนล่วงหน้า 1 วัน',
    room_updated: 'แก้ไขข้อมูลห้อง',
  };
  function addLog(data, b, action, actor, detail, ts) {
    data.logs.push({
      id: data.logSeq++, bookingId: b ? b.id : null, code: b ? b.code : null, action,
      actorName: actor ? actor.name : 'ระบบ', actorRole: actor ? actor.role : 'system',
      detail: detail || '', ts: ts || Date.now(),
      snapshot: b ? { name: b.name, department: b.department, date: b.date, start: b.start, end: b.end, roomId: b.roomId } : null,
    });
  }

  const EMAIL_KIND = {
    confirmed: { label: 'ยืนยันการจอง', subject: (b, d) => `[ยืนยันการจอง] ${b.code} ${roomName(d, b.roomId)} ${fmtDate(b.date)} ${b.start}-${b.end}` },
    cancel_requested: { label: 'แจ้งแอดมิน: คำขอยกเลิก', subject: (b, d) => `[คำขอยกเลิก] ${b.code} โดย ${b.name} รออนุมัติ` },
    cancelled: { label: 'แจ้งการยกเลิก', subject: (b, d) => `[ยกเลิกการจองแล้ว] ${b.code} ${roomName(d, b.roomId)} ${fmtDate(b.date)}` },
    rejected: { label: 'ปฏิเสธคำขอยกเลิก', subject: (b, d) => `[คำขอยกเลิกไม่ได้รับอนุมัติ] ${b.code}` },
    reminder: { label: 'เตือนล่วงหน้า 1 วัน', subject: (b, d) => `[แจ้งเตือน] พรุ่งนี้คุณมีการจอง ${roomName(d, b.roomId)} ${b.start}-${b.end}` },
  };
  function addEmail(data, b, kind, ts) {
    const to = kind === 'cancel_requested' ? data.users.filter((u) => u.role === 'admin').map((u) => u.email).join(', ') : b.email;
    const e = { id: data.emailSeq++, bookingId: b.id, kind, to, subject: EMAIL_KIND[kind].subject(b, data), ts: ts || Date.now(), status: 'sent' };
    data.emails.push(e);
    return e;
  }

  /* ---------------- session ---------------- */
  function currentUser() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      return s ? DATA.users.find((u) => u.id === s.userId) || null : null;
    } catch (e) { return null; }
  }
  function login(email, password, role) {
    const u = DATA.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.password === password);
    if (!u) return { ok: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    if (role === 'admin' && u.role !== 'admin') return { ok: false, error: 'บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ' };
    storeSet(SESSION_KEY, JSON.stringify({ userId: u.id }));
    return { ok: true, user: u };
  }
  function register(o) {
    if (DATA.users.some((u) => u.email.toLowerCase() === o.email.toLowerCase())) return { ok: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
    const u = { id: Math.max(...DATA.users.map((x) => x.id)) + 1, role: 'user', ...o };
    DATA.users.push(u); save();
    storeSet(SESSION_KEY, JSON.stringify({ userId: u.id }));
    return { ok: true, user: u };
  }
  function logout(to) { storeDel(SESSION_KEY); location.href = to || ROOT + 'login.html'; }
  function requireUser() {
    const u = currentUser();
    if (!u) { location.href = ROOT + 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); throw new Error('redirect'); }
    return u;
  }
  function requireAdmin() {
    const u = currentUser();
    if (!u || u.role !== 'admin') { location.href = ROOT + 'admin/login.html'; throw new Error('redirect'); }
    return u;
  }

  /* ---------------- booking logic ---------------- */
  const room = (id) => DATA.rooms.find((r) => r.id === Number(id));
  const activeBookings = () => DATA.bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const bookingsOn = (date, roomId) => activeBookings().filter((b) => b.date === date && (!roomId || b.roomId === Number(roomId)));

  /** ป้องกันการจองซ้ำ: ห้องเดียวกัน วันเดียวกัน ช่วงเวลาทับซ้อน (start < otherEnd && end > otherStart) */
  function findConflicts(roomId, date, start, end, ignoreId) {
    const s = toMin(start), e = toMin(end);
    return bookingsOn(date, roomId).filter((b) => b.id !== ignoreId && s < toMin(b.end) && e > toMin(b.start));
  }

  function validateBooking(o) {
    const errs = [];
    const r = room(o.roomId);
    if (!r) errs.push('กรุณาเลือกห้องประชุม');
    else if (!r.open) errs.push(`${r.name} ยังไม่เปิดให้จอง`);
    if (!o.name || !o.name.trim()) errs.push('กรุณากรอกชื่อผู้จอง');
    if (!o.department || !o.department.trim()) errs.push('กรุณาระบุแผนก');
    if (!/^0\d{1,2}-?\d{3}-?\d{3,4}$/.test((o.phone || '').trim())) errs.push('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 081-234-5678)');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((o.email || '').trim())) errs.push('รูปแบบอีเมลไม่ถูกต้อง');
    if (!o.purpose || !o.purpose.trim()) errs.push('กรุณาระบุวัตถุประสงค์การใช้งาน');
    if (!o.date) errs.push('กรุณาเลือกวันที่');
    if (!o.start || !o.end) errs.push('กรุณาเลือกเวลา');
    if (o.start && o.end && toMin(o.end) <= toMin(o.start)) errs.push('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม');
    if (o.date && o.start && (o.date < today() || (o.date === today() && toMin(o.start) < nowMin()))) errs.push('ไม่สามารถจองย้อนหลังได้');
    if (r && o.attendees && Number(o.attendees) > r.capacity) errs.push(`จำนวนผู้เข้าร่วมเกินความจุห้อง (สูงสุด ${r.capacityLabel})`);
    if (!errs.length && findConflicts(o.roomId, o.date, o.start, o.end).length) errs.push('ช่วงเวลานี้มีผู้จองแล้ว กรุณาเลือกเวลาอื่น');
    return errs;
  }

  function createBooking(o, actor) {
    const errs = validateBooking(o);
    if (errs.length) return { ok: false, errors: errs };
    const b = {
      id: DATA.seq, code: makeCode(o.date, DATA.seq), roomId: Number(o.roomId), userId: actor.id,
      name: o.name.trim(), department: o.department.trim(), phone: o.phone.trim(), email: o.email.trim(),
      purpose: o.purpose.trim(), attendees: Number(o.attendees) || null, note: (o.note || '').trim(), date: o.date, start: o.start, end: o.end,
      status: 'confirmed', createdAt: Date.now(), token: Math.random().toString(36).slice(2, 10),
    };
    DATA.seq++;
    DATA.bookings.push(b);
    addLog(DATA, b, 'created', actor, `จอง ${room(b.roomId).name} ${b.date} ${b.start}-${b.end}`);
    const email = addEmail(DATA, b, 'confirmed');
    save();
    return { ok: true, booking: b, email };
  }

  function requestCancel(id, reason, actor) {
    const b = DATA.bookings.find((x) => x.id === id);
    if (!b || b.status !== 'confirmed') return { ok: false, error: 'ไม่สามารถขอยกเลิกรายการนี้ได้' };
    b.status = 'cancel_requested';
    b.cancelReason = reason || '-';
    b.cancelRequestedAt = Date.now();
    addLog(DATA, b, 'cancel_requested', actor, 'ขอยกเลิก: ' + b.cancelReason);
    addEmail(DATA, b, 'cancel_requested');
    save();
    return { ok: true, booking: b };
  }
  function approveCancel(id, admin) {
    const b = DATA.bookings.find((x) => x.id === id);
    if (!b || b.status !== 'cancel_requested') return { ok: false };
    b.status = 'cancelled'; b.cancelledAt = Date.now(); b.cancelledBy = admin.name;
    addLog(DATA, b, 'cancel_approved', admin, 'อนุมัติการยกเลิก');
    const email = addEmail(DATA, b, 'cancelled');
    save();
    return { ok: true, booking: b, email };
  }
  function rejectCancel(id, note, admin) {
    const b = DATA.bookings.find((x) => x.id === id);
    if (!b || b.status !== 'cancel_requested') return { ok: false };
    b.status = 'confirmed'; b.rejectNote = note || '';
    addLog(DATA, b, 'cancel_rejected', admin, 'ปฏิเสธคำขอยกเลิก' + (note ? ': ' + note : ''));
    const email = addEmail(DATA, b, 'rejected');
    save();
    return { ok: true, booking: b, email };
  }
  function adminCancel(id, reason, admin) {
    const b = DATA.bookings.find((x) => x.id === id);
    if (!b || b.status === 'cancelled') return { ok: false };
    b.status = 'cancelled'; b.cancelReason = reason || b.cancelReason || '-'; b.cancelledAt = Date.now(); b.cancelledBy = admin.name;
    addLog(DATA, b, 'admin_cancelled', admin, 'ยกเลิกโดยแอดมิน: ' + b.cancelReason);
    const email = addEmail(DATA, b, 'cancelled');
    save();
    return { ok: true, booking: b, email };
  }
  /** จำลอง cron: ส่งอีเมลเตือนการจองของ "พรุ่งนี้" ที่ยังไม่เคยเตือน */
  function runReminders() {
    const tmr = iso(addDays(new Date(), 1));
    const list = DATA.bookings.filter((b) => b.date === tmr && b.status === 'confirmed' && !b.reminderSentAt);
    list.forEach((b) => {
      b.reminderSentAt = Date.now();
      addLog(DATA, b, 'reminder_sent', null, 'ส่งอีเมลเตือนไปที่ ' + b.email);
      addEmail(DATA, b, 'reminder');
    });
    save();
    return list;
  }
  function updateRoom(id, patch, admin) {
    const r = room(id);
    Object.assign(r, patch);
    addLog(DATA, null, 'room_updated', admin, `${r.name}: ความจุ ${r.capacityLabel}, ${r.open ? 'เปิดให้จอง' : 'ปิดการจอง'}`);
    save();
    return r;
  }

  /* ---------------- UI helpers ---------------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const statusPill = (st) => `<span class="pill ${STATUS[st].cls}">${STATUS[st].label}</span>`;
  const qs = (k) => new URLSearchParams(location.search).get(k);

  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'ok');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  function modal(html, onMount) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    const close = () => bg.remove();
    bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
    document.body.appendChild(bg);
    if (onMount) onMount(bg.querySelector('.modal'), close);
    return close;
  }

  /** กล่องยืนยันในหน้า (ใช้แทน window.confirm) */
  function confirmBox(title, text, okLabel, onOk) {
    modal(`<h2>${esc(title)}</h2>${text ? `<p class="muted">${esc(text)}</p>` : ''}
      <div class="foot"><button class="btn btn-ghost" data-close>ยกเลิก</button><button class="btn" id="cbOk">${esc(okLabel || 'ยืนยัน')}</button></div>`,
      (el, close) => el.querySelector('#cbOk').addEventListener('click', () => { close(); onOk(); }));
  }

  /** ส่งออก CSV: พยายามดาวน์โหลด และแสดงข้อมูลให้คัดลอกไปวางใน Excel ได้ด้วย */
  function exportCSVModal(filename, csv) {
    modal(`<h2>ส่งออกข้อมูล CSV</h2>
      <p class="muted small" style="margin-top:0">ถ้าไฟล์ <b>${esc(filename)}</b> ไม่ถูกดาวน์โหลดอัตโนมัติ ให้กดคัดลอกแล้ววางใน Excel / Google Sheets</p>
      <textarea id="csvText" readonly style="min-height:200px;font-size:.78rem;font-family:ui-monospace,monospace">${esc(csv)}</textarea>
      <div class="foot"><button class="btn btn-ghost" data-close>ปิด</button><button class="btn" id="csvCopy">คัดลอก</button></div>`,
      (el) => el.querySelector('#csvCopy').addEventListener('click', () => {
        const ta = el.querySelector('#csvText');
        const fallback = () => { ta.focus(); ta.select(); toast('เลือกข้อความแล้ว กด Ctrl+C เพื่อคัดลอก', ''); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(csv).then(() => toast('คัดลอกแล้ว'), fallback);
        else fallback();
      }));
  }

  function bookingDetailHTML(b, opts) {
    const r = room(b.roomId);
    const logs = DATA.logs.filter((l) => l.bookingId === b.id).sort((a, c) => a.ts - c.ts);
    const cls = { created: '', cancel_requested: 'amber', cancel_rejected: 'amber', cancel_approved: 'red', admin_cancelled: 'red', reminder_sent: '' };
    return `
      <div class="card-head" style="margin-bottom:8px"><h2 style="margin:0">รายละเอียดการจอง ${esc(b.code)}</h2>${statusPill(b.status)}</div>
      <dl class="kv">
        <dt>ห้อง</dt><dd>${esc(r.name)} (${esc(r.capacityLabel)})</dd>
        <dt>วันที่</dt><dd>${fmtDateLong(b.date)}</dd>
        <dt>เวลา</dt><dd>${b.start} – ${b.end} น.</dd>
        <dt>ชื่อผู้จอง</dt><dd>${esc(b.name)}</dd>
        <dt>แผนก</dt><dd>${esc(b.department)}</dd>
        <dt>เบอร์โทรศัพท์</dt><dd>${esc(b.phone)}</dd>
        <dt>อีเมล</dt><dd>${esc(b.email)}</dd>
        <dt>วัตถุประสงค์</dt><dd>${esc(b.purpose)}</dd>
        <dt>ผู้เข้าร่วม</dt><dd>${b.attendees ? b.attendees + ' คน' : '-'}</dd>
        ${b.note ? `<dt>หมายเหตุ</dt><dd>${esc(b.note)}</dd>` : ''}
        <dt>วันที่ทำรายการ</dt><dd>${fmtDateTime(b.createdAt)}</dd>
        ${b.cancelReason ? `<dt>เหตุผลยกเลิก</dt><dd>${esc(b.cancelReason)}</dd>` : ''}
        ${b.cancelledBy ? `<dt>ยกเลิกโดย</dt><dd>${esc(b.cancelledBy)} (${fmtDateTime(b.cancelledAt)})</dd>` : ''}
      </dl>
      <h3 style="margin-top:18px">ประวัติรายการ</h3>
      <ul class="tl">${logs.map((l) => `<li class="${cls[l.action] || ''}"><b>${LOG_LABEL[l.action]}</b> — ${esc(l.actorName)}<br><span class="muted small">${fmtDateTime(l.ts)} · ${esc(l.detail)}</span></li>`).join('')}</ul>
      <div class="foot">${(opts && opts.actions) || ''}<button class="btn btn-ghost" data-close>ปิด</button></div>`;
  }


  /* ---------------- email template (preview) ---------------- */
  function renderEmail(e) {
    const b = DATA.bookings.find((x) => x.id === e.bookingId);
    if (!b) return '<p class="muted">ไม่พบข้อมูล</p>';
    const r = room(b.roomId);
    const cancelUrl = `${ROOT}cancel.html?token=${b.token}`;
    const intro = {
      confirmed: `เรียน คุณ${esc(b.name)}<br><br>การจองห้องประชุมของท่าน <b>สำเร็จแล้ว</b> รายละเอียดดังนี้`,
      cancel_requested: `เรียน ผู้ดูแลระบบ<br><br>มี <b>คำขอยกเลิกการจอง</b> รอการอนุมัติ<br>เหตุผล: ${esc(b.cancelReason || '-')}`,
      cancelled: `เรียน คุณ${esc(b.name)}<br><br>การจองห้องประชุมของท่าน <b>ถูกยกเลิกเรียบร้อยแล้ว</b>`,
      rejected: `เรียน คุณ${esc(b.name)}<br><br>คำขอยกเลิกการจองของท่าน <b>ไม่ได้รับการอนุมัติ</b> การจองยังคงมีผลตามเดิม${b.rejectNote ? '<br>หมายเหตุจากผู้ดูแล: ' + esc(b.rejectNote) : ''}`,
      reminder: `เรียน คุณ${esc(b.name)}<br><br>ขอแจ้งเตือนว่า <b>พรุ่งนี้</b> ท่านมีการจองห้องประชุม ดังนี้`,
    }[e.kind];
    const cta = {
      confirmed: `<p class="small muted">หากต้องการยกเลิก สามารถกด <a href="${cancelUrl}">ขอยกเลิกการจอง</a> ได้</p>`,
      cancel_requested: `<a class="btn" href="${ROOT}admin/cancel-requests.html">ไปที่หน้าอนุมัติคำขอยกเลิก</a>`,
      reminder: `<p>หากไม่ต้องการใช้ห้องแล้ว กรุณากดยกเลิก เพื่อเปิดให้ผู้อื่นจองได้</p>
                 <a class="btn btn-danger" href="${cancelUrl}">ยกเลิกการจองนี้</a> <a class="btn btn-outline" href="${ROOT}my-bookings.html">ดูการจองของฉัน</a>`,
    }[e.kind] || '';
    return `<div class="email">
      <div class="eh">ระบบจองห้องประชุม — ${esc(EMAIL_KIND[e.kind].label)}</div>
      <div class="eb">
        <div class="muted small" style="margin-bottom:12px">ถึง: ${esc(e.to)}<br>หัวเรื่อง: <b style="color:var(--ink)">${esc(e.subject)}</b><br>ส่งเมื่อ: ${fmtDateTime(e.ts)}</div>
        <p>${intro}</p>
        <table>
          <tr><td>รหัสการจอง</td><td><b>${b.code}</b></td></tr>
          <tr><td>ห้อง</td><td>${esc(r.name)} (${esc(r.capacityLabel)})</td></tr>
          <tr><td>วันที่</td><td>${fmtDateLong(b.date)}</td></tr>
          <tr><td>เวลา</td><td>${b.start} – ${b.end} น.</td></tr>
          <tr><td>ผู้จอง</td><td>${esc(b.name)} (${esc(b.department)})</td></tr>
          <tr><td>เบอร์โทร</td><td>${esc(b.phone)}</td></tr>
          <tr><td>วัตถุประสงค์</td><td>${esc(b.purpose)}</td></tr>
        </table>
        ${cta}
      </div>
      <div class="ef">อีเมลนี้ส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับ</div>
    </div>`;
  }

  /* ---------------- top bar ---------------- */
  function renderTopbar(active) {
    $$('body > .mock-note, body > header.topbar').forEach((n) => n.remove());
    const u = currentUser();
    const isAdmin = u && u.role === 'admin';
    const pending = DATA.bookings.filter((b) => b.status === 'cancel_requested').length;
    const links = isAdmin
      ? [
          ['dashboard', 'admin/dashboard.html', 'Dashboard'],
          ['status', 'index.html', 'สถานะห้อง'],
          ['bookings', 'admin/bookings.html', 'รายการจอง'],
          ['requests', 'admin/cancel-requests.html', `คำขอยกเลิก${pending ? ` <span class="badge-admin" style="background:#fff;color:var(--red)">${pending}</span>` : ''}`],
          ['rooms', 'admin/rooms.html', 'จัดการห้อง'],
          ['history', 'admin/history.html', 'ประวัติ'],
          ['emails', 'admin/emails.html', 'อีเมล'],
        ]
      : [
          ['status', 'index.html', 'สถานะห้อง'],
          ['book', 'booking.html', 'จองห้องประชุม'],
          ['mine', 'my-bookings.html', 'การจองของฉัน'],
          ['inbox', 'email.html', 'กล่องอีเมล (จำลอง)'],
        ];
    const right = u
      ? `<div class="user-chip"><div class="avatar">${esc(u.name.slice(0, 1))}</div>
           <div><div style="font-weight:500">${esc(u.name)} ${isAdmin ? '<span class="badge-admin">ADMIN</span>' : ''}</div>
           <div class="dept" style="font-size:.78rem;opacity:.85">${esc(u.department)}</div></div>
           <a href="#" id="logoutBtn" title="ออกจากระบบ">ออกจากระบบ</a></div>`
      : `<div class="user-chip"><a class="btn btn-sm btn-outline" style="color:var(--green-700)" href="${ROOT}login.html">เข้าสู่ระบบ</a><a href="${ROOT}admin/login.html">สำหรับแอดมิน</a></div>`;
    const html = `
      <div class="mock-note">หน้านี้เป็น Mockup (HTML) — ข้อมูลเก็บในเบราว์เซอร์ · <a href="#" id="resetMock">รีเซ็ตข้อมูลตัวอย่าง</a></div>
      <header class="topbar"><div class="inner">
        <a class="brand" href="${ROOT}${isAdmin ? 'admin/dashboard.html' : 'index.html'}"><span class="logo">MR</span><span>ระบบจองห้องประชุม</span></a>
        <nav class="nav">${links.map(([k, href, label]) => `<a href="${ROOT}${href}" class="${k === active ? 'active' : ''}">${label}</a>`).join('')}</nav>
        ${right}
      </div></header>`;
    document.body.insertAdjacentHTML('afterbegin', html);
    const lo = $('#logoutBtn');
    if (lo) lo.addEventListener('click', (e) => { e.preventDefault(); logout(isAdmin ? ROOT + 'admin/login.html' : ROOT + 'login.html'); });
    $('#resetMock').addEventListener('click', (e) => { e.preventDefault(); confirmBox('รีเซ็ตข้อมูลตัวอย่างทั้งหมด?', 'ข้อมูลการจองที่ทดลองทำไว้จะถูกล้าง และสร้างข้อมูลตัวอย่างใหม่', 'รีเซ็ต', reset); });
  }

  function downloadCSV(filename, rows) {
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = filename;
    a.click();
  }

  load();

  window.MRB = {
    ROOT, OPEN_TIME, CLOSE_TIME, SLOT_MIN, AMENITIES, DEPARTMENTS, STATUS, ACTIVE_STATUSES, LOG_LABEL, EMAIL_KIND,
    get data() { return DATA; }, save, reset,
    pad, iso, parseISO, addDays, toMin, fromMin, today, nowMin, startOfWeek, slots, timeOptions,
    fmtDate, fmtDateLong, fmtMonth, fmtDow, fmtDateTime,
    currentUser, login, register, logout, requireUser, requireAdmin,
    room, activeBookings, bookingsOn, findConflicts, validateBooking, createBooking,
    requestCancel, approveCancel, rejectCancel, adminCancel, runReminders, updateRoom,
    esc, $, $$, statusPill, qs, toast, modal, confirmBox, bookingDetailHTML, renderEmail, renderTopbar, downloadCSV,
  };
})();
