/* =========================================================================
   SHARED ENGINE — used by adult.html, pediatric.html, mouse.html, monkey.html
   Each page must define, BEFORE loading this script:
     - window.DATA_FILE   (string, e.g. "data/adult.xlsx")
     - window.QUESTIONS   (array, category-specific — loaded from its own
                            {category}-questions.js file)
   The HTML markup (element ids) must be identical across all category pages.
   Requires xlsx-loader.js to be loaded first (provides loadPipelinesFromXlsx).
   ========================================================================= */

/* ======================= ENGINE STATE / DOM WIRING ======================= */
let PIPELINES = [];
let current = 0;
let answers = [];

const screenIntro = document.getElementById('screen-intro');
const screenQuiz = document.getElementById('screen-quiz');
const screenResult = document.getElementById('screen-result');
const streamlineWrap = document.getElementById('streamlineWrap');
const fillPath = document.getElementById('fill');
const stepLabel = document.getElementById('stepLabel');
const stepPct = document.getElementById('stepPct');
const loadMsg = document.getElementById('loadMsg');
const startBtn = document.getElementById('startBtn');
const factCount = document.getElementById('factCount');
const footFile = document.getElementById('footFile');

function resetAnswers(){
  answers = QUESTIONS.map(()=>[]);
}
resetAnswers();

async function initData(){
  loadMsg.className = 'load-msg';
  loadMsg.innerHTML = '<span class="spinner"></span>Loading ' + DATA_FILE + '…';
  startBtn.disabled = true;
  try{
    PIPELINES = await loadPipelinesFromXlsx(DATA_FILE);
    if(factCount) factCount.textContent = PIPELINES.length;
    if(footFile) footFile.textContent = DATA_FILE;
    loadMsg.className = 'load-msg';
    loadMsg.textContent = `✓ ${PIPELINES.length} pipelines loaded from ${DATA_FILE}`;
    startBtn.disabled = false;
  }catch(err){
    loadMsg.className = 'load-msg err';
    loadMsg.textContent = `Error: ${err.message} — make sure the file exists and the page is served over http (not file://).`;
    startBtn.disabled = true;
  }
}

startBtn.addEventListener('click', ()=>{
  if(!PIPELINES.length) return;
  screenIntro.classList.remove('active');
  screenQuiz.classList.add('active');
  streamlineWrap.style.display = 'block';
  current = 0;
  resetAnswers();
  renderQuestion();
});

document.getElementById('restartBtn').addEventListener('click', ()=>{
  current = 0;
  resetAnswers();
  screenResult.classList.remove('active');
  screenIntro.classList.add('active');
  streamlineWrap.style.display = 'none';
});

document.getElementById('backBtn').addEventListener('click', ()=>{
  if(current === 0){
    screenQuiz.classList.remove('active');
    screenIntro.classList.add('active');
    streamlineWrap.style.display = 'none';
    return;
  }
  current--;
  renderQuestion();
});

document.getElementById('nextBtn').addEventListener('click', ()=>{
  if(current < QUESTIONS.length - 1){
    current++;
    renderQuestion();
  } else {
    computeResults();
  }
});

function updateProgress(){
  const total = QUESTIONS.length;
  const pct = Math.round((current) / total * 100);
  const len = fillPath.getTotalLength ? fillPath.getTotalLength() : 1000;
  fillPath.style.strokeDasharray = len;
  fillPath.style.strokeDashoffset = len - (len * (current/total));
  stepLabel.textContent = `Question ${current+1} / ${total}`;
  stepPct.textContent = pct + '%';
}

function renderQuestion(){
  const q = QUESTIONS[current];
  document.getElementById('qEyebrow').textContent = q.eyebrow;
  document.getElementById('qTitle').textContent = q.title;
  const wrap = document.getElementById('qOptions');
  wrap.innerHTML = '';
  q.options.forEach((opt, idx)=>{
    const el = document.createElement('button');
    el.className = 'option ' + (q.type==='single' ? 'radio' : 'checkbox');
    if(answers[current].includes(idx)) el.classList.add('checked');
    el.innerHTML = `<span class="mark"></span><span>${opt.label}</span>`;
    el.addEventListener('click', ()=>{
      if(q.type === 'single'){
        answers[current] = [idx];
      } else {
        const i = answers[current].indexOf(idx);
        if(i>-1) answers[current].splice(i,1); else answers[current].push(idx);
      }
      renderQuestion();
    });
    wrap.appendChild(el);
  });
  document.getElementById('nextBtn').disabled = answers[current].length === 0;
  document.getElementById('nextBtn').textContent = current === QUESTIONS.length-1 ? 'See result →' : 'Next →';
  updateProgress();
}

function computeResults(){
  streamlineWrap.style.display = 'block';
  current = QUESTIONS.length;
  updateProgress();

  let pool = PIPELINES.slice();
  const appliedFilters = [];

  QUESTIONS.forEach((q, qi)=>{
    answers[qi].forEach(oi=>{
      const opt = q.options[oi];
      if(opt.filter){
        appliedFilters.push(opt.label);
        pool = pool.filter(opt.filter);
      }
    });
  });

  let fallback = false;
  if(pool.length === 0){
    fallback = true;
    pool = PIPELINES.slice();
  }

  const scored = pool.map(p=>{
    let total = 0;
    QUESTIONS.forEach((q, qi)=>{
      answers[qi].forEach(oi=>{
        const opt = q.options[oi];
        if(opt.score){
          const pts = opt.score(p);
          if(pts > 0) total += pts;
        }
      });
    });
    return { p, total };
  });

  scored.sort((a,b)=> b.total - a.total || (b.p.activity||0) - (a.p.activity||0));

  const maxScore = scored.length ? scored[0].total : 1;
  const top = scored.slice(0, 3);

  const noteEl = document.getElementById('filtersNote');
  if(fallback){
    noteEl.innerHTML = `<div class="filters-note">No pipeline meets all of your constraints exactly — ranking recalculated across all ${PIPELINES.length} pipelines by preference score only.</div>`;
  } else if(appliedFilters.length){
    noteEl.innerHTML = `<div class="filters-note">Blocking filters applied: ${appliedFilters.join(' · ')} — ${pool.length}/${PIPELINES.length} pipelines remaining before scoring.</div>`;
  } else {
    noteEl.innerHTML = '';
  }

  const listEl = document.getElementById('rankList');
  listEl.innerHTML = '';
  if(!top.length){
    listEl.innerHTML = `<div class="filters-note">No pipeline available in this data file.</div>`;
  }
  top.forEach((entry, i)=>{
    const p = entry.p;
    const pct = maxScore>0 ? Math.max(6, Math.round(entry.total / maxScore * 100)) : 0;
    const card = document.createElement('div');
    card.className = 'rank-card' + (i===0 ? ' first' : '');
    card.innerHTML = `
      <div class="rank-row">
        <div>
          <div class="rank-num">RANK ${i+1}${i===0 ? ' · BEST MATCH' : ''}</div>
          <div class="rank-name">${p.name}</div>
          <div class="rank-desc">${p.desc || ''}</div>
        </div>
        <div class="rank-score">
          <b>${entry.total}</b>
          <span>points</span>
        </div>
      </div>
      <div class="score-bar"><i style="width:${pct}%"></i></div>
      <div class="chips">
        ${p.interface ? `<span class="chip">${p.interface}</span>` : ''}
        ${p.containerized ? `<span class="chip">containerized</span>` : ''}
        ${p.tractography ? `<span class="chip">tractography</span>` : ''}
        ${p.gpu ? `<span class="chip">GPU</span>` : ''}
        ${p.activity>=3 ? `<span class="chip">actively maintained</span>` : `<span class="chip warn">slow maintenance</span>`}
      </div>
    `;
    listEl.appendChild(card);
  });

  screenQuiz.classList.remove('active');
  screenResult.classList.add('active');
}

// kick off
initData();