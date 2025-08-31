document.addEventListener('DOMContentLoaded', () => {
    /* ---------- Helpers ---------- */
    function showToast(msg) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 1600);
    }
    function pad(n) { return String(n).padStart(2, '0'); }
    function to24(hour, minute, ampm) {
        let h = Number(hour) % 12;
        if (ampm === 'PM') h += 12;
        return h * 60 + Number(minute);
    }
    function fmtMins(total) {
        const h24 = Math.floor(total / 60);
        const m = total % 60;
        const ampm = h24 >= 12 ? 'PM' : 'AM';
        let h12 = h24 % 12; if (h12 === 0) h12 = 12;
        return `${h12}:${pad(m)} ${ampm}`;
    }
    function nowInfo() {
        const d = new Date();
        return { dayIdx: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }

    /* ---------- State ---------- */
    let timetable = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [] };
    let goals = []; // {text, done}
    let editingIndex = -1;
    let currentDay = 'monday';

    /* ---------- DOM refs ---------- */
    const startHour = document.getElementById('start-hour');
    const startMinute = document.getElementById('start-minute');
    const endHour = document.getElementById('end-hour');
    const endMinute = document.getElementById('end-minute');
    const startAmpm = document.getElementById('start-ampm');
    const endAmpm = document.getElementById('end-ampm');
    const subjectInput = document.getElementById('subject');
    const daySelect = document.getElementById('day');
    const timetableBody = document.getElementById('timetable-body');
    const dayHeading = document.getElementById('day-heading');
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const submitBtn = document.getElementById('submit-btn');

    const clearDayBtn = document.getElementById('clear-day');
    const exportBtn = document.getElementById('export-data');
    const importInput = document.getElementById('import-data');
    const resetAllBtn = document.getElementById('reset-all');

    const goalsListEl = document.getElementById('goals-list');
    const goalForm = document.getElementById('goal-form');
    const newGoalInput = document.getElementById('new-goal');

    /* ---------- Feather icons (render after DOM ready) ---------- */
    if (window.feather) feather.replace();

    /* ---------- Dark mode ---------- */
    const darkToggle = document.getElementById('dark-mode-toggle');
    function setDark(isDark) {
        document.body.classList.toggle('dark-mode', isDark);
        darkToggle.innerHTML = isDark ? '<i data-feather="sun"></i>' : '<i data-feather="moon"></i>';
        if (window.feather) feather.replace();
        localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
    }
    const savedMode = localStorage.getItem('darkMode');
    setDark(savedMode ? savedMode === 'dark' : false);
    darkToggle.addEventListener('click', () => setDark(!document.body.classList.contains('dark-mode')));

    /* ---------- Populate time selects ---------- */
    function populateTimeDropdowns() {
        startHour.innerHTML = '<option value="" disabled selected>Hour</option>';
        endHour.innerHTML = '<option value="" disabled selected>Hour</option>';
        for (let h = 1; h <= 12; h++) { const o = document.createElement('option'); o.value = h; o.textContent = h; startHour.appendChild(o); endHour.appendChild(o.cloneNode(true)); }

        startMinute.innerHTML = '<option value="" disabled selected>Min</option>';
        endMinute.innerHTML = '<option value="" disabled selected>Min</option>';
        for (let m = 0; m < 60; m++) { const val = pad(m); const o = document.createElement('option'); o.value = val; o.textContent = val; startMinute.appendChild(o); endMinute.appendChild(o.cloneNode(true)); }
    }
    populateTimeDropdowns();

    /* ---------- Persistence ---------- */
    function saveAll() {
        localStorage.setItem('timetable', JSON.stringify(timetable));
        localStorage.setItem('goals', JSON.stringify(goals));
    }
    function loadAll() {
        const t = localStorage.getItem('timetable');
        const g = localStorage.getItem('goals');
        if (t) timetable = JSON.parse(t);
        if (g) {
            const parsed = JSON.parse(g);
            goals = parsed.map(x => typeof x === 'string' ? { text: x, done: false } : x);
        }
    }
    loadAll();

    /* ---------- Render ---------- */
    function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function renderGoals() {
        goalsListEl.innerHTML = '';
        goals.forEach((g, i) => {
            const li = document.createElement('li'); li.className = 'goal-item';
            const chk = document.createElement('button'); chk.className = 'goal-check' + (g.done ? ' checked' : '');
            chk.innerHTML = g.done ? '✓' : '';
            chk.addEventListener('click', () => { goals[i].done = !goals[i].done; saveAll(); renderGoals(); });

            const text = document.createElement('div'); text.className = 'goal-text' + (g.done ? ' done' : ''); text.textContent = g.text;

            const actions = document.createElement('div'); actions.className = 'goal-actions';
            const edit = document.createElement('button'); edit.className = 'btn small'; edit.innerHTML = '<i data-feather="edit-2"></i> Edit';
            edit.addEventListener('click', () => {
                const v = prompt('Edit goal', g.text);
                if (v !== null) { const t = v.trim(); if (t) { goals[i].text = t; saveAll(); renderGoals(); showToast('Goal updated.'); } }
            });
            const del = document.createElement('button'); del.className = 'btn small danger'; del.innerHTML = '<i data-feather="trash"></i> Delete';
            del.addEventListener('click', () => { if (confirm('Delete goal?')) { goals.splice(i, 1); saveAll(); renderGoals(); showToast('Goal deleted.'); } });

            actions.append(edit, del);
            li.append(chk, text, actions);
            goalsListEl.appendChild(li);
        });
        if (window.feather) feather.replace();
    }

    function renderDay(day) {
        currentDay = day;
        daySelect.value = day;
        dayHeading.textContent = day.charAt(0).toUpperCase() + day.slice(1);
        tabs.forEach(t => t.classList.toggle('active', t.dataset.day === day));

        // sort entries by start
        timetable[day].sort((a, b) => a.startMins - b.startMins);

        timetableBody.innerHTML = '';
        const now = nowInfo();
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.dayIdx];

        timetable[day].forEach((entry, idx) => {
            const tr = document.createElement('tr');
            const isNow = day === dayName && now.mins >= entry.startMins && now.mins < entry.endMins;
            if (isNow) tr.classList.add('highlight');

            tr.innerHTML = `
        <td>${fmtMins(entry.startMins)} – ${fmtMins(entry.endMins)} ${isNow ? '<span class="badge-now">Now</span>' : ''}</td>
        <td>${escapeHtml(entry.subject)}</td>
        <td>
          <div class="row-actions">
            <button class="btn small" data-action="edit"><i data-feather="edit-2"></i> Edit</button>
            <button class="btn small danger" data-action="delete"><i data-feather="trash"></i> Delete</button>
          </div>
        </td>
      `;

            tr.querySelector('[data-action="edit"]').addEventListener('click', () => editSubject(day, idx));
            tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
                if (!confirm('Delete this entry?')) return;
                timetable[day].splice(idx, 1); saveAll(); renderDay(day); showToast('Entry deleted.');
            });

            timetableBody.appendChild(tr);
        });

        if (window.feather) feather.replace();
    }

    /* ---------- Form handling: add/edit subjects ---------- */
    document.getElementById('subject-form').addEventListener('submit', ev => {
        ev.preventDefault();
        const day = daySelect.value;
        const sh = startHour.value, sm = startMinute.value, sap = startAmpm.value;
        const eh = endHour.value, em = endMinute.value, eap = endAmpm.value;
        const subject = subjectInput.value.trim();
        if (!sh || !sm || !eh || !em || !subject) { showToast('Fill required fields.'); return; }

        const startMins = to24(sh, sm, sap);
        const endMins = to24(eh, em, eap);
        if (endMins <= startMins) { showToast('End must be after start.'); return; }

        // overlap check
        const list = timetable[day];
        const overlap = list.some((it, i) => {
            if (editingIndex !== -1 && i === editingIndex) return false;
            return startMins < it.endMins && endMins > it.startMins;
        });
        if (overlap) { showToast('Time overlaps existing entry.'); return; }

        const item = { startMins, endMins, subject };
        if (editingIndex === -1) { list.push(item); showToast('Added.'); }
        else { list[editingIndex] = item; editingIndex = -1; submitBtn.querySelector('span').textContent = ' Add Subject'; showToast('Updated.'); }

        ev.target.reset();
        saveAll(); renderDay(day);
    });

    function editSubject(day, index) {
        editingIndex = index;
        const it = timetable[day][index];
        daySelect.value = day;

        // convert startMins back to hour/min/ampm
        let sh24 = Math.floor(it.startMins / 60), sm = it.startMins % 60;
        let eh24 = Math.floor(it.endMins / 60), em = it.endMins % 60;

        const sAmp = sh24 >= 12 ? 'PM' : 'AM'; let sHour = sh24 % 12; if (sHour === 0) sHour = 12;
        const eAmp = eh24 >= 12 ? 'PM' : 'AM'; let eHour = eh24 % 12; if (eHour === 0) eHour = 12;

        startHour.value = sHour; startMinute.value = pad(sm); startAmpm.value = sAmp;
        endHour.value = eHour; endMinute.value = pad(em); endAmpm.value = eAmp;
        subjectInput.value = it.subject;

        submitBtn.querySelector('span').textContent = ' Save Changes';
        showToast('Editing entry (save to apply).');
        renderDay(day);
    }

    /* ---------- Tab click ---------- */
    tabs.forEach(t => t.addEventListener('click', () => renderDay(t.dataset.day)));

    /* ---------- Clear / Export / Import / Reset ---------- */
    clearDayBtn.addEventListener('click', () => {
        if (!confirm(`Clear all entries for ${daySelect.value}?`)) return;
        timetable[daySelect.value] = [];
        saveAll(); renderDay(daySelect.value); showToast('Day cleared.');
    });

    exportBtn.addEventListener('click', () => {
        const data = { timetable, goals };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'timetable_data.json'; a.click();
        URL.revokeObjectURL(a.href); showToast('Exported.');
    });

    importInput.addEventListener('change', async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        try {
            const txt = await f.text();
            const parsed = JSON.parse(txt);
            if (parsed.timetable && parsed.goals) {
                timetable = parsed.timetable;
                goals = parsed.goals.map(x => typeof x === 'string' ? { text: x, done: false } : x);
                saveAll(); renderDay(currentDay); renderGoals(); showToast('Imported.');
            } else showToast('Invalid file.');
        } catch (err) { console.error(err); showToast('Import failed.'); }
        e.target.value = '';
    });

    resetAllBtn.addEventListener('click', () => {
        if (!confirm('Reset all timetable and goals?')) return;
        timetable = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [] };
        goals = []; saveAll(); renderDay(currentDay); renderGoals(); showToast('All reset.');
    });

    /* ---------- Goals form ---------- */
    goalForm.addEventListener('submit', ev => {
        ev.preventDefault();
        const v = newGoalInput.value.trim();
        if (!v) { showToast('Enter a goal.'); return; }
        goals.push({ text: v, done: false });
        newGoalInput.value = ''; saveAll(); renderGoals(); showToast('Goal added.');
    });

    /* ---------- Current day/time display ---------- */
    const currentDayTimeEl = document.getElementById('current-day-time');
    function displayCurrentDayTime() {
        const d = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let h = d.getHours(); const m = pad(d.getMinutes());
        const am = h >= 12 ? 'PM' : 'AM';
        h = h % 12; if (h === 0) h = 12;
        currentDayTimeEl.textContent = `${days[d.getDay()]}, ${h}:${m} ${am}`;
    }
    displayCurrentDayTime(); setInterval(displayCurrentDayTime, 60000);

    /* ---------- Init ---------- */
    // default to today (if within mon-sat)
    const todayIdx = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const defaultDay = dayNames[todayIdx] && ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(dayNames[todayIdx]) ? dayNames[todayIdx] : 'monday';
    renderDay(defaultDay);
    renderGoals();

    // keep highlight updated every minute
    setInterval(() => renderDay(currentDay), 60000);

    // ensure feather icons render for dynamic parts
    if (window.feather) feather.replace();
});
