'use strict';
const ORIGINAL_DAYS=[
{name:'Груди + трицепс',ex:[['Жим гантелей лежачи',8,3,10,12,75,'pair'],['Жим гантелей на похилій лавці 20–30°',6,3,10,12,75,'pair'],['Віджимання від лавки або підлоги',0,2,8,12,60,'body'],['Розгинання руки з-за голови',4,2,10,12,45,'single'],['Французький жим гантелей лежачи',3,2,10,12,60,'pair']]},
{name:'Спина + біцепс',ex:[['Тяга гантелі однією рукою',9,3,10,12,60,'single'],['Тяга двох гантелей у нахилі',7,3,10,12,75,'pair'],['Зворотні розведення у нахилі',2,2,12,15,45,'pair'],['Згинання рук на біцепс стоячи',5,3,10,12,60,'pair'],['Молоткові згинання',5,2,10,12,60,'pair']]},
{name:'Ноги + прес',ex:[['Присідання з гантеллю біля грудей',10,3,10,12,75,'single'],['Румунська тяга',8,3,10,12,75,'pair'],['Випади назад',4,2,8,10,60,'pair'],['Підйом на носки',7,2,15,20,45,'pair'],['Зворотні скручування',0,2,12,15,30,'body'],['Планка (секунди)',0,2,25,40,30,'time']]},
{name:'Груди + плечі',ex:[['Жим лежачи нейтральним хватом',7,3,10,12,75,'pair'],['Жим гантелей сидячи',5,3,8,12,75,'pair'],['Підйом гантелей через сторони',2,3,12,15,45,'pair'],['Розведення гантелей лежачи',3,2,12,15,60,'pair'],['Зворотні розведення на похилій лавці',2,2,12,15,45,'pair']]},
{name:'Спина + руки',ex:[['Тяга гантелі однією рукою',9,3,10,12,60,'single'],['Тяга двох гантелей у нахилі',7,2,10,12,75,'pair'],['Згинання рук на похилій лавці',4,2,10,12,60,'pair'],['Молоткові згинання',5,2,10,12,60,'pair'],['Розгинання рук із гантелями лежачи',3,3,10,12,60,'pair']]},
{name:'Кардіо + прес',ex:[['Швидка ходьба (хвилини)',0,1,20,25,0,'time'],['Dead bug (на бік)',0,2,10,10,30,'body'],['Зворотні скручування',0,2,12,15,30,'body'],['Бічна планка (секунди на бік)',0,2,20,30,30,'time'],['Мобільність (хвилини)',0,1,3,5,0,'time']]},
{name:'Відновлення',ex:[]}
];
// Keep the original exercise order for records saved before the plan changed.
const DAYS = ORIGINAL_DAYS.slice();
DAYS[2] = {
  name: 'Прес + стабілізація',
  ex: [ORIGINAL_DAYS[5].ex[1], ...ORIGINAL_DAYS[2].ex.slice(4), ORIGINAL_DAYS[5].ex[3]]
};
DAYS[5] = DAYS[6];

function sessionKey(date, dayIndex, short) {
  const revision = DAYS[dayIndex] === ORIGINAL_DAYS[dayIndex] ? '' : '_v2';
  return date + '_' + dayIndex + revision + (short ? '_short' : '');
}

const KEY='my-training-v1';let state;try{state=JSON.parse(localStorage.getItem(KEY))}catch{};state=state&&typeof state==='object'?state:{};state.logs ||= {};state.weights ||= [{date:localDate(),weight:93}];state.profile ||= {start:93,target:84,waist:'',pushups:''};state.startDate ||=localDate();let page='home',activeExercise=0,day=(new Date().getDay()+6)%7,sessionDate=localDate(),timerInterval=null,historyKey=null;

let shortMode = false;
const SHORT_EXERCISES = [[0, 2, 3], [0, 1, 3], [0, 2, 3], [0, 1, 2], [0, 2, 4], [], []];

const TECHNIQUES = [
  [["dumbbell-bench-press"], ["Ляж на рівну лавку. Постав стопи на підлогу, зведи лопатки й тримай гантелі над грудьми.", "Повільно опусти гантелі до боків грудей. Лікті спрямовуй трохи до тулуба, зап’ястки тримай над ліктями.", "Виштовхни гантелі знову над грудьми. Стопи та сідниці залишаються на опорі."]],
  [["dumbbell-incline-bench-press"], ["Підніми спинку лавки на 20–30°. Сядь, обіпрись спиною й підніми гантелі над верхом грудей.", "Опусти гантелі до боків верхньої частини грудей. Лікті залишай під зап’ястками.", "Вижми гантелі вгору. Не підтягуй плечі до вух."]],
  [["push-up", "incline-push-up"], ["Постав долоні трохи ширше плечей на стійку лавку або підлогу. Випрями тіло від голови до п’ят.", "Зігни лікті й наблизь груди до опори. Таз рухається разом із грудьми.", "Відштовхнись долонями до початкового положення."]],
  [["dumbbell-single-arm-overhead-tricep-extension"], ["Сядь або стань рівно. Підніми одну гантель над головою, лікоть спрямований вгору.", "Зігни лікоть і опусти гантель за голову в комфортному діапазоні. Плече залишається на місці.", "Випрями руку без ривка. Виконай підхід і другою рукою."]],
  [["dumbbell-skullcrusher"], ["Ляж на лавку й підніми гантелі над плечима долонями одна до одної.", "Зігни лікті, опускаючи гантелі по боках голови. Верхню частину рук тримай майже нерухомо.", "Випрями лікті й поверни гантелі над плечі."]],
  [["dumbbell-single-arm-row"], ["Обіпрись вільною долонею на стійку лавку, нахили корпус. Гантель у другій руці вільно звисає під плечем.", "Потягни лікоть до таза. Не повертай грудну клітку вбік.", "Повільно опусти гантель і повтори другою рукою."]],
  [["dumbbell-row-bilateral"], ["Трохи зігни коліна, відведи таз назад і нахили корпус. Гантелі звисають під плечима.", "Потягни обидва лікті назад уздовж тулуба до рівня ребер.", "Повільно випрями руки, зберігаючи нахил і положення спини."]],
  [["dumbbell-rear-delt-fly"], ["Відведи таз назад і нахили корпус. Легкі гантелі звисають під плечима, лікті трохи зігнуті.", "Розведи руки в боки, поки вони приблизно зрівняються з тулубом. Не знизуй плечима.", "Плавно опусти руки, зберігаючи той самий кут у ліктях."]],
  [["dumbbell-curl"], ["Стань рівно, руки з гантелями вздовж тулуба, долоні вперед.", "Зігни лікті й підніми гантелі до плечей. Лікті залишаються біля боків.", "Повільно випрями руки. Не розгойдуй корпус."]],
  [["dumbbell-hammer-curl"], ["Стань рівно, гантелі біля стегон. Долоні дивляться одна на одну.", "Зігни лікті, піднімаючи гантелі без повороту зап’ясть.", "Опусти гантелі до стегон, тримаючи лікті біля тулуба."]],
  [["reverse-crunch"], ["Ляж на спину, підніми ноги та зігни коліна приблизно під прямим кутом.", "Підкрути таз до ребер, щоб крижі трохи відірвалися від підлоги.", "Повільно опусти таз. Не підкидай ноги для розгону."]],
  [["forearm-plank"], ["Постав передпліччя на підлогу, лікті під плечима. Обіпрись на носки й підніми коліна.", "Тримай тіло в одній лінії, напруживши живіт і сідниці. Дихай рівно.", "Закінчи підхід, опустивши коліна на підлогу."]],
  [["dumbbell-seated-overhead-press"], ["Сядь на лавку зі спинкою, стопи на підлозі. Тримай гантелі на рівні плечей, лікті під зап’ястками.", "Виштовхни гантелі над головою, не відхиляючи корпус назад.", "Повільно поверни гантелі до рівня плечей."]],
  [["dumbbell-lateral-raise"], ["Стань рівно, гантелі біля стегон, лікті злегка зігнуті.", "Підніми руки через боки приблизно до рівня плечей. Корпус залишається нерухомим.", "Опусти гантелі повільно, зберігаючи невеликий згин у ліктях."]],
  [["dumbbell-chest-fly"], ["Ляж на рівну лавку й підніми гантелі над грудьми, долоні одна до одної, лікті трохи зігнуті.", "Плавно розведи руки в боки до комфортного розтягнення в грудях. Кут у ліктях майже не змінюється.", "Зведи руки по тій самій дузі над грудьми."]],
  [["dumbbell-laying-reverse-fly"], ["Ляж грудьми на похилу лавку. Легкі гантелі звисають униз, лікті трохи зігнуті.", "Розведи руки в боки приблизно до рівня тулуба.", "Повільно опусти гантелі, залишаючи груди на опорі."]],
  [["dumbbell-incline-curl"], ["Сядь на похилу лавку, спина на опорі. Руки з гантелями звисають з боків, долоні вперед.", "Зігни лікті, не виводячи плечі вперед.", "Плавно опусти гантелі до комфортного випрямлення рук."]],
  [["dead-bug"], ["Ляж на спину. Підніми руки над плечима, коліна над тазом, зігни ноги під прямим кутом.", "Повільно опусти одну руку за голову й витягни протилежну ногу вперед. Зупинись до того, як поперек почне відриватися.", "Поверни руку й ногу, потім зміни бік."]],
  [["elbow-side-plank"], ["Ляж на бік. Постав лікоть під плечем, випрями ноги й поклади одну стопу на іншу.", "Підніми таз, щоб плечі, таз і стопи утворили пряму лінію. Дихай рівно.", "Опусти таз після завершення часу й повтори на іншому боці."]],
  [["dumbbell-neutral-bench-press"], ["Ляж на рівну лавку, стопи на підлозі. Тримай гантелі над грудьми долонями одна до одної.", "Опусти гантелі до боків грудей, тримаючи лікті ближче до тулуба, а зап’ястки над ліктями.", "Вижми гантелі над грудьми, зберігаючи хват."]],
];

const TECHNIQUE_BY_DAY = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [17, 10, 11, 18],
  [19, 12, 13, 14, 15],
  [5, 6, 16, 9, 4],
  [],
  [],
];

function exerciseTechnique(dayIndex, exerciseIndex) {
  const [videos, steps] = TECHNIQUES[TECHNIQUE_BY_DAY[dayIndex][exerciseIndex]];
  const labels = ['Початкове положення', 'Рух', 'Завершення'];
  const links = videos.map((slug, index) => {
    const label = videos.length === 1 ? 'Відео техніки' : index === 0 ? 'Відео · від підлоги' : 'Відео · від лавки';
    return `<a class="secondary technique-demo" href="https://musclewiki.com/exercise/${slug}" target="_blank" rel="noopener">${label} ↗</a>`;
  }).join('');
  return `<div class="technique-videos">${links}</div><ol class="technique-steps">${steps.map((step, i) =>
    `<li><strong>${labels[i]}</strong><p>${escapeHtml(step)}</p></li>`).join('')}</ol>`;
}

function openTechnique(index, button) {
  const name = DAYS[day].ex[index][0];
  el('modal').innerHTML = `<dialog class="modal-card technique-dialog" aria-labelledby="technique-title">
    <button class="secondary close" data-action="closemodal">Закрити ×</button>
    <h2 id="technique-title">${escapeHtml(name)}</h2>
    ${exerciseTechnique(day, index)}
  </dialog>`;
  const dialog = el('modal').querySelector('dialog');
  dialog.addEventListener('close', () => {
    dialog.remove();
    button.focus();
  }, { once: true });
  dialog.showModal();
}

function progression(di,i){const x=DAYS[di].ex[i];if(x[6]==='body'||x[6]==='time')return null;let history=Object.values(state.logs).filter(s=>s.day===di&&s.finished&&!s.short&&s.sets[i]?.length&&s.date<sessionDate).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,2);if(history.length<2)return null;let good=history.every(h=>h.sets[i].length>=Math.min(x[2],weekNum()<=2?2:x[2])&&h.sets[i].every(t=>t.done&&Number(t.reps)>=x[4]));if(!good)return null;let weights=history.map(h=>Number(h.sets[i][0].kg));if(weights.some(w=>!Number.isFinite(w))||weights[0]!==weights[1])return null;let proposed=weights[0]+2.5;return proposed<=16?proposed:null}
function dateLabel(date){return new Date(date+'T12:00').toLocaleDateString('uk-UA',{day:'numeric',month:'short'})}
function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}function el(id){return document.getElementById(id)}function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function weekNum(){return Math.max(1,Math.floor((new Date(localDate()+'T12:00')-new Date(state.startDate+'T12:00'))/604800000)+1)}
function getSession(date, di, short = shortMode) {
  const key = sessionKey(date, di, short);
  if (!state.logs[key]) {
    const sets = DAYS[di].ex.map((exercise, index) => {
      const [, weight, plannedSets, reps] = exercise;
      let count = weekNum() <= 2 ? Math.min(2, plannedSets) : plannedSets;
      if (short) {
        if (!SHORT_EXERCISES[di].includes(index)) return [];
        count = Math.min(2, count);
      }
      return Array.from({ length: count }, () => ({
        kg: suggest(di, index, weight),
        reps,
        done: false
      }));
    });
    state.logs[key] = { date, day: di, finished: false, sets, ...(short ? { short: true } : {}) };
  }
  return state.logs[key];
}
function suggest(di,i,initial){let history=Object.values(state.logs).filter(s=>s.day===di&&s.finished&&!s.short&&s.sets[i]?.length&&s.date<sessionDate).sort((a,b)=>b.date.localeCompare(a.date));if(!history.length)return initial;const prev=history[0].sets[i],valid=prev.filter(x=>x.done);if(!valid.length)return initial;const lastKg=Number(valid[0].kg);return Number.isFinite(lastKg)?lastKg:initial}
function completedCount(){return Object.values(state.logs).filter(x=>x.finished).length}
function home() {
  const now = new Date();
  const today = localDate(now);
  const todayIndex = (now.getDay() + 6) % 7;
  const workout = DAYS[todayIndex];
  const date = now.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
  const monday = new Date(now);
  monday.setDate(now.getDate() - todayIndex);
  const weekStart = localDate(monday);
  const sessions = Object.values(state.logs).filter(s => s.finished && s.date >= weekStart && s.date <= today);
  const latest = state.weights.at(-1)?.weight ?? 93;
  const fullSession = state.logs[sessionKey(today, todayIndex, false)];
  const shortSession = state.logs[sessionKey(today, todayIndex, true)];
  const trainingLabel = fullSession?.finished ? 'Переглянути тренування' :
    fullSession?.sets.some(sets => sets.some(set => set.done)) ? 'Продовжити тренування' : 'Почати тренування';

  return `<header class="today-header">
    <span class="brand"><span class="brand-mark" aria-hidden="true">✦</span> My Training</span>
    <span class="pill">Тиждень ${weekNum()}</span>
  </header>
  <section class="today-hero">
    <div class="eyebrow">${date}</div>
    <h1>Сьогодні</h1>
    <h2>${workout.name}</h2>
    ${workout.ex.length ? `<p class="today-details">${todayIndex === 2 ? 'До 20 хв' : 'До 40 хв'} · ${workout.ex.length} вправ · розминка 5 хв</p>
    <button class="primary" data-action="train">${trainingLabel} <span aria-hidden="true">→</span></button>
    <button class="secondary" data-action="short">${shortSession?.finished ? 'Переглянути коротке тренування' : 'Маю лише 15 хвилин'}</button>` :
    `<p class="today-details">День відновлення.</p>
    <button class="primary" data-action="train">Переглянути день</button>`}
  </section>
  <section class="today-week">
    <h2>Цього тижня</h2>
    <div class="statrow">
      <div class="stat"><strong>${sessions.length}</strong><small>Тренувань</small></div>
      <div class="stat"><strong>${latest}</strong><small>Вага, кг</small></div>
      <div class="stat"><strong>${escapeHtml(state.profile.target ?? 84)}</strong><small>Ціль, кг</small></div>
    </div>
  </section>`;
}

function workoutSets(session) {
  return session.sets.flatMap((sets, exercise) =>
    sets.map((set, index) => ({ set, exercise, index, total: sets.length })));
}

function setLabel(item) {
  return `Підхід ${item.index + 1} із ${item.total}`;
}

function restTimer(session, current) {
  const rest = session.rest;
  if (session.finished || !current || !rest || rest.until <= Date.now()) return '';
  const from = DAYS[session.day].ex[rest.exercise][0];
  const to = DAYS[session.day].ex[current.exercise][0];
  const previous = { index: rest.index, total: session.sets[rest.exercise].length };
  const sameExercise = rest.exercise === current.exercise;
  return `<section class="timer rest-card" aria-label="Відпочинок між підходами">
    <div class="row">
      <strong class="rest-title">Відпочинок</strong>
      <strong id="timer-count" role="timer" aria-label="Залишилось часу"></strong>
    </div>
    <div class="rest-transition">
      <p><small>Завершено</small><b>${setLabel(previous)}</b>${sameExercise ? '' : `<span>${from}</span>`}</p>
      <p><small>Далі</small><b>${setLabel(current)}</b><span>${to}</span></p>
    </div>
    <button class="secondary" data-action="stoptimer">Почати наступний підхід зараз</button>
  </section>`;
}

function guidedWorkout() {
  const session = getSession(sessionDate, day);
  const queue = workoutSets(session);
  const current = queue.find(item => !item.set.done);
  const done = queue.filter(item => item.set.done).length;
  const title = shortMode ? 'Коротке тренування' : DAYS[day].name;
  const header = `<header class="guided-header row">
    <button class="secondary" data-action="leave-guided">← Сьогодні</button>
    <span class="pill">${done}/${queue.length} підходів</span>
  </header>
  <div class="bar guided-progress" role="progressbar" aria-label="Виконано підходів" aria-valuenow="${done}" aria-valuemax="${queue.length}"><div style="width:${queue.length ? done / queue.length * 100 : 0}%"></div></div>`;
  if (session.finished || !current) {
    return `<section class="guided">${header}
      <div class="guided-content guided-summary"><div class="eyebrow">${title}</div>
      <h1>${session.finished ? 'Тренування збережено' : 'Усі підходи виконано'}</h1>
      <p class="muted">${done} з ${queue.length} підходів.</p></div>
      <footer class="guided-controls">
        ${session.finished ? '<button class="primary" data-action="leave-guided">На головну</button>' :
          '<button class="primary" data-action="finish">Завершити тренування</button>'}
        <button class="secondary" data-action="open-plan">Відкрити список вправ</button>
      </footer></section>`;
  }

  const { set, exercise, index } = current;
  const [name, , , , , , equipment] = DAYS[day].ex[exercise];
  const next = queue.slice(queue.indexOf(current) + 1).find(item => !item.set.done);
  const nextLabel = next && `${setLabel(next)}${next.exercise === exercise ? '' : ' · ' + DAYS[day].ex[next.exercise][0]}`;
  const rest = restTimer(session, current);
  const repsLabel = equipment !== 'time' ? 'Повторення' : name.includes('хвилини') ? 'Хвилини' : 'Секунди';
  return `<section class="guided">${header}
    <div class="guided-content">
      <div class="eyebrow">${rest ? 'Наступна вправа' : title}</div>
      <h1>${name}</h1>
      <div class="guided-technique">${exerciseTechnique(day, exercise)}</div>
      ${done === 0 ? '<p class="hint">Перед першим підходом — 5 хв розминки.</p>' : ''}
    </div>
    <footer class="guided-controls">
      <div id="timer-host">${rest}</div>
      ${rest ? '' : `
      <div class="current-set"><span>Зараз</span><strong>${setLabel(current)}</strong></div>
      ${nextLabel ? `<p class="guided-next">Далі · ${nextLabel}</p>` : ''}
      <div class="guided-fields">
        ${equipment === 'pair' || equipment === 'single' ? `<label class="field">${equipment === 'pair' ? 'Кг на гантель' : 'Вага, кг'}
          <input type="number" inputmode="decimal" min="0" max="100" step="0.5" value="${set.kg}" data-set="${exercise}:${index}:kg"></label>` : ''}
        <label class="field">${repsLabel}<input type="number" inputmode="numeric" min="0" max="999" value="${set.reps}" data-set="${exercise}:${index}:reps"></label>
      </div>
      <button class="primary" data-complete="${exercise}:${index}">Завершити підхід ${index + 1} <span aria-hidden="true">✓</span></button>`}
      <button class="secondary" data-action="open-plan">Список вправ</button>
    </footer></section>`;
}

function openTodayWorkout(short) {
  const today = localDate();
  const todayIndex = (new Date().getDay() + 6) % 7;
  sessionDate = today;
  day = todayIndex;
  shortMode = short && DAYS[day].ex.length > 0;
  activeExercise = 0;
  page = DAYS[day].ex.length ? 'guided' : 'plan';
  render();
}

function plan(){return `<h1>Програма</h1><div class="daystrip">${['Пн','Вт','Ср','Чт','Пт','Сб','Нд'].map((s,i)=>`<button class="daybtn ${day===i?'active':''}" data-day="${i}">${s}</button>`).join('')}</div><h2>${DAYS[day].name}${shortMode ? ' · 15 хв' : ''}</h2>
${DAYS[day].ex.length ? '<p class="hint">Перші 5 хв — розминка. Вага у вправах з двома гантелями вказана для кожної руки. Відпочинок після підходу за таймером.</p>' : ''}<label class="field">Дата тренування<input id="session-date" type="date" value="${sessionDate}"></label>${DAYS[day].ex.length ? workout() : '<div class="card">День відновлення. Сон і відпочинок — пріоритет.</div>'}</div>`}
function workout(){const s=getSession(sessionDate,day);const exerciseIndexes=s.sets.flatMap((sets,index)=>sets.length?[index]:[]);if(!exerciseIndexes.includes(activeExercise))activeExercise=exerciseIndexes[0];const activePosition=exerciseIndexes.indexOf(activeExercise);let total=0,done=0;const cards=DAYS[day].ex.map((x,i)=>{const sets=s.sets[i]||[];if(!sets.length)return '';total+=sets.length;done+=sets.filter(v=>v.done).length;return `<div class="exercise" id="exercise-${i}"><div class="row"><h3>${i+1}. ${x[0]}</h3><button class="secondary tiny" data-info="${i}">Техніка й відео</button></div><div class="sub">${x[6]==='pair'?'Дві гантелі':x[6]==='single'?'Одна гантель':x[6]==='time'?'Час':'Власна вага'} · ${x[3] === x[4] ? x[3] : x[3]+'–'+x[4]} ${x[6]==='time'?(x[0].includes('хвилини')?'хв':'с'):'повторень'} · відпочинок ${x[5]} с</div>${progression(day,i)!==null?`<div class="suggestion">Два тренування поспіль виконано верхню межу. Можна спробувати ${progression(day,i)} кг. <button class="secondary tiny" data-increase="${i}">Застосувати</button></div>`:''}${sets.map((set,j)=>`<div class="setrow"><small>${j+1}</small><label class="field"><small>${x[6]==='body'?'Вага, кг':'Вага, кг'}</small><input aria-label="Вага" inputmode="decimal" type="number" min="0" max="100" step="0.5" value="${set.kg}" data-set="${i}:${j}:kg"></label><label class="field"><small>${x[6]==='time'?'Час':'Повт.'}</small><input aria-label="Повторення або час" inputmode="numeric" type="number" min="0" max="999" value="${set.reps}" data-set="${i}:${j}:reps"></label><input aria-label="Виконано" type="checkbox" ${set.done?'checked':''} data-set="${i}:${j}:done"></div>`).join('')}</div>`}).join('');return `<div class="card"><div class="row"><b>Виконано підходів</b><b>${done}/${total}</b></div><div class="bar" style="margin-top:10px"><div style="width:${total?done/total*100:0}%"></div></div></div><div id="timer-host">${restTimer(s, workoutSets(s).find(item => !item.set.done))}</div><div class="active-panel"><div class="eyebrow">АКТИВНА ВПРАВА ${activePosition+1}/${exerciseIndexes.length}</div><h2>${DAYS[day].ex[activeExercise][0]}</h2><p class="hint">Відмічай підходи нижче. Великі кнопки перемикають вправи.</p><button class="primary" data-action="guided-from-plan">Відкрити режим тренування</button><div class="row plan-exercise-controls"><button class="secondary bigbtn" data-move="-1" ${activePosition===0?'disabled':''}>← Назад</button><button class="primary bigbtn" data-move="1" ${activePosition===exerciseIndexes.length-1?'disabled':''}>Далі →</button></div></div><div class="card">${cards}<button class="primary" data-action="finish">${s.finished?'Зберегти зміни':'Завершити тренування'}</button>${s.finished?'<p class="sub">Тренування збережене ✓</p>':''}</div>`}
function oldPlanRecord(key, session) {
  return key !== sessionKey(session.date, session.day, !!session.short);
}

function workoutHistory() {
  return Object.entries(state.logs)
    .filter(([key, session]) => session.finished || (oldPlanRecord(key, session) && session.sets.some(sets => sets.some(set => set.done))))
    .sort(([, a], [, b]) => b.date.localeCompare(a.date))
    .slice(0, 30)
    .map(([key, session]) => {
      const planDay = (oldPlanRecord(key, session) ? ORIGINAL_DAYS : DAYS)[session.day];
      return `<div class="history row"><span>${escapeHtml(session.date)}<br>
        <small>${escapeHtml(planDay.name)}${session.short ? ' · 15 хв' : ''}${session.finished ? '' : ' · Незавершене'}</small></span>
        <button class="secondary" data-open="${escapeHtml(key)}">Відкрити</button></div>`;
    }).join('') || '<p class="muted">Поки немає завершених тренувань.</p>';
}

function archivedWorkout() {
  const session = state.logs[historyKey];
  const planDay = ORIGINAL_DAYS[session.day];
  const exercises = planDay.ex.map(([name, , , , , , equipment], index) => {
    const sets = session.sets[index];
    if (!sets?.length) return '';
    const unit = equipment !== 'time' ? 'повт.' : name.includes('хвилини') ? 'хв' : 'с';
    const rows = sets.map((set, setIndex) => {
      const weight = equipment === 'pair' || equipment === 'single' ? ` · ${escapeHtml(set.kg)} кг` : '';
      return `<li>Підхід ${setIndex + 1} · ${escapeHtml(set.reps)} ${unit}${weight} · ${set.done ? 'виконано' : 'пропущено'}</li>`;
    }).join('');
    return `<section class="card"><h2>${escapeHtml(name)}</h2><ul>${rows}</ul></section>`;
  }).join('');
  return `<button class="secondary" data-page="progress">← Історія тренувань</button>
    <h1>${escapeHtml(planDay.name)}</h1><p class="muted">${escapeHtml(session.date)}${session.short ? ' · 15 хв' : ''} · Архів програми</p>${exercises}`;
}

function progress(){const data=state.weights.slice().sort((a,b)=>a.date.localeCompare(b.date));return `<div class="eyebrow">Аналітика</div><h1>Прогрес</h1><div class="statrow"><div class="stat"><strong>${data.at(-1)?.weight??93}</strong><small>Зараз, кг</small></div><div class="stat"><strong>${(93-(data.at(-1)?.weight??93)).toFixed(1)}</strong><small>Зміна, кг</small></div><div class="stat"><strong>${completedCount()}</strong><small>Занять</small></div></div><div class="card"><h3>Динаміка ваги</h3><canvas id="weight-chart" width="600" height="260"></canvas><p class="hint">Додавай вагу регулярно. Графік зберігається на цьому пристрої.</p></div><div class="card"><h3>Динаміка талії</h3><canvas id="waist-chart" width="600" height="260"></canvas></div><div class="card"><h3>Додати вимірювання</h3><div class="stack"><label class="field">Дата<input type="date" id="weight-date" value="${localDate()}"></label><label class="field">Вага, кг<input type="number" inputmode="decimal" id="weight-value" step="0.1" min="30" max="300" value="${data.at(-1)?.weight??93}"></label><label class="field">Талія, см (необов'язково)<input type="number" inputmode="decimal" id="waist-value" step="0.1" min="40" max="200" placeholder="Наприклад, 95"></label><button class="primary" data-action="addweight">Зберегти вимірювання</button></div></div><div class="card"><h3>Історія тренувань</h3>${workoutHistory()}</div>`}
function settings(){return `<div class="eyebrow">Особисті дані</div><h1>Налаштування</h1><div class="card stack"><label class="field">Дата початку програми<input id="start-date" type="date" value="${state.startDate}"></label><label class="field">Талія, см<input id="waist" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(state.profile.waist)}"></label><label class="field">Максимум віджимань<input id="pushups" inputmode="numeric" type="number" value="${escapeHtml(state.profile.pushups)}"></label><button class="primary" data-action="saveprofile">Зберегти показники</button></div><div class="card stack"><h3>Резервна копія</h3><p class="hint">Дані зберігаються лише в браузері цього пристрою. Експортуй резервну копію, щоб не втратити історію при очищенні даних Safari або зміні iPhone.</p><button class="secondary" data-action="export">Експортувати JSON</button><label class="field">Імпортувати резервну копію<input id="import-file" type="file" accept="application/json,.json"></label></div><div class="card"><p class="hint">Вправи не повинні спричиняти гострого болю. Початкові ваги — припущення, а не персонально перевірені робочі навантаження. Припиняй вправу при болю, запамороченні чи незвичній задишці.</p></div>`}
function render(){el('app').innerHTML=({home,plan,progress,settings,guided:guidedWorkout,history:archivedWorkout}[page])();document.body.classList.toggle('is-guided',page==='guided');document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(page==='progress'){drawChart();drawWaistChart()}clearInterval(timerInterval);if(el('timer-count')){timerInterval=setInterval(showTimer,250);showTimer()}}
function drawChart(){let c=el('weight-chart');if(!c)return;const ctx=c.getContext('2d'),d=state.weights.slice().sort((a,b)=>a.date.localeCompare(b.date)),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);const vals=d.map(x=>Number(x.weight)),lo=Math.min(84,...vals)-2,hi=Math.max(93,...vals)+2,x=i=>35+(w-55)*(d.length===1?.5:i/(d.length-1)),y=v=>h-35-(v-lo)/(hi-lo)*(h-60);ctx.strokeStyle='#47616b';ctx.fillStyle='#a8b9c0';ctx.font='20px sans-serif';for(let i=0;i<4;i++){let v=lo+(hi-lo)*i/3;ctx.beginPath();ctx.moveTo(35,y(v));ctx.lineTo(w-12,y(v));ctx.stroke();ctx.fillText(v.toFixed(0),2,y(v)+6)}ctx.strokeStyle='#b3e4d3';ctx.lineWidth=4;ctx.beginPath();d.forEach((p,i)=>i?ctx.lineTo(x(i),y(p.weight)):ctx.moveTo(x(i),y(p.weight)));ctx.stroke();d.forEach((p,i)=>{ctx.beginPath();ctx.arc(x(i),y(p.weight),5,0,Math.PI*2);ctx.fillStyle='#b3e4d3';ctx.fill()})}
function drawWaistChart(){const c=el('waist-chart');if(!c)return;const ctx=c.getContext('2d'),d=(state.waists||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));ctx.clearRect(0,0,c.width,c.height);if(!d.length){ctx.fillStyle='#a8b9c0';ctx.font='21px sans-serif';ctx.fillText('Додай перший вимір талії',30,120);return}const vals=d.map(v=>Number(v.waist)),lo=Math.min(...vals)-3,hi=Math.max(...vals)+3,w=c.width,h=c.height,x=i=>35+(w-55)*(d.length===1?.5:i/(d.length-1)),y=v=>h-35-(v-lo)/(hi-lo)*(h-60);ctx.strokeStyle='#47616b';ctx.fillStyle='#a8b9c0';ctx.font='20px sans-serif';for(let i=0;i<4;i++){let v=lo+(hi-lo)*i/3;ctx.beginPath();ctx.moveTo(35,y(v));ctx.lineTo(w-12,y(v));ctx.stroke();ctx.fillText(v.toFixed(0),2,y(v)+6)}ctx.strokeStyle='#b3e4d3';ctx.lineWidth=4;ctx.beginPath();d.forEach((p,i)=>i?ctx.lineTo(x(i),y(p.waist)):ctx.moveTo(x(i),y(p.waist)));ctx.stroke();d.forEach((p,i)=>{ctx.beginPath();ctx.arc(x(i),y(p.waist),5,0,Math.PI*2);ctx.fillStyle='#b3e4d3';ctx.fill()})}
function showTimer() {
  const count = el('timer-count');
  if (!count) return;
  const session = getSession(sessionDate, day);
  const left = Math.max(0, Math.ceil((session.rest.until - Date.now()) / 1000));
  if (left === 0) {
    clearInterval(timerInterval);
    if (navigator.vibrate) navigator.vibrate([150, 100, 150]);
    if (page === 'guided') {
      render();
    } else {
      el('timer-host').innerHTML = '';
    }
    return;
  }
  const label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  if (count.textContent !== label) count.textContent = label;
}

function completeSet(session, exercise, index) {
  session.sets[exercise][index].done = true;
  const seconds = DAYS[session.day].ex[exercise][5];
  if (!session.finished && seconds > 0 && workoutSets(session).some(item => !item.set.done)) {
    session.rest = { until: Date.now() + seconds * 1000, exercise, index };
  } else {
    delete session.rest;
  }
  save();
}

document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;
if (b.dataset.complete) {
  const [exercise, index] = b.dataset.complete.split(':').map(Number);
  const session = getSession(sessionDate, day);
  const set = session.sets[exercise][index];
  if (set.done) return;
  completeSet(session, exercise, index);
  render();
  return;
}
if (b.dataset.info !== undefined) {
  openTechnique(Number(b.dataset.info), b);
  return;
}
if(b.dataset.increase!==undefined){let i=Number(b.dataset.increase),v=progression(day,i);if(v!==null){getSession(sessionDate,day).sets[i].forEach(t=>{if(!t.done){t.kg=v;t.reps=DAYS[day].ex[i][3]}});save();render()}return}if(b.dataset.move!==undefined){const indexes=getSession(sessionDate,day).sets.flatMap((sets,i)=>sets.length?[i]:[]);activeExercise=indexes[indexes.indexOf(activeExercise)+Number(b.dataset.move)]??activeExercise;render();el('exercise-'+activeExercise)?.scrollIntoView({behavior:'smooth',block:'center'});return}if(b.dataset.page){page=b.dataset.page;if(page==='plan')shortMode=false;render();return}if(b.dataset.day!==undefined){day=Number(b.dataset.day);shortMode=false;activeExercise=0;render();return}if (b.dataset.open) {
  const session = state.logs[b.dataset.open];
  if (oldPlanRecord(b.dataset.open, session)) {
    historyKey = b.dataset.open;
    page = 'history';
  } else {
    sessionDate = session.date;
    day = session.day;
    shortMode = !!session.short;
    activeExercise = 0;
    page = 'plan';
  }
  render();
  window.scrollTo(0, 0);
  return;
}switch(b.dataset.action){case'closemodal':el('modal').querySelector('dialog')?.close();break;case'train':openTodayWorkout(false);window.scrollTo(0,0);break;
case'short':openTodayWorkout(true);window.scrollTo(0,0);break;
case'leave-guided':page='home';render();window.scrollTo(0,0);break;
case'guided-from-plan':page='guided';render();window.scrollTo(0,0);break;
case'open-plan':page='plan';render();window.scrollTo(0,0);break;case'finish':{let s=getSession(sessionDate,day);delete s.rest;s.finished=true;s.completedAt=new Date().toISOString();save();render();break}case'stoptimer':delete getSession(sessionDate,day).rest;save();render();break;case'addweight':{let v=Number(el('weight-value').value),date=el('weight-date').value;if(!date||!Number.isFinite(v)||v<30||v>300){alert('Перевір дату та вагу');break}state.weights=state.weights.filter(x=>x.date!==date);state.weights.push({date,weight:v});state.weights.sort((a,b)=>a.date.localeCompare(b.date));let waist=el('waist-value').value;if(waist!==''){let w=Number(waist);if(!Number.isFinite(w)||w<40||w>200){alert('Перевір об’єм талії');break}state.waists ||= [];state.waists=state.waists.filter(x=>x.date!==date);state.waists.push({date,waist:w})}save();render();break}case'saveprofile':state.startDate=el('start-date').value||state.startDate;state.profile.waist=el('waist').value;if(state.profile.waist){state.waists ||= [];if(!state.waists.length)state.waists.push({date:localDate(),waist:Number(state.profile.waist)})}state.profile.pushups=el('pushups').value;save();alert('Збережено');break;case'export':{let blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='my-training-backup-'+localDate()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break}}});
document.addEventListener('change',async e=>{let t=e.target;if(t.id==='session-date'){if(t.value)sessionDate=t.value;render();return}if(t.dataset.set){let [i,j,k]=t.dataset.set.split(':'),s=getSession(sessionDate,day),v=k==='done'?t.checked:Number(t.value);if(k!=='done'&&(!Number.isFinite(v)||v<0||v>999)){alert('Некоректне значення');render();return}if (k === 'done' && v) {
  completeSet(s, Number(i), Number(j));
} else {
  s.sets[Number(i)][Number(j)][k] = v;
  if (k === 'done' && s.rest?.exercise === Number(i) && s.rest?.index === Number(j)) delete s.rest;
  save();
}
if(k==='done')render();return}if(t.id==='import-file'&&t.files[0]){try{let data=JSON.parse(await t.files[0].text());if(!data||typeof data!=='object'||!data.logs||!Array.isArray(data.weights)||!data.profile)throw Error();if(confirm('Замінити поточні дані резервною копією?')){state=data;save();render()}}catch{alert('Не вдалося прочитати резервну копію')}}});
render();if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
