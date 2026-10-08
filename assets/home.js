/* หน้าแรก: สถานะห้อง + ปฏิทินรายวัน/สัปดาห์/เดือน + ตัวกรอง */
(function () {
  'use strict';
  const M = window.MRB;
  const { $, $$, esc } = M;
  M.renderTopbar('status');

  const user = M.currentUser();
  // ผู้จองทั่วไปเห็นแค่ "ไม่ว่าง" (ไม่เปิดเผยชื่อ/แผนกของผู้อื่น) — แอดมินเห็นรายละเอียดทั้งหมด
  const isAdmin = !!user && user.role === 'admin';
  const isMine = (b) => !!user && b.userId === user.id;
  const state = {
    view: M.qs('view') || 'day',
    date: M.parseISO(M.qs('date') || M.today()),
    weekRoom: 1,
    f: { people: '', date: M.today(), from: '', to: '', amenities: [], showClosed: true },
  };

  $('#filterToggle').addEventListener('click', () => {
    const open = $('#filterCard').classList.toggle('open');
    $('#filterToggle').setAttribute('aria-expanded', String(open));
    $('#filterToggle').textContent = open ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง';
  });

  $('#todayLabel').textContent = 'วันนี้ ' + M.fmtDateLong(M.today());

  /* ---------- ตัวกรอง ---------- */
  const fromSel = $('#fFrom'), toSel = $('#fTo');
  fromSel.innerHTML = '<option value="">ตั้งแต่</option>' + M.timeOptions(false).map((t) => `<option>${t}</option>`).join('');
  toSel.innerHTML = '<option value="">ถึง</option>' + M.timeOptions(true).map((t) => `<option>${t}</option>`).join('');
  $('#fAmenities').innerHTML = M.AMENITIES.map((a) => `<label class="check"><input type="checkbox" value="${esc(a)}"> ${esc(a)}</label>`).join('');
  $('#fDate').value = state.f.date;
  $('#weekRoom').innerHTML = M.data.rooms.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('');

  function readFilters() {
    state.f.people = $('#fPeople').value;
    state.f.date = $('#fDate').value || M.today();
    state.f.from = fromSel.value;
    state.f.to = toSel.value;
    state.f.amenities = $$('#fAmenities input:checked').map((i) => i.value);
    state.f.showClosed = $('#fShowClosed').checked;
  }
  function roomMatches(r) {
    const f = state.f;
    if (f.people && r.capacity < Number(f.people)) return false;
    if (f.amenities.some((a) => !r.amenities.includes(a))) return false;
    return true;
  }
  function visibleRooms() { return M.data.rooms.filter((r) => state.f.showClosed || r.open); }

  ['#fPeople', '#fDate', '#fFrom', '#fTo', '#fShowClosed'].forEach((s) => $(s).addEventListener('input', onFilter));
  $('#fAmenities').addEventListener('change', onFilter);
  $('#fReset').addEventListener('click', () => {
    $('#fPeople').value = ''; $('#fDate').value = M.today(); fromSel.value = ''; toSel.value = '';
    $$('#fAmenities input').forEach((i) => (i.checked = false)); $('#fShowClosed').checked = true;
    onFilter();
  });
  function onFilter() {
    const prevDate = state.f.date;
    readFilters();
    if (state.f.date !== prevDate) state.date = M.parseISO(state.f.date);
    renderAll();
  }

  /* ---------- ผลการค้นหา ---------- */
  function renderResults() {
    const f = state.f;
    const hasRange = f.from && f.to && M.toMin(f.to) > M.toMin(f.from);
    const out = M.data.rooms.map((r) => {
      const reasons = [];
      if (f.people && r.capacity < Number(f.people)) reasons.push(`ความจุไม่พอ (${r.capacityLabel})`);
      const miss = f.amenities.filter((a) => !r.amenities.includes(a));
      if (miss.length) reasons.push('ไม่มี ' + miss.join(', '));
      let status, cls;
      if (!r.open) { status = 'ยังไม่เปิดให้จอง'; cls = 'pill-off'; }
      else if (reasons.length) { status = 'ไม่ตรงเงื่อนไข'; cls = 'pill-off'; }
      else if (hasRange) {
        const c = M.findConflicts(r.id, f.date, f.from, f.to);
        if (c.length) { status = 'ไม่ว่าง'; cls = 'pill-busy'; reasons.push('ติดการจอง ' + c.map((b) => `${b.start}-${b.end}`).join(', ')); }
        else { status = 'ว่าง'; cls = 'pill-free'; }
      } else {
        const n = M.bookingsOn(f.date, r.id).length;
        status = n ? `มีการจอง ${n} รายการ` : 'ว่างทั้งวัน'; cls = n ? 'pill-warn' : 'pill-free';
      }
      const canBook = r.open && !reasons.length;
      const href = `booking.html?room=${r.id}&date=${f.date}` + (hasRange ? `&start=${f.from}&end=${f.to}` : '') + (f.people ? `&people=${f.people}` : '');
      return `<div style="border:1px solid var(--gray-200);border-radius:10px;padding:10px 12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;gap:6px;align-items:center;flex-wrap:wrap"><b style="white-space:nowrap">${esc(r.name)}</b><span class="pill ${cls}">${status}</span></div>
        <div class="muted small">${esc(r.capacityLabel)} · ${M.fmtDate(f.date)}${hasRange ? ` ${f.from}-${f.to}` : ''}</div>
        ${reasons.length ? `<div class="small" style="color:var(--red)">${esc(reasons.join(' · '))}</div>` : ''}
        ${canBook ? `<a class="btn btn-sm" style="margin-top:6px" href="${href}">จองห้องนี้</a>` : ''}
      </div>`;
    });
    $('#results').innerHTML = (hasRange ? '' : '<p class="muted small" style="margin-top:0">เลือกช่วงเวลาเพื่อตรวจสอบว่าห้องว่างหรือไม่</p>') + out.join('');
  }

  /* ---------- การ์ดสถานะปัจจุบัน ---------- */
  function renderRoomCards() {
    const now = M.nowMin(), td = M.today();
    $('#roomCards').innerHTML = visibleRooms().map((r) => {
      const todays = M.bookingsOn(td, r.id).sort((a, b) => a.start.localeCompare(b.start));
      const cur = todays.find((b) => M.toMin(b.start) <= now && now < M.toMin(b.end));
      let cls = '', nowTxt;
      if (!r.open) { cls = 'off'; nowTxt = 'ยังไม่เปิดให้จอง'; }
      else if (cur) { cls = 'busy'; nowTxt = 'ไม่ว่าง'; }
      else { nowTxt = 'ว่าง'; }
      const dim = roomMatches(r) ? '' : ' dim';
      return `<div class="card room-card ${cls}${dim}" style="--room:${M.roomColor(r)}">
        <div class="room-photo-wrap"><img class="room-photo" src="${M.roomPhoto(r)}" alt="${esc(r.name)}"><span class="room-no">${esc(M.roomNo(r))}</span></div>
        <div class="room-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
            <div><h2 class="room-title" style="margin:0">${esc(r.name)}</h2><div class="muted small">ห้องประชุม ${esc(r.capacityLabel)}</div><div class="muted small">📍 ${esc(r.floor)}</div></div>
            <span class="pill status-tag ${cls === 'busy' || cls === 'off' ? 'tag-no' : 'tag-ok'}">${nowTxt}</span>
          </div>
          <div class="amenities">${r.amenities.map((a) => `<span>${esc(a)}</span>`).join('')}</div>
          ${r.open ? `<div><a class="btn btn-sm btn-room" href="booking.html?room=${r.id}">จองห้องนี้</a></div>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  /* ---------- ปฏิทิน ---------- */
  function slotCell(r, date, t, bk, compact) {
    const td = M.today();
    const isPast = date < td || (date === td && M.toMin(t) + M.SLOT_MIN <= M.nowMin());
    const f = state.f;
    const inRange = f.from && f.to && date === f.date && M.toMin(t) >= M.toMin(f.from) && M.toMin(t) < M.toMin(f.to);
    if (!r.open) return `<div class="slot off" title="ยังไม่เปิดให้จอง"></div>`;
    if (bk) {
      const isStart = bk.start === t || (M.toMin(bk.start) < M.toMin(M.OPEN_TIME) && t === M.OPEN_TIME);
      const mine = user && bk.userId === user.id;
      const firstMin = Math.max(M.toMin(bk.start), M.toMin(M.OPEN_TIME));
      const n = (M.toMin(t) - firstMin) / M.SLOT_MIN; // ช่องที่เท่าไรของการจองนี้ (0 = ช่องแรก)
      // รายวัน: เวลา+หัวข้อ · รายสัปดาห์ (ช่องแคบ): หัวข้อ / เวลา — ข้อมูลผู้จองดูได้เมื่อคลิก
      const lines = compact ? [`<b>${esc(bk.purpose)}</b>`, `<span class="who">${bk.start}-${bk.end}</span>`]
        : [`<b>${bk.start}-${bk.end}</b> ${esc(bk.purpose)}`];
      const label = lines[n] || '';
      return `<div class="slot busy ${isStart ? 'start' : ''} ${mine ? 'mine' : ''}" data-bid="${bk.id}">${label}</div>`;
    }
    if (isPast) return `<div class="slot off past"></div>`;
    return `<div class="slot ${inRange ? 'match' : ''}" data-room="${r.id}" data-date="${date}" data-time="${t}" title="ว่าง — คลิกเพื่อจอง">ว่าง</div>`;
  }
  const bookingAt = (list, t) => list.find((b) => M.toMin(b.start) <= M.toMin(t) && M.toMin(t) < M.toMin(b.end));

  function renderDay() {
    const date = M.iso(state.date);
    const rooms = visibleRooms();
    $('#calTitle').textContent = M.fmtDateLong(date);
    let html = `<div class="timeline" style="grid-template-columns:70px repeat(${rooms.length}, minmax(140px,1fr))"><div class="th">เวลา</div>`;
    html += rooms.map((r) => `<div class="th th-room" style="--room:${M.roomColor(r)};${roomMatches(r) ? '' : 'opacity:.45'}">${esc(r.name)}<div class="muted small" style="font-weight:400">${esc(r.capacityLabel)}${r.open ? '' : ' · ยังไม่เปิด'}</div></div>`).join('');
    const lists = rooms.map((r) => M.bookingsOn(date, r.id));
    M.slots().forEach((t) => {
      html += `<div class="time">${t}</div>`;
      rooms.forEach((r, i) => { html += slotCell(r, date, t, bookingAt(lists[i], t)); });
    });
    $('#calendar').innerHTML = html + '</div>';
  }

  function renderWeek() {
    const r = M.room(state.weekRoom);
    const ws = M.startOfWeek(state.date);
    const days = [...Array(7)].map((_, i) => M.addDays(ws, i));
    $('#calTitle').textContent = `${M.fmtDate(M.iso(days[0]))} – ${M.fmtDate(M.iso(days[6]))}`;
    let html = `<div class="timeline" style="grid-template-columns:70px repeat(7, minmax(92px,1fr))"><div class="th">เวลา</div>`;
    html += days.map((d) => `<div class="th" style="${M.iso(d) === M.today() ? 'color:var(--green-700)' : ''}">${M.fmtDow(d)}<div class="muted small" style="font-weight:400">${d.getDate()}/${d.getMonth() + 1}</div></div>`).join('');
    const lists = days.map((d) => M.bookingsOn(M.iso(d), r.id));
    M.slots().forEach((t) => {
      html += `<div class="time">${t}</div>`;
      days.forEach((d, i) => { html += slotCell(r, M.iso(d), t, bookingAt(lists[i], t), true); });
    });
    $('#calendar').innerHTML = html + '</div>';
  }

  function renderMonth() {
    const first = new Date(state.date.getFullYear(), state.date.getMonth(), 1);
    const start = M.startOfWeek(first);
    $('#calTitle').textContent = M.fmtMonth(first);
    const totalMin = M.toMin(M.CLOSE_TIME) - M.toMin(M.OPEN_TIME);
    let html = '<div class="month">' + ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map((d) => `<div class="dow">${d}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = M.addDays(start, i);
      const ds = M.iso(d);
      const other = d.getMonth() !== first.getMonth();
      if (i >= 35 && other) break;
      const bars = visibleRooms().map((r) => {
        if (!r.open) return `<span class="bar off" style="--room:${M.roomColor(r)}" title="${esc(r.name)} ยังไม่เปิดให้จอง">${esc(r.name.replace('ห้องประชุม', 'ห้อง'))}: ปิด</span>`;
        const list = M.bookingsOn(ds, r.id);
        const used = list.reduce((s, b) => s + (M.toMin(b.end) - M.toMin(b.start)), 0);
        const cls = !list.length ? 'free' : used >= totalMin ? 'full' : 'part';
        const txt = !list.length ? 'ว่าง' : used >= totalMin ? 'เต็ม' : `จอง ${list.length}`;
        return `<span class="bar ${cls}" style="--room:${M.roomColor(r)}" title="${esc(r.name)}">${esc(r.name.replace('ห้องประชุม', 'ห้อง'))}: ${txt}</span>`;
      }).join('');
      html += `<div class="day ${other ? 'other' : ''} ${ds === M.today() ? 'today' : ''}" data-day="${ds}"><span class="num">${d.getDate()}</span>${bars}</div>`;
    }
    $('#calendar').innerHTML = html + '</div>';
  }

  function renderCalendar() {
    $$('#viewSwitch button').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));
    $('#weekRoom').classList.toggle('hidden', state.view !== 'week');
    ({ day: renderDay, week: renderWeek, month: renderMonth })[state.view]();
  }
  function renderAll() { renderRoomCards(); renderResults(); renderCalendar(); }

  $('#viewSwitch').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    state.view = b.dataset.view; renderCalendar();
  });
  $('#weekRoom').addEventListener('change', (e) => { state.weekRoom = Number(e.target.value); renderCalendar(); });
  function shift(dir) {
    const d = new Date(state.date);
    if (state.view === 'day') d.setDate(d.getDate() + dir);
    else if (state.view === 'week') d.setDate(d.getDate() + 7 * dir);
    else { d.setDate(1); d.setMonth(d.getMonth() + dir); }
    state.date = d; renderCalendar();
  }
  $('#prev').addEventListener('click', () => shift(-1));
  $('#next').addEventListener('click', () => shift(1));
  $('#goToday').addEventListener('click', () => { state.date = M.parseISO(M.today()); renderCalendar(); });

  /* ---------- hover: แสดงหัวข้อ ผู้จอง และแผนก ---------- */
  const tipEl = document.createElement('div');
  tipEl.className = 'slot-tip'; tipEl.hidden = true; document.body.appendChild(tipEl);
  let tipBid = null;
  function placeTip(e) {
    const pad = 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > innerWidth - 8) x = e.clientX - w - pad;
    if (y + h > innerHeight - 8) y = e.clientY - h - pad;
    tipEl.style.left = Math.max(8, x) + 'px'; tipEl.style.top = Math.max(8, y) + 'px';
  }
  $('#calendar').addEventListener('mousemove', (e) => {
    const cell = e.target.closest('.slot[data-bid]');
    if (!cell) { tipEl.hidden = true; tipBid = null; return; }
    if (cell.dataset.bid !== tipBid) {
      tipBid = cell.dataset.bid;
      const b = M.data.bookings.find((x) => x.id === Number(tipBid));
      if (!b) return;
      tipEl.innerHTML = `<div class="t-topic">${esc(b.purpose)}</div>
        <div class="t-time">${M.roomTag(M.room(b.roomId))} · ${b.start}–${b.end} น.</div>
        <dl><dt>ผู้จอง</dt><dd>${esc(b.name)}${isMine(b) ? ' (คุณ)' : ''}</dd><dt>แผนก</dt><dd>${esc(b.department)}</dd></dl>
        <div class="t-hint">คลิกเพื่อดูรายละเอียด</div>`;
      tipEl.hidden = false;
    }
    placeTip(e);
  });
  $('#calendar').addEventListener('mouseleave', () => { tipEl.hidden = true; tipBid = null; });

  $('#calendar').addEventListener('click', (e) => {
    tipEl.hidden = true; tipBid = null;
    const day = e.target.closest('[data-day]');
    if (day) { state.date = M.parseISO(day.dataset.day); state.view = 'day'; renderCalendar(); return; }
    const free = e.target.closest('.slot[data-time]');
    if (free) {
      const end = M.fromMin(Math.min(M.toMin(free.dataset.time) + 60, M.toMin(M.CLOSE_TIME)));
      location.href = `booking.html?room=${free.dataset.room}&date=${free.dataset.date}&start=${free.dataset.time}&end=${end}`;
      return;
    }
    const busy = e.target.closest('.slot[data-bid]');
    if (busy) {
      const b = M.data.bookings.find((x) => x.id === Number(busy.dataset.bid));
      if (isAdmin || isMine(b)) {
        M.modal(M.bookingDetailHTML(b));
      } else {
        M.modal(`<h2>ไม่ว่าง</h2><dl class="kv"><dt>ห้อง</dt><dd>${M.roomTag(M.room(b.roomId))}</dd><dt>วันที่</dt><dd>${M.fmtDateLong(b.date)}</dd>
          <dt>เวลา</dt><dd>${b.start} – ${b.end} น.</dd>
          <dt>ผู้จอง</dt><dd>${esc(b.name)}</dd>
          <dt>แผนก</dt><dd>${esc(b.department)}</dd>
          <dt>เบอร์โทรศัพท์</dt><dd>${esc(b.phone)}</dd>
          <dt>วัตถุประสงค์</dt><dd>${esc(b.purpose)}</dd>
          ${b.attendees ? `<dt>ผู้เข้าร่วม</dt><dd>${b.attendees} คน</dd>` : ''}</dl>
          <p class="muted small">ช่วงเวลานี้มีการจองแล้ว หากต้องการใช้ห้อง สามารถติดต่อผู้จองได้โดยตรง</p>
          <div class="foot"><button class="btn btn-ghost" data-close>ปิด</button></div>`);
      }
    }
  });

  if (!['day', 'week', 'month'].includes(state.view)) state.view = 'day';
  renderAll();
})();
