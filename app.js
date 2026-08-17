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
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
function addMonths(yyyyMm, delta) {
  let [y, m] = yyyyMm.split('-').map(Number);
  m += delta;
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  return `${y}-${pad2(m)}`;
}
function monthGridDays(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const gridStart = new Date(y, m - 1, 1 - first.getDay());
  const days = [];
  for (let i = 0; i < 42; i++) { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); days.push(d); }
  return days;
}

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

  week[3] = weekdayBlocks().filter(b => b.id !== 'livre');
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
  { data: '2026-09-27', hora: '13:00', adversario: 'Pittsburgh Steelers', mandante: false, competicao: 'nfl-reg' },
  { data: '2026-10-04', hora: '13:00', adversario: 'Jacksonville Jaguars', mandante: true, competicao: 'nfl-reg' },
  { data: '2026-10-11', hora: '13:00', adversario: 'Miami Dolphins', mandante: false, competicao: 'nfl-reg' },
  // WK6: bye week — sem jogo
  { data: '2026-10-25', hora: '13:00', adversario: 'Baltimore Ravens', mandante: false, competicao: 'nfl-reg' },
  { data: '2026-11-01', hora: '14:00', adversario: 'Tennessee Titans', mandante: true, competicao: 'nfl-reg' },
  { data: '2026-11-08', hora: '10:30', adversario: 'Atlanta Falcons', mandante: true, competicao: 'nfl-reg' },
  { data: '2026-11-15', hora: '21:20', adversario: 'Pittsburgh Steelers', mandante: true, competicao: 'nfl-reg' },
  { data: '2026-11-23', hora: '21:15', adversario: 'Washington Commanders', mandante: false, competicao: 'nfl-reg' },
  { data: '2026-11-29', hora: '14:00', adversario: 'New Orleans Saints', mandante: true, competicao: 'nfl-reg' },
  { data: '2026-12-06', hora: '14:00', adversario: 'Cleveland Browns', mandante: false, competicao: 'nfl-reg' },
  { data: '2026-12-13', hora: '17:25', adversario: 'Kansas City Chiefs', mandante: true, competicao: 'nfl-reg' },
  { data: '2026-12-20', hora: '14:00', adversario: 'Carolina Panthers', mandante: true, competicao: 'nfl-reg' },
  // WK16: flex game vs Indianapolis Colts — data/horário ainda não definidos pela NFL
  { data: '2026-12-31', hora: '21:15', adversario: 'Baltimore Ravens', mandante: false, competicao: 'nfl-reg' },
  // WK18: flex game @ Cleveland Browns — data/horário ainda não definidos pela NFL
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
  { data: '2026-08-20', hora: '17:00', adversario: 'Macará', mandante: false, competicao: 'sudamericana' },
  { data: '2026-08-23', hora: '16:30', adversario: 'Mirassol', mandante: true, competicao: 'brasileirao' },
  { data: '2026-08-26', hora: '19:30', adversario: 'Palmeiras', mandante: false, competicao: 'copa-do-brasil' },
  { data: '2026-08-30', hora: '14:00', adversario: 'Corinthians', mandante: false, competicao: 'brasileirao' },
  { data: '2026-09-02', hora: '19:30', adversario: 'Palmeiras', mandante: true, competicao: 'copa-do-brasil' },
  { data: '2026-09-06', hora: '14:00', adversario: 'Internacional', mandante: false, competicao: 'brasileirao' },
  { data: '2026-09-12', hora: null, adversario: 'Cruzeiro', mandante: true, competicao: 'brasileirao' },
  { data: '2026-09-19', hora: null, adversario: 'Remo', mandante: false, competicao: 'brasileirao' },
  { data: '2026-10-07', hora: null, adversario: 'Flamengo', mandante: true, competicao: 'brasileirao' },
  { data: '2026-10-10', hora: null, adversario: 'Atlético-MG', mandante: false, competicao: 'brasileirao' },
  { data: '2026-10-17', hora: null, adversario: 'Fluminense', mandante: true, competicao: 'brasileirao' },
  { data: '2026-10-24', hora: null, adversario: 'Bahia', mandante: true, competicao: 'brasileirao' },
  { data: '2026-10-28', hora: null, adversario: 'Palmeiras', mandante: true, competicao: 'brasileirao' },
  { data: '2026-11-04', hora: null, adversario: 'Red Bull Bragantino', mandante: false, competicao: 'brasileirao' },
  { data: '2026-11-18', hora: null, adversario: 'Coritiba', mandante: false, competicao: 'brasileirao' },
  { data: '2026-11-21', hora: null, adversario: 'Grêmio', mandante: true, competicao: 'brasileirao' },
  { data: '2026-11-28', hora: null, adversario: 'Vitória', mandante: false, competicao: 'brasileirao' },
  { data: '2026-12-02', hora: null, adversario: 'Botafogo', mandante: true, competicao: 'brasileirao' },
];
const DODGERS = [
  { data: '2026-08-17', hora: '20:40', adversario: 'Colorado Rockies', mandante: false, competicao: 'mlb' },
  { data: '2026-08-18', hora: '20:40', adversario: 'Colorado Rockies', mandante: false, competicao: 'mlb' },
  { data: '2026-08-19', hora: '20:40', adversario: 'Colorado Rockies', mandante: false, competicao: 'mlb' },
  { data: '2026-08-21', hora: '22:10', adversario: 'Pittsburgh Pirates', mandante: true, competicao: 'mlb' },
  { data: '2026-08-22', hora: '19:15', adversario: 'Pittsburgh Pirates', mandante: true, competicao: 'mlb' },
  { data: '2026-08-23', hora: '16:10', adversario: 'Pittsburgh Pirates', mandante: true, competicao: 'mlb' },
  { data: '2026-08-25', hora: '19:15', adversario: 'Atlanta Braves', mandante: false, competicao: 'mlb' },
  { data: '2026-08-26', hora: '19:15', adversario: 'Atlanta Braves', mandante: false, competicao: 'mlb' },
  { data: '2026-08-27', hora: '19:15', adversario: 'Atlanta Braves', mandante: false, competicao: 'mlb' },
  { data: '2026-08-28', hora: '18:40', adversario: 'Detroit Tigers', mandante: false, competicao: 'mlb' },
  { data: '2026-08-29', hora: '13:10', adversario: 'Detroit Tigers', mandante: false, competicao: 'mlb' },
  { data: '2026-08-30', hora: '13:40', adversario: 'Detroit Tigers', mandante: false, competicao: 'mlb' },
  { data: '2026-09-01', hora: '22:10', adversario: 'St. Louis Cardinals', mandante: true, competicao: 'mlb' },
  { data: '2026-09-02', hora: '22:10', adversario: 'St. Louis Cardinals', mandante: true, competicao: 'mlb' },
  { data: '2026-09-03', hora: '22:10', adversario: 'St. Louis Cardinals', mandante: true, competicao: 'mlb' },
  { data: '2026-09-04', hora: '22:10', adversario: 'Washington Nationals', mandante: true, competicao: 'mlb' },
  { data: '2026-09-05', hora: '21:10', adversario: 'Washington Nationals', mandante: true, competicao: 'mlb' },
  { data: '2026-09-06', hora: '22:10', adversario: 'Washington Nationals', mandante: true, competicao: 'mlb' },
  { data: '2026-09-07', hora: '21:10', adversario: 'Cincinnati Reds', mandante: true, competicao: 'mlb' },
  { data: '2026-09-08', hora: '22:10', adversario: 'Cincinnati Reds', mandante: true, competicao: 'mlb' },
  { data: '2026-09-09', hora: '22:10', adversario: 'Cincinnati Reds', mandante: true, competicao: 'mlb' },
  { data: '2026-09-11', hora: '19:10', adversario: 'Miami Marlins', mandante: false, competicao: 'mlb' },
  { data: '2026-09-12', hora: '16:10', adversario: 'Miami Marlins', mandante: false, competicao: 'mlb' },
  { data: '2026-09-13', hora: '13:40', adversario: 'Miami Marlins', mandante: false, competicao: 'mlb' },
  { data: '2026-09-14', hora: '18:40', adversario: 'Cincinnati Reds', mandante: false, competicao: 'mlb' },
  { data: '2026-09-15', hora: '18:40', adversario: 'Cincinnati Reds', mandante: false, competicao: 'mlb' },
  { data: '2026-09-16', hora: '18:40', adversario: 'Cincinnati Reds', mandante: false, competicao: 'mlb' },
  { data: '2026-09-17', hora: '12:40', adversario: 'Cincinnati Reds', mandante: false, competicao: 'mlb' },
  { data: '2026-09-18', hora: '22:10', adversario: 'San Francisco Giants', mandante: true, competicao: 'mlb' },
  { data: '2026-09-19', hora: '21:10', adversario: 'San Francisco Giants', mandante: true, competicao: 'mlb' },
  { data: '2026-09-20', hora: '16:10', adversario: 'San Francisco Giants', mandante: true, competicao: 'mlb' },
  { data: '2026-09-22', hora: '22:10', adversario: 'San Diego Padres', mandante: true, competicao: 'mlb' },
  { data: '2026-09-23', hora: '22:10', adversario: 'San Diego Padres', mandante: true, competicao: 'mlb' },
  { data: '2026-09-24', hora: '22:10', adversario: 'San Diego Padres', mandante: true, competicao: 'mlb' },
  { data: '2026-09-25', hora: '22:15', adversario: 'San Francisco Giants', mandante: false, competicao: 'mlb' },
  { data: '2026-09-26', hora: '16:05', adversario: 'San Francisco Giants', mandante: false, competicao: 'mlb' },
  { data: '2026-09-27', hora: '15:05', adversario: 'San Francisco Giants', mandante: false, competicao: 'mlb' },
];
const LAKERS = [
  { data: '2026-10-05', hora: '22:00', adversario: 'Sacramento Kings', mandante: false, competicao: 'nba-pre' },
  { data: '2026-10-06', hora: '22:00', adversario: 'Golden State Warriors', mandante: false, competicao: 'nba-pre' },
  { data: '2026-10-08', hora: '22:30', adversario: 'Sacramento Kings', mandante: true, competicao: 'nba-pre' },
  { data: '2026-10-13', hora: null, adversario: 'Golden State Warriors', mandante: true, competicao: 'nba-pre' },
  { data: '2026-10-16', hora: null, adversario: 'Denver Nuggets', mandante: true, competicao: 'nba-pre' },
  { data: '2026-10-21', hora: '22:00', adversario: 'Golden State Warriors', mandante: true, competicao: 'nba' },
  { data: '2026-10-23', hora: '22:00', adversario: 'LA Clippers', mandante: true, competicao: 'nba' },
  { data: '2026-10-25', hora: '17:00', adversario: 'Utah Jazz', mandante: false, competicao: 'nba' },
  { data: '2026-10-27', hora: '23:00', adversario: 'Portland Trail Blazers', mandante: true, competicao: 'nba' },
  { data: '2026-10-28', hora: '22:30', adversario: 'LA Clippers', mandante: false, competicao: 'nba' },
  { data: '2026-10-30', hora: '22:00', adversario: 'Golden State Warriors', mandante: false, competicao: 'nba' },
  { data: '2026-11-01', hora: '22:00', adversario: 'Toronto Raptors', mandante: true, competicao: 'nba' },
  { data: '2026-11-02', hora: '23:00', adversario: 'Miami Heat', mandante: true, competicao: 'nba' },
  { data: '2026-11-04', hora: '23:00', adversario: 'Sacramento Kings', mandante: false, competicao: 'nba' },
  { data: '2026-11-06', hora: '23:00', adversario: 'Portland Trail Blazers', mandante: true, competicao: 'nba' },
  { data: '2026-11-08', hora: '19:00', adversario: 'Detroit Pistons', mandante: false, competicao: 'nba' },
  { data: '2026-11-09', hora: '20:00', adversario: 'Atlanta Hawks', mandante: false, competicao: 'nba' },
  { data: '2026-11-11', hora: '21:00', adversario: 'Milwaukee Bucks', mandante: false, competicao: 'nba' },
  { data: '2026-11-15', hora: '17:00', adversario: 'Phoenix Suns', mandante: false, competicao: 'nba' },
  { data: '2026-11-17', hora: '23:00', adversario: 'Charlotte Hornets', mandante: true, competicao: 'nba' },
  { data: '2026-11-18', hora: '23:00', adversario: 'Utah Jazz', mandante: true, competicao: 'nba' },
  { data: '2026-11-20', hora: '23:00', adversario: 'Sacramento Kings', mandante: true, competicao: 'nba' },
  { data: '2026-11-23', hora: '23:00', adversario: 'Utah Jazz', mandante: true, competicao: 'nba' },
  { data: '2026-11-27', hora: '22:30', adversario: 'San Antonio Spurs', mandante: false, competicao: 'nba' },
  { data: '2026-11-29', hora: '17:00', adversario: 'Memphis Grizzlies', mandante: false, competicao: 'nba' },
  { data: '2026-11-30', hora: '20:30', adversario: 'Houston Rockets', mandante: false, competicao: 'nba' },
  { data: '2026-12-02', hora: '21:00', adversario: 'New Orleans Pelicans', mandante: false, competicao: 'nba' },
  { data: '2026-12-14', hora: '23:00', adversario: 'New Orleans Pelicans', mandante: true, competicao: 'nba' },
  { data: '2026-12-16', hora: '22:30', adversario: 'Minnesota Timberwolves', mandante: false, competicao: 'nba' },
  { data: '2026-12-18', hora: '21:00', adversario: 'Minnesota Timberwolves', mandante: false, competicao: 'nba' },
  { data: '2026-12-19', hora: '22:00', adversario: 'Denver Nuggets', mandante: false, competicao: 'nba' },
  { data: '2026-12-21', hora: '23:00', adversario: 'Indiana Pacers', mandante: true, competicao: 'nba' },
  { data: '2026-12-23', hora: '23:00', adversario: 'Denver Nuggets', mandante: true, competicao: 'nba' },
  { data: '2026-12-25', hora: '18:00', adversario: 'Philadelphia 76ers', mandante: true, competicao: 'nba' },
  { data: '2026-12-27', hora: '22:00', adversario: 'Memphis Grizzlies', mandante: true, competicao: 'nba' },
  { data: '2026-12-29', hora: '23:30', adversario: 'Houston Rockets', mandante: true, competicao: 'nba' },
  { data: '2026-12-31', hora: '21:00', adversario: 'New Orleans Pelicans', mandante: false, competicao: 'nba' },
  { data: '2027-01-02', hora: '21:00', adversario: 'Chicago Bulls', mandante: false, competicao: 'nba' },
  { data: '2027-01-03', hora: '20:00', adversario: 'Toronto Raptors', mandante: false, competicao: 'nba' },
  { data: '2027-01-05', hora: '20:00', adversario: 'Washington Wizards', mandante: false, competicao: 'nba' },
  { data: '2027-01-07', hora: '23:00', adversario: 'Boston Celtics', mandante: true, competicao: 'nba' },
  { data: '2027-01-08', hora: '23:00', adversario: 'Detroit Pistons', mandante: true, competicao: 'nba' },
  { data: '2027-01-11', hora: '23:00', adversario: 'LA Clippers', mandante: false, competicao: 'nba' },
  { data: '2027-01-13', hora: '23:00', adversario: 'Portland Trail Blazers', mandante: false, competicao: 'nba' },
  { data: '2027-01-14', hora: '23:00', adversario: 'Orlando Magic', mandante: true, competicao: 'nba' },
  { data: '2027-01-17', hora: '22:00', adversario: 'Milwaukee Bucks', mandante: true, competicao: 'nba' },
  { data: '2027-01-19', hora: '23:00', adversario: 'Sacramento Kings', mandante: false, competicao: 'nba' },
  { data: '2027-01-21', hora: '23:00', adversario: 'Golden State Warriors', mandante: false, competicao: 'nba' },
  { data: '2027-01-22', hora: '23:00', adversario: 'Sacramento Kings', mandante: true, competicao: 'nba' },
  { data: '2027-01-24', hora: '17:00', adversario: 'Washington Wizards', mandante: true, competicao: 'nba' },
  { data: '2027-01-27', hora: '00:00', adversario: 'Oklahoma City Thunder', mandante: true, competicao: 'nba' },
  { data: '2027-01-28', hora: '20:00', adversario: 'Indiana Pacers', mandante: false, competicao: 'nba' },
  { data: '2027-01-30', hora: '21:30', adversario: 'New York Knicks', mandante: false, competicao: 'nba' },
  { data: '2027-01-31', hora: '20:00', adversario: 'Charlotte Hornets', mandante: false, competicao: 'nba' },
  { data: '2027-02-02', hora: '21:00', adversario: 'Boston Celtics', mandante: false, competicao: 'nba' },
  { data: '2027-02-04', hora: '20:30', adversario: 'Brooklyn Nets', mandante: false, competicao: 'nba' },
  { data: '2027-02-06', hora: '21:30', adversario: 'San Antonio Spurs', mandante: false, competicao: 'nba' },
  { data: '2027-02-08', hora: '22:30', adversario: 'Phoenix Suns', mandante: false, competicao: 'nba' },
  { data: '2027-02-10', hora: '23:00', adversario: 'LA Clippers', mandante: true, competicao: 'nba' },
  { data: '2027-02-12', hora: '23:30', adversario: 'Denver Nuggets', mandante: true, competicao: 'nba' },
  { data: '2027-02-16', hora: '23:00', adversario: 'Chicago Bulls', mandante: true, competicao: 'nba' },
  { data: '2027-02-18', hora: '23:00', adversario: 'Houston Rockets', mandante: true, competicao: 'nba' },
  { data: '2027-02-26', hora: '23:00', adversario: 'Denver Nuggets', mandante: false, competicao: 'nba' },
  { data: '2027-02-28', hora: '16:30', adversario: 'Dallas Mavericks', mandante: false, competicao: 'nba' },
  { data: '2027-03-02', hora: '20:00', adversario: 'Orlando Magic', mandante: false, competicao: 'nba' },
  { data: '2027-03-04', hora: '20:00', adversario: 'Philadelphia 76ers', mandante: false, competicao: 'nba' },
  { data: '2027-03-06', hora: '21:30', adversario: 'Oklahoma City Thunder', mandante: true, competicao: 'nba' },
  { data: '2027-03-07', hora: '23:30', adversario: 'Brooklyn Nets', mandante: true, competicao: 'nba' },
  { data: '2027-03-11', hora: '23:00', adversario: 'New York Knicks', mandante: true, competicao: 'nba' },
  { data: '2027-03-12', hora: '23:00', adversario: 'Cleveland Cavaliers', mandante: true, competicao: 'nba' },
  { data: '2027-03-14', hora: '22:00', adversario: 'Golden State Warriors', mandante: true, competicao: 'nba' },
  { data: '2027-03-16', hora: '22:00', adversario: 'Portland Trail Blazers', mandante: false, competicao: 'nba' },
  { data: '2027-03-17', hora: '22:00', adversario: 'Phoenix Suns', mandante: true, competicao: 'nba' },
  { data: '2027-03-19', hora: '22:00', adversario: 'Atlanta Hawks', mandante: true, competicao: 'nba' },
  { data: '2027-03-21', hora: '22:00', adversario: 'Dallas Mavericks', mandante: true, competicao: 'nba' },
  { data: '2027-03-23', hora: '20:00', adversario: 'Miami Heat', mandante: false, competicao: 'nba' },
  { data: '2027-03-25', hora: '19:00', adversario: 'Cleveland Cavaliers', mandante: false, competicao: 'nba' },
  { data: '2027-03-28', hora: '15:00', adversario: 'Houston Rockets', mandante: false, competicao: 'nba' },
  { data: '2027-03-30', hora: '20:00', adversario: 'Memphis Grizzlies', mandante: false, competicao: 'nba' },
  { data: '2027-04-01', hora: '21:30', adversario: 'Oklahoma City Thunder', mandante: false, competicao: 'nba' },
  { data: '2027-04-04', hora: '22:00', adversario: 'San Antonio Spurs', mandante: true, competicao: 'nba' },
  { data: '2027-04-06', hora: '22:00', adversario: 'Dallas Mavericks', mandante: true, competicao: 'nba' },
  { data: '2027-04-07', hora: '22:00', adversario: 'Minnesota Timberwolves', mandante: true, competicao: 'nba' },
  { data: '2027-04-09', hora: '22:00', adversario: 'Minnesota Timberwolves', mandante: true, competicao: 'nba' },
  { data: '2027-04-11', hora: '20:30', adversario: 'Phoenix Suns', mandante: true, competicao: 'nba' },
];

const TEAMS = {
  'man-utd': { nome: 'Manchester United', liga: 'Premier League', fixtures: MAN_UTD, icon: 'MU' },
  'lakers': { nome: 'LA Lakers', liga: 'NBA', fixtures: LAKERS, icon: 'LA' },
  'bengals': { nome: 'Cincinnati Bengals', liga: 'NFL', fixtures: BENGALS, icon: 'CIN' },
  'santos': { nome: 'Santos FC', liga: 'Brasileirão + Copa do Brasil + Sul-Americana', fixtures: SANTOS, icon: 'SAN' },
  'dodgers': { nome: 'Los Angeles Dodgers', liga: 'MLB', fixtures: DODGERS, icon: 'LAD' },
};

const COMP_LABEL = {
  'nfl-pre': 'NFL · Pré-temporada', 'nfl-reg': 'NFL · Temporada',
  'epl': 'Premier League', 'nba': 'NBA', 'nba-pre': 'NBA · Pré-temporada',
  'brasileirao': 'Brasileirão Série A', 'copa-do-brasil': 'Copa do Brasil',
  'sudamericana': 'Copa Sul-Americana', 'mlb': 'MLB',
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
    fitness: {
      workouts: [],
      medidas: [],
    },
    navConfig: [
      { id: 'hoje', label: 'Hoje', icon: 'home', visible: true, order: 0 },
      { id: 'rotina', label: 'Rotina', icon: 'calendar', visible: true, order: 1 },
      { id: 'trabalho', label: 'Trabalho', icon: 'briefcase', visible: true, order: 2 },
      { id: 'pessoal', label: 'Pessoal', icon: 'heart', visible: true, order: 3 },
      { id: 'fitness', label: 'Fitness', icon: 'dumbbell', visible: true, order: 4 },
      { id: 'jogos', label: 'Jogos', icon: 'trophy', visible: true, order: 5 },
      { id: 'quadro', label: 'Quadro Conjunto', icon: 'layers', visible: true, order: 6 },
    ],
    customTabs: {},
    notif: { leadMinutes: 15, notifiedGames: {}, notifiedTasks: {}, notifiedBlocks: {} },
    installDismissed: false,
  };
}
function mergeNavConfig(defConfig, savedConfig) {
  if (!Array.isArray(savedConfig)) return defConfig;
  const savedById = Object.fromEntries(savedConfig.map(c => [c.id, c]));
  return defConfig.map(d => (savedById[d.id] ? { ...d, ...savedById[d.id] } : d)).sort((a, b) => a.order - b.order);
}
let STATE = loadState();
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const def = defaultState();
    return {
      ...def, ...parsed,
      notif: { ...def.notif, ...(parsed.notif || {}) },
      personal: { ...def.personal, ...(parsed.personal || {}) },
      fitness: { ...def.fitness, ...(parsed.fitness || {}) },
      navConfig: mergeNavConfig(def.navConfig, parsed.navConfig),
      customTabs: { ...def.customTabs, ...(parsed.customTabs || {}) },
    };
  } catch (e) {
    return defaultState();
  }
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(STATE)); } catch (e) { /* storage unavailable (e.g. sandboxed preview) — keep running in-memory */ } }

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
function openCount(list) { return list.filter(i => i.status !== 'concluido').length; }
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

/* ---------------- fitness ---------------- */
function addWorkout(exercicio, series, reps, carga, data) {
  STATE.fitness.workouts.push({ id: 'wo' + Date.now() + Math.random().toString(36).slice(2, 6), exercicio, series, reps, carga, data });
  saveState();
}
function removeWorkout(id) {
  const idx = STATE.fitness.workouts.findIndex(w => w.id === id);
  if (idx >= 0) STATE.fitness.workouts.splice(idx, 1);
  saveState();
}
function addMedida(fields, data) {
  STATE.fitness.medidas.push({ id: 'me' + Date.now() + Math.random().toString(36).slice(2, 6), ...fields, data });
  saveState();
}
function removeMedida(id) {
  const idx = STATE.fitness.medidas.findIndex(m => m.id === id);
  if (idx >= 0) STATE.fitness.medidas.splice(idx, 1);
  saveState();
}
function distinctExercises() {
  const names = [...new Set(STATE.fitness.workouts.map(w => w.exercicio))];
  return names.sort((a, b) => a.localeCompare(b));
}
function withinPeriod(dateISO, days) {
  if (!days) return true;
  const [y, m, d] = dateISO.split('-').map(Number);
  const entryDate = new Date(y, m - 1, d);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return entryDate >= cutoff;
}
function exerciseProgress(name, days) {
  const byDate = {};
  for (const w of STATE.fitness.workouts) {
    if (w.exercicio !== name || !withinPeriod(w.data, days)) continue;
    if (!byDate[w.data] || w.carga > byDate[w.data]) byDate[w.data] = w.carga;
  }
  return Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).map(([data, carga]) => ({ x: data, y: carga }));
}
function weightProgress(days) {
  return STATE.fitness.medidas
    .filter(m => m.peso != null && withinPeriod(m.data, days))
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(m => ({ x: m.data, y: m.peso }));
}
function countFitnessRecent() {
  return STATE.fitness.workouts.filter(w => withinPeriod(w.data, 7)).length + STATE.fitness.medidas.filter(m => withinPeriod(m.data, 7)).length;
}
function svgLineChart(points, opts) {
  opts = opts || {};
  const w = 560, h = 160;
  const padL = 34, padR = 12, padT = 14, padB = 24;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  if (!points.length) {
    return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}"><text x="${w / 2}" y="${h / 2}" text-anchor="middle" fill="var(--text-faint)" font-size="12">sem dados no período</text></svg>`;
  }
  const ys = points.map(p => p.y);
  let minY = Math.min(...ys), maxY = Math.max(...ys);
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const pad = (maxY - minY) * 0.15;
  minY -= pad; maxY += pad;
  const xStep = points.length > 1 ? plotW / (points.length - 1) : 0;
  const xAt = i => padL + xStep * i;
  const yAt = v => padT + plotH - ((v - minY) / (maxY - minY)) * plotH;
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p.y).toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${xAt(points.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;
  const gridLines = [0, 1, 2, 3].map(i => {
    const y = padT + (plotH / 3) * i;
    return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="var(--border-soft)" stroke-width="1"/>`;
  }).join('');
  const dots = points.map((p, i) => `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(p.y).toFixed(1)}" r="${i === points.length - 1 ? 3.5 : 2.2}" fill="var(--mint-text)"/>`).join('');
  const last = points[points.length - 1];
  return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="overflow:visible">
    ${gridLines}
    <path d="${areaD}" fill="var(--mint-bg)" opacity="0.5"/>
    <path d="${pathD}" fill="none" stroke="var(--mint-text)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <text x="${padL}" y="${h - 6}" font-size="10" fill="var(--text-faint)">${points[0].x}</text>
    <text x="${w - padR}" y="${h - 6}" font-size="10" text-anchor="end" fill="var(--text-faint)">${last.x}</text>
    <text x="${w - padR}" y="${padT + 8}" font-size="11" text-anchor="end" fill="var(--text)" font-weight="700">${last.y}${opts.unit || ''}</text>
  </svg>`;
}

/* ---------------- icons (minimal hand-drawn line set) ---------------- */
const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1h4v-6h3v6h4a1 1 0 0 0 1-1v-9"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5h16M8 3v3M16 3v3"/>',
  briefcase: '<rect x="3.5" y="7.5" width="17" height="11" rx="1.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/>',
  heart: '<path d="M12 20s-7-4.3-9.4-8.4C.9 8.2 2.1 4.9 5.3 4.3a4.6 4.6 0 0 1 6.7 2 4.6 4.6 0 0 1 6.7-2c3.2.6 4.4 3.9 2.7 7.3C19 15.7 12 20 12 20Z"/>',
  trophy: '<path d="M7 4h10v3.5a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5v1A3.5 3.5 0 0 0 6.5 11H7"/><path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5v1A3.5 3.5 0 0 1 17.5 11H17"/><path d="M12 12.5V16"/><path d="M8.5 20h7l-1-3.5h-5L8.5 20Z"/>',
  layers: '<path d="m12 3 8 4.5-8 4.5-8-4.5Z"/><path d="m4 12 8 4.5 8-4.5"/><path d="m4 16 8 4.5 8-4.5"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.35-4.35"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  folder: '<path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-11Z"/>',
  arrowRight: '<path d="M4 12h16M13 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  archive: '<rect x="3.5" y="4.5" width="17" height="4.5" rx="1"/><path d="M5 9v9a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V9"/><path d="M10 13h4"/>',
  alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
  share: '<circle cx="6" cy="12" r="2.3"/><circle cx="17.5" cy="5.5" r="2.3"/><circle cx="17.5" cy="18.5" r="2.3"/><path d="m8 10.8 7.6-4.3M8 13.2l7.6 4.3"/>',
  asterisk: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"/>',
  dumbbell: '<path d="M6.5 8.5v7M4 10v3M17.5 8.5v7M20 10v3M6.5 12h11"/><rect x="2" y="10.5" width="2" height="3" rx=".6"/><rect x="20" y="10.5" width="2" height="3" rx=".6"/>',
  listView: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  kanbanView: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="10" rx="1"/><rect x="16" y="4" width="5" height="13" rx="1"/>',
  tableView: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 10h18M3 15h18M9.5 4v16"/>',
  ganttView: '<path d="M4 6h8M4 12h13M4 18h6"/><circle cx="14" cy="6" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.6A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.7 17.7 0 0 1-3.2 4.1M6.5 6.9C4 8.6 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9.6 9.6 0 0 0 3.3-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
};
function svgIcon(name, size) {
  size = size || 18;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* ---------------- badge counts ---------------- */
function countBlocksPendingToday() {
  const dateISO = todayISO();
  return blocksForDate(dateISO).filter(b => !isBlockDone(dateISO, b.id)).length;
}
function countTasksToday() {
  const dateISO = todayISO();
  return STATE.workTasks.filter(t => t.prazo === dateISO && t.status !== 'concluido').length;
}
function countPersonalToday() {
  const dateISO = todayISO();
  return allPersonalWithOrigin().filter(x => x.item.data === dateISO && x.item.status !== 'concluido').length;
}
function countHojeBadge() { return countBlocksPendingToday() + countTasksToday() + countPersonalToday(); }
function countHabitsPendingToday() {
  const log = STATE.habitLog[todayISO()] || {};
  return HABITS.filter(h => (log[h.id] || 'none') === 'none').length;
}
function countTrabalhoOpen() { return STATE.workTasks.filter(t => t.status !== 'concluido').length; }
function countPessoalOpen() { return allPersonalWithOrigin().filter(x => x.item.status !== 'concluido').length; }
function countJogosBadge() { return gamesOnDate(todayISO()).length; }
function countQuadroOpen() {
  const workShared = STATE.workTasks.filter(t => t.compartilhada && t.status !== 'concluido').length;
  const persShared = allPersonalWithOrigin().filter(x => x.item.compartilhada && x.item.status !== 'concluido').length;
  return workShared + persShared;
}
function countUrgentes() { return STATE.workTasks.filter(t => t.tier === 'urgente' && t.status !== 'concluido').length; }
function countConcluidosHoje() {
  const dateISO = todayISO();
  const blocksDone = blocksForDate(dateISO).filter(b => isBlockDone(dateISO, b.id)).length;
  const log = STATE.habitLog[dateISO] || {};
  const habitsDone = HABITS.filter(h => log[h.id] === 'done').length;
  return blocksDone + habitsDone;
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
function bestStreak() { return Math.max(0, ...HABITS.map(h => habitStreak(h.id))); }

/* ---------------- navigation state ---------------- */
const TABS = ['hoje', 'rotina', 'trabalho', 'pessoal', 'fitness', 'jogos', 'quadro'];
let currentView = 'hoje';
let activeTreeId = null;
let pessoalSub = 'diario';
let trabalhoActiveBoard = 'projeto-yt';
let treeExpanded = new Set(['node-trabalho', 'node-pessoal']);
let treeSearch = '';
let treeIndex = {};

/* ---------------- document tree (Trabalho + Pessoal) ---------------- */
function buildTree() {
  return [
    {
      id: 'node-trabalho', label: 'Trabalho', count: countTrabalhoOpen(),
      children: WORK_BOARDS.map(b => ({
        id: 'board-' + b.id, label: b.nome,
        count: openCount(STATE.workTasks.filter(t => t.board === b.id)),
        action: () => { trabalhoActiveBoard = b.id; activeTreeId = 'board-' + b.id; switchView('trabalho'); renderSidebar(); },
      })),
    },
    {
      id: 'node-pessoal', label: 'Pessoal', count: countPessoalOpen(),
      children: [
        { id: 'p-diario', label: 'Diário', count: PERSONAL_SIMPLE.reduce((s, x) => s + openCount(STATE.personal[x.key]), 0), action: () => openPessoalTree('diario', 'p-diario') },
        { id: 'p-financas', label: 'Finanças', count: openCount(STATE.personal.financas), action: () => openPessoalTree('financas', 'p-financas') },
        { id: 'p-objetivos', label: 'Objetivos', count: openCount(STATE.personal.objetivos), action: () => openPessoalTree('objetivos', 'p-objetivos') },
        { id: 'p-wishlist', label: 'Wish List', count: openCount(STATE.personal.wishlist), action: () => openPessoalTree('wishlist', 'p-wishlist') },
        {
          id: 'node-residencial', label: 'Residencial',
          count: openCount(STATE.personal.residencial.limpeza) + openCount(STATE.personal.residencial.lixo) + openCount(STATE.personal.residencial.gatos),
          children: [
            { id: 'p-limpeza', label: 'Limpeza da Casa', count: openCount(STATE.personal.residencial.limpeza), action: () => openPessoalTree('residencial', 'p-limpeza') },
            { id: 'p-lixo', label: 'Troca de Lixo', count: openCount(STATE.personal.residencial.lixo), action: () => openPessoalTree('residencial', 'p-lixo') },
            { id: 'p-gatos', label: 'Cuidados com os Gatos', count: openCount(STATE.personal.residencial.gatos), action: () => openPessoalTree('residencial', 'p-gatos') },
          ],
        },
        { id: 'p-veiculos', label: 'Veículos', count: openCount(STATE.personal.veiculos), action: () => openPessoalTree('veiculos', 'p-veiculos') },
      ],
    },
  ];
}
function openPessoalTree(subId, treeId) {
  pessoalSub = subId; activeTreeId = treeId; switchView('pessoal'); renderSidebar();
}
function nodeMatches(node, term) {
  if (!term) return true;
  if (node.label.toLowerCase().includes(term)) return true;
  if (node.children) return node.children.some(c => nodeMatches(c, term));
  return false;
}
function renderTreeNode(node, depth, term) {
  if (!nodeMatches(node, term)) return '';
  const hasChildren = node.children && node.children.length;
  const isOpen = term ? true : treeExpanded.has(node.id);
  const isActive = activeTreeId === node.id;
  let html = `<div class="tree-node">
    <div class="tree-row ${isActive ? 'active' : ''}" style="padding-left:${8 + depth * 14}px" onclick="${hasChildren ? `onTreeToggle('${node.id}')` : `onTreeLeaf('${node.id}')`}">
      <span class="chev ${hasChildren ? (isOpen ? 'open' : '') : 'spacer'}">${hasChildren ? svgIcon('chevron', 12) : ''}</span>
      <span class="t-icon">${svgIcon('folder', 14)}</span>
      <span class="t-label">${node.label}</span>
      <span class="count-badge">${node.count}</span>
    </div>`;
  if (hasChildren && isOpen) {
    html += `<div class="tree-children">${node.children.map(c => renderTreeNode(c, depth + 1, term)).join('')}</div>`;
  }
  html += `</div>`;
  return html;
}
function renderTreeInto() {
  const tree = buildTree();
  treeIndex = {};
  const indexify = (nodes) => { nodes.forEach(n => { treeIndex[n.id] = n; if (n.children) indexify(n.children); }); };
  indexify(tree);
  const term = treeSearch.trim().toLowerCase();
  const html = tree.map(n => renderTreeNode(n, 0, term)).join('');
  document.getElementById('doc-tree').innerHTML = html || '<div class="empty-note">nada encontrado</div>';
}
function onTreeToggle(id) {
  if (treeExpanded.has(id)) treeExpanded.delete(id); else treeExpanded.add(id);
  renderTreeInto();
}
function onTreeLeaf(id) {
  const node = treeIndex[id];
  if (node && node.action) node.action();
}
function onTreeSearch(v) { treeSearch = v; renderTreeInto(); }

/* ---------------- sidebar ---------------- */
const BUILTIN_BADGE_FN = {
  hoje: countHojeBadge,
  rotina: countHabitsPendingToday,
  trabalho: countTrabalhoOpen,
  pessoal: countPessoalOpen,
  fitness: countFitnessRecent,
  jogos: countJogosBadge,
  quadro: countQuadroOpen,
};
function countCustomTabOpen(tab) { return tab.lists.reduce((s, l) => s + openCount(l.tasks), 0); }
function navLabel(id) {
  const c = STATE.navConfig.find(x => x.id === id);
  return c ? c.label : id;
}
function allNavTabs(includeHidden) {
  const builtins = STATE.navConfig
    .filter(c => includeHidden || c.visible)
    .map(c => ({ id: c.id, label: c.label, icon: c.icon, order: c.order, kind: 'builtin', count: (BUILTIN_BADGE_FN[c.id] || (() => 0))() }));
  const customs = Object.values(STATE.customTabs)
    .map(t => ({ id: t.id, label: t.label, icon: t.icon || 'folder', order: t.order, kind: 'custom', count: countCustomTabOpen(t) }));
  return [...builtins, ...customs].sort((a, b) => a.order - b.order);
}
function navItem(tab) {
  const active = currentView === tab.id && !activeTreeId;
  return `<button class="nav-item ${active ? 'active' : ''}" onclick="onNav('${tab.id}')">
    <span class="ni-icon">${svgIcon(tab.icon, 16)}</span>
    <span class="ni-label">${tab.label}</span>
    <span class="count-badge">${tab.count}</span>
  </button>`;
}
function renderRail() {
  const nav = document.getElementById('rail-nav');
  nav.innerHTML = allNavTabs().map(tab => `<button class="rail-btn ${currentView === tab.id ? 'active' : ''}" data-view="${tab.id}" title="${tab.label}" onclick="onNav('${tab.id}')">${svgIcon(tab.icon, 18)}</button>`).join('');
}
function statusItem(icon, label, count, targetView, warn) {
  return `<button class="nav-item" onclick="onNav('${targetView}')">
    <span class="ni-icon">${svgIcon(icon, 16)}</span>
    <span class="ni-label">${label}</span>
    <span class="count-badge ${warn && count > 0 ? 'warn' : ''}">${count}</span>
  </button>`;
}
function folderCard(view, icon, label, count) {
  return `<button class="folder-card" onclick="onNav('${view}')">
    <span class="fc-icon">${svgIcon(icon, 17)}</span>
    <span class="fc-label">${label}</span>
    <span class="fc-count">${count}</span>
  </button>`;
}
function renderSidebar() {
  const body = document.getElementById('side-panel-body');
  body.innerHTML = `
    <div class="profile-row">
      <div class="avatar">${svgIcon('home', 18)}</div>
      <div class="profile-info">
        <div class="p-name">Minha Rotina ${svgIcon('chevronDown', 12)}</div>
        <div class="p-sub">dashboard pessoal · 2026</div>
      </div>
    </div>

    <div class="nav-section">
      <div class="nav-section-label">Navegação <button class="nav-manage-btn" onclick="openManageTabs()" title="Gerenciar abas">${svgIcon('gear', 13)}</button></div>
      <div class="nav-list">
        ${allNavTabs().map(navItem).join('')}
      </div>
    </div>

    <div class="side-divider"></div>
    <div class="nav-section">
      <div class="nav-section-label">Status</div>
      <div class="nav-list">
        ${statusItem('alert', 'Urgentes', countUrgentes(), 'trabalho', true)}
        ${statusItem('clock', 'Prazos Hoje', countTasksToday() + countPersonalToday(), 'hoje', false)}
        ${statusItem('share', 'Compartilhadas', countQuadroOpen(), 'quadro', false)}
      </div>
    </div>

    <div class="side-divider"></div>
    <div class="nav-section">
      <div class="nav-section-label">Histórico</div>
      <div class="nav-list">
        ${statusItem('archive', 'Concluídos Hoje', countConcluidosHoje(), 'hoje', false)}
        ${statusItem('clock', 'Melhor Sequência', bestStreak(), 'rotina', false)}
      </div>
    </div>

    <div class="side-divider"></div>
    <div class="nav-section">
      <div class="nav-section-label">Documentos</div>
      <div class="doc-search">
        ${svgIcon('search', 14)}
        <input type="text" id="tree-search-input" placeholder="Buscar em trabalho/pessoal..." oninput="onTreeSearch(this.value)" value="${treeSearch}">
      </div>
      <div id="doc-tree"></div>
    </div>
  `;
  renderTreeInto();
  renderRail();
}
function onNav(view) {
  activeTreeId = null;
  switchView(view);
  renderSidebar();
}

/* ---------------- tag / pill helpers ---------------- */
function tagLabel(tag) {
  const map = { trabalho: 'Trabalho', treino: 'Treino', volei: 'Vôlei', futsal: 'Futsal', estudo: 'Estudo', sono: 'Sono', livre: 'Livre', almoco: 'Almoço' };
  return tag ? (map[tag] || tag) : '';
}

/* ---------------- rendering: HOJE ---------------- */
function renderHoje() {
  const dateISO = todayISO();
  const blocks = blocksForDate(dateISO);
  const games = gamesOnDate(dateISO);
  const conflicts = games.map(g => ({ g, block: gameConflict(g) })).filter(x => x.block);
  const doneBlocks = blocks.filter(b => isBlockDone(dateISO, b.id)).length;
  const pct = blocks.length ? Math.round((doneBlocks / blocks.length) * 100) : 0;
  const workToday0 = STATE.workTasks.filter(t => t.prazo === dateISO && t.status !== 'concluido');
  const personalToday0 = allPersonalWithOrigin().filter(x => x.item.data === dateISO && x.item.status !== 'concluido');

  let html = `<div class="content-header">
    <h1>${navLabel('hoje')}</h1>
    <div class="sub">${WEEKDAY_NAMES[weekdayOf(dateISO)]}, ${dateISO} · tudo que importa hoje, num só lugar</div>
  </div>`;

  html += `<div class="card-grid">`;
  html += `<div class="card">
    <div class="card-title">Progresso do Dia</div>
    <div class="card-sub">blocos da rotina concluídos</div>
    <div class="stat-hero">
      <span class="num">${doneBlocks}/${blocks.length}</span>
      <span class="up-badge ${pct < 50 ? 'down' : ''}">${pct}%</span>
    </div>
    <button class="see-more" onclick="onNav('rotina')">Ver rotina completa ${svgIcon('arrowRight', 13)}</button>
  </div>`;

  html += `<div class="card">
    <div class="card-title">Jogos de Hoje</div>
    <div class="card-sub">${games.length ? games.length + ' jogo(s)' : 'nenhum jogo hoje'}</div>`;
  if (!games.length) {
    html += `<div class="empty-note">sem jogos dos times acompanhados hoje.</div>`;
  } else {
    for (const g of games) {
      const hasConflict = gameConflict(g);
      html += `<div class="mini-row">
        <span class="mr-time">${g.hora || 'TBD'}</span>
        <span class="mr-text">🏟 ${g.teamNome} x ${g.adversario}</span>
        ${hasConflict ? '<span class="pill warn">⚠</span>' : ''}
      </div>`;
    }
  }
  html += `<button class="see-more" onclick="onNav('jogos')">Ver todos os jogos ${svgIcon('arrowRight', 13)}</button></div>`;

  html += `<div class="card">
    <div class="card-title">Prazos de Hoje</div>
    <div class="card-sub">${workToday0.length + personalToday0.length ? (workToday0.length + personalToday0.length) + ' pendente(s)' : 'nada vencendo hoje'}</div>`;
  if (!workToday0.length && !personalToday0.length) {
    html += `<div class="empty-note">nenhuma tarefa ou conta vence hoje.</div>`;
  } else {
    for (const t of workToday0) html += `<div class="mini-row"><span class="mr-text">💼 ${t.titulo}</span><span class="pill ${t.tier}">${t.tier}</span></div>`;
    for (const p of personalToday0) html += `<div class="mini-row"><span class="mr-text">🏠 ${p.item.texto}</span><span class="pill origin">${p.origin}</span></div>`;
  }
  html += `<button class="see-more" onclick="onNav('trabalho')">Ver Trabalho ${svgIcon('arrowRight', 13)}</button></div>`;
  html += `</div>`;

  if (conflicts.length) {
    html += `<div class="card"><div class="card-title">Alertas de Conflito</div>`;
    for (const c of conflicts) {
      html += `<div class="alert-item">${svgIcon('alert', 15)}<span><b>${c.g.teamNome}</b> às ${c.g.hora} sobrepõe <b>${c.block.nome}</b> (${c.block.hora_inicio}–${c.block.hora_fim || ''}).</span></div>`;
    }
    html += `</div>`;
  }

  const homeAreas = ['trabalho', 'pessoal', 'jogos', 'quadro']
    .map(id => STATE.navConfig.find(c => c.id === id))
    .filter(c => c && c.visible)
    .map(c => folderCard(c.id, c.icon, c.label, c.id === 'jogos' ? gamesOnDate(dateISO).length : (BUILTIN_BADGE_FN[c.id] ? BUILTIN_BADGE_FN[c.id]() : 0)))
    .join('');
  if (homeAreas) html += `<div class="folder-row">${homeAreas}</div>`;

  const rows = [];
  for (const b of blocks) rows.push({ sortKey: timeToMin(b.hora_inicio), kind: 'block', data: b });
  for (const g of games) rows.push({ sortKey: g.hora ? timeToMin(g.hora) : 1440, kind: 'game', data: g });
  const workToday = STATE.workTasks.filter(t => t.prazo === dateISO && t.status !== 'concluido');
  for (const t of workToday) rows.push({ sortKey: 1441, kind: 'work', data: t });
  const personalToday = allPersonalWithOrigin().filter(x => x.item.data === dateISO && x.item.status !== 'concluido');
  for (const p of personalToday) rows.push({ sortKey: 1442, kind: 'personal', data: p });
  rows.sort((a, b) => a.sortKey - b.sortKey);

  html += `<div class="card"><div class="card-title">Timeline de Hoje</div><div class="row-list">`;
  if (!rows.length) html += `<div class="empty-note">nada agendado hoje...</div>`;
  for (const r of rows) {
    if (r.kind === 'block') {
      const b = r.data;
      const now = isBlockNow(b, dateISO);
      const done = isBlockDone(dateISO, b.id);
      html += `<div class="row-item timeline-row ${now ? 'now' : ''}">
        <span class="r-time">${b.hora_inicio}</span>
        <span class="r-text">${b.nome} ${b.tag ? `<span class="pill ${b.tag}">${tagLabel(b.tag)}</span>` : ''}</span>
        <button class="check-circle ${done ? 'checked' : ''}" onclick="onToggleBlock('${b.id}')">${done ? '✓' : ''}</button>
      </div>`;
    } else if (r.kind === 'game') {
      const g = r.data;
      const hasConflict = gameConflict(g);
      html += `<div class="row-item">
        <span class="r-time">${g.hora || 'TBD'}</span>
        <span class="r-text">🏟 ${g.teamNome} x ${g.adversario}</span>
        ${hasConflict ? '<span class="pill warn">Conflito</span>' : ''}
      </div>`;
    } else if (r.kind === 'work') {
      const t = r.data;
      html += `<div class="row-item">
        <span class="r-time">Prazo</span>
        <span class="r-text">💼 ${t.titulo}</span>
        <span class="pill ${t.tier}">${t.tier}</span>
      </div>`;
    } else if (r.kind === 'personal') {
      html += `<div class="row-item">
        <span class="r-time">Vence</span>
        <span class="r-text">🏠 ${r.data.item.texto}</span>
        <span class="pill origin">${r.data.origin}</span>
      </div>`;
    }
  }
  html += `</div></div>`;

  html += `<div class="card"><div class="card-title">Hábitos Rápidos</div><div class="card-sub">toque para alternar</div>${renderHabitTiles(dateISO)}</div>`;

  document.getElementById('view-hoje').innerHTML = html;
}
function renderHabitTiles(dateISO) {
  const log = STATE.habitLog[dateISO] || {};
  let html = '<div class="habit-tiles">';
  for (const h of HABITS) {
    const state = log[h.id] || 'none';
    const icon = state === 'done' ? '✓' : state === 'skip' ? '–' : '○';
    html += `<div class="habit-tile state-${state}" onclick="onQuickHabit('${h.id}')">
      <div class="ht-state">${icon}</div>
      <div class="ht-label">${h.nome}</div>
    </div>`;
  }
  html += '</div>';
  return html;
}
function onToggleBlock(blockId) { toggleBlockDone(todayISO(), blockId); renderHoje(); renderSidebar(); }
function onQuickHabit(habitId) {
  const dateISO = todayISO();
  if (!STATE.habitLog[dateISO]) STATE.habitLog[dateISO] = {};
  const cur = STATE.habitLog[dateISO][habitId] || 'none';
  const next = cur === 'none' ? 'done' : cur === 'done' ? 'skip' : 'none';
  STATE.habitLog[dateISO][habitId] = next;
  saveState();
  renderHoje();
  renderSidebar();
}

/* ---------------- rendering: ROTINA ---------------- */
function renderRotina() {
  let html = `<div class="content-header"><h1>${navLabel('rotina')}</h1><div class="sub">grade semanal fixa e hábitos</div></div>`;
  html += `<div class="card"><div class="card-title">Grade Semanal</div><div class="card-sub">blocos fixos por dia</div>`;
  html += `<div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">`;
  for (let d = 0; d < 7; d++) {
    const blocks = ROUTINE[d];
    html += `<div class="mini-stat" style="padding:12px">
      <div class="lbl" style="margin-bottom:8px;font-size:11px">${WEEKDAY_SHORT[d]}</div>`;
    for (const b of blocks) {
      html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-top:1px solid var(--border-soft);font-size:11.5px">
        <span style="font-weight:700;min-width:74px">${b.hora_inicio}${b.hora_fim ? '–' + b.hora_fim : ''}</span>
        <span style="flex:1">${b.nome}</span>
      </div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;

  html += renderHabitsPanel();
  document.getElementById('view-rotina').innerHTML = html;
}
function last30Dates() {
  const out = [];
  const d = new Date();
  for (let i = 29; i >= 0; i--) { const dd = new Date(d); dd.setDate(d.getDate() - i); out.push(isoFromDate(dd)); }
  return out;
}
function last7Dates() {
  const out = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) { const dd = new Date(d); dd.setDate(d.getDate() - i); out.push(isoFromDate(dd)); }
  return out;
}
function renderHabitsPanel() {
  const week = last7Dates();
  let html = `<div class="card"><div class="card-title">Hábitos</div><div class="card-sub">grid semanal · clique para alternar (vazio → feito → pulado)</div>`;
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

  html += `<div class="card-grid" style="margin-top:16px">`;
  for (const h of HABITS) {
    html += `<div class="mini-stat"><div class="num">${habitStreak(h.id)}</div><div class="lbl">${h.nome}</div></div>`;
  }
  html += `</div>`;

  html += `<div class="card-sub" style="margin-top:16px">heatmap · últimos 30 dias (todos os hábitos)</div>`;
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
  renderSidebar();
}

/* ---------------- rendering: TRABALHO ---------------- */
const VIEW_TYPES = [
  { id: 'quadro', icon: 'kanbanView', label: 'Quadro' },
  { id: 'lista', icon: 'listView', label: 'Lista' },
  { id: 'calendario', icon: 'calendar', label: 'Calendário' },
  { id: 'gantt', icon: 'ganttView', label: 'Gantt' },
  { id: 'tabela', icon: 'tableView', label: 'Tabela' },
];
let trabalhoViewType = 'quadro';
let trabalhoCalMonth = todayISO().slice(0, 7);

function renderTrabalho() {
  refreshTiers();
  let html = `<div class="content-header"><h1>${navLabel('trabalho')}</h1><div class="sub">3 boards · tier sobe automaticamente com o atraso</div></div>`;
  html += `<div class="card">`;
  html += `<div class="utabs">`;
  for (const b of WORK_BOARDS) html += `<button class="${trabalhoActiveBoard === b.id ? 'active' : ''}" onclick="onTrabalhoBoardTab('${b.id}')">${b.nome}</button>`;
  html += `</div>`;
  html += `<div class="view-tabs">`;
  for (const v of VIEW_TYPES) html += `<button class="${trabalhoViewType === v.id ? 'active' : ''}" onclick="onTrabalhoViewType('${v.id}')">${svgIcon(v.icon, 14)} ${v.label}</button>`;
  html += `</div>`;
  html += `<div class="inline-form">
    <input type="text" id="new-title-work" placeholder="Nova tarefa...">
    <input type="date" id="new-prazo-work">
    <button class="btn" onclick="onAddWorkTask()">+ Adicionar</button>
  </div>`;

  const tasks = STATE.workTasks.filter(t => t.board === trabalhoActiveBoard);
  const h = workHandlers();
  if (trabalhoViewType === 'quadro') html += genericBoard(tasks, h);
  else if (trabalhoViewType === 'lista') html += genericList(tasks, h);
  else if (trabalhoViewType === 'calendario') html += genericCalendar(tasks, trabalhoCalMonth, (dir) => `onTrabalhoCalNav(${dir})`);
  else if (trabalhoViewType === 'gantt') html += genericGantt(tasks);
  else if (trabalhoViewType === 'tabela') html += genericTable(tasks, h);

  html += `</div>`;
  document.getElementById('view-trabalho').innerHTML = html;
}
function onTrabalhoViewType(id) { trabalhoViewType = id; renderTrabalho(); }
function onTrabalhoCalNav(dir) { trabalhoCalMonth = addMonths(trabalhoCalMonth, dir); renderTrabalho(); }
function onTrabalhoBoardTab(id) { trabalhoActiveBoard = id; renderTrabalho(); }
function workHandlers() {
  return {
    moveAttr: (id, dir) => `onMoveWork('${id}',${dir})`,
    delAttr: (id) => `onDeleteWork('${id}')`,
    shareAttr: (id) => `onToggleWorkShared('${id}')`,
  };
}

/* ---------------- generic task views (shared by Trabalho + custom tabs) ---------------- */
function genericTaskCard(t, h) {
  const overdue = daysOverdue(t.prazo) > 0 && t.status !== 'concluido';
  return `<div class="task-card tier-${t.tier}">
    <div class="t-title">${t.titulo}</div>
    <div class="t-meta">
      <span class="t-deadline">${t.prazo ? 'prazo ' + t.prazo + (overdue ? ' · atrasado' : '') : 'sem prazo'}</span>
      <span class="pill ${t.tier}">${t.tier}</span>
    </div>
    <div class="t-share-row">
      <input type="checkbox" ${t.compartilhada ? 'checked' : ''} onchange="${h.shareAttr(t.id)}"> compartilhada
    </div>
    <div class="t-actions">
      <button onclick="${h.moveAttr(t.id, -1)}" ${t.status === 'a_fazer' ? 'disabled' : ''}>◀</button>
      <button onclick="${h.moveAttr(t.id, 1)}" ${t.status === 'concluido' ? 'disabled' : ''}>▶</button>
      <button onclick="${h.delAttr(t.id)}">✕</button>
    </div>
  </div>`;
}
function genericBoard(tasks, h) {
  let html = `<div class="kanban">`;
  for (const col of STATUS_COLS) {
    html += `<div class="kanban-col"><h4>${col.nome}</h4><div class="col-body">`;
    const colTasks = tasks.filter(t => t.status === col.id);
    if (!colTasks.length) html += `<div class="empty-note">vazio</div>`;
    for (const t of colTasks) html += genericTaskCard(t, h);
    html += `</div></div>`;
  }
  html += `</div>`;
  return html;
}
function genericList(tasks, h) {
  let html = '';
  for (const col of STATUS_COLS) {
    const colTasks = tasks.filter(t => t.status === col.id);
    html += `<div class="list-group">
      <div class="list-group-header"><span class="pill ${col.id === 'concluido' ? 'origin' : col.id === 'em_andamento' ? 'alta' : 'normal'}">${col.nome}</span><span class="r-meta">${colTasks.length}</span></div>`;
    if (!colTasks.length) html += `<div class="empty-note">vazio</div>`;
    for (const t of colTasks) {
      html += `<div class="row-item">
        <span class="r-text">${t.titulo}</span>
        <span class="r-meta">${t.prazo || 'sem prazo'}</span>
        <span class="pill ${t.tier}">${t.tier}</span>
        <div class="t-actions">
          <button onclick="${h.moveAttr(t.id, -1)}" ${t.status === 'a_fazer' ? 'disabled' : ''}>◀</button>
          <button onclick="${h.moveAttr(t.id, 1)}" ${t.status === 'concluido' ? 'disabled' : ''}>▶</button>
          <button onclick="${h.delAttr(t.id)}">✕</button>
        </div>
      </div>`;
    }
    html += `</div>`;
  }
  return html;
}
function genericTable(tasks, h) {
  let html = `<div style="overflow-x:auto"><table class="flat-table"><thead><tr>
    <th>Nome</th><th>Status</th><th>Prazo</th><th>Tier</th><th>Compartilhada</th><th></th>
  </tr></thead><tbody>`;
  if (!tasks.length) html += `<tr><td colspan="6" class="empty-note">vazio</td></tr>`;
  for (const t of tasks) {
    const statusLabel = STATUS_COLS.find(c => c.id === t.status)?.nome || t.status;
    html += `<tr>
      <td>${t.titulo}</td>
      <td><span class="pill normal">${statusLabel}</span></td>
      <td>${t.prazo || '—'}</td>
      <td><span class="pill ${t.tier}">${t.tier}</span></td>
      <td>${t.compartilhada ? 'sim' : 'não'}</td>
      <td><button class="btn ghost" style="padding:3px 8px" onclick="${h.delAttr(t.id)}">✕</button></td>
    </tr>`;
  }
  html += `</tbody></table></div>`;
  return html;
}
function genericCalendar(tasks, calMonth, navAttr) {
  const byDate = {};
  for (const t of tasks) { if (t.prazo) (byDate[t.prazo] = byDate[t.prazo] || []).push(t); }
  const [y, m] = calMonth.split('-').map(Number);
  const days = monthGridDays(calMonth);
  let html = `<div class="cal-header">
    <button class="btn ghost" onclick="${navAttr(-1)}">‹</button>
    <div class="cal-title">${MONTH_NAMES[m - 1]} ${y}</div>
    <button class="btn ghost" onclick="${navAttr(1)}">›</button>
  </div>`;
  html += `<div class="cal-grid">`;
  for (const wd of WEEKDAY_SHORT) html += `<div class="cal-dow">${wd}</div>`;
  for (const d of days) {
    const iso = isoFromDate(d);
    const inMonth = d.getMonth() === m - 1;
    const dayTasks = byDate[iso] || [];
    const shown = dayTasks.slice(0, 3);
    const overflow = dayTasks.length - shown.length;
    html += `<div class="cal-cell ${inMonth ? '' : 'out'} ${iso === todayISO() ? 'today' : ''}">
      <div class="cal-daynum">${d.getDate()}</div>
      ${shown.map(t => `<div class="cal-pill tier-${t.tier}">${t.titulo}</div>`).join('')}
      ${overflow > 0 ? `<div class="cal-more">+ ${overflow} mais</div>` : ''}
    </div>`;
  }
  html += `</div>`;
  return html;
}
function genericGantt(tasks) {
  const withDates = tasks.filter(t => t.prazo).sort((a, b) => a.prazo.localeCompare(b.prazo));
  if (!withDates.length) return `<div class="empty-note">nenhuma tarefa com prazo para mostrar na timeline. (Gantt aqui marca a data de prazo — como as tarefas não têm data de início, não dá pra desenhar barras de duração.)</div>`;
  const totalDays = 35;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today); start.setDate(start.getDate() - 7);
  const dayW = 100 / totalDays;
  let header = '';
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    header += `<div class="gantt-day ${isoFromDate(d) === todayISO() ? 'today' : ''}" style="width:${dayW}%">${d.getDate()}</div>`;
  }
  let rows = '';
  for (const t of withDates) {
    const [y, m, d] = t.prazo.split('-').map(Number);
    const dueDate = new Date(y, m - 1, d);
    const offsetDays = Math.round((dueDate - start) / 86400000);
    const inRange = offsetDays >= 0 && offsetDays < totalDays;
    rows += `<div class="gantt-row">
      <div class="gantt-label">${t.titulo}</div>
      <div class="gantt-track">${inRange ? `<div class="gantt-marker tier-${t.tier}" style="left:${(offsetDays * dayW).toFixed(2)}%" title="${t.prazo}"></div>` : `<span class="r-meta">${t.prazo}</span>`}</div>
    </div>`;
  }
  return `<div class="gantt-wrap">
    <div class="gantt-header"><div class="gantt-label"></div><div class="gantt-track gantt-days">${header}</div></div>
    ${rows}
  </div>`;
}
function onAddWorkTask() {
  const titleEl = document.getElementById('new-title-work');
  const prazoEl = document.getElementById('new-prazo-work');
  const titulo = titleEl.value.trim();
  if (!titulo) return;
  STATE.workTasks.push({ id: 'w' + Date.now() + Math.random().toString(36).slice(2, 6), board: trabalhoActiveBoard, titulo, prazo: prazoEl.value || null, status: 'a_fazer', tier: 'normal', compartilhada: false });
  saveState();
  renderTrabalho();
  renderSidebar();
}
function onMoveWork(id, dir) {
  const t = STATE.workTasks.find(x => x.id === id);
  if (t) t.status = cycleStatus(t.status, dir);
  saveState();
  renderTrabalho();
  renderSidebar();
}
function onDeleteWork(id) {
  const idx = STATE.workTasks.findIndex(x => x.id === id);
  if (idx >= 0) STATE.workTasks.splice(idx, 1);
  saveState();
  renderTrabalho();
  renderSidebar();
}
function onToggleWorkShared(id) {
  const t = STATE.workTasks.find(x => x.id === id);
  if (t) t.compartilhada = !t.compartilhada;
  saveState();
  renderTrabalho();
  renderSidebar();
}

/* ---------------- custom tabs (fully user-defined spaces) ---------------- */
function nextTabOrder() {
  const all = allNavTabs(true);
  return all.length ? Math.max(...all.map(t => t.order)) + 1 : 0;
}
function createCustomTab(label) {
  const id = 'ct' + Date.now() + Math.random().toString(36).slice(2, 6);
  const listId = 'l' + Date.now() + Math.random().toString(36).slice(2, 6);
  STATE.customTabs[id] = {
    id, label, icon: 'folder', order: nextTabOrder(),
    lists: [{ id: listId, nome: 'Lista 1', tasks: [] }],
    activeList: listId,
    viewType: 'quadro',
    calMonth: todayISO().slice(0, 7),
  };
  saveState();
  return id;
}
function deleteCustomTab(id) {
  delete STATE.customTabs[id];
  saveState();
  if (currentView === id) onNav('hoje');
}
function renameCustomTab(id, label) {
  if (STATE.customTabs[id]) { STATE.customTabs[id].label = label; saveState(); }
}
function setTabOrder(id, order) {
  const nc = STATE.navConfig.find(c => c.id === id);
  if (nc) { nc.order = order; return; }
  if (STATE.customTabs[id]) STATE.customTabs[id].order = order;
}
function reorderTab(id, dir) {
  const list = allNavTabs(true);
  const idx = list.findIndex(t => t.id === id);
  const swapIdx = idx + dir;
  if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;
  setTabOrder(list[idx].id, list[swapIdx].order);
  setTabOrder(list[swapIdx].id, list[idx].order);
  saveState();
}
function toggleBuiltinVisible(id) {
  const nc = STATE.navConfig.find(c => c.id === id);
  if (nc) { nc.visible = !nc.visible; saveState(); }
}
function renameBuiltin(id, label) {
  const nc = STATE.navConfig.find(c => c.id === id);
  if (nc) { nc.label = label; saveState(); }
}

function addListToTab(tabId, nome) {
  const tab = STATE.customTabs[tabId];
  if (!tab) return;
  const id = 'l' + Date.now() + Math.random().toString(36).slice(2, 6);
  tab.lists.push({ id, nome, tasks: [] });
  tab.activeList = id;
  saveState();
}
function renameListInTab(tabId, listId, nome) {
  const tab = STATE.customTabs[tabId];
  const list = tab && tab.lists.find(l => l.id === listId);
  if (list) { list.nome = nome; saveState(); }
}
function deleteListFromTab(tabId, listId) {
  const tab = STATE.customTabs[tabId];
  if (!tab) return;
  tab.lists = tab.lists.filter(l => l.id !== listId);
  if (!tab.lists.length) {
    const id = 'l' + Date.now() + Math.random().toString(36).slice(2, 6);
    tab.lists.push({ id, nome: 'Lista 1', tasks: [] });
  }
  if (tab.activeList === listId) tab.activeList = tab.lists[0].id;
  saveState();
}

function customHandlers(tabId, listId) {
  return {
    moveAttr: (id, dir) => `onMoveCustomTask('${tabId}','${listId}','${id}',${dir})`,
    delAttr: (id) => `onDeleteCustomTask('${tabId}','${listId}','${id}')`,
    shareAttr: (id) => `onToggleCustomTaskShared('${tabId}','${listId}','${id}')`,
  };
}
function renderCustomTab(tabId) {
  const tab = STATE.customTabs[tabId];
  const container = document.getElementById('view-custom');
  if (!tab) { container.innerHTML = ''; return; }
  if (!tab.activeList || !tab.lists.find(l => l.id === tab.activeList)) tab.activeList = tab.lists[0] ? tab.lists[0].id : null;

  let html = `<div class="content-header"><h1>${tab.label}</h1><div class="sub">aba personalizada</div></div>`;
  html += `<div class="card">`;
  html += `<div class="utabs">`;
  for (const l of tab.lists) html += `<button class="${tab.activeList === l.id ? 'active' : ''}" onclick="onCustomListTab('${tabId}','${l.id}')">${l.nome}</button>`;
  html += `</div>`;
  html += `<div class="inline-form" style="margin-top:-6px">
    <button class="btn ghost" style="padding:5px 10px" onclick="onAddCustomList('${tabId}')">+ Lista</button>
    <button class="btn ghost" style="padding:5px 10px" onclick="onRenameCustomList('${tabId}')">${svgIcon('edit', 12)} Renomear lista</button>
    ${tab.lists.length > 1 ? `<button class="btn ghost" style="padding:5px 10px" onclick="onDeleteCustomList('${tabId}')">✕ Excluir lista</button>` : ''}
  </div>`;

  const list = tab.lists.find(l => l.id === tab.activeList);
  if (!list) { container.innerHTML = html + `</div>`; return; }

  html += `<div class="view-tabs">`;
  for (const v of VIEW_TYPES) html += `<button class="${tab.viewType === v.id ? 'active' : ''}" onclick="onCustomViewType('${tabId}','${v.id}')">${svgIcon(v.icon, 14)} ${v.label}</button>`;
  html += `</div>`;

  html += `<div class="inline-form">
    <input type="text" id="ct-new-title" placeholder="Nova tarefa...">
    <input type="date" id="ct-new-prazo">
    <button class="btn" onclick="onAddCustomTask('${tabId}')">+ Adicionar</button>
  </div>`;

  const tasks = list.tasks;
  const h = customHandlers(tabId, list.id);
  if (tab.viewType === 'quadro') html += genericBoard(tasks, h);
  else if (tab.viewType === 'lista') html += genericList(tasks, h);
  else if (tab.viewType === 'calendario') html += genericCalendar(tasks, tab.calMonth, (dir) => `onCustomCalNav('${tabId}',${dir})`);
  else if (tab.viewType === 'gantt') html += genericGantt(tasks);
  else if (tab.viewType === 'tabela') html += genericTable(tasks, h);

  html += `</div>`;
  container.innerHTML = html;
}
function onCustomListTab(tabId, listId) {
  const tab = STATE.customTabs[tabId];
  if (tab) { tab.activeList = listId; saveState(); renderCustomTab(tabId); }
}
function onAddCustomList(tabId) {
  const nome = prompt('Nome da nova lista:');
  if (!nome || !nome.trim()) return;
  addListToTab(tabId, nome.trim());
  renderCustomTab(tabId);
  renderSidebar();
}
function onRenameCustomList(tabId) {
  const tab = STATE.customTabs[tabId];
  const list = tab && tab.lists.find(l => l.id === tab.activeList);
  if (!list) return;
  const nome = prompt('Novo nome da lista:', list.nome);
  if (!nome || !nome.trim()) return;
  renameListInTab(tabId, list.id, nome.trim());
  renderCustomTab(tabId);
}
function onDeleteCustomList(tabId) {
  const tab = STATE.customTabs[tabId];
  if (!tab || !confirm('Excluir esta lista e todas as tarefas dela?')) return;
  deleteListFromTab(tabId, tab.activeList);
  renderCustomTab(tabId);
  renderSidebar();
}
function onCustomViewType(tabId, viewId) {
  const tab = STATE.customTabs[tabId];
  if (tab) { tab.viewType = viewId; saveState(); renderCustomTab(tabId); }
}
function onCustomCalNav(tabId, dir) {
  const tab = STATE.customTabs[tabId];
  if (tab) { tab.calMonth = addMonths(tab.calMonth, dir); saveState(); renderCustomTab(tabId); }
}
function onAddCustomTask(tabId) {
  const tab = STATE.customTabs[tabId];
  const list = tab && tab.lists.find(l => l.id === tab.activeList);
  if (!list) return;
  const titleEl = document.getElementById('ct-new-title');
  const prazoEl = document.getElementById('ct-new-prazo');
  const titulo = titleEl.value.trim();
  if (!titulo) return;
  list.tasks.push({ id: 'ctk' + Date.now() + Math.random().toString(36).slice(2, 6), titulo, prazo: prazoEl.value || null, status: 'a_fazer', tier: 'normal', compartilhada: false });
  saveState();
  renderCustomTab(tabId);
  renderSidebar();
}
function onMoveCustomTask(tabId, listId, taskId, dir) {
  const tab = STATE.customTabs[tabId];
  const list = tab && tab.lists.find(l => l.id === listId);
  const t = list && list.tasks.find(x => x.id === taskId);
  if (t) { t.status = cycleStatus(t.status, dir); saveState(); renderCustomTab(tabId); renderSidebar(); }
}
function onDeleteCustomTask(tabId, listId, taskId) {
  const tab = STATE.customTabs[tabId];
  const list = tab && tab.lists.find(l => l.id === listId);
  if (!list) return;
  list.tasks = list.tasks.filter(x => x.id !== taskId);
  saveState();
  renderCustomTab(tabId);
  renderSidebar();
}
function onToggleCustomTaskShared(tabId, listId, taskId) {
  const tab = STATE.customTabs[tabId];
  const list = tab && tab.lists.find(l => l.id === listId);
  const t = list && list.tasks.find(x => x.id === taskId);
  if (t) { t.compartilhada = !t.compartilhada; saveState(); renderCustomTab(tabId); renderSidebar(); }
}

/* ---------------- manage tabs modal ---------------- */
function openManageTabs() {
  document.getElementById('manage-tabs-modal').classList.remove('hidden');
  renderManageTabsBody();
}
function closeManageTabs() { document.getElementById('manage-tabs-modal').classList.add('hidden'); }
function renderManageTabsBody() {
  const body = document.getElementById('manage-tabs-body');
  const list = allNavTabs(true);
  let html = `<div class="row-list">`;
  list.forEach((tab, i) => {
    const isBuiltin = tab.kind === 'builtin';
    const visible = isBuiltin ? STATE.navConfig.find(c => c.id === tab.id).visible : true;
    html += `<div class="manage-row ${!visible ? 'hidden-tab' : ''}">
      <span class="mr-icon">${svgIcon(tab.icon, 16)}</span>
      <span class="mr-name">${tab.label}</span>
      ${!isBuiltin ? '<span class="mr-badge">custom</span>' : ''}
      <div class="mr-btns">
        <button onclick="onReorderTabUI('${tab.id}',-1)" ${i === 0 ? 'disabled' : ''} title="Mover para cima">▲</button>
        <button onclick="onReorderTabUI('${tab.id}',1)" ${i === list.length - 1 ? 'disabled' : ''} title="Mover para baixo">▼</button>
        <button onclick="onRenameTabUI('${tab.id}','${tab.kind}')" title="Renomear">${svgIcon('edit', 12)}</button>
        ${isBuiltin
        ? `<button onclick="onToggleVisibleUI('${tab.id}')" title="${visible ? 'Esconder' : 'Mostrar'}">${svgIcon(visible ? 'eye' : 'eyeOff', 13)}</button>`
        : `<button onclick="onDeleteCustomTabUI('${tab.id}')" title="Excluir">✕</button>`}
      </div>
    </div>`;
  });
  html += `</div><div class="inline-form" style="margin-top:14px"><button class="btn" onclick="onCreateCustomTabUI()">+ Nova aba</button></div>`;
  body.innerHTML = html;
}
function onReorderTabUI(id, dir) { reorderTab(id, dir); renderManageTabsBody(); renderSidebar(); switchView(currentView); }
function onRenameTabUI(id, kind) {
  const current = kind === 'builtin' ? STATE.navConfig.find(c => c.id === id).label : STATE.customTabs[id].label;
  const label = prompt('Novo nome da aba:', current);
  if (!label || !label.trim()) return;
  if (kind === 'builtin') renameBuiltin(id, label.trim());
  else renameCustomTab(id, label.trim());
  renderManageTabsBody();
  renderSidebar();
  switchView(currentView);
}
function onToggleVisibleUI(id) {
  toggleBuiltinVisible(id);
  renderManageTabsBody();
  renderSidebar();
  switchView(currentView);
}
function onDeleteCustomTabUI(id) {
  if (!confirm('Excluir esta aba e todo o conteúdo dela? Essa ação não pode ser desfeita.')) return;
  deleteCustomTab(id);
  renderManageTabsBody();
  renderSidebar();
  switchView(currentView);
}
function onCreateCustomTabUI() {
  const label = prompt('Nome da nova aba:');
  if (!label || !label.trim()) return;
  const id = createCustomTab(label.trim());
  renderSidebar();
  closeManageTabs();
  onNav(id);
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
function renderPessoal() {
  let html = `<div class="content-header"><h1>${navLabel('pessoal')}</h1><div class="sub">rotina, finanças, objetivos e casa</div></div>`;
  html += `<div class="utabs">`;
  for (const s of PESSOAL_SUBTABS) html += `<button class="${pessoalSub === s.id ? 'active' : ''}" onclick="onPessoalSub('${s.id}')">${s.label}</button>`;
  html += `</div>`;

  if (pessoalSub === 'diario') {
    html += `<div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">`;
    for (const s of PERSONAL_SIMPLE) html += simpleListPanel(s.label, s.key);
    html += `</div>`;
  } else if (pessoalSub === 'financas') {
    html += valueListPanel('Finanças · Contas a Pagar', 'financas', { withValor: true, withData: true });
  } else if (pessoalSub === 'objetivos') {
    html += valueListPanel('Objetivos e Metas', 'objetivos', { withValor: false, withData: true });
  } else if (pessoalSub === 'wishlist') {
    html += valueListPanel('Wish List', 'wishlist', { withValor: true, withData: false });
  } else if (pessoalSub === 'residencial') {
    html += `<div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">`;
    html += valueListPanel('Limpeza da Casa', 'residencial.limpeza', { withValor: false, withData: false });
    html += valueListPanel('Troca de Lixo', 'residencial.lixo', { withValor: false, withData: false });
    html += valueListPanel('Cuidados com os Gatos', 'residencial.gatos', { withValor: false, withData: true });
    html += `</div>`;
  } else if (pessoalSub === 'veiculos') {
    html += valueListPanel('Veículos', 'veiculos', { withValor: false, withData: true });
  }
  document.getElementById('view-pessoal').innerHTML = html;
}
function onPessoalSub(id) { pessoalSub = id; activeTreeId = null; renderPessoal(); renderSidebar(); }

function simpleListPanel(label, key) {
  const list = STATE.personal[key];
  let html = `<div class="card"><div class="card-title">${label}</div>`;
  html += `<div class="inline-form"><input type="text" id="new-${key}" placeholder="Adicionar item..."><button class="btn" onclick="onAddSimple('${key}')">+</button></div>`;
  html += `<div class="row-list">`;
  if (!list.length) html += `<div class="empty-note">nada por aqui ainda</div>`;
  for (const item of list) {
    html += `<div class="row-item ${item.status === 'concluido' ? 'done' : ''}">
      <div class="check-circle ${item.status === 'concluido' ? 'checked' : ''}" onclick="onTogglePersonal('${key}','${item.id}')">${item.status === 'concluido' ? '✓' : ''}</div>
      <span class="r-text">${item.texto}</span>
      <button class="btn ghost" style="padding:3px 8px" onclick="onRemovePersonal('${key}','${item.id}')">✕</button>
    </div>`;
  }
  html += `</div></div>`;
  return html;
}
function valueListPanel(label, path, opts) {
  const list = personalListRef(path);
  const idPrefix = path.replace('.', '-');
  let html = `<div class="card"><div class="card-title">${label}</div>`;
  html += `<div class="inline-form"><input type="text" id="new-txt-${idPrefix}" placeholder="Descrição...">`;
  if (opts.withValor) html += `<input type="number" id="new-val-${idPrefix}" placeholder="Valor R$" style="width:100px">`;
  if (opts.withData) html += `<input type="date" id="new-date-${idPrefix}">`;
  html += `<button class="btn" onclick="onAddValue('${path}','${idPrefix}',${opts.withValor},${opts.withData})">+ Adicionar</button></div>`;
  html += `<div class="row-list">`;
  if (!list.length) html += `<div class="empty-note">nada por aqui ainda</div>`;
  for (const item of list) {
    html += `<div class="row-item ${item.status === 'concluido' ? 'done' : ''}">
      <div class="check-circle ${item.status === 'concluido' ? 'checked' : ''}" onclick="onTogglePersonal('${path}','${item.id}')">${item.status === 'concluido' ? '✓' : ''}</div>
      <span class="r-text">${item.texto}</span>
      <span class="r-meta">${item.valor ? 'R$ ' + item.valor : ''} ${item.data ? '· ' + item.data : ''}</span>
      <label style="font-size:10.5px;display:flex;align-items:center;gap:3px;color:var(--text-muted);cursor:pointer">
        <input type="checkbox" ${item.compartilhada ? 'checked' : ''} onchange="onToggleSharedPersonal('${path}','${item.id}')"> compartilhada
      </label>
      <button class="btn ghost" style="padding:3px 8px" onclick="onRemovePersonal('${path}','${item.id}')">✕</button>
    </div>`;
  }
  html += `</div></div>`;
  return html;
}
function onAddSimple(key) {
  const el = document.getElementById(`new-${key}`);
  const texto = el.value.trim();
  if (!texto) return;
  addPersonalItem(key, texto);
  el.value = '';
  renderPessoal();
  renderSidebar();
}
function onAddValue(path, idPrefix, withValor, withData) {
  const txtEl = document.getElementById(`new-txt-${idPrefix}`);
  const texto = txtEl.value.trim();
  if (!texto) return;
  const valor = withValor ? parseFloat(document.getElementById(`new-val-${idPrefix}`).value) || null : null;
  const data = withData ? document.getElementById(`new-date-${idPrefix}`).value || null : null;
  addPersonalItem(path, texto, valor, data);
  renderPessoal();
  renderSidebar();
}
function onTogglePersonal(path, id) { togglePersonalDone(path, id); renderPessoal(); renderSidebar(); }
function onToggleSharedPersonal(path, id) { toggleShared(path, id); renderPessoal(); renderSidebar(); }
function onRemovePersonal(path, id) { removePersonalItem(path, id); renderPessoal(); renderSidebar(); }

/* ---------------- rendering: FITNESS ---------------- */
let fitnessSub = 'treinos';
let fitnessExercise = null;
let fitnessPeriod = 90;
const PERIOD_OPTIONS = [{ id: 7, label: '7d' }, { id: 30, label: '30d' }, { id: 90, label: '90d' }, { id: 365, label: '1a' }, { id: 0, label: 'Tudo' }];
function periodSwitch(current, onclickName) {
  return `<div class="period-switch">${PERIOD_OPTIONS.map(p => `<button class="${current === p.id ? 'active' : ''}" onclick="${onclickName}(${p.id})">${p.label}</button>`).join('')}</div>`;
}
function renderFitness() {
  let html = `<div class="content-header"><h1>${navLabel('fitness')}</h1><div class="sub">treinos e medidas corporais</div></div>`;
  html += `<div class="utabs">
    <button class="${fitnessSub === 'treinos' ? 'active' : ''}" onclick="onFitnessSub('treinos')">Treinos</button>
    <button class="${fitnessSub === 'medidas' ? 'active' : ''}" onclick="onFitnessSub('medidas')">Medidas</button>
  </div>`;

  if (fitnessSub === 'treinos') {
    const exercises = distinctExercises();
    if (!fitnessExercise && exercises.length) fitnessExercise = exercises[exercises.length - 1];

    html += `<div class="card">
      <div class="card-title">Registrar treino</div>
      <div class="inline-form">
        <input type="text" id="wo-exercicio" placeholder="Exercício (ex: Supino)">
        <input type="number" id="wo-series" placeholder="Séries" style="width:80px">
        <input type="number" id="wo-reps" placeholder="Reps" style="width:80px">
        <input type="number" id="wo-carga" placeholder="Carga (kg)" style="width:100px">
        <input type="date" id="wo-data" value="${todayISO()}">
        <button class="btn" onclick="onAddWorkout()">+ Adicionar</button>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="card-title">Progresso de carga</div>`;
    if (!exercises.length) {
      html += `<div class="empty-note">registre um treino para ver o gráfico de evolução.</div>`;
    } else {
      html += `<div class="inline-form" style="margin-bottom:10px">
        <select id="wo-exercise-select" onchange="onSelectExercise(this.value)" style="font-size:12.5px;border:1px solid var(--border);background:var(--bg-soft);border-radius:var(--radius-sm);padding:8px 12px;color:var(--text)">
          ${exercises.map(e => `<option value="${e}" ${e === fitnessExercise ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
        ${periodSwitch(fitnessPeriod, 'onFitnessPeriod')}
      </div>`;
      html += `<div class="chart-wrap">${svgLineChart(exerciseProgress(fitnessExercise, fitnessPeriod), { unit: 'kg' })}</div>`;
    }
    html += `</div>`;

    html += `<div class="card"><div class="card-title">Histórico</div><div class="row-list">`;
    const recent = [...STATE.fitness.workouts].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 30);
    if (!recent.length) html += `<div class="empty-note">nenhum treino registrado ainda.</div>`;
    for (const w of recent) {
      html += `<div class="row-item">
        <span class="r-text"><b>${w.exercicio}</b> — ${w.series}x${w.reps} · ${w.carga}kg</span>
        <span class="r-meta">${w.data}</span>
        <button class="btn ghost" style="padding:3px 8px" onclick="onRemoveWorkout('${w.id}')">✕</button>
      </div>`;
    }
    html += `</div></div>`;
  } else {
    html += `<div class="card">
      <div class="card-title">Registrar medidas</div>
      <div class="inline-form">
        <input type="number" id="me-peso" placeholder="Peso (kg)" style="width:100px">
        <input type="number" id="me-cintura" placeholder="Cintura (cm)" style="width:110px">
        <input type="number" id="me-peito" placeholder="Peito (cm)" style="width:100px">
        <input type="number" id="me-braco" placeholder="Braço (cm)" style="width:100px">
        <input type="number" id="me-coxa" placeholder="Coxa (cm)" style="width:100px">
        <input type="date" id="me-data" value="${todayISO()}">
        <button class="btn" onclick="onAddMedida()">+ Adicionar</button>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="card-title">Evolução do peso</div>
      <div class="inline-form" style="margin-bottom:10px">${periodSwitch(fitnessPeriod, 'onFitnessPeriod')}</div>
      <div class="chart-wrap">${svgLineChart(weightProgress(fitnessPeriod), { unit: 'kg' })}</div>
    </div>`;

    html += `<div class="card"><div class="card-title">Histórico</div><div class="row-list">`;
    const recentM = [...STATE.fitness.medidas].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 30);
    if (!recentM.length) html += `<div class="empty-note">nenhuma medida registrada ainda.</div>`;
    for (const m of recentM) {
      const parts = [];
      if (m.peso != null) parts.push(`${m.peso}kg`);
      if (m.cintura != null) parts.push(`cintura ${m.cintura}cm`);
      if (m.peito != null) parts.push(`peito ${m.peito}cm`);
      if (m.braco != null) parts.push(`braço ${m.braco}cm`);
      if (m.coxa != null) parts.push(`coxa ${m.coxa}cm`);
      html += `<div class="row-item">
        <span class="r-text">${parts.join(' · ') || '—'}</span>
        <span class="r-meta">${m.data}</span>
        <button class="btn ghost" style="padding:3px 8px" onclick="onRemoveMedida('${m.id}')">✕</button>
      </div>`;
    }
    html += `</div></div>`;
  }

  document.getElementById('view-fitness').innerHTML = html;
}
function onFitnessSub(id) { fitnessSub = id; renderFitness(); }
function onSelectExercise(name) { fitnessExercise = name; renderFitness(); }
function onFitnessPeriod(days) { fitnessPeriod = days; renderFitness(); }
function onAddWorkout() {
  const exercicio = document.getElementById('wo-exercicio').value.trim();
  const series = parseFloat(document.getElementById('wo-series').value);
  const reps = parseFloat(document.getElementById('wo-reps').value);
  const carga = parseFloat(document.getElementById('wo-carga').value);
  const data = document.getElementById('wo-data').value || todayISO();
  if (!exercicio || isNaN(carga)) return;
  addWorkout(exercicio, isNaN(series) ? null : series, isNaN(reps) ? null : reps, carga, data);
  fitnessExercise = exercicio;
  renderFitness();
  renderSidebar();
}
function onRemoveWorkout(id) { removeWorkout(id); renderFitness(); renderSidebar(); }
function onAddMedida() {
  const val = (id) => { const v = parseFloat(document.getElementById(id).value); return isNaN(v) ? null : v; };
  const peso = val('me-peso'), cintura = val('me-cintura'), peito = val('me-peito'), braco = val('me-braco'), coxa = val('me-coxa');
  const data = document.getElementById('me-data').value || todayISO();
  if (peso == null && cintura == null && peito == null && braco == null && coxa == null) return;
  addMedida({ peso, cintura, peito, braco, coxa }, data);
  renderFitness();
  renderSidebar();
}
function onRemoveMedida(id) { removeMedida(id); renderFitness(); renderSidebar(); }

/* ---------------- rendering: JOGOS ---------------- */
function renderJogos() {
  let html = `<div class="content-header"><h1>${navLabel('jogos')}</h1><div class="sub">times acompanhados · fuso Cuiabá/MT (UTC-4)</div></div>`;
  for (const [teamId, team] of Object.entries(TEAMS)) {
    html += `<div class="card"><div class="card-title">${team.nome}</div><div class="card-sub">${team.liga}</div>`;
    if (!team.fixtures.length) html += `<div class="empty-note">sem jogos confirmados no momento — recheck em breve.</div>`;
    for (const f of team.fixtures) {
      const conflict = gameConflict(f);
      html += `<div class="game-row comp-${f.competicao}">
        <div class="g-team-icon">${team.icon}</div>
        <div class="g-info">
          <div class="g-matchup">${team.nome} ${f.mandante ? 'x' : '@'} ${f.adversario}</div>
          <div class="g-comp">${COMP_LABEL[f.competicao] || f.competicao} · ${f.data}</div>
        </div>
        <span class="pill ${f.mandante ? 'origin' : 'normal'}">${f.mandante ? 'CASA' : 'FORA'}</span>
        ${conflict ? `<span class="pill warn">⚠ ${conflict.nome}</span>` : ''}
        <div class="g-time">${f.hora || '<span class="pill tbd">TBD</span>'}</div>
      </div>`;
    }
    html += `</div>`;
  }
  html += `<div class="card"><div class="card-sub" style="margin-bottom:0">Jogos do Brasileirão marcados como TBD costumam ser divulgados na quinta-feira da semana do jogo — recheck recomendado.</div></div>`;
  document.getElementById('view-jogos').innerHTML = html;
}

/* ---------------- rendering: QUADRO CONJUNTO ---------------- */
function renderQuadro() {
  const workShared = STATE.workTasks.filter(t => t.compartilhada).map(t => ({ id: t.id, texto: t.titulo, status: t.status, origin: 'Trabalho', kind: 'work' }));
  const personalShared = allPersonalWithOrigin().filter(x => x.item.compartilhada).map(x => ({ id: x.item.id, texto: x.item.texto, status: x.item.status, origin: x.origin, path: x.path, kind: 'personal' }));
  const customShared = [];
  for (const tab of Object.values(STATE.customTabs)) {
    for (const list of tab.lists) {
      for (const t of list.tasks) {
        if (t.compartilhada) customShared.push({ id: t.id, texto: t.titulo, status: t.status, origin: tab.label, path: `${tab.id}:${list.id}`, kind: 'custom' });
      }
    }
  }
  const all = [...workShared, ...personalShared, ...customShared];

  let html = `<div class="content-header"><h1>${navLabel('quadro')}</h1><div class="sub">tarefas compartilhadas / que dependem de terceiros, de qualquer área</div></div>`;
  html += `<div class="card"><div class="kanban">`;
  for (const col of STATUS_COLS) {
    html += `<div class="kanban-col"><h4>${col.nome}</h4><div class="col-body">`;
    const items = all.filter(i => i.status === col.id);
    if (!items.length) html += `<div class="empty-note">vazio</div>`;
    for (const i of items) {
      html += `<div class="task-card">
        <div class="t-title">${i.texto}</div>
        <div class="t-meta"><span class="pill origin">${i.origin}</span></div>
        <div class="t-actions">
          <button onclick="onMoveQuadro('${i.kind}','${i.id}','${i.path || ''}',-1)" ${i.status === 'a_fazer' ? 'disabled' : ''}>◀</button>
          <button onclick="onMoveQuadro('${i.kind}','${i.id}','${i.path || ''}',1)" ${i.status === 'concluido' ? 'disabled' : ''}>▶</button>
        </div>
      </div>`;
    }
    html += `</div></div>`;
  }
  html += `</div></div>`;
  document.getElementById('view-quadro').innerHTML = html;
}
function onMoveQuadro(kind, id, path, dir) {
  if (kind === 'work') {
    const t = STATE.workTasks.find(x => x.id === id);
    if (t) t.status = cycleStatus(t.status, dir);
  } else if (kind === 'custom') {
    const [tabId, listId] = path.split(':');
    const tab = STATE.customTabs[tabId];
    const list = tab && tab.lists.find(l => l.id === listId);
    const t = list && list.tasks.find(x => x.id === id);
    if (t) t.status = cycleStatus(t.status, dir);
  } else {
    const list = personalListRef(path);
    const item = list.find(x => x.id === id);
    if (item) item.status = cycleStatus(item.status, dir);
  }
  saveState();
  renderQuadro();
  renderSidebar();
}

/* ---------------- view switching ---------------- */
function switchView(view) {
  const isCustom = !!STATE.customTabs[view];
  if (!TABS.includes(view) && !isCustom) view = 'hoje';
  currentView = view;
  for (const t of TABS) document.getElementById(`view-${t}`).classList.toggle('hidden', t !== view);
  document.getElementById('view-custom').classList.toggle('hidden', !isCustom);
  document.querySelectorAll('.rail-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  if (isCustom) renderCustomTab(view);
  else if (view === 'hoje') renderHoje();
  else if (view === 'rotina') renderRotina();
  else if (view === 'trabalho') renderTrabalho();
  else if (view === 'pessoal') renderPessoal();
  else if (view === 'fitness') renderFitness();
  else if (view === 'jogos') renderJogos();
  else if (view === 'quadro') renderQuadro();
  window.location.hash = view;
  closeMobileSidebar();
}

/* ---------------- mobile sidebar ---------------- */
function toggleMobileSidebar() {
  const shell = document.getElementById('app-shell');
  const backdrop = document.getElementById('sidebar-backdrop');
  const opening = !shell.classList.contains('sidebar-open');
  shell.classList.toggle('sidebar-open', opening);
  backdrop.classList.toggle('hidden', !opening);
}
function closeMobileSidebar() {
  document.getElementById('app-shell').classList.remove('sidebar-open');
  document.getElementById('sidebar-backdrop').classList.add('hidden');
}

/* ---------------- theme ---------------- */
const THEME_KEY = 'rotina2026_theme';
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (e) { /* storage unavailable */ }
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage unavailable */ }
}
function onThemeChange(theme) { applyTheme(theme); openSettings(); }

/* ---------------- settings modal ---------------- */
function openSettings() {
  const modal = document.getElementById('settings-modal');
  const body = document.getElementById('settings-body');
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const notifPerm = ('Notification' in window) ? Notification.permission : 'unsupported';
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  body.innerHTML = `
    <div class="settings-row">
      <div><div class="sr-label">Tema</div><div class="sr-sub">aparência do app</div></div>
      <div class="theme-switch">
        <button class="${theme === 'light' ? 'active' : ''}" onclick="onThemeChange('light')">${svgIcon('sun', 14)} Claro</button>
        <button class="${theme === 'dark' ? 'active' : ''}" onclick="onThemeChange('dark')">${svgIcon('moon', 14)} Escuro</button>
      </div>
    </div>
    <div class="settings-row">
      <div><div class="sr-label">Notificações locais</div><div class="sr-sub">início de bloco, prazos e jogos próximos</div></div>
      ${notifPerm === 'granted' ? `<span class="pill origin">ativas</span>` : `<button class="btn" onclick="requestNotifPermission()">Ativar</button>`}
    </div>
    <div class="settings-row">
      <div><div class="sr-label">Aviso antes do jogo</div><div class="sr-sub">minutos de antecedência</div></div>
      <input type="number" min="1" max="120" value="${STATE.notif.leadMinutes}" onchange="onLeadMinutesChange(this.value)">
    </div>
    <div class="settings-row">
      <div><div class="sr-label">Instalar como app</div><div class="sr-sub">${standalone ? 'já instalado nesta sessão' : 'iPhone: Safari → Compartilhar → Adicionar à Tela de Início. Android/Chrome: menu → Instalar app. Assim as notificações chegam na Central de Notificações (e no Apple Watch pareado).'}</div></div>
    </div>
  `;
  modal.classList.remove('hidden');
}
function closeSettings() { document.getElementById('settings-modal').classList.add('hidden'); }
function onLeadMinutesChange(v) { STATE.notif.leadMinutes = Math.max(1, parseInt(v, 10) || 15); saveState(); }
async function requestNotifPermission() {
  if (!('Notification' in window)) return;
  await Notification.requestPermission();
  openSettings();
}

/* ---------------- notifications ---------------- */
function fireNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(reg => reg.showNotification(title, { body, icon: 'icons/icon.svg' })).catch(() => { new Notification(title, { body }); });
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

/* ---------------- init ---------------- */
function init() {
  document.querySelector('.rail-logo').innerHTML = svgIcon('asterisk', 18);
  document.getElementById('mobile-toggle').innerHTML = svgIcon('menu', 18);
  document.getElementById('btn-settings').innerHTML = svgIcon('gear', 18);

  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-modal').addEventListener('click', (e) => { if (e.target.id === 'settings-modal') closeSettings(); });
  document.getElementById('manage-tabs-close').addEventListener('click', closeManageTabs);
  document.getElementById('manage-tabs-modal').addEventListener('click', (e) => { if (e.target.id === 'manage-tabs-modal') closeManageTabs(); });
  document.getElementById('mobile-toggle').addEventListener('click', toggleMobileSidebar);
  document.getElementById('sidebar-backdrop').addEventListener('click', closeMobileSidebar);

  refreshTiers();
  renderSidebar();

  const initial = (window.location.hash || '#hoje').replace('#', '');
  switchView(initial);

  setInterval(() => {
    checkNotifications();
    if (currentView === 'hoje') { renderHoje(); renderSidebar(); }
  }, 30000);
  checkNotifications();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
document.addEventListener('DOMContentLoaded', init);
