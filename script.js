/* =========================================================================
   CONFIG — edite aqui antes de subir a página
   ========================================================================= */
const CONFIG = {
  EMAIL_POPUP_DELAY_SECONDS: 300,         // 5 minutos — tempo até o popup de e-mail aparecer na VSL 1
  EMAIL_WEBHOOK_URL: "https://autoapi.cjconsultoria.com/webhook/mapaanjoguarda",  // recebe o e-mail capturado no popup (POST)
  FB_PIXEL_ID: "",                        // opcional
  TT_PIXEL_ID: ""                         // opcional
};

/* =========================================================================
   DADOS
   ========================================================================= */
const SIGNS = [
  {key:'aries', name:'Áries', icon:'♈', start:[3,21], end:[4,19], element:'fire'},
  {key:'touro', name:'Touro', icon:'♉', start:[4,20], end:[5,20], element:'earth'},
  {key:'gemeos', name:'Gêmeos', icon:'♊', start:[5,21], end:[6,20], element:'air'},
  {key:'cancer', name:'Câncer', icon:'♋', start:[6,21], end:[7,22], element:'water'},
  {key:'leao', name:'Leão', icon:'♌', start:[7,23], end:[8,22], element:'fire'},
  {key:'virgem', name:'Virgem', icon:'♍', start:[8,23], end:[9,22], element:'earth'},
  {key:'libra', name:'Libra', icon:'♎', start:[9,23], end:[10,22], element:'air'},
  {key:'escorpiao', name:'Escorpião', icon:'♏', start:[10,23], end:[11,21], element:'water'},
  {key:'sagitario', name:'Sagitário', icon:'♐', start:[11,22], end:[12,21], element:'fire'},
  {key:'capricornio', name:'Capricórnio', icon:'♑', start:[12,22], end:[1,19], element:'earth'},
  {key:'aquario', name:'Aquário', icon:'♒', start:[1,20], end:[2,18], element:'air'},
  {key:'peixes', name:'Peixes', icon:'♓', start:[2,19], end:[3,20], element:'water'},
];
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];

const ANGELS = {
  aries:'Miguel', touro:'Haniel', gemeos:'Rafael', cancer:'Gabriel',
  leao:'Camael', virgem:'Zadquiel', libra:'Jofiel', escorpiao:'Azrael',
  sagitario:'Sachiel', capricornio:'Cassiel', aquario:'Uriel', peixes:'Raguel'
};

const MARITAL = [
  {key:'casado', label:'Casado(a)', icon:'🤝'},
  {key:'namorando', label:'Namorando', icon:'💕'},
  {key:'noivo', label:'Noivo(a)', icon:'💍'},
  {key:'solteiro', label:'Solteiro(a)', icon:'🤍'},
  {key:'separado', label:'Separado(a)', icon:'🧩'},
  {key:'viuvo', label:'Viúvo(a)', icon:'💔'},
];
const CHALLENGES = [
  {key:'amor', label:'Vida Amorosa', icon:'💞'},
  {key:'financas', label:'Finanças', icon:'💰'},
  {key:'saude', label:'Saúde', icon:'➕'},
  {key:'felicidade', label:'Felicidade', icon:'✨'},
];

/* =========================================================================
   STATE
   ========================================================================= */
const state = { sign:null, day:null, month:null, decade:null, year:null, marital:null, challenge:null, gender:null, name:'', email:'' };
let currentStep = 1;

/* =========================================================================
   RENDER: opções estáticas
   ========================================================================= */
function renderSigns(){
  const wrap = document.getElementById('signGrid');
  wrap.innerHTML = SIGNS.map(s => `
    <div class="opt-card" onclick="selectSign('${s.key}')">
      <span class="icon">${s.icon}</span>${s.name}
    </div>`).join('');
}

function renderMarital(){
  document.getElementById('maritalGrid').innerHTML = MARITAL.map(m => `
    <div class="opt-card teal" onclick="selectMarital('${m.key}')">
      <span class="icon">${m.icon}</span>${m.label}
    </div>`).join('');
}

function renderChallenges(){
  document.getElementById('challengeGrid').innerHTML = CHALLENGES.map(c => `
    <div class="opt-card teal" onclick="selectChallenge('${c.key}')">
      <span class="icon">${c.icon}</span>${c.label}
    </div>`).join('');
}

function renderGender(){
  document.getElementById('genderGrid').innerHTML = `
    <div class="opt-card gender" onclick="selectGender('masculino')"><span class="icon">♂️</span>Masculino</div>
    <div class="opt-card gender" onclick="selectGender('feminino')"><span class="icon">♀️</span>Feminino</div>`;
}

/* =========================================================================
   RENDER: dias do signo (pode atravessar 2 meses)
   ========================================================================= */
let tempMonth = null;
let tempDay = null;

let dayStepGroups = [];

function renderDayPicker(signKey){
  const sign = SIGNS.find(s => s.key === signKey);
  const [sm, sd] = sign.start;
  const [em, ed] = sign.end;

  dayStepGroups = [];
  if (sm === em){
    dayStepGroups.push({month:sm, days: rangeArr(sd, ed)});
  } else {
    dayStepGroups.push({month:sm, days: rangeArr(sd, DAYS_IN_MONTH[sm-1])});
    dayStepGroups.push({month:em, days: rangeArr(1, ed)});
  }

  tempMonth = null;
  tempDay = null;
  document.getElementById('dayWarning').classList.remove('show');

  document.getElementById('monthGrid').innerHTML = dayStepGroups.map(g => `
    <div class="opt-card month-opt" id="month-opt-${g.month}" onclick="selectMonthTemp(${g.month})">${MONTH_NAMES[g.month-1]}</div>
  `).join('');

  document.getElementById('dayGrid').innerHTML = '';
  document.getElementById('dayFieldLabel').style.opacity = '.4';
  updateDayContinueState();
}

function selectMonthTemp(month){
  tempMonth = month;
  tempDay = null;
  document.querySelectorAll('.month-opt').forEach(el => el.classList.remove('selected'));
  document.getElementById('month-opt-' + month).classList.add('selected');

  const group = dayStepGroups.find(g => g.month === month);
  document.getElementById('dayFieldLabel').style.opacity = '1';
  document.getElementById('dayGrid').innerHTML = group.days.map(d => `
    <div class="opt-card day" id="day-opt-${d}" onclick="selectDayTemp(${d})">${d}</div>
  `).join('');
  updateDayContinueState();
}

function selectDayTemp(day){
  tempDay = day;
  document.querySelectorAll('.opt-card.day').forEach(el => el.classList.remove('selected'));
  document.getElementById('day-opt-' + day).classList.add('selected');
  updateDayContinueState();
}

function updateDayContinueState(){
  const ready = tempMonth !== null && tempDay !== null;
  document.getElementById('dayContinueBtn').style.opacity = ready ? '1' : '.6';
  if (ready) document.getElementById('dayWarning').classList.remove('show');
}

function confirmDayStep(){
  if (tempMonth === null || tempDay === null){
    document.getElementById('dayWarning').classList.add('show');
    return;
  }
  state.month = tempMonth;
  state.day = tempDay;
  goToStep(3);
}

function rangeArr(a,b){ const r=[]; for(let i=a;i<=b;i++) r.push(i); return r; }

/* =========================================================================
   RENDER: décadas e anos
   ========================================================================= */
function renderDecades(){
  const decades = [1910,1920,1930,1940,1950,1960,1970,1980,1990,2000,2010];
  document.getElementById('decadeGrid').innerHTML = decades.map(dc => `
    <div class="opt-card decade" onclick="selectDecade(${dc})">${dc}</div>`).join('');
}
function renderYears(decade){
  const years = []; for(let y=decade; y<=decade+9; y++) years.push(y);
  document.getElementById('yearGrid').innerHTML = years.map(y => `
    <div class="opt-card year" onclick="selectYear(${y})">${y}</div>`).join('');
}

/* =========================================================================
   NAVEGAÇÃO
   ========================================================================= */
function goToStep(n){
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById('step-' + n).classList.add('active');
  currentStep = n;
  document.getElementById('progressLabel').textContent = `Passo ${n} de 8`;
  document.getElementById('progressFill').style.width = (n/8*100) + '%';
  window.scrollTo({top:0, behavior:'smooth'});
}
function goBack(){ if (currentStep > 1) goToStep(currentStep - 1); }

function selectSign(key){
  state.sign = key;
  renderDayPicker(key);
  goToStep(2);
}
function selectDecade(dc){
  state.decade = dc;
  renderYears(dc);
  goToStep(4);
}
function selectYear(y){
  state.year = y;
  goToStep(5);
}
function selectMarital(key){
  state.marital = key;
  goToStep(6);
}
function selectChallenge(key){
  state.challenge = key;
  goToStep(7);
}
function selectGender(g){
  state.gender = g;
  goToStep(8);
  setTimeout(() => document.getElementById('nameInput').focus(), 300);
}
function checkName(){
  const v = document.getElementById('nameInput').value.trim();
  document.getElementById('continueBtn').disabled = v.length < 2;
}

/* =========================================================================
   RESULTADO
   ========================================================================= */
function submitQuiz(){
  const raw = document.getElementById('nameInput').value.trim();
  state.name = raw.charAt(0).toUpperCase() + raw.slice(1);
  goToGate();
}

function goToGate(){
  document.getElementById('quizApp').style.display = 'none';
  document.getElementById('gateName').textContent = state.name;
  document.getElementById('gatePage').style.display = 'block';
  window.scrollTo({top:0, behavior:'smooth'});
}

/* =========================================================================
   ROTEAMENTO DE VSL — decide qual vídeo (VTurb) mostrar
   conforme década de nascimento + estado civil + sexo
   ========================================================================= */

const VTURB_PROJECT_ID = 'f896c4e4-f70b-496c-9564-a55b2ae856b4';
const VTURB_PADDING_STAGE1 = '178.05555555555554%';
const VTURB_PADDING_STAGE2 = '178.14814814814815%';

// player-id do VTurb para cada combinação: década x relacionamento x sexo
const VSL_MAP = {
  '10s':   { relacionamento: { M: '6a650870c31f37935a68f962', F: '6a65087680f74cfc9ac4c655' }, sozinho: { M: '6a65089eb3a75cd536b7b893', F: '6a65087eb3a75cd536b7b836' } },
  '70s':   { relacionamento: { M: '6a650868d2f50fc230230a39', F: '6a65088d67adc9c3c9c8a480' }, sozinho: { M: '6a6508a5177c7df6fca2b986', F: '6a6508add2f50fc230230b82' } },
  '80s':   { relacionamento: { M: '6a650896e7e4e90f8b77d23a', F: '6a65085d80f74cfc9ac4c614' }, sozinho: { M: '6a6508d8be935bf55065ac67', F: '6a6508c0b3a75cd536b7b917' } },
  '2000s': { relacionamento: { M: '6a6508d0e7e4e90f8b77d2e8', F: '6a650886d2f50fc230230afb' }, sozinho: { M: '6a6508b6c31f37935a68faa7', F: '6a6508c8c31f37935a68fadf' } },
};

// segunda VSL: escolhida pelo desafio respondido no passo 6 do quiz
const CHALLENGE_VSL_MAP = {
  amor:       '6a67cdf0ebc3c8a49299679d',
  financas:   '6a67ce9fc82db20ec935f39f',
  saude:      '6a67cfd05eddf74e20205d1b',
  felicidade: '6a67cf5e74588149ec2b54fe',
};

// 10's = 1910 a 1960 | 70's = 1970 | 80's = 1980 e 1990 | 2000's = 2000 em diante
function getDecadeGroup(decade){
  if (decade <= 1960) return '10s';
  if (decade === 1970) return '70s';
  if (decade === 1980 || decade === 1990) return '80s';
  return '2000s';
}

// casado(a) / namorando / noivo(a) -> "em um relacionamento"
// solteiro(a) / separado(a) / viúvo(a) -> "sem ninguém"
function getRelationshipGroup(marital){
  return ['casado','namorando','noivo'].includes(marital) ? 'relacionamento' : 'sozinho';
}

function getGenderCode(gender){
  return gender === 'masculino' ? 'M' : 'F';
}

function loadVturbVideo(containerId, playerId, paddingPercent){
  document.getElementById(containerId).innerHTML =
    `<vturb-smartplayer id="vid-${playerId}" style="display:block;margin:0 auto;width:100%;max-width:400px;"><div class="vturb-player-placeholder" style="position:relative;width:100%;padding:${paddingPercent} 0 0;z-index:0;background-color:black;"></div></vturb-smartplayer>`;

  const playerScript = document.createElement('script');
  playerScript.type = 'text/javascript';
  playerScript.src = `https://scripts.converteai.net/${VTURB_PROJECT_ID}/players/${playerId}/v4/player.js`;
  playerScript.async = true;
  document.head.appendChild(playerScript);
}

/* =========================================================================
   VSL 1 — por década + estado civil + sexo
   ========================================================================= */
function startVSL(){
  document.getElementById('gatePage').style.display = 'none';
  document.getElementById('vslApp').style.display = 'block';
  window.scrollTo({top:0, behavior:'smooth'});

  const decadeGroup = getDecadeGroup(state.decade);
  const relGroup = getRelationshipGroup(state.marital);
  const genderCode = getGenderCode(state.gender);
  const playerId = VSL_MAP[decadeGroup][relGroup][genderCode];

  loadVturbVideo('vslPlayer1', playerId, VTURB_PADDING_STAGE1);
  scheduleEmailPopup();
}

/* =========================================================================
   POPUP DE E-MAIL — aparece sozinho após CONFIG.EMAIL_POPUP_DELAY_SECONDS.
   É apenas uma camada visual por cima da página: nunca toca no player, então
   o vídeo continua tocando normalmente por trás do popup. Ao confirmar um
   e-mail válido, a pessoa é levada para a VSL 2 (pelo maior desafio).
   ========================================================================= */
function scheduleEmailPopup(){
  setTimeout(showEmailPopup, CONFIG.EMAIL_POPUP_DELAY_SECONDS * 1000);
}

function showEmailPopup(){
  document.getElementById('emailModalOverlay').classList.add('show');
}

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function submitEmailPopup(){
  const input = document.getElementById('emailPopupInput');
  const email = input.value.trim();

  if (!isValidEmail(email)){
    document.getElementById('emailPopupWarning').classList.add('show');
    return;
  }
  document.getElementById('emailPopupWarning').classList.remove('show');
  state.email = email;

  if (CONFIG.EMAIL_WEBHOOK_URL){
    fetch(CONFIG.EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        nome: state.name,
        signo: state.sign,
        sexo: state.gender,
        estadoCivil: state.marital,
        decada: state.decade,
        ano: state.year,
        desafio: state.challenge
      })
    }).catch(() => {});
  }

  document.getElementById('emailModalOverlay').classList.remove('show');
  goToChallengeVSL();
}

/* =========================================================================
   VSL 2 — escolhida pelo desafio (Vida Amorosa / Finanças / Saúde / Felicidade)
   respondido no quiz. Acionada pela confirmação do e-mail no popup da VSL 1.
   ========================================================================= */
function goToChallengeVSL(){
  document.getElementById('vslApp').style.display = 'none';
  document.getElementById('vslPlayer1').innerHTML = ''; // destrói o player 1 pra garantir que ele pare de tocar
  document.getElementById('vslApp2').style.display = 'block';
  window.scrollTo({top:0, behavior:'smooth'});

  const playerId = CHALLENGE_VSL_MAP[state.challenge] || CHALLENGE_VSL_MAP.felicidade;
  loadVturbVideo('vslPlayer2', playerId, VTURB_PADDING_STAGE2);
}

/* =========================================================================
   INIT
   ========================================================================= */
renderSigns();
renderDecades();
renderMarital();
renderChallenges();
renderGender();
