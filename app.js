/* ROTINA 2026 — app logic. Vanilla JS, no deps, localStorage-only. */

const STORE_KEY = 'rotina2026_v1';

/* ---------------- date helpers ---------------- */
function pad2(n) { return String(n).padStart(2, '0'); }
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isoFromDate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function timeToMin(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minToTime(min) {
  min = ((min % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}
function weekdayOf(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}
function isoWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}
const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

/* ---------------- routine seed (section 4.1) ---------------- */
function weekdayBlocks() {
  return [
    { id: 'acordar', hora_inicio: '08:00', hora_fim: '09:00', nome: 'Acordar', tag: null },
    { id: 'treino', hora_inicio: '09:00', hora_fim: '10:00', nome: 'Treino', tag: 'treino' },
    { id: 'trabalho1', hora_inicio: '10:30', hora_fim: '12:00', nome: 'Trabalho', tag: 'trabalho' },
    { id: 'almoco', hora_inicio: '12:00', hora_fim: '13:30', nome: 'Almoço', tag: 'almoco' },
    { id: 'trabalho2', hora_inicio: '13:30', hora_fim: '18:00', nome: 'Trabalho', tag: 'trabalho' },
    { id: 'estudo', hora_inicio: '18:00', hora_fim: '19:00', nome: 'Estudo', tag: 'estudo' },
    { id: 'livre', hora_inicio: '19:00', hora_fim: '23:59', nome: 'Livre', tag: 'livre' },
    { id: 'dormir', hora_inicio: '23:59', hora_fim: null, nome: 'Dormir', tag: 'sono' },
  ];
}
function buildWeekRoutine() {
  const week = {};
  for (const d of [1, 2, 3, 4, 5]) week[d] = weekdayBlocks();

  week[3] = weekdayBlocks().filter(b => b.id !== 'livre').concat([]);
  week[3].splice(6, 0, { id: 'volei-qua', hora_inicio: '19:00', hora_fim: '23:00', nome: 'Vôlei', tag: 'volei' });

  week[5] = weekdayBlocks().filter(b => b.id !== 'livre');
  week[5].splice(6, 0, { id: 'futsal-sex', hora_inicio: '19:00', hora_fim: '22:00', nome: 'Futsal', tag: 'futsal' });
  week[5].splice(7, 0, { id: 'livre-sex', hora_inicio: '22:00', hora_fim: '23:59', nome: 'Livre', tag: 'livre' });

  week[6] = [
    { id: 'acordar-sab', hora_inicio: '09:00', hora_fim: '10:00', nome: 'Acordar', tag: null },
    { id: 'treino-sab', hora_inicio: '10:00', hora_fim: '11:00', nome: 'Treino', tag: 'treino' },
    { id: 'livre-sab', hora_inicio: '11:00', hora_fim: '23:59', nome: 'Folga', tag: 'livre' },
    { id: 'dormir-sab', hora_inicio: '23:59', hora_fim: null, nome: 'Dormir', tag: 'sono' },
  ];
  week[0] = [
    { id: 'acordar-dom', hora_inicio: '09:00', hora_fim: '10:00', nome: 'Acordar', tag: null },
    { id: 'treino-dom', hora_inicio: '10:00', hora_fim: '11:00', nome: 'Treino', tag: 'treino' },
    { id: 'livre-dom-1', hora_inicio: '11:00', hora_fim: '19:00', nome: 'Folga', tag: 'livre' },
    { id: 'volei-dom', hora_inicio: '19:00', hora_fim: '21:00', nome: 'Vôlei', tag: 'volei' },
    { id: 'livre-dom-2', hora_inicio: '21:00', hora_fim: '23:59', nome: 'Folga', tag: 'livre' },
    { id: 'dormir-dom', hora_inicio: '23:59', hora_fim: null, nome: 'Dormir', tag: 'sono' },
  ];
  return week;
}
const ROUTINE = buildWeekRoutine();

/* ---------------- habits seed ---------------- */
const HABITS = [
  { id: 'agua', periodo: 'AM', nome: 'Água antes do celular', porque: 'fisiológico' },
  { id: 'alongamento', periodo: 'AM', nome: 'Alongamento', porque: 'mobilidade' },
  { id: 'sem-tela-cama', periodo: 'PM', nome: 'Sem tela na cama', porque: 'sono' },
  { id: 'leitura', periodo: 'PM', nome: 'Leitura 10min', porque: 'mente' },
  { id: 'gratidao', periodo: 'PM', nome: '3 coisas boas do dia', porque: 'mental' },
];

/* ---------------- games seed (section 7, fuso Cuiabá/MT UTC-4) ---------------- */
const BENGALS = [
  { data: '2026-08-13', hora: '19:00', adversario: 'Detroit Lions', mandante: true, competicao: 'nfl-pre' },
  { data: '2026-08-22', hora: '19:00', adversario: 'Chicago Bears', mandante: true, competicao: 'nfl-pre' },
  { data: '2026-08-28', hora: '20:00', adversario: 'Philadelphia Eagles', mandante: false, competicao: 'nfl-pre' },
  { data: '2026-09-13', hora: '13:00', adversario: 'Tampa Bay Buccaneers', mandante: true, competicao: 'nfl-reg' },
  { data: '2026-09-20', hora: '13:00', adversario: 'Houston Texans', mandante: false, competicao: 'nfl-reg' },
];
const MAN_UTD = [
  { data: '2026-08-22', hora: '07:30', adversario: 'Hull City', mandante: false, competicao: 'epl' },
  { data: '2026-08-30', hora: '11:30', adversario: 'Ipswich Town', mandante: true, competicao: 'epl' },
  { data: '2026-09-06', hora: '09:00', adversario: 'Everton', mandante: false, competicao: 'epl' },
  { data: '2026-09-13', hora: '11:30', adversario: 'Manchester City', mandante: true, competicao: 'epl' },
  { data: '2026-09-20', hora: '11:30', adversario: 'Fulham', mandante: false, competicao: 'epl' },
];
const SANTOS = [
  { data: '2026-08-01', hora: '20:00', adversario: 'Remo', mandante: true, competicao: 'copa-do-brasil' },
  { data: '2026-08-04', hora: '20:30', adversario: 'Remo', mandante: false, competicao: 'copa-do-brasil' },
  { data: '2026-08-09', hora: null, adversario: 'Athletico-PR', mandante: true, competicao: 'brasileirao' },
  { data: '2026-08-16', hora: null, adversario: 'Vasco da Gama', mandante: false, competicao: 'brasileirao' },
  { data: '2026-08-23', hora: null, adversario: 'Mirassol', mandante: true, competicao: 'brasileirao' },
  { data: '2026-08-30', hora: null, adversario: 'Corinthians', mandante: false, competicao: 'brasileirao' },
];
const LAKERS = [];

const TEAMS = {
  'man-utd': { nome: 'Manchester United', liga: 'Premier League', fixtures: MAN_UTD, icon: 'MU' },
  'lakers': { nome: 'LA Lakers', liga: 'NBA', fixtures: LAKERS, icon: 'LA' },
  'bengals': { nome: 'Cincinnati Bengals', liga: 'NFL', fixtures: BENGALS, icon: 'CIN' },
  'santos': { nome: 'Santos FC', liga: 'Brasileirão + Copa do Brasil', fixtures: SANTOS, icon: 'SAN' },
};

const COMP_LABEL = {
  'nfl-pre': 'NFL · Pré-temporada', 'nfl-reg': 'NFL · Temporada',
  'epl': 'Premier League', 'nba': 'NBA',
  'brasileirao': 'Brasileirão Série A', 'copa-do-brasil': 'Copa do Brasil',
};

const CONFLICT_TAGS = ['trabalho', 'estudo', 'volei', 'futsal'];
const GAME_DURATION_MIN = 120; // fixtures only give kickoff time; assume ~2h match window for overlap checks

/* ---------------- state / persistence ---------------- */
function defaultState() {
  return {
    version: 1,
    routineCompletion: {},
    habitLog: {},
    workTasks: [
      { id: 'w1', board: 'projeto-yt', titulo: 'Roteiro ep. 12', prazo: '2026-08-10', status: 'em_andamento', tier: 'normal', compartilhada: false },
      { id: 'w2', board: 'projeto-yt', titulo: 'Editar ep. 11', prazo: '2026-08-02', status: 'a_fazer', tier: 'normal', compartilhada: false },
      { id: 'w3', board: 'imobiliaria', titulo: 'Fechar contrato Apto 302', prazo: '2026-08-05', status: 'em_andamento', tier: 'normal', compartilhada: true },
      { id: 'w4', board: 'imobiliaria', titulo: 'Vistoria imóvel novo', prazo: '2026-08-01', status: 'a_fazer', tier: 'normal', compartilhada: false },
      { id: 'w5', board: 'prospeccao-ativa', titulo: 'Ligar 20 leads frios', prazo: '2026-08-03', status: 'a_fazer', tier: 'normal', compartilhada: false },
    ],
    personal: {
      alimentacao: [], hidratacao: [], atividade: [], cuidados: [], estudos: [],
      financas: [
        { id: 'f1', texto: 'Aluguel', valor: 1800, data: '2026-08-05', status: 'a_fazer', compartilhada: false },
        { id: 'f2', texto: 'Internet', valor: 120, data: '2026-08-10', status: 'a_fazer', compartilhada: false },
      ],
      objetivos: [
        { id: 'o1', texto: 'Fechar 3 imóveis no trimestre', valor: null, data: '2026-09-30', status: 'em_andamento', compartilhada: false },
      ],
      wishlist: [
        { id: 'wl1', texto: 'Bola de vôlei nova', valor: 180, data: null, status: 'a_fazer', compartilhada: false },
      ],
      residencial: {
        limpeza: [{ id: 'r1', texto: 'Limpeza geral da casa', valor: null, data: null, status: 'a_fazer', compartilhada: true }],
        lixo: [{ id: 'r2', texto: 'Trocar lixo reciclável', valor: null, data: null, status: 'a_fazer', compartilhada: false }],
        gatos: [{ id: 'r3', texto: 'Levar gatos no veterinário', valor: null, data: '2026-08-07', status: 'a_fazer', compartilhada: true }],
      },
      veiculos: [
        { id: 'v1', texto: 'Troca de óleo', valor: null, data: '2026-08-15', status: 'a_fazer', compartilhada: false },
      ],
    },
    notif: { leadMinutes: 15, notifiedGames: {}, notifiedTasks: {}, notifiedBlocks: {} },
    installDismissed: false,
  };
}
let STATE = loadState();
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const def = defaultState();
    return { ...def, ...parsed, notif: { ...def.notif, ...(parsed.notif || {}) }, personal: { ...def.personal, ...(parsed.personal || {}) } };
  } catch (e) {
    return defaultState();
  }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(STATE)); }

/* ---------------- routine helpers ---------------- */
function blocksForDate(dateISO) { return ROUTINE[weekdayOf(dateISO)] || []; }
function isBlockNow(block, dateISO) {
  if (dateISO !== todayISO()) return false;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = timeToMin(block.hora_inicio);
  let end = block.hora_fim ? timeToMin(block.hora_fim) : start + 1;
  if (end <= start) end += 1440;
  return nowMin >= start && nowMin < end;
}
function isBlockDone(dateISO, blockId) { return !!(STATE.routineCompletion[dateISO] && STATE.routineCompletion[dateISO][blockId]); }
function toggleBlockDone(dateISO, blockId) {
  if (!STATE.routineCompletion[dateISO]) STATE.routineCompletion[dateISO] = {};
  STATE.routineCompletion[dateISO][blockId] = !STATE.routineCompletion[dateISO][blockId];
  saveState();
}

/* ---------------- games helpers ---------------- */
function allFixturesFlat() {
  const out = [];
  for (const [teamId, team] of Object.entries(TEAMS)) {
    for (const f of team.fixtures) out.push({ ...f, teamId, teamNome: team.nome, teamIcon: team.icon });
  }
  return out.sort((a, b) => (a.data + (a.hora || '00:00')).localeCompare(b.data + (b.hora || '00:00')));
}
function gamesOnDate(dateISO) { return allFixturesFlat().filter(f => f.data === dateISO); }
function gameConflict(fixture) {
  if (!fixture.hora) return null;
  const blocks = blocksForDate(fixture.data);
  const gStart = timeToMin(fixture.hora);
  const gEnd = gStart + GAME_DURATION_MIN;
  for (const b of blocks) {
    if (!CONFLICT_TAGS.includes(b.tag)) continue;
    const bStart = timeToMin(b.hora_inicio);
    let bEnd = b.hora_fim ? timeToMin(b.hora_fim) : bStart + 1;
    if (bEnd <= bStart) bEnd += 1440;
    if (gStart < bEnd && gEnd > bStart) return b;
  }
  return null;
}

/* ---------------- work tasks / tiers ---------------- */
function daysOverdue(prazoISO) {
  if (!prazoISO) return 0;
  const [y, m, d] = prazoISO.split('-').map(Number);
  const prazo = new Date(y, m - 1, d);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.floor((now - prazo) / 86400000);
}
function effectiveTier(task) {
  if (task.status === 'concluido') return 'normal';
  const over = daysOverdue(task.prazo);
  if (over >= 3) return 'urgente';
  if (over >= 1) return 'alta';
  return task.tier === 'urgente' || task.tier === 'alta' ? task.tier : 'normal';
}
function refreshTiers() {
  let changed = false;
  for (const t of STATE.workTasks) {
    const eff = effectiveTier(t);
    if (eff !== t.tier) { t.tier = eff; changed = true; }
  }
  if (changed) saveState();
}
const WORK_BOARDS = [
  { id: 'projeto-yt', nome: 'Projeto Yt' },
  { id: 'imobiliaria', nome: 'Imobiliária' },
  { id: 'prospeccao-ativa', nome: 'Prospecção Ativa' },
];
const STATUS_COLS = [
  { id: 'a_fazer', nome: 'A Fazer' },
  { id: 'em_andamento', nome: 'Em Andamento' },
  { id: 'concluido', nome: 'Concluído' },
];
function cycleStatus(current, dir) {
  const ids = STATUS_COLS.map(c => c.id);
  let idx = ids.indexOf(current) + dir;
  idx = Math.max(0, Math.min(ids.length - 1, idx));
  return ids[idx];
}

/* ---------------- personal generic lists ---------------- */
const PERSONAL_SIMPLE = [
  { key: 'alimentacao', label: 'Alimentação' },
  { key: 'hidratacao', label: 'Hidratação' },
  { key: 'atividade', label: 'Atividade Física' },
  { key: 'cuidados', label: 'Cuidados' },
  { key: 'estudos', label: 'Estudos' },
];
function personalListRef(path) {
  if (path.startsWith('residencial.')) return STATE.personal.residencial[path.split('.')[1]];
  return STATE.personal[path];
}
function addPersonalItem(path, texto, valor, data) {
  const list = personalListRef(path);
  list.push({ id: 'p' + Date.now() + Math.random().toString(36).slice(2, 6), texto, valor: valor || null, data: data || null, status: 'a_fazer', compartilhada: false });
  saveState();
}
function togglePersonalDone(path, id) {
  const list = personalListRef(path);
  const item = list.find(i => i.id === id);
  if (item) item.status = item.status === 'concluido' ? 'a_fazer' : 'concluido';
  saveState();
}
function toggleShared(path, id) {
  const list = personalListRef(path);
  const item = list.find(i => i.id === id);
  if (item) item.compartilhada = !item.compartilhada;
  saveState();
}
function removePersonalItem(path, id) {
  const list = personalListRef(path);
  const idx = list.findIndex(i => i.id === id);
  if (idx >= 0) list.splice(idx, 1);
  saveState();
}
function allPersonalWithOrigin() {
  const out = [];
  for (const s of PERSONAL_SIMPLE) for (const item of STATE.personal[s.key]) out.push({ item, origin: s.label, path: s.key });
  for (const [subKey, subLabel] of [['limpeza', 'Limpeza da Casa'], ['lixo', 'Troca de Lixo'], ['gatos', 'Cuidados com os Gatos']]) {
    for (const item of STATE.personal.residencial[subKey]) out.push({ item, origin: 'Residencial · ' + subLabel, path: 'residencial.' + subKey });
  }
  for (const item of STATE.personal.financas) out.push({ item, origin: 'Finanças', path: 'financas' });
  for (const item of STATE.personal.objetivos) out.push({ item, origin: 'Objetivos', path: 'objetivos' });
  for (const item of STATE.personal.wishlist) out.push({ item, origin: 'Wish List', path: 'wishlist' });
  for (const item of STATE.personal.veiculos) out.push({ item, origin: 'Veículos', path: 'veiculos' });
  return out;
}

/* ---------------- rendering: header ---------------- */
function renderHeader() {
  const now = new Date();
  document.getElementById('clock').textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  document.getElementById('date-line').textContent = `${WEEKDAY_NAMES[now.getDay()]}, ${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
  document.getElementById('week-badge').textContent = `SEM ${isoWeekNumber(now)}`;
}
function renderBarcode() {
  const el = document.getElementById('barcode');
  el.innerHTML = '';
  const seed = todayISO().replace(/-/g, '');
  for (let i = 0; i < 28; i++) {
    const w = (parseInt(seed[i % seed.length], 10) % 3) + 1;
    const h = 10 + ((parseInt(seed[(i * 3) % seed.length], 10) * 7) % 20);
    const span = document.createElement('span');
    span.style.width = w + 'px';
    span.style.height = h + 'px';
    el.appendChild(span);
  }
}

/* ---------------- rendering: HOJE ---------------- */
function tagClass(tag) { return tag ? `t-${tag}` : ''; }
function tagLabel(tag) {
  const map = { trabalho: 'Trabalho', treino: 'Treino', volei: 'Vôlei', futsal: 'Futsal', estudo: 'Estudo', sono: 'Sono', livre: 'Livre', almoco: 'Almoço' };
  return tag ? (map[tag] || tag) : '';
}
function renderHoje() {
  const dateISO = todayISO();
  const blocks = blocksForDate(dateISO);
  const games = gamesOnDate(dateISO);
  const conflicts = games.map(g => ({ g, block: gameConflict(g) })).filter(x => x.block);

  const wrap = document.getElementById('view-hoje');
  let html = '';

  if (conflicts.length) {
    html += `<div class="panel"><div class="panel-title">Alertas de Conflito</div>`;
    for (const c of conflicts) {
      html += `<div class="alert-box"><span class="icon">⚠️</span><span><b>${c.g.teamNome}</b> às ${c.g.hora} sobrepõe <b>${c.block.nome}</b> (${c.block.hora_inicio}–${c.block.hora_fim || ''}) hoje.</span></div>`;
    }
    html += `</div>`;
  }

  html += `<div class="schedule-card">
    <div class="panel-title">Timeline de Hoje</div>
    <div class="panel-sub">${WEEKDAY_NAMES[weekdayOf(dateISO)]} · ${dateISO}</div>`;
  const rows = [];
  for (const b of blocks) {
    rows.push({ sortKey: timeToMin(b.hora_inicio), kind: 'block', data: b });
  }
  for (const g of games) {
    rows.push({ sortKey: g.hora ? timeToMin(g.hora) : 1440, kind: 'game', data: g });
  }
  const workToday = STATE.workTasks.filter(t => t.prazo === dateISO && t.status !== 'concluido');
  for (const t of workToday) rows.push({ sortKey: 1441, kind: 'work', data: t });
  const personalToday = allPersonalWithOrigin().filter(x => x.item.data === dateISO && x.item.status !== 'concluido');
  for (const p of personalToday) rows.push({ sortKey: 1442, kind: 'personal', data: p });
  rows.sort((a, b) => a.sortKey - b.sortKey);

  if (!rows.length) html += `<div class="empty-note">nada agendado hoje...</div>`;
  for (const r of rows) {
    if (r.kind === 'block') {
      const b = r.data;
      const now = isBlockNow(b, dateISO);
      const done = isBlockDone(dateISO, b.id);
      html += `<div class="sched-row ${now ? 'now' : ''}">
        <span class="time">${b.hora_inicio}${b.hora_fim ? '–' + b.hora_fim : ''}</span>
        <span class="name">${b.nome} ${b.tag ? `<span class="tag ${tagClass(b.tag)}">${tagLabel(b.tag)}</span>` : ''}</span>
        <button class="done-check ${done ? 'checked' : ''}" data-block-id="${b.id}" onclick="onToggleBlock('${b.id}')">${done ? '✓' : ''}</button>
      </div>`;
    } else if (r.kind === 'game') {
      const g = r.data;
      const hasConflict = gameConflict(g);
      html += `<div class="sched-row">
        <span class="time">${g.hora || 'TBD'}</span>
        <span class="name">🏟 ${g.teamNome} x ${g.adversario} ${hasConflict ? '<span class="badge-conflict">⚠️ Conflito</span>' : ''}</span>
      </div>`;
    } else if (r.kind === 'work') {
      const t = r.data;
      html += `<div class="sched-row">
        <span class="time">Prazo hoje</span>
        <span class="name">💼 ${t.titulo} <span class="tier-pill ${t.tier}">${t.tier}</span></span>
      </div>`;
    } else if (r.kind === 'personal') {
      html += `<div class="sched-row">
        <span class="time">Vence hoje</span>
        <span class="name">🏠 ${r.data.item.texto} <span class="tag">${r.data.origin}</span></span>
      </div>`;
    }
  }
  html += `</div>`;

  html += `<div class="panel"><div class="panel-title">Hábitos Rápidos</div><div class="panel-sub">toque para alternar</div>`;
  html += renderHabitQuickToggles(dateISO);
  html += `</div>`;

  wrap.innerHTML = html;
}
function renderHabitQuickToggles(dateISO) {
  const log = STATE.habitLog[dateISO] || {};
  let html = '<div class="stat-row">';
  for (const h of HABITS) {
    const state = log[h.id] || 'none';
    html += `<div class="stat-box" style="cursor:pointer" onclick="onQuickHabit('${h.id}')">
      <div class="num" style="font-size:20px">${state === 'done' ? '✓' : state === 'skip' ? '–' : '○'}</div>
      <div class="lbl">${h.nome}</div>
    </div>`;
  }
  html += '</div>';
  return html;
}
function onToggleBlock(blockId) { toggleBlockDone(todayISO(), blockId); renderHoje(); }
function onQuickHabit(habitId) {
  const dateISO = todayISO();
  if (!STATE.habitLog[dateISO]) STATE.habitLog[dateISO] = {};
  const cur = STATE.habitLog[dateISO][habitId] || 'none';
  const next = cur === 'none' ? 'done' : cur === 'done' ? 'skip' : 'none';
  STATE.habitLog[dateISO][habitId] = next;
  saveState();
  renderHoje();
  if (document.getElementById('view-rotina').classList.contains('active-view')) renderRotina();
}

/* ---------------- rendering: ROTINA ---------------- */
function renderRotina() {
  const wrap = document.getElementById('view-rotina');
  let html = `<div class="panel"><div class="panel-title">Grade Semanal</div><div class="panel-sub">blocos fixos por dia</div>`;
  html += `<div class="grid-2">`;
  for (let d = 0; d < 7; d++) {
    const blocks = ROUTINE[d];
    html += `<div class="schedule-card" style="margin-bottom:14px">
      <div class="panel-sub" style="margin-bottom:8px">${WEEKDAY_SHORT[d]}</div>`;
    for (const b of blocks) {
      html += `<div class="sched-row">
        <span class="time" style="font-size:14px;min-width:78px">${b.hora_inicio}${b.hora_fim ? '–' + b.hora_fim : ''}</span>
        <span class="name">${b.nome} ${b.tag ? `<span class="tag ${tagClass(b.tag)}">${tagLabel(b.tag)}</span>` : ''}</span>
      </div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;

  html += renderHabitsPanel();
  wrap.innerHTML = html;
}
function last30Dates() {
  const out = [];
  const d = new Date();
  for (let i = 29; i >= 0; i--) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - i);
    out.push(isoFromDate(dd));
  }
  return out;
}
function last7Dates() {
  const out = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - i);
    out.push(isoFromDate(dd));
  }
  return out;
}
function habitStreak(habitId) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const iso = isoFromDate(d);
    const state = (STATE.habitLog[iso] || {})[habitId];
    if (state === 'done') { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}
function renderHabitsPanel() {
  const week = last7Dates();
  let html = `<div class="panel"><div class="panel-title">Hábitos</div><div class="panel-sub">grid semanal · clique para alternar (vazio → feito → pulado)</div>`;
  html += `<div style="overflow-x:auto"><table class="habit-table"><thead><tr><th style="text-align:left">Hábito</th>`;
  for (const iso of week) html += `<th>${WEEKDAY_SHORT[weekdayOf(iso)]}</th>`;
  html += `</tr></thead><tbody>`;
  for (const h of HABITS) {
    html += `<tr><td class="habit-name">${h.nome}<span class="habit-why">${h.porque}</span></td>`;
    for (const iso of week) {
      const state = (STATE.habitLog[iso] || {})[h.id] || 'none';
      html += `<td><div class="cell-toggle" data-state="${state}" onclick="onGridHabit('${h.id}','${iso}')"></div></td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;

  html += `<div class="sec-divider"></div><div class="panel-sub">streaks</div><div class="stat-row">`;
  for (const h of HABITS) {
    html += `<div class="stat-box"><div class="num">${habitStreak(h.id)}</div><div class="lbl">${h.nome}</div></div>`;
  }
  html += `</div>`;

  html += `<div class="panel-sub" style="margin-top:12px">heatmap · últimos 30 dias (todos os hábitos)</div>`;
  html += `<div class="heatmap">`;
  for (const iso of last30Dates()) {
    const log = STATE.habitLog[iso] || {};
    const doneCount = HABITS.filter(h => log[h.id] === 'done').length;
    const level = HABITS.length ? Math.min(5, Math.round((doneCount / HABITS.length) * 5)) : 0;
    html += `<div class="hcell" data-level="${level}" title="${iso}: ${doneCount}/${HABITS.length}"></div>`;
  }
  html += `</div></div>`;
  return html;
}
function onGridHabit(habitId, dateISO) {
  if (!STATE.habitLog[dateISO]) STATE.habitLog[dateISO] = {};
  const cur = STATE.habitLog[dateISO][habitId] || 'none';
  const next = cur === 'none' ? 'done' : cur === 'done' ? 'skip' : 'none';
  STATE.habitLog[dateISO][habitId] = next;
  saveState();
  renderRotina();
}

/* ---------------- rendering: TRABALHO ---------------- */
function renderTrabalho() {
  refreshTiers();
  const wrap = document.getElementById('view-trabalho');
  let html = '';
  for (const board of WORK_BOARDS) {
    const tasks = STATE.workTasks.filter(t => t.board === board.id);
    html += `<div class="panel"><div class="panel-title">${board.nome}</div>`;
    html += `<div class="inline-form">
      <input type="text" id="new-title-${board.id}" placeholder="Nova tarefa...">
      <input type="date" id="new-prazo-${board.id}">
      <button class="btn" onclick="onAddWorkTask('${board.id}')">+ Adicionar</button>
    </div>`;
    html += `<div class="kanban">`;
    for (const col of STATUS_COLS) {
      html += `<div class="kanban-col"><h4>${col.nome}</h4><div class="col-body">`;
      const colTasks = tasks.filter(t => t.status === col.id);
      if (!colTasks.length) html += `<div class="empty-note" style="font-size:14px">vazio</div>`;
      for (const t of colTasks) html += renderWorkTaskCard(t);
      html += `</div></div>`;
    }
    html += `</div></div>`;
  }
  wrap.innerHTML = html;
}
function renderWorkTaskCard(t) {
  const overdue = daysOverdue(t.prazo) > 0 && t.status !== 'concluido';
  return `<div class="task-card tier-${t.tier}">
    <div class="t-title">${t.titulo}</div>
    <div class="t-meta">
      <span class="t-deadline">${t.prazo ? 'prazo ' + t.prazo + (overdue ? ' · atrasado' : '') : 'sem prazo'}</span>
      <span class="tier-pill ${t.tier}">${t.tier}</span>
    </div>
    <div class="t-meta" style="margin-top:4px">
      <label style="font-size:10px;display:flex;align-items:center;gap:4px;cursor:pointer">
        <input type="checkbox" ${t.compartilhada ? 'checked' : ''} onchange="onToggleWorkShared('${t.id}')"> compartilhada
      </label>
    </div>
    <div class="t-actions">
      <button onclick="onMoveWork('${t.id}',-1)" ${t.status === 'a_fazer' ? 'disabled' : ''}>◀</button>
      <button onclick="onMoveWork('${t.id}',1)" ${t.status === 'concluido' ? 'disabled' : ''}>▶</button>
      <button onclick="onDeleteWork('${t.id}')">✕</button>
    </div>
  </div>`;
}
function onAddWorkTask(boardId) {
  const titleEl = document.getElementById(`new-title-${boardId}`);
  const prazoEl = document.getElementById(`new-prazo-${boardId}`);
  const titulo = titleEl.value.trim();
  if (!titulo) return;
  STATE.workTasks.push({ id: 'w' + Date.now() + Math.random().toString(36).slice(2, 6), board: boardId, titulo, prazo: prazoEl.value || null, status: 'a_fazer', tier: 'normal', compartilhada: false });
  saveState();
  renderTrabalho();
}
function onMoveWork(id, dir) {
  const t = STATE.workTasks.find(x => x.id === id);
  if (t) t.status = cycleStatus(t.status, dir);
  saveState();
  renderTrabalho();
}
function onDeleteWork(id) {
  const idx = STATE.workTasks.findIndex(x => x.id === id);
  if (idx >= 0) STATE.workTasks.splice(idx, 1);
  saveState();
  renderTrabalho();
}
function onToggleWorkShared(id) {
  const t = STATE.workTasks.find(x => x.id === id);
  if (t) t.compartilhada = !t.compartilhada;
  saveState();
  renderTrabalho();
}

/* ---------------- rendering: PESSOAL ---------------- */
const PESSOAL_SUBTABS = [
  { id: 'diario', label: 'Diário' },
  { id: 'financas', label: 'Finanças' },
  { id: 'objetivos', label: 'Objetivos' },
  { id: 'wishlist', label: 'Wish List' },
  { id: 'residencial', label: 'Residencial' },
  { id: 'veiculos', label: 'Veículos' },
];
let pessoalSub = 'diario';
function renderPessoal() {
  const wrap = document.getElementById('view-pessoal');
  let html = `<div class="sub-tabs">`;
  for (const s of PESSOAL_SUBTABS) html += `<button class="${pessoalSub === s.id ? 'active' : ''}" onclick="onPessoalSub('${s.id}')">${s.label}</button>`;
  html += `</div>`;

  if (pessoalSub === 'diario') {
    html += `<div class="grid-2">`;
    for (const s of PERSONAL_SIMPLE) html += simpleListPanel(s.label, s.key);
    html += `</div>`;
  } else if (pessoalSub === 'financas') {
    html += valueListPanel('Finanças · Contas a Pagar', 'financas', { withValor: true, withData: true, dataLabel: 'vencimento' });
  } else if (pessoalSub === 'objetivos') {
    html += valueListPanel('Objetivos e Metas', 'objetivos', { withValor: false, withData: true, dataLabel: 'prazo' });
  } else if (pessoalSub === 'wishlist') {
    html += valueListPanel('Wish List', 'wishlist', { withValor: true, withData: false });
  } else if (pessoalSub === 'residencial') {
    html += `<div class="grid-2">`;
    html += valueListPanel('Limpeza da Casa', 'residencial.limpeza', { withValor: false, withData: false });
    html += valueListPanel('Troca de Lixo', 'residencial.lixo', { withValor: false, withData: false });
    html += valueListPanel('Cuidados com os Gatos', 'residencial.gatos', { withValor: false, withData: true, dataLabel: 'data' });
    html += `</div>`;
  } else if (pessoalSub === 'veiculos') {
    html += valueListPanel('Veículos', 'veiculos', { withValor: false, withData: true, dataLabel: 'data' });
  }
  wrap.innerHTML = html;
}
function onPessoalSub(id) { pessoalSub = id; renderPessoal(); }

function simpleListPanel(label, key) {
  const dateISO = todayISO();
  const log = STATE.habitLog; // not used, simple list is independent of date
  const list = STATE.personal[key];
  let html = `<div class="panel"><div class="panel-title" style="font-size:20px">${label}</div>`;
  html += `<div class="inline-form"><input type="text" id="new-${key}" placeholder="Adicionar item..."><button class="btn" onclick="onAddSimple('${key}')">+</button></div>`;
  html += `<ul class="simple-list">`;
  if (!list.length) html += `<li class="empty-note">nada por aqui ainda</li>`;
  for (const item of list) {
    html += `<li class="${item.status === 'concluido' ? 'done' : ''}">
      <div class="check-box ${item.status === 'concluido' ? 'checked' : ''}" onclick="onTogglePersonal('${key}','${item.id}')"></div>
      <span class="li-text">${item.texto}</span>
      <button class="x" onclick="onRemovePersonal('${key}','${item.id}')">✕</button>
    </li>`;
  }
  html += `</ul></div>`;
  return html;
}
function valueListPanel(label, path, opts) {
  const list = personalListRef(path);
  const idPrefix = path.replace('.', '-');
  let html = `<div class="panel"><div class="panel-title" style="font-size:20px">${label}</div>`;
  html += `<div class="inline-form">
    <input type="text" id="new-txt-${idPrefix}" placeholder="Descrição...">`;
  if (opts.withValor) html += `<input type="number" id="new-val-${idPrefix}" placeholder="Valor R$" style="width:100px">`;
  if (opts.withData) html += `<input type="date" id="new-date-${idPrefix}">`;
  html += `<button class="btn" onclick="onAddValue('${path}','${idPrefix}',${opts.withValor},${opts.withData})">+ Adicionar</button></div>`;
  html += `<ul class="simple-list">`;
  if (!list.length) html += `<li class="empty-note">nada por aqui ainda</li>`;
  for (const item of list) {
    html += `<li class="${item.status === 'concluido' ? 'done' : ''}">
      <div class="check-box ${item.status === 'concluido' ? 'checked' : ''}" onclick="onTogglePersonal('${path}','${item.id}')"></div>
      <span class="li-text">${item.texto}</span>
      <span class="li-meta">${item.valor ? 'R$ ' + item.valor : ''} ${item.data ? '· ' + item.data : ''}</span>
      <label style="font-size:10px;display:flex;align-items:center;gap:3px;cursor:pointer">
        <input type="checkbox" ${item.compartilhada ? 'checked' : ''} onchange="onToggleSharedPersonal('${path}','${item.id}')"> compartilhada
      </label>
      <button class="x" onclick="onRemovePersonal('${path}','${item.id}')">✕</button>
    </li>`;
  }
  html += `</ul></div>`;
  return html;
}
function onAddSimple(key) {
  const el = document.getElementById(`new-${key}`);
  const texto = el.value.trim();
  if (!texto) return;
  addPersonalItem(key, texto);
  el.value = '';
  renderPessoal();
}
function onAddValue(path, idPrefix, withValor, withData) {
  const txtEl = document.getElementById(`new-txt-${idPrefix}`);
  const texto = txtEl.value.trim();
  if (!texto) return;
  const valor = withValor ? parseFloat(document.getElementById(`new-val-${idPrefix}`).value) || null : null;
  const data = withData ? document.getElementById(`new-date-${idPrefix}`).value || null : null;
  addPersonalItem(path, texto, valor, data);
  renderPessoal();
}
function onTogglePersonal(path, id) { togglePersonalDone(path, id); renderPessoal(); }
function onToggleSharedPersonal(path, id) { toggleShared(path, id); renderPessoal(); renderQuadro(); }
function onRemovePersonal(path, id) { removePersonalItem(path, id); renderPessoal(); }

/* ---------------- rendering: JOGOS ---------------- */
function renderJogos() {
  const wrap = document.getElementById('view-jogos');
  let html = '';
  for (const [teamId, team] of Object.entries(TEAMS)) {
    html += `<div class="panel"><div class="panel-title">${team.nome}</div><div class="panel-sub">${team.liga}</div>`;
    if (!team.fixtures.length) {
      html += `<div class="empty-note">sem jogos confirmados no momento — recheck em breve.</div>`;
    }
    for (const f of team.fixtures) {
      const conflict = gameConflict(f);
      html += `<div class="game-row comp-${f.competicao}">
        <div class="g-team-icon">${team.icon}</div>
        <div class="g-info">
          <div class="g-matchup">${team.nome} ${f.mandante ? 'x' : '@'} ${f.adversario}</div>
          <div class="g-comp">${COMP_LABEL[f.competicao] || f.competicao} · ${f.data}</div>
        </div>
        <span class="badge-mando">${f.mandante ? 'CASA' : 'FORA'}</span>
        ${conflict ? `<span class="badge-conflict">⚠️ Conflito: ${conflict.nome}</span>` : ''}
        <div class="g-time">${f.hora || '<span class="badge-tbd">TBD</span>'}</div>
      </div>`;
    }
    html += `</div>`;
  }
  html += `<div class="panel"><div class="panel-sub">Horários no fuso de Cuiabá/MT (UTC-4). Jogos do Brasileirão marcados como TBD costumam ser divulgados na quinta-feira da semana do jogo — recheck recomendado.</div></div>`;
  wrap.innerHTML = html;
}

/* ---------------- rendering: QUADRO CONJUNTO ---------------- */
function renderQuadro() {
  const wrap = document.getElementById('view-quadro');
  const workShared = STATE.workTasks.filter(t => t.compartilhada).map(t => ({ id: t.id, texto: t.titulo, status: t.status, origin: 'Trabalho', kind: 'work' }));
  const personalShared = allPersonalWithOrigin().filter(x => x.item.compartilhada).map(x => ({ id: x.item.id, texto: x.item.texto, status: x.item.status, origin: x.origin, path: x.path, kind: 'personal' }));
  const all = [...workShared, ...personalShared];

  let html = `<div class="panel"><div class="panel-title">Quadro Conjunto</div><div class="panel-sub">tarefas compartilhadas / que dependem de terceiros, de qualquer área</div>`;
  html += `<div class="kanban">`;
  for (const col of STATUS_COLS) {
    html += `<div class="kanban-col"><h4>${col.nome}</h4><div class="col-body">`;
    const items = all.filter(i => i.status === col.id);
    if (!items.length) html += `<div class="empty-note" style="font-size:14px">vazio</div>`;
    for (const i of items) {
      html += `<div class="task-card">
        <div class="t-title">${i.texto}</div>
        <div class="t-meta"><span class="origin-pill">${i.origin}</span></div>
        <div class="t-actions">
          <button onclick="onMoveQuadro('${i.kind}','${i.id}','${i.path || ''}',-1)" ${i.status === 'a_fazer' ? 'disabled' : ''}>◀</button>
          <button onclick="onMoveQuadro('${i.kind}','${i.id}','${i.path || ''}',1)" ${i.status === 'concluido' ? 'disabled' : ''}>▶</button>
        </div>
      </div>`;
    }
    html += `</div></div>`;
  }
  html += `</div></div>`;
  wrap.innerHTML = html;
}
function onMoveQuadro(kind, id, path, dir) {
  if (kind === 'work') {
    const t = STATE.workTasks.find(x => x.id === id);
    if (t) t.status = cycleStatus(t.status, dir);
  } else {
    const list = personalListRef(path);
    const item = list.find(x => x.id === id);
    if (item) item.status = cycleStatus(item.status, dir);
  }
  saveState();
  renderQuadro();
}

/* ---------------- tabs ---------------- */
const TABS = ['hoje', 'rotina', 'trabalho', 'pessoal', 'jogos', 'quadro'];
function switchTab(tab) {
  for (const t of TABS) {
    document.getElementById(`view-${t}`).classList.toggle('active-view', t === tab);
    document.getElementById(`view-${t}`).classList.toggle('hidden', t !== tab);
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
  }
  if (tab === 'hoje') renderHoje();
  else if (tab === 'rotina') renderRotina();
  else if (tab === 'trabalho') renderTrabalho();
  else if (tab === 'pessoal') renderPessoal();
  else if (tab === 'jogos') renderJogos();
  else if (tab === 'quadro') renderQuadro();
  window.location.hash = tab;
}

/* ---------------- notifications ---------------- */
async function requestNotifPermission() {
  if (!('Notification' in window)) return;
  const perm = await Notification.requestPermission();
  document.getElementById('install-banner').classList.toggle('hidden', perm !== 'default');
}
function fireNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(reg => reg.showNotification(title, { body, icon: 'icons/icon.svg' })).catch(() => {
      new Notification(title, { body });
    });
  } else {
    new Notification(title, { body });
  }
}
function checkNotifications() {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dateISO = todayISO();

  for (const b of blocksForDate(dateISO)) {
    const start = timeToMin(b.hora_inicio);
    if (start === nowMin) {
      const key = dateISO + '_' + b.id;
      if (!STATE.notif.notifiedBlocks[key]) {
        fireNotification('Rotina', `Começando agora: ${b.nome}`);
        STATE.notif.notifiedBlocks[key] = true;
        saveState();
      }
    }
  }

  for (const t of STATE.workTasks) {
    if (t.prazo === dateISO && t.status !== 'concluido') {
      const key = dateISO + '_' + t.id;
      if (!STATE.notif.notifiedTasks[key]) {
        fireNotification('Prazo hoje', t.titulo);
        STATE.notif.notifiedTasks[key] = true;
        saveState();
      }
    }
  }

  for (const g of gamesOnDate(dateISO)) {
    if (!g.hora) continue;
    const start = timeToMin(g.hora);
    const lead = STATE.notif.leadMinutes || 15;
    const key = dateISO + '_' + g.teamId + '_' + g.hora;
    if (nowMin >= start - lead && nowMin < start && !STATE.notif.notifiedGames[key]) {
      fireNotification('Jogo em breve', `${g.teamNome} x ${g.adversario} às ${g.hora}`);
      STATE.notif.notifiedGames[key] = true;
      saveState();
    }
  }
}

/* ---------------- PWA install banner ---------------- */
function setupInstallBanner() {
  const banner = document.getElementById('install-banner');
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (standalone) { banner.classList.add('hidden'); return; }
  if (STATE.installDismissed) { banner.classList.add('hidden'); return; }
  banner.classList.remove('hidden');
  document.getElementById('dismiss-install').onclick = () => {
    STATE.installDismissed = true; saveState(); banner.classList.add('hidden');
  };
  document.getElementById('enable-notif').onclick = requestNotifPermission;
}

/* ---------------- init ---------------- */
function init() {
  for (const t of TABS) document.getElementById(`tab-${t}`).addEventListener('click', () => switchTab(t));
  renderHeader();
  renderBarcode();
  setupInstallBanner();
  refreshTiers();

  const initial = (window.location.hash || '#hoje').replace('#', '');
  switchTab(TABS.includes(initial) ? initial : 'hoje');

  setInterval(renderHeader, 15000);
  setInterval(() => {
    checkNotifications();
    if (document.getElementById('view-hoje').classList.contains('active-view')) renderHoje();
  }, 30000);
  checkNotifications();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
document.addEventListener('DOMContentLoaded', init);
