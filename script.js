/* =========================
   Utilities
========================= */
// Time helpers
function to24h(hour, minute, ampm){
  let h = parseInt(hour,10)%12;
  if(ampm === 'PM') h += 12;
  return {h, m: parseInt(minute,10)};
}
function minsSinceMidnight(hour, minute, ampm){
  const {h,m} = to24h(hour, minute, ampm);
  return h*60 + m;
}
function fmt12h(totalMins){
  const h24 = Math.floor(totalMins/60);
  const m = totalMins%60;
  const ampm = h24>=12 ? 'PM':'AM';
  let h12 = h24%12; if(h12===0) h12=12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1800);
}
function nowInfo(){
  const d = new Date();
  const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const day = days[d.getDay()];
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours>=12 ? 'PM':'AM';
  const h12 = (hours%12) || 12;
  return {day, timeLabel: `${h12}:${String(minutes).padStart(2,'0')} ${ampm}`, totalMins: hours*60+minutes};
}

/* =========================
   State & Persistence
========================= */
let timetable = {
  monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: []
};
let goals = []; // {text, done}

let editingIndex = -1;
let currentDay = 'monday';

function saveAll(){
  localStorage.setItem('timetable', JSON.stringify(timetable));
  localStorage.setItem('goals', JSON.stringify(goals));
}
function loadAll(){
  const t = localStorage.getItem('timetable');
  const g = localStorage.getItem('goals');
  if(t) timetable = JSON.parse(t);
  if(g){
    const parsed = JSON.parse(g);
    goals = parsed.map(x => typeof x === 'string' ? {text:x, done:false} : x);
  }
}

/* =========================
   DOM Refs
========================= */
const currentDayTimeEl = document.getElementById('current-day-time');
const dayHeadingEl = document.getElementById('day-heading');
const timetableBodyEl = document.getElementById('timetable-body');
const tabs = [...document.querySelectorAll('.tab')];
const darkToggle = document.getElementById('dark-mode-toggle');

const startHour = document.getElementById('start-hour');
const startMinute = document.getElementById('start-minute');
const startAmpm = document.getElementById('start-ampm');
const endHour = document.getElementById('end-hour');
const endMinute = document.getElementById('end-minute');
const endAmpm = document.getElementById('end-ampm');
const subjectInput = document.getElementById('subject');
const daySelect = document.getElementById('day');
const submitBtn = document.getElementById('submit-btn');

const clearDayBtn = document.getElementById('clear-day');
const exportBtn = document.getElementById('export-data');
const importInput = document.getElementById('import-data');
const resetAllBtn = document.getElementById('reset-all');

const goalForm = document.getElementById('goal-form');
const newGoalInput = document.getElementById('new-goal');
const goalsListEl = document.getElementById('goals-list');

/* =========================
   Current Day/Time in Navbar
========================= */
function displayCurrentDayTime(){
  const d = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  let h = d.getHours(), m = String(d.getMinutes()).padStart(2,'0');
  const ampm = h>=12 ? 'PM':'AM'; h = h%12; if(h===0) h = 12;
  currentDayTimeEl.textContent = `${days[d.getDay()]}, ${h}:${m} ${ampm}`;
}
displayCurrentDayTime();
setInterval(displayCurrentDayTime, 60000);

/* =========================
   Dark Mode
========================= */
function setDarkMode(isDark){
  document.body.classList.toggle('dark-mode', isDark);
  darkToggle.innerHTML = isDark ? '<i data-feather="sun"></i>' : '<i data-feather="moon"></i>';
  feather.replace();
  localStorage.setItem('darkMode', isDark ? 'dark':'light');
}
const savedMode = localStorage.getItem('darkMode');
setDarkMode(savedMode ? savedMode==='dark' : false);
darkToggle.addEventListener('click', ()=> setDarkMode(!document.body.classList.contains('dark-mode')));

/* =========================
   Time Dropdowns
========================= */
function populateTimeDropdowns(){
  const hours = Array.from({length:12}, (_,i)=>i+1);
  const minutes = Array.from({length:60}, (_,i)=>String(i).padStart(2,'0'));
  [startHour, endHour].forEach(sel=>{
    sel.innerHTML = '<option value="" disabled selected>Hour</option>';
    hours.forEach(h=>{
      const o = document.createElement('option'); o.value=h; o.textContent=h; sel.appendChild(o);
    });
  });
  [startMinute, endMinute].forEach(sel=>{
    sel.innerHTML = '<option value="" disabled selected>Min</option>';
    minutes.forEach(m=>{
      const o = document.createElement('option'); o.value=m; o.textContent=m; sel.appendChild(o);
    });
  });
}
populateTimeDropdowns();

/* =========================
   Rendering: Timetable
========================= */
function sortByStart(a,b){ return a.startMins - b.startMins; }

function renderDay(day){
  currentDay = day;
  dayHeadingEl.textContent = day.charAt(0).toUpperCase()+day.slice(1);
  daySelect.value = day;
  tabs.forEach(t=>t.classList.toggle('active', t.dataset.day===day));

  // sort
  timetable[day].sort(sortByStart);

  // build rows
  timetableBodyEl.innerHTML = '';
  const now = nowInfo();
  timetable[day].forEach((entry, index)=>{
    const tr = document.createElement('tr');

    const isNow = (day===now.day) && (now.totalMins>=entry.startMins) && (now.totalMins<entry.endMins);
    if(isNow) tr.classList.add('highlight');

    tr.innerHTML = `
      <td>
        ${fmt12h(entry.startMins)} – ${fmt12h(entry.endMins)}
        ${isNow ? '<span class="badge-now">Now</span>' : ''}
      </td>
      <td>${escapeHtml(entry.subject)}</td>
      <td>
        <div class="row-actions">
          <button class="btn small" aria-label="Edit" data-action="edit"><i data-feather="edit-2"></i>Edit</button>
          <button class="btn small danger" aria-label="Delete" data-action="delete"><i data-feather="trash"></i>Delete</button>
        </div>
      </td>
    `;
    tr.addEventListener('click', (e)=>{
      const action = e.target.closest('button')?.dataset.action;
      if(!action) return;
      if(action==='edit') editSubject(day, index);
      if(action==='delete') deleteSubject(day, index);
    });
    timetableBodyEl.appendChild(tr);
  });
  feather.replace();
}

function escapeHtml(str){
  const div = document.createElement('div'); div.textContent = str; return div.innerHTML;
}

/* =========================
   Add / Edit / Delete
========================= */
document.getElementById('subject-form').addEventListener('submit', (e)=>{
  e.preventDefault();

  const day = daySelect.value;
  const sh = startHour.value, sm = startMinute.value, sap = startAmpm.value;
  const eh = endHour.value, em = endMinute.value, eap = endAmpm.value;
  const subject = subjectInput.value.trim();

  if(!day || !sh || !sm || !eh || !em || !subject){
    showToast('Please fill all required fields.');
    return;
  }

  const startMins = minsSinceMidnight(sh, sm, sap);
  const endMins = minsSinceMidnight(eh, em, eap);

  if(endMins <= startMins){
    showToast('End time must be after start time.');
    return;
  }

  // Overlap check
  const list = timetable[day];
  const overlaps = list.some((item, idx)=>{
    if(editingIndex!==-1 && idx===editingIndex) return false;
    // Overlap if start < otherEnd && end > otherStart
    return startMins < item.endMins && endMins > item.startMins;
  });

  if(overlaps){
    showToast('Time overlaps an existing entry.');
    return;
  }

  const newEntry = { startMins, endMins, subject };

  if(editingIndex === -1){
    list.push(newEntry);
    showToast('Subject added.');
  }else{
    list[editingIndex] = newEntry;
    editingIndex = -1;
    submitBtn.querySelector('span').textContent = 'Add Subject';
    showToast('Subject updated.');
  }

  // Reset form
  e.target.reset();
  saveAll();
  renderDay(day);
});

function editSubject(day, index){
  editingIndex = index;
  const item = timetable[day][index];
  daySelect.value = day;

  // back-calc times
  const sh = Math.floor(item.startMins/60);
  const sm = item.startMins%60;
  const eh = Math.floor(item.endMins/60);
  const em = item.endMins%60;

  // set start
  const s_ampm = sh>=12 ? 'PM':'AM';
  let s_h = sh%12; if(s_h===0) s_h=12;
  startHour.value = s_h;
  startMinute.value = String(sm).padStart(2,'0');
  startAmpm.value = s_ampm;

  // set end
  const e_ampm = eh>=12 ? 'PM':'AM';
  let e_h = eh%12; if(e_h===0) e_h=12;
  endHour.value = e_h;
  endMinute.value = String(em).padStart(2,'0');
  endAmpm.value = e_ampm;

  subjectInput.value = item.subject;

  submitBtn.querySelector('span').textContent = 'Save Changes';
  showToast('Editing entry…');
  window.scrollTo({top: document.getElementById('timetable-section').offsetTop - 60, behavior:'smooth'});
}

function deleteSubject(day, index){
  if(!confirm('Delete this entry?')) return;
  timetable[day].splice(index,1);
  saveAll();
  renderDay(day);
  showToast('Entry deleted.');
}

/* =========================
   Tabs / Day selection
========================= */
tabs.forEach(btn=>{
  btn.addEventListener('click', ()=> renderDay(btn.dataset.day));
});

/* =========================
   Import / Export / Clear / Reset
========================= */
clearDayBtn.addEventListener('click', ()=>{
  if(!confirm(`Clear all entries for ${dayHeadingEl.textContent}?`)) return;
  timetable[currentDay] = [];
  saveAll();
  renderDay(currentDay);
  showToast('Day cleared.');
});

exportBtn.addEventListener('click', ()=>{
  const data = { timetable, goals };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'timetable_manager_data.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported.');
});

importInput.addEventListener('change', async (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  try{
    const text = await file.text();
    const data = JSON.parse(text);
    if(data.timetable && data.goals){
      timetable = data.timetable;
      goals = data.goals.map(x => typeof x === 'string' ? {text:x, done:false} : x);
      saveAll();
      renderDay(currentDay);
      renderGoals();
      showToast('Data imported.');
    }else{
      showToast('Invalid file.');
    }
  }catch(err){
    console.error(err);
    showToast('Import failed.');
  }finally{
    e.target.value = '';
  }
});

resetAllBtn.addEventListener('click', ()=>{
  if(!confirm('This will remove all timetable entries and goals. Continue?')) return;
  timetable = { monday:[], tuesday:[], wednesday:[], thursday:[], friday:[], saturday:[] };
  goals = [];
  saveAll();
  renderDay(currentDay);
  renderGoals();
  showToast('All data reset.');
});

/* =========================
   Goals
========================= */
function goalItemTemplate(goal, idx){
  const li = document.createElement('li');
  li.className = 'goal-item';

  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'goal-check' + (goal.done ? ' checked':'');
  check.innerHTML = goal.done ? '✓' : '';
  check.addEventListener('click', ()=>{
    goals[idx].done = !goals[idx].done;
    saveAll(); renderGoals();
  });

  const text = document.createElement('div');
  text.className = 'goal-text' + (goal.done ? ' done':'');
  text.textContent = goal.text;

  const actions = document.createElement('div');
  actions.className = 'goal-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn small';
  editBtn.innerHTML = '<i data-feather="edit-2"></i>Edit';
  editBtn.addEventListener('click', ()=>{
    const updated = prompt('Edit goal', goals[idx].text);
    if(updated!==null){
      const trimmed = updated.trim();
      if(trimmed){
        goals[idx].text = trimmed;
        saveAll(); renderGoals(); showToast('Goal updated.');
      }
    }
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'btn small danger';
  delBtn.innerHTML = '<i data-feather="trash"></i>Delete';
  delBtn.addEventListener('click', ()=>{
    if(!confirm('Delete this goal?')) return;
    goals.splice(idx,1);
    saveAll(); renderGoals(); showToast('Goal deleted.');
  });

  actions.append(editBtn, delBtn);
  li.append(check, text, actions);
  return li;
}

function renderGoals(){
  goalsListEl.innerHTML = '';
  goals.forEach((g,i)=> goalsListEl.appendChild(goalItemTemplate(g,i)));
  feather.replace();
}

goalForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const text = newGoalInput.value.trim();
  if(!text){ showToast('Please enter a goal.'); return; }
  goals.push({text, done:false});
  newGoalInput.value = '';
  saveAll(); renderGoals(); showToast('Goal added.');
});

/* =========================
   Init
========================= */
function init(){
  loadAll();

  // Auto-select today's tab
  const {day} = nowInfo();
  const today = ['monday','tuesday','wednesday','thursday','friday','saturday'].includes(day) ? day : 'monday';
  renderDay(today);

  // Feather icons initial render
  feather.replace();

  // Keep current-row highlight fresh each minute
  setInterval(()=> renderDay(currentDay), 60000);

  renderGoals();
}
init();
