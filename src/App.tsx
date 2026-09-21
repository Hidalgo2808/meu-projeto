import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowLeftRight, BarChart3, CalendarDays, Car as CarIcon, CheckCircle2, ClipboardList,
  Download, FileSpreadsheet, FileText, History, Moon, Plus, RefreshCw, Search, Settings2, Sun, Trash2,
  Truck, Trophy, Upload, UserCheck, UserPlus, Users, UserX, X, Pencil, Lock, Stethoscope,
} from 'lucide-react';
import IndicadoresTab from './components/IndicadoresTab';
import GerenciarEquipeModal from './components/GerenciarEquipeModal';
import EditarUnidadeCarroModal from './components/EditarUnidadeCarroModal';
import CompanyLogo, { LogoUploadButton } from './components/CompanyLogo';
import SeletorPessoaEquipe from './components/SeletorPessoaEquipe';
import CarroTopView from './components/CarroTopView';
import FiltroRegional from './components/FiltroRegional';
import FiltroMes from './components/FiltroMes';
import type { BancoRegistros, Carro, Colaborador, FiltroRegionalId, Registro } from './types';
import { FUNCOES_COLABORADOR, MOTIVOS_AFASTAMENTO } from './types';
import { TEMAS_UNIDADE, temaUnidade } from './unidadeTheme';
import { TEMAS_EQUIPE, equipeIdDePosicao, temaEquipe } from './equipeTheme';
import { MOCK_CARROS, MOCK_COLABORADORES, mockHistorico } from './mock';
import {
  alocarPessoa, calcIndicadores, carroDaPessoa, exportarExcel, exportarPDF, filtrarCarrosPorRegional, filtrarColabsPorRegional,
  historicoFaltasPorRegional, initials, isVago, listaFaltas, listarMesesComLancamento,
  loadLS, migrarCarrosComRegional, migrarColabsComRegional, migrarFuncoesColabs, normalizarFuncao, nowHM, ocupadosDoCarro, parseColaboradoresCSV, quantEquipesDoCarro, regionalCurto,
  regionalDoCarro, regionalDoColab, regionalLabel, removerDoCarro, saveLS, situacaoLabel, statusCarro, statusEquipe,
  titulares, toBR, todayKey, totaisDoMes, totaisPorMes, uid, vagasDoCarro,
} from './utils';

type Tab = 'operacao' | 'colaboradores' | 'carros' | 'historico' | 'indicadores';

// ---------------- Avatar ----------------
function Avatar({ nome, foto, size = 56, ring = '' }: { nome: string; foto: string; size?: number; ring?: string }) {
  const [err, setErr] = useState(false);
  if (!foto || err) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold ${ring}`}
        style={{ width: size, height: size, fontSize: size * 0.34 }}
      >
        {initials(nome)}
      </div>
    );
  }
  return (
    <img
      src={foto}
      alt={nome}
      width={size}
      height={size}
      onError={() => setErr(true)}
      className={`rounded-full object-cover ${ring}`}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}

// ================= APP =================
export default function App() {
  const [colabs, setColabs] = useState<Colaborador[]>(() => {
    const base = loadLS<Colaborador[]>('f44_colabs', MOCK_COLABORADORES);
    const carrosBase = loadLS<Carro[]>('f44_carros', MOCK_CARROS);
    const comRegional = migrarColabsComRegional(base, carrosBase);
    return migrarFuncoesColabs(comRegional);
  });
  const [carros, setCarros] = useState<Carro[]>(() => {
    const baseCarros = loadLS<Carro[]>('f44_carros', MOCK_CARROS);
    const baseColabs = loadLS<Colaborador[]>('f44_colabs', MOCK_COLABORADORES);
    return migrarCarrosComRegional(baseCarros, baseColabs);
  });
  const [registros, setRegistros] = useState<BancoRegistros>(() => {
    const saved = loadLS<BancoRegistros>('f44_regs', {});
    if (Object.keys(saved).length > 0) return saved;
    return mockHistorico();
  });
  const [dataSel, setDataSel] = useState<string>(() => loadLS('f44_data', todayKey()));
  const [dark, setDark] = useState<boolean>(() => loadLS('f44_theme', true));
  const [tab, setTab] = useState<Tab>('operacao');
  const [busca, setBusca] = useState('');
  const [regionalFiltro, setRegionalFiltro] = useState<FiltroRegionalId>(() => loadLS<FiltroRegionalId>('f44_regional', 'todas'));
  const [mesFiltro, setMesFiltro] = useState<string>(() => loadLS<string>('f44_mesFiltro', 'todos'));
  const [alvo, setAlvo] = useState<{ carroId: string; colabId: string } | null>(null);
  const [gerenciar, setGerenciar] = useState<{ carroId: string; posFoco?: number | null } | null>(null);
  const [responsavel, setResponsavel] = useState(() => loadLS('f44_resp', 'Gestor'));
  const [showFechamento, setShowFechamento] = useState(false);
  const [showNovoColab, setShowNovoColab] = useState(false);
  const [editColab, setEditColab] = useState<Colaborador | null>(null);
  const [showNovoCarro, setShowNovoCarro] = useState(false);
  const [editCarro, setEditCarro] = useState<Carro | null>(null);
  const [editarUnidadeId, setEditarUnidadeId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    saveLS('f44_theme', dark);
  }, [dark]);
  useEffect(() => saveLS('f44_colabs', colabs), [colabs]);
  useEffect(() => saveLS('f44_carros', carros), [carros]);
  useEffect(() => saveLS('f44_regs', registros), [registros]);
  useEffect(() => saveLS('f44_data', dataSel), [dataSel]);
  useEffect(() => saveLS('f44_resp', responsavel), [responsavel]);
  useEffect(() => saveLS('f44_regional', regionalFiltro), [regionalFiltro]);
  useEffect(() => saveLS('f44_mesFiltro', mesFiltro), [mesFiltro]);

  const dia = registros[dataSel];
  const carrosDaRegional = useMemo(() => filtrarCarrosPorRegional(carros, regionalFiltro), [carros, regionalFiltro]);
  const colabsDaRegional = useMemo(() => filtrarColabsPorRegional(colabs, carros, regionalFiltro), [colabs, carros, regionalFiltro]);
  const ind = useMemo(() => calcIndicadores(colabsDaRegional, carrosDaRegional, dia), [colabsDaRegional, carrosDaRegional, dia]);
  const faltasLista = useMemo(() => listaFaltas(colabs, carrosDaRegional, dia), [colabs, carrosDaRegional, dia]);
  const hist = useMemo(() => historicoFaltasPorRegional(registros, carros, colabs, regionalFiltro), [registros, carros, colabs, regionalFiltro]);
  const mesesDisponiveis = useMemo(() => listarMesesComLancamento(registros), [registros]);
  const totaisMesMap = useMemo(() => totaisPorMes(registros), [registros]);
  const histFiltradoMes = useMemo(
    () => (mesFiltro === 'todos' ? hist : hist.filter((h) => h.data.startsWith(mesFiltro))),
    [hist, mesFiltro],
  );
  const resumoMesFiltro = useMemo(() => totaisDoMes(registros, mesFiltro), [registros, mesFiltro]);
  const maxHist = Math.max(1, ...histFiltradoMes.map((h) => Math.max(h.faltas, h.subs, h.afastados ?? 0)));

  const colabById = (id: string) => colabs.find((c) => c.id === id);
  const disponiveis = useMemo(() => {
    const emUso = new Set(titulares(carros));
    const alvoId = alvo?.colabId;
    const afastadosHoje = new Set(
      Object.entries(dia ?? {})
        .filter(([, r]) => r.situacao === 'afastado' || r.situacao === 'ferias')
        .map(([id]) => id),
    );
    return colabs.filter((c) => {
      if (c.status === 'inativo') return false;
      if (afastadosHoje.has(c.id) && c.id !== alvoId) return false;
      // Substitutos preferencialmente da mesma regional do carro alvo
      if (regionalFiltro !== 'todas' && regionalDoColab(c, carros) !== regionalFiltro) {
        // mantém reservas de outras regionais como opção secundária apenas se buscar explicitamente? por ora oculta
        return false;
      }
      return !emUso.has(c.id) || c.id === alvoId || c.status === 'reserva';
    });
  }, [colabs, carros, alvo, regionalFiltro, dia]);

  // ---------- ações de presença ----------
  function setRegistro(colabId: string, reg: Registro | null) {
    setRegistros((prev) => {
      const copia = { ...prev };
      const d = { ...(copia[dataSel] ?? {}) };
      if (reg === null) delete d[colabId];
      else d[colabId] = reg;
      copia[dataSel] = d;
      return copia;
    });
  }
  const marcarPresente = (id: string) => {
    setRegistro(id, null);
    setAlvo(null);
  };
  const marcarFalta = (id: string, motivo: string, obs: string) => {
    setRegistro(id, { situacao: 'falta', hora: nowHM(), responsavel, motivo, observacao: obs });
    setAlvo(null);
  };
  const marcarSubstituicao = (id: string, subId: string, motivo: string) => {
    setRegistro(id, { situacao: 'substituicao', substitutoId: subId, hora: nowHM(), responsavel, motivo });
    setAlvo(null);
  };
  const marcarAfastado = (id: string, tipo: string, obs: string, inicio?: string, fim?: string) => {
    const motivoLabel = tipo === 'Outros' && obs ? obs : tipo;
    setRegistro(id, {
      situacao: 'afastado', hora: nowHM(), responsavel,
      motivo: motivoLabel, observacao: obs,
      afastadoTipo: tipo, afastadoInicio: inicio, afastadoFim: fim,
    });
    setAlvo(null);
  };

  function resetDemo() {
    if (!confirm('Restaurar dados de demonstração?')) return;
    setColabs(MOCK_COLABORADORES);
    setCarros(MOCK_CARROS);
    setRegistros(mockHistorico());
    setDataSel(todayKey());
    setRegionalFiltro('todas');
    setMesFiltro('todos');
  }

  function handleMesFiltroChange(v: string): void {
    setMesFiltro(v);
    if (v !== 'todos') {
      const diasDoMes = hist.filter((h) => h.data.startsWith(v));
      if (diasDoMes.length > 0 && !dataSel.startsWith(v)) {
        setDataSel(diasDoMes[diasDoMes.length - 1].data);
      }
    }
  }

  // ---------- exportações ----------
  function linhasDetalhe() {
    const rows: Array<{ data: string; regional: string; carro: string; equipe: string; colaborador: string; funcao: string; situacao: string; substituto: string; hora: string }> = [];
    for (const carro of carrosDaRegional) {
      carro.posicoes.forEach((id, idx) => {
        // CORREÇÃO: pula lugares vazios — não entram no Excel/PDF nem na contagem
        if (isVago(id)) return;
        const c = colabById(id);
        if (!c) return;
        const r = dia?.[id];
        const sit = !r ? 'Presente' : situacaoLabel(r.situacao, r.afastadoTipo ?? r.motivo);
        const sub = r?.substitutoId ? colabById(r.substitutoId)?.nome ?? '' : '';
        rows.push({
          data: toBR(dataSel), regional: regionalLabel(regionalDoCarro(carro)), carro: `${carro.prefixo} (${carro.placa})`, equipe: idx < 2 ? 'EQ01' : 'EQ02',
          colaborador: c.nome, funcao: c.funcao, situacao: sit, substituto: sub, hora: r?.hora ?? '—',
        });
      });
    }
    return rows;
  }
  const doExcel = () => exportarExcel(dataSel, ind, linhasDetalhe());
  const doPDF = () =>
    exportarPDF(dataSel, ind, faltasLista.map((f) => ({
      colaborador: f.colab.nome, funcao: f.colab.funcao, carro: `${f.carro.prefixo} · ${regionalCurto(regionalDoCarro(f.carro))}`,
      equipe: f.equipe, situacao: situacaoLabel(f.registro.situacao, f.registro.afastadoTipo ?? f.registro.motivo),
      substituto: f.substituto?.nome ?? '—',
    })));

  const carrosFiltrados = carrosDaRegional.filter((c) =>
    (c.prefixo + c.placa + c.modelo + regionalLabel(regionalDoCarro(c))).toLowerCase().includes(busca.toLowerCase()),
  );
  const alvoColab = alvo ? colabById(alvo.colabId) : undefined;
  const alvoCarro = alvo ? carros.find((c) => c.id === alvo.carroId) : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/40 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl no-print">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <CompanyLogo size={48} />
            <div>
              <h1 className="text-base font-extrabold tracking-tight sm:text-lg">CONTROLE DE FALTAS 4x4</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Presença · Faltas · Substituições · Afastados INSS · Equipes</p>
              <LogoUploadButton />
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-indigo-500" />
              <input
                type="date"
                value={dataSel}
                max={todayKey()}
                onChange={(e) => e.target.value && setDataSel(e.target.value)}
                className="bg-transparent outline-none text-sm"
              />
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400">{toBR(dataSel)}</span>
            </label>
            <input
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              title="Responsável pelo lançamento"
              placeholder="Responsável"
              className="w-32 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button onClick={() => setDark(!dark)} className="btn-ghost !px-3" title="Alternar tema">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {/* TABS */}
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {([
            { k: 'operacao', label: 'Operação', icon: CarIcon },
            { k: 'indicadores', label: 'Indicadores', icon: Trophy },
            { k: 'colaboradores', label: `Colaboradores (${colabs.length})`, icon: Users },
            { k: 'carros', label: `Carros (${carros.length})`, icon: Truck },
            { k: 'historico', label: 'Histórico', icon: History },
          ] as Array<{ k: Tab; label: string; icon: typeof Users }>).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`tab-btn ${tab === t.k
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={resetDemo} className="tab-btn bg-slate-100 dark:bg-slate-800 text-slate-500" title="Restaurar demo">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Filtro global por regional */}
        <div className="mb-5">
          <FiltroRegional value={regionalFiltro} onChange={setRegionalFiltro} carros={carros} colabs={colabs} />
          {regionalFiltro !== 'todas' && (
            <p className="mt-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              Exibindo apenas <b className="text-indigo-500">{regionalLabel(regionalFiltro)}</b> — indicadores, carros, colaboradores e histórico filtrados.
            </p>
          )}
        </div>
        {/* ============ OPERAÇÃO ============ */}
        {tab === 'operacao' && (
          <div className="anim-fade-up space-y-6">
            {/* Indicadores principais */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="card-stat text-center border-t-4 !border-t-emerald-500">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Equipes</p>
                <p className="text-3xl font-extrabold">{ind.totalEquipes}</p>
                <p className="text-xs text-slate-500">🟢 {ind.completas} · 🟡 {ind.incompletas} · 🔴 {ind.semEquipe}</p>
              </div>
              <div className="card-stat text-center border-t-4 !border-t-red-500">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Faltas</p>
                <p className="text-3xl font-extrabold text-red-500">🔴 {ind.faltas}</p>
                <p className="text-xs text-slate-500">{toBR(dataSel)}</p>
              </div>
              <div className="card-stat text-center border-t-4 !border-t-sky-500">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Substituições</p>
                <p className="text-3xl font-extrabold text-sky-500">🔵 {ind.substituicoes}</p>
                <button onClick={() => setShowFechamento(true)} className="text-xs font-bold text-indigo-500 hover:underline">
                  ver detalhe →
                </button>
              </div>
              <div className="card-stat text-center border-t-4 !border-t-orange-500">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Afastados</p>
                <p className="text-3xl font-extrabold text-orange-500">🟠 {ind.afastados}</p>
                <p className="text-xs text-slate-500">INSS / médico</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="card-stat">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-indigo-500" /> COLABORADORES</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3">👥 Total <b className="float-right">{ind.totalColaboradores}</b></div>
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">🟢 Presentes <b className="float-right text-emerald-500">{ind.presentes}</b></div>
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">🔴 Faltas <b className="float-right text-red-500">{ind.faltas}</b></div>
                  <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 p-3">🔵 Substituições <b className="float-right text-sky-500">{ind.substituicoes}</b></div>
                  <div className="col-span-2 rounded-xl bg-orange-500/10 border border-orange-500/30 p-3">🟠 Afastados (INSS) <b className="float-right text-orange-500">{ind.afastados}</b></div>
                </div>
              </div>
              <div className="card-stat">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><BarChart3 className="h-4 w-4 text-indigo-500" /> EQUIPES & CARROS</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">🟢 Completas <b className="float-right">{ind.completas}</b></div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">🟡 Incompletas <b className="float-right">{ind.incompletas}</b></div>
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3">🚙 Operando <b className="float-right">{ind.carrosOperando}/{ind.totalCarros}</b></div>
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">⛔ Sem equipe <b className="float-right">{ind.carrosSemEquipe}</b></div>
                </div>
                <div className="mt-2 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent p-3">
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">🚗 Ocupação dos carros</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-2 py-2.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Fechados · 4p</p>
                      <p className="text-2xl font-extrabold text-emerald-500">{ind.carrosCom4 ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 px-2 py-2.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Com 3p</p>
                      <p className="text-2xl font-extrabold text-sky-500">{ind.carrosCom3 ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-2 py-2.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Com 2p</p>
                      <p className="text-2xl font-extrabold text-amber-500">{ind.carrosCom2 ?? 0}</p>
                    </div>
                  </div>
                  <button onClick={() => setTab('indicadores')} className="mt-2 w-full text-center text-xs font-bold text-indigo-500 hover:underline">
                    ver detalhe por carro nos Indicadores →
                  </button>
                </div>
                <button onClick={() => setShowFechamento(true)} className="btn-primary mt-3 w-full">
                  <Lock className="h-4 w-4" /> FECHAR DIA · EXPORTAR
                </button>
              </div>
            </div>

            {/* Busca + Nova equipe */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center no-print">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar carro por prefixo, placa ou modelo…"
                  className="input !pl-10 !py-3 !rounded-2xl glass w-full" />
              </div>
              <button
                onClick={() => { setEditCarro(null); setShowNovoCarro(true); }}
                title="Cadastrar nova equipe (novo carro 4x4)"
                className="group flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-indigo-600/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/40 active:translate-y-0"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110">
                  <Plus className="h-4 w-4" />
                </span>
                Nova equipe
              </button>
            </div>

            {/* Legenda de cores por unidade + equipe */}
            <div className="glass flex flex-wrap items-center justify-center gap-2 rounded-2xl px-4 py-2.5 no-print">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Unidades:
              </span>
              {TEMAS_UNIDADE.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRegionalFiltro(t.id)}
                  title={`Filtrar por ${t.nome}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide transition-all hover:scale-105 ${regionalFiltro === t.id ? `bg-gradient-to-r ${t.id === 'ribas' ? 'from-emerald-600 to-teal-600' : 'from-sky-600 to-cyan-600'} text-white shadow-lg` : t.badge}`}
                >
                  <i className={`h-2 w-2 rounded-full ${regionalFiltro === t.id ? 'bg-white' : t.dot}`} />
                  {t.nomeCurto}
                </button>
              ))}
              {regionalFiltro !== 'todas' && (
                <button
                  type="button"
                  onClick={() => setRegionalFiltro('todas')}
                  className="text-[11px] font-bold text-indigo-500 hover:underline"
                >
                  limpar filtro ✕
                </button>
              )}
              <span className="mx-1 hidden h-5 w-px bg-slate-200 dark:bg-slate-700 sm:block" aria-hidden="true" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Equipes:
              </span>
              {TEMAS_EQUIPE.map((e) => (
                <span
                  key={e.id}
                  title={e.nome}
                  className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${e.gradient} px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-md ${e.gradientShadow}`}
                >
                  <i className="h-2 w-2 rounded-full bg-white/90" />
                  {e.id}
                </span>
              ))}
            </div>

            {/* Grade de carros — card com cor da unidade */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {carrosFiltrados.map((carro, i) => {
                // CORREÇÃO: passa colabs para ignorar vagas vazias e ids fantasmas
                const st = statusCarro(carro, dia, colabs);
                const regId = regionalDoCarro(carro);
                const tema = temaUnidade(regId);
                return (
                  <div
                    key={carro.id}
                    className={`glass anim-fade-up overflow-hidden rounded-3xl border-t-4 ${tema.borderTop} ${tema.cardRing} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {/* Faixa de cor da unidade */}
                    <div className={`unidade-bar h-1.5 w-full bg-gradient-to-r ${tema.bar}`} aria-hidden="true" />
                    <div className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tema.icon} text-white shadow-lg ${tema.iconShadow}`}>
                            <CarIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold leading-tight">{carro.prefixo}</p>
                            <p className="text-xs text-slate-500">{carro.placa} · {carro.modelo}</p>
                            {/* Badge colorido da unidade */}
                            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${tema.badge}`}>
                              <i className={`h-1.5 w-1.5 rounded-full ${tema.dot}`} />
                              📍 {regionalCurto(regId)}
                            </span>
                          </div>
                        </div>
                        <span title={`${st.alocados} pessoa(s) alocada(s) = ${st.qtdEquipes} equipe(s) · ${st.label}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.classe === 'ok' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : st.classe === 'warn' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                          <i className={`h-1.5 w-1.5 rounded-full ${st.classe === 'ok' ? 'bg-emerald-500' : st.classe === 'warn' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          {st.presentes}/{st.alocados} · {st.qtdEquipes} eq.
                        </span>
                      </div>
                      {/* Desenho minimalista do carro — detalhes no tooltip/modal */}
                      <div className={`rounded-2xl border ${tema.carroFrame} overflow-hidden`}>
                        <CarroTopView
                          carro={carro}
                          colabs={colabs}
                          dia={dia}
                          onPick={(id) => setAlvo({ carroId: carro.id, colabId: id })}
                          onAdd={(pos) => setGerenciar({ carroId: carro.id, posFoco: pos })}
                        />
                      </div>
                      {vagasDoCarro(carro) > 0 && (
                        <button
                          onClick={() => setGerenciar({ carroId: carro.id, posFoco: carro.posicoes.findIndex((p) => isVago(p)) })}
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-700"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Adicionar pessoa · {vagasDoCarro(carro)} vaga{vagasDoCarro(carro) === 1 ? '' : 's'}
                        </button>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className={`truncate text-xs font-semibold ${tema.text}`}>{regionalLabel(regId)} · {st.label}</span>
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            onClick={() => setEditarUnidadeId(carro.id)}
                            className={`btn-ghost !rounded-lg !px-2.5 !py-1.5 !text-xs !font-extrabold uppercase tracking-wide transition-all hover:scale-105 ${tema.unitButton}`}
                            title={`Trocar unidade — atual: ${regionalLabel(regId)}`}
                          >
                            <i className={`h-1.5 w-1.5 rounded-full ${tema.dot}`} />
                            {regionalCurto(regId)}
                          </button>
                          <button onClick={() => setGerenciar({ carroId: carro.id, posFoco: null })} className="btn-ghost !rounded-lg !px-2.5 !py-1.5 !text-xs !font-medium" title="Gerenciar equipe">
                            <Settings2 className="h-3.5 w-3.5" /> Equipe
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {carrosFiltrados.length === 0 && (
              <div className="glass rounded-3xl p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                  <Truck className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold">Nenhuma equipe encontrada.</p>
                <p className="mt-1 text-xs text-slate-500">Ajuste a busca ou cadastre uma nova equipe para {regionalFiltro === 'todas' ? 'a operação' : regionalLabel(regionalFiltro)}.</p>
                <button
                  onClick={() => { setEditCarro(null); setShowNovoCarro(true); }}
                  className="mx-auto mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" /> Incluir nova equipe
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============ COLABORADORES ============ */}
        {tab === 'colaboradores' && (
          <ColaboradoresTab
            colabs={colabs} setColabs={setColabs} carros={carros} setCarros={setCarros} regionalFiltro={regionalFiltro} onRegionalChange={setRegionalFiltro}
            dia={dia} dataSel={dataSel}
            onNew={() => { setEditColab(null); setShowNovoColab(true); }}
            onEdit={(c) => { setEditColab(c); setShowNovoColab(true); }}
          />
        )}

        {/* ============ CARROS ============ */}
        {tab === 'carros' && (
          <CarrosTab
            carros={carros} setCarros={setCarros} colabs={colabs} regionalFiltro={regionalFiltro}
            onNew={() => { setEditCarro(null); setShowNovoCarro(true); }}
            onEdit={(c) => { setEditCarro(c); setShowNovoCarro(true); }}
          />
        )}

        {/* ============ HISTÓRICO ============ */}
        {tab === 'historico' && (
          <div className="anim-fade-up space-y-4">
            <FiltroMes
              meses={mesesDisponiveis}
              value={mesFiltro}
              onChange={handleMesFiltroChange}
              totais={totaisMesMap}
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="card-stat border-t-4 !border-t-red-500 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Faltas {mesFiltro === 'todos' ? '· geral' : '· mês'}</p>
                <p className="text-2xl font-extrabold text-red-500">🔴 {histFiltradoMes.reduce((s, h) => s + h.faltas, 0)}</p>
                <p className="text-[11px] text-slate-500">{resumoMesFiltro.dias} dias lançados</p>
              </div>
              <div className="card-stat border-t-4 !border-t-sky-500 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Subs {mesFiltro === 'todos' ? '· geral' : '· mês'}</p>
                <p className="text-2xl font-extrabold text-sky-500">🔵 {histFiltradoMes.reduce((s, h) => s + h.subs, 0)}</p>
                <p className="text-[11px] text-slate-500">{histFiltradoMes.length} dias no gráfico</p>
              </div>
              <div className="card-stat border-t-4 !border-t-orange-500 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Afastados {mesFiltro === 'todos' ? '· geral' : '· mês'}</p>
                <p className="text-2xl font-extrabold text-orange-500">🟠 {histFiltradoMes.reduce((s, h) => s + (h.afastados ?? 0), 0)}</p>
                <p className="text-[11px] text-slate-500">INSS / médico</p>
              </div>
              <div className="card-stat border-t-4 !border-t-indigo-500 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Dias {mesFiltro === 'todos' ? '· geral' : '· mês'}</p>
                <p className="text-2xl font-extrabold">📅 {histFiltradoMes.length}</p>
                <p className="text-[11px] text-slate-500">clique p/ carregar</p>
              </div>
            </div>
            <div className="glass rounded-3xl p-5">
              <h3 className="mb-1 flex items-center gap-2 font-bold"><BarChart3 className="h-5 w-5 text-indigo-500" /> FALTAS POR DIA{regionalFiltro !== 'todas' ? ` — ${regionalLabel(regionalFiltro).toUpperCase()}` : ''}{mesFiltro !== 'todos' ? ` · ${mesFiltro.slice(5, 7)}/${mesFiltro.slice(0, 4)}` : ''}</h3>
              <p className="mb-4 text-xs text-slate-500">Clique em um dia para carregar os registros{mesFiltro !== 'todos' ? ' do mês filtrado' : ''}.</p>
              <div className="flex items-end gap-2 overflow-x-auto pb-2">
                {histFiltradoMes.map((h) => (
                  <button
                    key={h.data}
                    onClick={() => { setDataSel(h.data); setTab('operacao'); }}
                    className={`flex min-w-[76px] flex-1 flex-col items-center gap-1.5 rounded-2xl p-3 transition-all hover:scale-105 ${h.data === dataSel ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    <span className="text-[10px] font-bold">{toBR(h.data).slice(0, 5)}</span>
                    <div className="flex h-24 w-full items-end justify-center gap-1">
                      <div className="w-5 rounded-t-md bg-gradient-to-t from-red-600 to-red-400 transition-all" style={{ height: `${Math.max(6, (h.faltas / maxHist) * 90)}px` }} title={`${h.faltas} faltas`} />
                      <div className="w-5 rounded-t-md bg-gradient-to-t from-sky-600 to-sky-400 transition-all" style={{ height: `${Math.max(6, (h.subs / Math.max(1, maxHist)) * 90)}px` }} title={`${h.subs} subs`} />
                      <div className="w-5 rounded-t-md bg-gradient-to-t from-orange-600 to-amber-400 transition-all" style={{ height: `${Math.max(6, ((h.afastados ?? 0) / Math.max(1, maxHist)) * 90)}px` }} title={`${h.afastados ?? 0} afastados`} />
                    </div>
                    <span className="text-xs font-extrabold">🔴{h.faltas} 🔵{h.subs} 🟠{h.afastados ?? 0}</span>
                  </button>
                ))}
                {histFiltradoMes.length === 0 && (
                  <div className="w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                    <p className="text-sm font-bold">Nenhum lançamento em {mesFiltro}.</p>
                    <p className="mt-1 text-xs text-slate-500">Ajuste o filtro de mês ou registre faltas na aba Operação.</p>
                    <button onClick={() => setMesFiltro('todos')} className="btn-ghost mt-3 !py-2 !text-xs">Ver todos os meses</button>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-red-500" /> Faltas</span>
                <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-sky-500" /> Substituições</span>
                <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-orange-500" /> Afastados INSS</span>
              </div>
            </div>
            <div className="glass rounded-3xl p-5">
              <h3 className="mb-3 flex items-center gap-2 font-bold"><ClipboardList className="h-5 w-5 text-indigo-500" /> RELATÓRIO — {toBR(dataSel)}</h3>
              <RelatorioTable />
            </div>
          </div>
        )}

        {/* ============ INDICADORES ============ */}
        {tab === 'indicadores' && (
          <IndicadoresTab
            registros={registros}
            colabs={colabs}
            carros={carros}
            regionalFiltro={regionalFiltro}
            onRegionalChange={setRegionalFiltro}
            onVerDia={(data) => { setDataSel(data); setTab('operacao'); }}
          />
        )}
      </main>

      {/* ============ MODAL SITUAÇÃO ============ */}
      {alvo && alvoColab && (
        <StatusModal
          colab={alvoColab} carro={alvoCarro} dia={dia} disponiveis={disponiveis}
          onClose={() => setAlvo(null)} onPresente={() => marcarPresente(alvo.colabId)}
          onFalta={marcarFalta} onSub={marcarSubstituicao} onAfastado={marcarAfastado}
          onRealocar={() => {
            const loc = carroDaPessoa(carros, alvo.colabId);
            const carroId = alvo.carroId ?? loc?.carro.id;
            if (carroId) {
              const idAlvo = alvo.colabId;
              setAlvo(null);
              setGerenciar({ carroId, posFoco: null });
              void idAlvo;
            }
          }}
        />
      )}

      {/* ============ MODAL GERENCIAR EQUIPE (Operação: adicionar pessoas) ============ */}
      {gerenciar && (() => {
        const carro = carros.find((c) => c.id === gerenciar.carroId);
        if (!carro) return null;
        return (
          <GerenciarEquipeModal
            carro={carro}
            carros={carros}
            colabs={colabs}
            posFoco={gerenciar.posFoco ?? null}
            onClose={() => setGerenciar(null)}
            onChange={(novos) => setCarros(novos)}
            onCriarColaborador={() => { setGerenciar(null); setEditColab(null); setShowNovoColab(true); }}
          />
        );
      })()}

      {/* ============ MODAL TROCAR UNIDADE (Operação: nome da regional) ============ */}
      {editarUnidadeId && (() => {
        const carro = carros.find((c) => c.id === editarUnidadeId);
        if (!carro) return null;
        return (
          <EditarUnidadeCarroModal
            carro={carro}
            onClose={() => setEditarUnidadeId(null)}
            onSave={(atualizado) => {
              setCarros((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
              setEditarUnidadeId(null);
            }}
          />
        );
      })()}

      {/* ============ MODAL FECHAMENTO ============ */}
      {showFechamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowFechamento(false)}>
          <div className="anim-pop max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">🔒 FECHAMENTO — {toBR(dataSel)}{regionalFiltro !== 'todas' ? ` · ${regionalCurto(regionalFiltro).toUpperCase()}` : ''}</h2>
              <button onClick={() => setShowFechamento(false)} className="btn-ghost !px-3"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-[11px] font-bold text-indigo-500">
              📍 {regionalFiltro === 'todas' ? 'Todas as regionais (consolidado)' : regionalLabel(regionalFiltro)}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {[
                ['Total', ind.totalColaboradores, 'bg-slate-100 dark:bg-slate-800'],
                ['Presentes', `🟢 ${ind.presentes}`, 'bg-emerald-500/10 border border-emerald-500/30'],
                ['Faltas', `🔴 ${ind.faltas}`, 'bg-red-500/10 border border-red-500/30'],
                ['Substituições', `🔵 ${ind.substituicoes}`, 'bg-sky-500/10 border border-sky-500/30'],
                ['Afastados', `🟠 ${ind.afastados}`, 'bg-orange-500/10 border border-orange-500/30'],
                [`Equipes (${ind.totalEquipes})`, `🟢${ind.completas} 🟡${ind.incompletas} 🔴${ind.semEquipe}`, 'bg-slate-100 dark:bg-slate-800'],
                [`Carros (${ind.totalCarros})`, `🚙 ${ind.carrosOperando} oper.`, 'bg-slate-100 dark:bg-slate-800'],
                ['Fechados · 4 pessoas', `✅ ${ind.carrosCom4 ?? 0}`, 'bg-emerald-500/10 border border-emerald-500/30'],
                ['Carros com 3 pessoas', `🚗 ${ind.carrosCom3 ?? 0}`, 'bg-sky-500/10 border border-sky-500/30'],
                ['Carros com 2 pessoas', `🚗 ${ind.carrosCom2 ?? 0}`, 'bg-amber-500/10 border border-amber-500/30'],
              ].map(([k, v, cls]) => (
                <div key={k as string} className={`rounded-2xl p-3 text-center ${cls}`}>
                  <p className="text-[11px] font-bold uppercase text-slate-500">{k}</p>
                  <p className="text-xl font-extrabold">{v}</p>
                </div>
              ))}
            </div>
            <h3 className="mb-2 mt-5 text-sm font-bold">DETALHAMENTO DE FALTAS, SUBSTITUIÇÕES E AFASTADOS</h3>
            <RelatorioTable />
            <div className="mt-5 grid grid-cols-2 gap-2 no-print">
              <button onClick={doExcel} className="btn-primary"><FileSpreadsheet className="h-4 w-4" /> EXPORTAR EXCEL</button>
              <button onClick={doPDF} className="btn-ghost !bg-slate-900 !text-white dark:!bg-white dark:!text-slate-900"><FileText className="h-4 w-4" /> EXPORTAR PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL COLABORADOR (novo/editar) ============ */}
      {showNovoColab && (
        <ColabForm
          initial={editColab} onClose={() => setShowNovoColab(false)}
          onSave={(c) => {
            setColabs((prev) => (editColab ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c]));
            setShowNovoColab(false);
          }}
        />
      )}

      {/* ============ MODAL CARRO / NOVA EQUIPE (novo/editar) ============ */}
      {showNovoCarro && (
        <CarroForm
          initial={editCarro} colabs={colabs} carros={carros} onClose={() => setShowNovoCarro(false)}
          defaultRegional={regionalFiltro !== 'todas' ? regionalFiltro : undefined}
          onSave={(c) => {
            setCarros((prev) => (editCarro ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c]));
            setShowNovoCarro(false);
          }}
        />
      )}

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-400 no-print">
        Sistema de Controle de Faltas 4x4 · {ind.totalCarros} carros · {ind.totalEquipes} equipes · {regionalFiltro === 'todas' ? 'todas as regionais' : regionalLabel(regionalFiltro)} · dados salvos localmente
      </footer>
    </div>
  );

  // ---------- tabela relatório (usa closure) ----------
  function RelatorioTable() {
    if (faltasLista.length === 0) {
      return (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" /> Nenhuma falta em {toBR(dataSel)}{regionalFiltro !== 'todas' ? ` na ${regionalLabel(regionalFiltro)}` : ''}. Todas as equipes completas. 🎉
        </div>
      );
    }
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
            <tr>
              <th className="p-2.5">Colaborador</th><th className="p-2.5">Carro</th><th className="p-2.5">Regional</th><th className="p-2.5">Eq.</th>
              <th className="p-2.5">Situação</th><th className="p-2.5">Substituto</th><th className="p-2.5">Hora</th>
            </tr>
          </thead>
          <tbody>
            {faltasLista.map((f) => {
              const regId = regionalDoCarro(f.carro);
              return (
              <tr key={f.colab.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-2.5 font-semibold">{f.colab.nome}</td>
                <td className="p-2.5">{f.carro.prefixo}</td>
                <td className="p-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${regId === 'ribas' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-sky-500/15 text-sky-600'}`}>
                    {regionalCurto(regId)}
                  </span>
                </td>
                <td className="p-2.5">{f.equipe}</td>
                <td className="p-2.5">
                  <span className={`rounded-full px-2 py-0.5 font-bold text-white ${f.registro.situacao === 'falta' ? 'bg-red-500' : f.registro.situacao === 'afastado' ? 'bg-orange-500' : f.registro.situacao === 'ferias' ? 'bg-violet-500' : 'bg-sky-500'}`}>
                    {situacaoLabel(f.registro.situacao, f.registro.afastadoTipo ?? f.registro.motivo)}
                  </span>
                </td>
                <td className="p-2.5">{f.substituto?.nome ?? '—'}</td>
                <td className="p-2.5">{f.registro.hora}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

// ---------------- Equipe em lista no card (Operação sem visão superior) ----------------
function EquipeLista({ ids, baseIndex = 0, titulo, status, colabs, dia, onPick, onAdd }: {
  ids: [string, string]; baseIndex?: number; titulo: string; status: 'completa' | 'incompleta' | 'sem-equipe';
  colabs: Colaborador[]; dia: BancoRegistros[string] | undefined; onPick: (id: string) => void; onAdd?: (posIndex: number) => void;
}) {
  const equipe = temaEquipe(equipeIdDePosicao(baseIndex));
  return (
    <div className={`rounded-xl border border-transparent p-2 ${equipe.softBg} ${equipe.frame}`}>
      <p className="mb-2 flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${equipe.gradient} px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md ${equipe.gradientShadow}`}>
          <i className="h-1.5 w-1.5 rounded-full bg-white/90" />
          {equipe.id}
        </span>
        <span className={`text-[11px] font-extrabold uppercase tracking-widest ${status === 'completa' ? 'text-emerald-500' : status === 'incompleta' ? 'text-amber-500' : 'text-red-500'}`}>
          {status === 'completa' ? '🟢' : status === 'incompleta' ? '🟡' : '🔴'} {titulo}
        </span>
      </p>
      <div className="space-y-1.5">
        {ids.map((id, k) => {
          const posGlobal = baseIndex + k;
          if (isVago(id)) {
            return (
              <button key={`vago-${posGlobal}`} onClick={() => onAdd?.(posGlobal)}
                title={`${equipe.id} — Adicionar pessoa nesta vaga`}
                className="flex w-full items-center gap-2.5 rounded-xl border-2 border-dashed px-3 py-2 text-left transition-all border-indigo-400/60 bg-indigo-500/10 hover:bg-indigo-500/20">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-500 dark:text-indigo-300">
                  <Plus className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className={`block text-xs font-extrabold uppercase ${equipe.text}`}>+ Adicionar · vaga {posGlobal + 1}</span>
                  <span className="block text-[11px] text-slate-500">{titulo} · {equipe.id} · toque para escalar</span>
                </span>
              </button>
            );
          }
          const c = colabs.find((x) => x.id === id);
          if (!c) return <div key={id} className="w-full rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-2 text-center text-[11px] text-slate-500">vago</div>;
          const r = dia?.[id];
          const s = r?.situacao ?? 'presente';
          const dot = s === 'presente' ? 'bg-emerald-500' : s === 'falta' ? 'bg-red-500' : s === 'afastado' ? 'bg-orange-500' : s === 'ferias' ? 'bg-violet-500' : 'bg-sky-500';
          const sub = r?.substitutoId ? colabs.find((x) => x.id === r.substitutoId) : undefined;
          const nomeExibido = sub?.nome ?? c.nome;
          const selo = s === 'presente' ? '🟢 Presente' : s === 'falta' ? '🔴 Falta' : s === 'afastado' ? `🟠 ${(r?.afastadoTipo ?? r?.motivo ?? 'INSS').toUpperCase()}` : s === 'ferias' ? '🟣 Férias' : '🔵 Substituto';
          return (
            <button key={id} onClick={() => onPick(id)}
              className={`relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border bg-white dark:bg-slate-800/80 px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-px hover:shadow ${s === 'falta' ? 'border-red-500/60' : s === 'substituicao' ? 'border-sky-400/60' : s === 'afastado' ? 'border-orange-400/60' : s === 'ferias' ? 'border-violet-400/60' : equipe.assentoRing}`}>
              <i className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${equipe.gradient}`} aria-hidden="true" />
              <span className="relative shrink-0">
                <Avatar nome={nomeExibido} foto={sub?.foto ?? c.foto} size={38} />
                <i className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-800 ${dot}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">{nomeExibido}</span>
                <span className="block truncate text-[11px] text-slate-500">{c.funcao}{s === 'substituicao' ? ` · no lugar de ${c.nome.split(' ')[0]}` : ''}</span>
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-1 text-[10px] font-extrabold uppercase">{selo}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Modal de situação ----------------
function StatusModal({ colab, carro, dia, disponiveis, onClose, onPresente, onFalta, onSub, onAfastado, onRealocar }: {
  colab: Colaborador; carro?: Carro; dia: BancoRegistros[string] | undefined;
  disponiveis: Colaborador[]; onClose: () => void;
  onPresente: () => void; onFalta: (id: string, motivo: string, obs: string) => void;
  onSub: (id: string, subId: string, motivo: string) => void;
  onAfastado: (id: string, tipo: string, obs: string, inicio?: string, fim?: string) => void;
  onRealocar?: () => void;
}) {
  const [modo, setModo] = useState<'menu' | 'falta' | 'sub' | 'afastado'>('menu');
  const [motivo, setMotivo] = useState('');
  const [obs, setObs] = useState('');
  const [buscaSub, setBuscaSub] = useState('');
  const [tipoAfast, setTipoAfast] = useState<string>('INSS');
  const [afInicio, setAfInicio] = useState('');
  const [afFim, setAfFim] = useState('');
  const reg = dia?.[colab.id];
  const subs = disponiveis.filter((c) => c.id !== colab.id && c.nome.toLowerCase().includes(buscaSub.toLowerCase()));

  const atualLabel = !reg ? '🟢 Presente'
    : reg.situacao === 'falta' ? '🔴 Falta'
    : reg.situacao === 'substituicao' ? '🔵 Substituição'
    : reg.situacao === 'afastado' ? `🟠 ${situacaoLabel('afastado', reg.afastadoTipo ?? reg.motivo)}`
    : reg.situacao === 'ferias' ? '🟣 Férias'
    : '🟢 Presente';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="anim-pop w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3">
          <Avatar nome={colab.nome} foto={colab.foto} size={60} />
          <div className="flex-1">
            <h2 className="font-extrabold leading-tight">{colab.nome}</h2>
            <p className="text-xs text-slate-500">{colab.funcao} · {carro?.prefixo ?? '—'} · {colab.matricula}</p>
            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${(carro ? regionalDoCarro(carro) : (colab.regional ?? 'ribas')) === 'ribas' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'}`}>
              📍 {carro ? regionalLabel(regionalDoCarro(carro)) : regionalLabel(colab.regional ?? 'ribas')}
            </span>
            {reg && <p className="mt-1 text-xs">Atual: <b>{atualLabel}</b> às {reg.hora}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost !px-3"><X className="h-4 w-4" /></button>
        </div>

        {modo === 'menu' && (
          <div className="space-y-2">
            <p className="label">Situação</p>
            <button onClick={onPresente} className="flex w-full items-center gap-3 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-3.5 font-bold transition-all hover:scale-[1.01]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"><UserCheck className="h-5 w-5" /></span>
              🟢 PRESENTE
            </button>
            <button onClick={() => setModo('falta')} className="flex w-full items-center gap-3 rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-3.5 font-bold transition-all hover:scale-[1.01]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white"><UserX className="h-5 w-5" /></span>
              🔴 FALTA
            </button>
            <button onClick={() => setModo('sub')} className="flex w-full items-center gap-3 rounded-2xl border-2 border-sky-500/40 bg-sky-500/10 p-3.5 font-bold transition-all hover:scale-[1.01]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white"><UserPlus className="h-5 w-5" /></span>
              🔵 SUBSTITUIÇÃO
            </button>
            <button onClick={() => { setTipoAfast('INSS'); setModo('afastado'); }} className="flex w-full items-center gap-3 rounded-2xl border-2 border-orange-500/40 bg-orange-500/10 p-3.5 font-bold transition-all hover:scale-[1.01]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white"><Stethoscope className="h-5 w-5" /></span>
              🟠 AFASTADO INSS
            </button>
            {onRealocar && (
              <button onClick={onRealocar} title={`Trocar de equipe — unidade atual: ${carro ? regionalLabel(regionalDoCarro(carro)) : regionalLabel(colab.regional ?? 'ribas')}`} className="flex w-full items-center gap-3 rounded-2xl border-2 border-indigo-500/40 bg-indigo-500/10 p-3.5 font-bold transition-all hover:scale-[1.01]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white"><ArrowLeftRight className="h-5 w-5" /></span>
                <span className="flex-1 text-left">
                  🔀 TROCAR DE UNIDADE / EQUIPE
                  <span className="block text-[11px] font-semibold text-slate-500">
                    📍 {carro ? regionalLabel(regionalDoCarro(carro)) : regionalLabel(colab.regional ?? 'ribas')}{carro ? ` · 🚙 ${carro.prefixo}` : ''}
                  </span>
                </span>
              </button>
            )}
          </div>
        )}

        {modo === 'falta' && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-bold text-red-500"><AlertTriangle className="h-4 w-4" /> Registrar falta de {colab.nome.split(' ')[0]}</p>
            <div>
              <label className="label">Motivo (opcional)</label>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: atestado, sem aviso…" className="input" />
            </div>
            <div>
              <label className="label">Observação (opcional)</label>
              <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observação…" className="input" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModo('menu')} className="btn-ghost flex-1"><ArrowLeft className="h-4 w-4" /> Voltar</button>
              <button onClick={() => onFalta(colab.id, motivo, obs)} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-500">Confirmar falta</button>
            </div>
          </div>
        )}

        {modo === 'sub' && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-sky-500">SUBSTITUIR {colab.nome.toUpperCase()}</p>
            <div>
              <label className="label">Motivo</label>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: falta sem aviso" className="input" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={buscaSub} onChange={(e) => setBuscaSub(e.target.value)} placeholder="Buscar substituto…" className="input !pl-9" />
            </div>
            <div className="max-h-56 space-y-1.5 overflow-y-auto">
              {subs.map((s) => (
                <button key={s.id} onClick={() => onSub(colab.id, s.id, motivo)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 transition-all hover:border-sky-400 hover:bg-sky-500/10">
                  <Avatar nome={s.nome} foto={s.foto} size={38} />
                  <span className="flex-1 text-left text-sm font-semibold">{s.nome}</span>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500">{s.status === 'reserva' ? 'RESERVA' : s.funcao}</span>
                </button>
              ))}
              {subs.length === 0 && <p className="p-3 text-center text-xs text-slate-500">Nenhum colaborador disponível.</p>}
            </div>
            <button onClick={() => setModo('menu')} className="btn-ghost w-full"><ArrowLeft className="h-4 w-4" /> Voltar</button>
          </div>
        )}

        {modo === 'afastado' && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-bold text-orange-500"><Stethoscope className="h-4 w-4" /> Afastar {colab.nome.split(' ')[0]} — INSS</p>
            <div>
              <label className="label">Tipo de afastamento *</label>
              <select value={tipoAfast} onChange={(e) => setTipoAfast(e.target.value)} className="input">
                {MOTIVOS_AFASTAMENTO.map((t) => (
                  <option key={t} value={t}>{t === 'INSS' ? 'INSS (padrão)' : t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Início (opcional)</label>
                <input type="date" value={afInicio} onChange={(e) => setAfInicio(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Previsão retorno (opcional)</label>
                <input type="date" value={afFim} onChange={(e) => setAfFim(e.target.value)} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Observação (opcional)</label>
              <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: atestado entregue, CID…" className="input" />
            </div>
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-600 dark:text-orange-300">
              🟠 O colaborador sai da operação e <b>não conta como falta</b> — entra no indicador <b>Afastados</b> e não pode ser escalado como substituto.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModo('menu')} className="btn-ghost flex-1"><ArrowLeft className="h-4 w-4" /> Voltar</button>
              <button onClick={() => onAfastado(colab.id, tipoAfast, obs, afInicio || undefined, afFim || undefined)} className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-400">Confirmar afastamento</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Aba colaboradores ----------------
function ColaboradoresTab({ colabs, setColabs, carros, setCarros, regionalFiltro, onRegionalChange, onNew, onEdit, dia, dataSel }: {
  colabs: Colaborador[]; setColabs: (fn: (p: Colaborador[]) => Colaborador[]) => void;
  carros: Carro[]; setCarros?: (fn: (p: Carro[]) => Carro[]) => void; regionalFiltro: FiltroRegionalId; onRegionalChange: (v: FiltroRegionalId) => void;
  onNew: () => void; onEdit: (c: Colaborador) => void;
  dia?: BancoRegistros[string]; dataSel?: string;
}) {
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ativo' | 'reserva' | 'inativo' | 'afastado'>('todos');
  const lista = colabs.filter((c) => {
    const reg = dia?.[c.id];
    const isAfast = reg?.situacao === 'afastado' || reg?.situacao === 'ferias';
    if (filtro === 'afastado' && !isAfast) return false;
    if (filtro !== 'todos' && filtro !== 'afastado' && c.status !== filtro) return false;
    return (regionalFiltro === 'todas' || regionalDoColab(c, carros) === regionalFiltro) &&
      (c.nome + c.funcao + c.matricula + c.cpf + regionalLabel(regionalDoColab(c, carros))).toLowerCase().includes(q.toLowerCase());
  });
  const carroDe = (id: string) => carros.find((c) => c.posicoes.includes(id))?.prefixo ?? '—';

  function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const rows = parseColaboradoresCSV(String(rd.result ?? ''));
      if (rows.length === 0) {
        alert('Nada para importar.\nUse o botão "Modelo" — planilha padrão: Regional;Nome;Função');
        return;
      }
      const regionalFallback = regionalFiltro === 'todas' ? null : regionalFiltro;
      setColabs((prev) => {
        const existentes = new Set(prev.map((c) => `${c.nome.trim().toLowerCase()}|${regionalDoColab(c, carros)}`));
        const novos: Colaborador[] = [];
        let ignorados = 0;
        for (const r of rows) {
          // Se a linha veio sem regional (planilha legada), herda o filtro atual; senão usa a regional da linha
          const reg = r.regionalRaw.trim() === '' && regionalFallback ? regionalFallback : r.regional;
          const chave = `${r.nome.trim().toLowerCase()}|${reg}`;
          if (existentes.has(chave)) { ignorados += 1; continue; }
          existentes.add(chave);
          novos.push({
            id: uid('c'), nome: r.nome.trim(), cpf: r.cpf, matricula: r.matricula, funcao: r.funcao,
            foto: '', status: 'reserva' as const, regional: reg,
          });
        }
        const qtdRibas = novos.filter((n) => n.regional === 'ribas').length;
        const qtdAgua = novos.filter((n) => n.regional === 'agua-clara').length;
        queueMicrotask(() => {
          if (novos.length === 0) {
            alert(`Nenhum registro novo — ${ignorados} já existiam (mesmo Nome + Regional).`);
          } else {
            alert(
              `${novos.length} colaboradores importados como RESERVA.\n` +
              `📍 Ribas: ${qtdRibas} · Água Clara: ${qtdAgua}` +
              (ignorados > 0 ? `\n${ignorados} duplicados ignorados.` : '') +
              `\nPlanilha padrão: Regional;Nome;Função`,
            );
          }
        });
        return [...prev, ...novos];
      });
    };
    rd.readAsText(f, 'UTF-8');
    e.target.value = '';
  }

  function modeloExcel() {
    const csv =
      'Regional;Nome;Função\n' +
      'Ribas;João Silva;Auxiliar de Inventário Florestal\n' +
      'Ribas;Pedro Santos;Líder de Inventário Florestal\n' +
      'Água Clara;Maria Souza;Auxiliar de Inventário Florestal\n' +
      'Água Clara;Carlos Lima;Líder de Pesquisa\n';
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modelo-colaboradores-regional-nome-funcao.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="anim-fade-up space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {([
          { id: 'todas' as FiltroRegionalId, label: 'Todas', classe: 'from-indigo-600 to-violet-600' },
          { id: 'ribas' as FiltroRegionalId, label: '📍 Ribas', classe: 'from-emerald-600 to-teal-600' },
          { id: 'agua-clara' as FiltroRegionalId, label: '📍 Água Clara', classe: 'from-sky-600 to-cyan-600' },
        ]).map((op) => {
          const ativo = regionalFiltro === op.id;
          const total = op.id === 'todas' ? colabs.length : colabs.filter((c) => regionalDoColab(c, carros) === op.id).length;
          return (
            <button key={op.id} onClick={() => onRegionalChange(op.id)}
              className={`rounded-2xl px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide transition-all hover:-translate-y-0.5 ${ativo ? `bg-gradient-to-r ${op.classe} text-white shadow-lg` : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:shadow-md'}`}>
              {op.label} · {total}
            </button>
          );
        })}
      </div>
      <div className="glass flex flex-wrap items-center gap-2 rounded-3xl p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar colaborador…" className="input !pl-9" />
        </div>
        {(['todos', 'ativo', 'reserva', 'inativo', 'afastado'] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`rounded-xl px-3 py-2 text-xs font-bold uppercase ${filtro === f ? (f === 'afastado' ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white') : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {f === 'afastado' ? '🟠 afastado' : f} ({f === 'todos' ? colabs.length : f === 'afastado' ? Object.values(dia ?? {}).filter((r) => r.situacao === 'afastado' || r.situacao === 'ferias').length : colabs.filter((c) => c.status === f).length})
          </button>
        ))}
        <label className="btn-ghost cursor-pointer !text-xs" title="Planilha padrão: Regional;Nome;Função — salve o Excel como CSV"><Upload className="h-4 w-4" /> Importar (Regional·Nome·Função)
          <input type="file" accept=".csv,.txt" className="hidden" onChange={importar} />
        </label>
        <button onClick={modeloExcel} className="btn-ghost !text-xs" title="Baixa o modelo Regional;Nome;Função"><Download className="h-4 w-4" /> Modelo Regional·Nome·Função</button>
        <button onClick={onNew} className="btn-primary !text-xs"><Plus className="h-4 w-4" /> Novo</button>
      </div>
      <p className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400">
        📋 Importação corrigida — planilha padrão com 3 colunas: <b>Regional</b> (Ribas | Água Clara) · <b>Nome</b> · <b>Função</b> (Auxiliar de Inventário Florestal | Líder de Inventário Florestal | Líder de Pesquisa). Separe por <b>;</b> e salve o Excel como <b>CSV</b> antes de importar.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((c) => {
          const regId = regionalDoColab(c, carros);
          const regDia = dia?.[c.id];
          const isAfast = regDia?.situacao === 'afastado' || regDia?.situacao === 'ferias';
          return (
          <div key={c.id} className={`glass flex items-center gap-3 rounded-2xl p-3.5 transition-all hover:-translate-y-0.5 ${isAfast ? 'ring-2 ring-orange-500/50' : ''}`}>
            <Avatar nome={c.nome} foto={c.foto} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{c.nome}</p>
              <p className="text-xs text-slate-500">{c.funcao} · {c.matricula} · {carroDe(c.id)}</p>
              <div className="mt-1 flex flex-wrap gap-1">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.status === 'ativo' ? 'bg-emerald-500/15 text-emerald-500' : c.status === 'reserva' ? 'bg-sky-500/15 text-sky-500' : 'bg-slate-500/15 text-slate-500'}`}>
                {c.status === 'reserva' ? 'Disponível p/ substituição' : c.status}
              </span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${regId === 'ribas' ? 'bg-emerald-600/15 text-emerald-600 dark:text-emerald-300' : 'bg-sky-600/15 text-sky-600 dark:text-sky-300'}`}>
                📍 {regionalCurto(regId)}
              </span>
              {isAfast && (
                <span className="inline-block rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase text-orange-600 dark:text-orange-300">
                  🟠 {situacaoLabel(regDia!.situacao, regDia!.afastadoTipo ?? regDia!.motivo)}{dataSel ? ` · ${dataSel.slice(8, 10)}/${dataSel.slice(5, 7)}` : ''}
                </span>
              )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <button onClick={() => onEdit(c)} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 hover:bg-indigo-500 hover:text-white" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => {
                if (!confirm(`Excluir ${c.nome}?`)) return;
                // CORREÇÃO: ao excluir, o lugar vira vaga vazia — não conta mais em nenhuma contagem
                setColabs((p) => p.filter((x) => x.id !== c.id));
                if (setCarros) {
                  setCarros((prev) => prev.map((car) => {
                    if (!car.posicoes.includes(c.id)) return car;
                    return { ...car, posicoes: car.posicoes.map((p) => (p === c.id ? '' : p)) as [string, string, string, string] };
                  }));
                }
              }} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 hover:bg-red-500 hover:text-white" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          );
        })}
      </div>
      {lista.length === 0 && <p className="glass rounded-2xl p-8 text-center text-sm text-slate-500">Nenhum colaborador encontrado.</p>}
    </div>
  );
}

// ---------------- Form colaborador ----------------
function ColabForm({ initial, onClose, onSave }: { initial: Colaborador | null; onClose: () => void; onSave: (c: Colaborador) => void }) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [cpf, setCpf] = useState(initial?.cpf ?? '');
  const [matricula, setMatricula] = useState(initial?.matricula ?? '');
  const [funcao, setFuncao] = useState(initial ? normalizarFuncao(initial.funcao) : 'Auxiliar de Inventário Florestal');
  const [foto, setFoto] = useState(initial?.foto ?? '');
  const [status, setStatus] = useState<Colaborador['status']>(initial?.status ?? 'ativo');
  const [regional, setRegional] = useState<'ribas' | 'agua-clara'>(initial?.regional ?? 'ribas');

  function fotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 600 * 1024) { alert('Foto muito grande (máx 600KB).'); return; }
    const rd = new FileReader();
    rd.onload = () => setFoto(String(rd.result));
    rd.readAsDataURL(f);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="anim-pop w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-extrabold">{initial ? 'Editar colaborador' : 'Novo colaborador'}</h2>
        <div className="mb-4 flex items-center gap-3">
          <Avatar nome={nome || 'Novo'} foto={foto} size={64} />
          <label className="btn-ghost cursor-pointer !text-xs"><Upload className="h-4 w-4" /> Enviar foto
            <input type="file" accept="image/*" className="hidden" onChange={fotoUpload} />
          </label>
          {foto && <button onClick={() => setFoto('')} className="text-xs text-red-500 hover:underline">remover</button>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Nome *</label><input value={nome} onChange={(e) => setNome(e.target.value)} className="input" placeholder="Nome completo" /></div>
          <div><label className="label">CPF</label><input value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))} className="input" placeholder="Somente números" /></div>
          <div><label className="label">Matrícula</label><input value={matricula} onChange={(e) => setMatricula(e.target.value)} className="input" /></div>
          <div><label className="label">Função</label>
            <select value={funcao} onChange={(e) => setFuncao(e.target.value)} className="input">
              {FUNCOES_COLABORADOR.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div><label className="label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Colaborador['status'])} className="input">
              <option value="ativo">Ativo</option><option value="reserva">Disponível p/ substituição</option><option value="inativo">Inativo</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">📍 Regional</label>
            <select value={regional} onChange={(e) => setRegional(e.target.value as 'ribas' | 'agua-clara')} className="input">
              <option value="ribas">Regional de Ribas</option>
              <option value="agua-clara">Regional de Água Clara</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={() => {
              if (!nome.trim()) { alert('Informe o nome.'); return; }
              onSave({ id: initial?.id ?? uid('c'), nome: nome.trim(), cpf: cpf || '00000000000', matricula: matricula || String(Date.now()).slice(-4), funcao: normalizarFuncao(funcao), foto, status, regional });
            }}
            className="btn-primary flex-1">Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Aba carros ----------------
function CarrosTab({ carros, setCarros, colabs, regionalFiltro, onNew, onEdit }: {
  carros: Carro[]; setCarros: (fn: (p: Carro[]) => Carro[]) => void;
  colabs: Colaborador[]; regionalFiltro: FiltroRegionalId; onNew: () => void; onEdit: (c: Carro) => void;
}) {
  const lista = regionalFiltro === 'todas' ? carros : carros.filter((c) => regionalDoCarro(c) === regionalFiltro);
  // CORREÇÃO: conta somente o real — vagas vazias e ids fantasmas não contam como equipe nem como pessoa
  const idsValidos = new Set(colabs.map((c) => c.id));
  const ocupadosValidos = (c: Carro): number => c.posicoes.filter((p) => !isVago(p) && idsValidos.has(p)).length;
  const equipesValidas = (c: Carro): number => {
    const n = ocupadosValidos(c);
    if (n === 0) return 0;
    if (n <= 3) return 1;
    return 2;
  };
  const totalEquipesReais = lista.reduce((s, c) => s + equipesValidas(c), 0);
  const totalOcupados = lista.reduce((s, c) => s + ocupadosValidos(c), 0);
  const totalVagas = lista.reduce((s, c) => s + (c.posicoes.length - ocupadosValidos(c)), 0);
  return (
    <div className="anim-fade-up space-y-4">
      <div className="glass flex flex-wrap items-center justify-between gap-2 rounded-3xl p-4">
        <p className="text-sm font-bold">{lista.length} carros · {totalEquipesReais} equipes · {totalOcupados} pessoas alocadas{totalVagas > 0 ? ` · ${totalVagas} vaga${totalVagas === 1 ? '' : 's'} em aberto` : ' · sem vagas em aberto'}{regionalFiltro !== 'todas' ? ` · ${regionalLabel(regionalFiltro)}` : ''}</p>
        <button onClick={onNew} className="btn-primary !text-xs"><Plus className="h-4 w-4" /> Novo carro</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {lista.map((c) => {
          const regId = regionalDoCarro(c);
          return (
          <div key={c.id} className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-extrabold">🚙 {c.prefixo} <span className="text-xs font-normal text-slate-500">{c.placa} · {c.modelo}</span></p>
              <div className="flex gap-1.5">
                <button onClick={() => onEdit(c)} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 hover:bg-indigo-500 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => { if (confirm(`Excluir ${c.prefixo}?`)) setCarros((p) => p.filter((x) => x.id !== c.id)); }} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 hover:bg-red-500 hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <span className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${regId === 'ribas' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30'}`}>
              📍 {regionalLabel(regId)}
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <p className="mb-1 font-bold text-emerald-500">EQUIPE 01</p>
                {[c.posicoes[0], c.posicoes[1]].map((id) => {
                  const p = colabs.find((x) => x.id === id);
                  return <p key={id} className="truncate">👤 {p?.nome ?? '— vago —'}</p>;
                })}
              </div>
              <div className="rounded-xl bg-indigo-500/10 p-2.5">
                <p className="mb-1 font-bold text-indigo-600 dark:text-indigo-400">EQUIPE 02</p>
                {[c.posicoes[2], c.posicoes[3]].map((id) => {
                  const p = colabs.find((x) => x.id === id);
                  return <p key={id} className="truncate">👤 {p?.nome ?? '— vago —'}</p>;
                })}
              </div>
            </div>
          </div>
          );
        })}
      </div>
      {lista.length === 0 && <p className="glass rounded-2xl p-8 text-center text-sm text-slate-500">Nenhum carro nesta regional.</p>}
    </div>
  );
}

// ---------------- Form carro / Nova equipe ----------------
function CarroForm({ initial, colabs, carros, onClose, onSave, defaultRegional }: {
  initial: Carro | null; colabs: Colaborador[]; carros: Carro[];
  onClose: () => void; onSave: (c: Carro) => void;
  defaultRegional?: 'ribas' | 'agua-clara' | FiltroRegionalId;
}) {
  const regionalInicial = initial?.regional ?? (defaultRegional === 'ribas' || defaultRegional === 'agua-clara' ? defaultRegional : 'ribas');
  const [prefixo, setPrefixo] = useState(initial?.prefixo ?? `4x4-${String(carros.length + 1).padStart(2, '0')}`);
  const [placa, setPlaca] = useState(initial?.placa ?? '');
  const [modelo, setModelo] = useState(initial?.modelo ?? 'Hilux 4x4');
  const [regional, setRegional] = useState<'ribas' | 'agua-clara'>(regionalInicial);
  const [pos, setPos] = useState<[string, string, string, string]>(
    initial?.posicoes ?? (['', '', '', ''] as [string, string, string, string]),
  );

  const isNovaEquipe = !initial;
  const nomeDe = (id: string): string => {
    if (!id) return '— vaga vazia —';
    return colabs.find((c) => c.id === id)?.nome ?? '— removido —';
  };
  const funcaoDe = (id: string): string => colabs.find((c) => c.id === id)?.funcao ?? '';
  const setPosicao = (i: number, v: string) =>
    setPos((p) => { const n = [...p] as [string, string, string, string]; n[i] = v; return n; });
  // CORREÇÃO: lugares vazios ('', null, '   ') nunca contam como pessoa escalada
  const totalEscalados = pos.filter((p) => !isVago(p)).length;
  const eq01Nomes = [pos[0], pos[1]].map(nomeDe);
  const eq02Nomes = [pos[2], pos[3]].map(nomeDe);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="anim-pop max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-0 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-t-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-5 text-white">
          <h2 className="flex items-center gap-2 text-base font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <Plus className="h-5 w-5" />
            </span>
            {initial ? 'Editar carro' : 'Nova equipe · Novo carro 4x4'}
          </h2>
          <p className="mt-1 text-xs text-white/85">
            {isNovaEquipe
              ? 'Cadastre o carro e escale as 2 equipes (EQ01 + EQ02) — os nomes aparecem aqui no ato da criação.'
              : 'Atualize os dados do carro e a composição das equipes — nomes visíveis abaixo.'}
          </p>
        </div>
        <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Prefixo *</label><input value={prefixo} onChange={(e) => setPrefixo(e.target.value)} className="input" placeholder="Ex: 4x4-07" /></div>
          <div><label className="label">Placa</label><input value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} className="input" placeholder="ABC-1234" /></div>
          <div className="col-span-2"><label className="label">Modelo</label>
            <select value={modelo} onChange={(e) => setModelo(e.target.value)} className="input">
              <option>Hilux 4x4</option><option>S10 4x4</option><option>Ranger 4x4</option><option>Triton 4x4</option><option>Frontier 4x4</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">📍 Regional</label>
            <select value={regional} onChange={(e) => setRegional(e.target.value as 'ribas' | 'agua-clara')} className="input">
              <option value="ribas">Regional de Ribas</option>
              <option value="agua-clara">Regional de Água Clara</option>
            </select>
          </div>

          {/* RESUMO COM NOMES — aparece no ato da criação */}
          <div className="col-span-2 grid gap-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.07] p-3 sm:grid-cols-2">
            <div className="rounded-xl bg-indigo-500/10 p-2.5">
              <p className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow">
                EQ01 · Equipe 01
              </p>
              {[0, 1].map((i) => (
                <p key={i} className="flex items-center gap-1.5 truncate py-0.5 text-[13px] font-bold" title={pos[i] ? `${nomeDe(pos[i])} · ${funcaoDe(pos[i])}` : 'Vaga vazia'}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${pos[i] ? 'bg-indigo-500' : 'border border-dashed border-indigo-400 text-indigo-400'}`}>
                    {pos[i] ? initials(nomeDe(pos[i])) : '+'}
                  </span>
                  <span className={`truncate ${pos[i] ? '' : 'font-semibold text-slate-400'}`}>
                    {nomeDe(pos[i])}
                  </span>
                </p>
              ))}
            </div>
            <div className="rounded-xl bg-indigo-500/10 p-2.5">
              <p className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow">
                EQ02 · Equipe 02
              </p>
              {[2, 3].map((i) => (
                <p key={i} className="flex items-center gap-1.5 truncate py-0.5 text-[13px] font-bold" title={pos[i] ? `${nomeDe(pos[i])} · ${funcaoDe(pos[i])}` : 'Vaga vazia'}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${pos[i] ? 'bg-indigo-500' : 'border border-dashed border-indigo-400 text-indigo-400'}`}>
                    {pos[i] ? initials(nomeDe(pos[i])) : '+'}
                  </span>
                  <span className={`truncate ${pos[i] ? '' : 'font-semibold text-slate-400'}`}>
                    {nomeDe(pos[i])}
                  </span>
                </p>
              ))}
            </div>
            <p className="col-span-2 text-center text-[11px] font-semibold text-slate-500">
              {totalEscalados === 0
                ? 'Nenhuma pessoa escalada ainda — escolha os nomes abaixo.'
                : `${totalEscalados} ${totalEscalados === 1 ? 'pessoa escalada' : 'pessoas escaladas'}: ${[...eq01Nomes, ...eq02Nomes].filter((n) => n !== '— vaga vazia —').join(' · ')}`}
            </p>
          </div>

          <p className="col-span-2 mt-1 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Escolha as pessoas pelos nomes</p>
          <div className="col-span-2 grid gap-3 sm:grid-cols-2">
            {(['Pessoa 1 · EQ01', 'Pessoa 2 · EQ01', 'Pessoa 3 · EQ02', 'Pessoa 4 · EQ02'] as const).map((lbl, i) => (
              <SeletorPessoaEquipe
                key={lbl}
                label={lbl}
                value={pos[i]}
                colabs={colabs}
                carros={carros}
                selecionados={pos.filter((p) => !isVago(p))}
                accent="indigo"
                onChange={(v) => setPosicao(i, v)}
              />
            ))}
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={() => {
              if (!prefixo.trim()) { alert('Informe o prefixo.'); return; }
              // CORREÇÃO: filtra vagas vazias antes de validar duplicadas / obrigatoriedade
              const usados = pos.filter((p) => !isVago(p));
              if (new Set(usados).size !== usados.length) { alert('Cada posição deve ter uma pessoa diferente.'); return; }
              if (usados.length === 0) { alert('Adicione ao menos 1 pessoa na equipe. Vagas podem ficar vazias e ser completadas na Operação.'); return; }
              onSave({ id: initial?.id ?? uid('car'), prefixo: prefixo.trim(), placa: placa || '—', modelo, posicoes: pos, status: 'operando', regional });
            }}
            className="btn-primary flex-1">{isNovaEquipe ? `Criar equipe${totalEscalados > 0 ? ` (${totalEscalados})` : ''}` : 'Salvar carro'}</button>
        </div>
        </div>
      </div>
    </div>
  );
}
