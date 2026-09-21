import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, BarChart3, CalendarDays, Car as CarIcon, CheckCircle2, ClipboardList,
  Download, FileSpreadsheet, FileText, History, Moon, Plus, RefreshCw, Search, Sun, Trash2,
  Truck, Trophy, Upload, UserCheck, UserPlus, Users, UserX, X, Pencil, Lock, Rocket,
} from 'lucide-react';
import IndicadoresTab from './components/IndicadoresTab';
import PublicarTab from './components/PublicarTab';
import type { BancoRegistros, Carro, Colaborador, Registro } from './types';
import { MOCK_CARROS, MOCK_COLABORADORES, mockHistorico } from './mock';
import {
  calcIndicadores, exportarExcel, exportarPDF, historicoFaltas, initials, listaFaltas,
  loadLS, nowHM, parseColaboradoresCSV, saveLS, situacaoDe, statusCarro, statusEquipe,
  titulares, toBR, todayKey, uid,
} from './utils';

type Tab = 'operacao' | 'colaboradores' | 'carros' | 'historico' | 'indicadores' | 'publicar';

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

// ---------------- Assento (posição do carro) ----------------
function Seat({
  colab, equipe, situacao, substituto, onClick, grande = false,
}: {
  colab: Colaborador; equipe: string; situacao: 'presente' | 'falta' | 'substituicao';
  substituto?: Colaborador; onClick: () => void; grande?: boolean;
}) {
  const visivel = situacao === 'substituicao' && substituto ? substituto : colab;
  const border =
    situacao === 'presente'
      ? 'border-emerald-400/70 shadow-emerald-500/20'
      : situacao === 'falta'
        ? 'border-red-500 shadow-red-500/30 falta-pulse'
        : 'border-sky-400 shadow-sky-500/30';
  const badge =
    situacao === 'presente' ? 'bg-emerald-500' : situacao === 'falta' ? 'bg-red-500' : 'bg-sky-500';
  const label = situacao === 'presente' ? 'PRESENTE' : situacao === 'falta' ? 'FALTA' : 'SUBSTITUTO';
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-slate-800/80 p-3 shadow-lg backdrop-blur transition-all hover:scale-[1.03] hover:bg-slate-700/80 ${border} ${grande ? 'min-w-[150px] py-4' : 'min-w-[118px]'}`}
    >
      <span className={`absolute -top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${badge}`}>
        {label}
      </span>
      <div className="mt-1.5">
        <Avatar nome={visivel.nome} foto={visivel.foto} size={grande ? 72 : 56} />
      </div>
      <span className="max-w-[130px] truncate text-xs font-bold text-white">{visivel.nome}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{equipe}</span>
      {situacao === 'substituicao' && (
        <span className="max-w-[130px] truncate text-[10px] text-sky-300">no lugar de {colab.nome.split(' ')[0]}</span>
      )}
      {situacao === 'falta' && <span className="text-[10px] font-bold text-red-300">🔴 faltou</span>}
    </button>
  );
}

// ================= APP =================
export default function App() {
  const [colabs, setColabs] = useState<Colaborador[]>(() => loadLS('f44_colabs', MOCK_COLABORADORES));
  const [carros, setCarros] = useState<Carro[]>(() => loadLS('f44_carros', MOCK_CARROS));
  const [registros, setRegistros] = useState<BancoRegistros>(() => {
    const saved = loadLS<BancoRegistros>('f44_regs', {});
    if (Object.keys(saved).length > 0) return saved;
    return mockHistorico();
  });
  const [dataSel, setDataSel] = useState<string>(() => loadLS('f44_data', todayKey()));
  const [dark, setDark] = useState<boolean>(() => loadLS('f44_theme', true));
  const [tab, setTab] = useState<Tab>('operacao');
  const [busca, setBusca] = useState('');
  const [carroAberto, setCarroAberto] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<{ carroId: string; colabId: string } | null>(null);
  const [responsavel, setResponsavel] = useState(() => loadLS('f44_resp', 'Gestor'));
  const [showFechamento, setShowFechamento] = useState(false);
  const [showNovoColab, setShowNovoColab] = useState(false);
  const [editColab, setEditColab] = useState<Colaborador | null>(null);
  const [showNovoCarro, setShowNovoCarro] = useState(false);
  const [editCarro, setEditCarro] = useState<Carro | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    saveLS('f44_theme', dark);
  }, [dark]);
  useEffect(() => saveLS('f44_colabs', colabs), [colabs]);
  useEffect(() => saveLS('f44_carros', carros), [carros]);
  useEffect(() => saveLS('f44_regs', registros), [registros]);
  useEffect(() => saveLS('f44_data', dataSel), [dataSel]);
  useEffect(() => saveLS('f44_resp', responsavel), [responsavel]);

  const dia = registros[dataSel];
  const ind = useMemo(() => calcIndicadores(colabs, carros, dia), [colabs, carros, dia]);
  const faltasLista = useMemo(() => listaFaltas(colabs, carros, dia), [colabs, carros, dia]);
  const hist = useMemo(() => historicoFaltas(registros), [registros]);
  const maxHist = Math.max(1, ...hist.map((h) => h.faltas));

  const colabById = (id: string) => colabs.find((c) => c.id === id);
  const disponiveis = useMemo(() => {
    const emUso = new Set(titulares(carros));
    const alvoId = alvo?.colabId;
    return colabs.filter((c) => c.status !== 'inativo' && (!emUso.has(c.id) || c.id === alvoId || c.status === 'reserva'));
  }, [colabs, carros, alvo]);

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

  function resetDemo() {
    if (!confirm('Restaurar dados de demonstração?')) return;
    setColabs(MOCK_COLABORADORES);
    setCarros(MOCK_CARROS);
    setRegistros(mockHistorico());
    setDataSel(todayKey());
  }

  // ---------- exportações ----------
  function linhasDetalhe() {
    const rows: Array<{ data: string; carro: string; equipe: string; colaborador: string; funcao: string; situacao: string; substituto: string; hora: string }> = [];
    for (const carro of carros) {
      carro.posicoes.forEach((id, idx) => {
        const c = colabById(id);
        if (!c) return;
        const r = dia?.[id];
        const sit = !r ? 'Presente' : r.situacao === 'presente' ? 'Presente' : r.situacao === 'falta' ? 'Falta' : 'Substituição';
        const sub = r?.substitutoId ? colabById(r.substitutoId)?.nome ?? '' : '';
        rows.push({
          data: toBR(dataSel), carro: `${carro.prefixo} (${carro.placa})`, equipe: idx < 2 ? 'EQ01' : 'EQ02',
          colaborador: c.nome, funcao: c.funcao, situacao: sit, substituto: sub, hora: r?.hora ?? '—',
        });
      });
    }
    return rows;
  }
  const doExcel = () => exportarExcel(dataSel, ind, linhasDetalhe());
  const doPDF = () =>
    exportarPDF(dataSel, ind, faltasLista.map((f) => ({
      colaborador: f.colab.nome, funcao: f.colab.funcao, carro: f.carro.prefixo,
      equipe: f.equipe, situacao: f.registro.situacao === 'falta' ? 'Falta' : 'Substituição',
      substituto: f.substituto?.nome ?? '—',
    })));

  const carrosFiltrados = carros.filter((c) =>
    (c.prefixo + c.placa + c.modelo).toLowerCase().includes(busca.toLowerCase()),
  );
  const carroModal = carros.find((c) => c.id === carroAberto);
  const alvoColab = alvo ? colabById(alvo.colabId) : undefined;
  const alvoCarro = alvo ? carros.find((c) => c.id === alvo.carroId) : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/40 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl no-print">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/30">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight sm:text-lg">CONTROLE DE FALTAS 4x4</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Presença · Faltas · Substituições · Equipes</p>
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
            { k: 'publicar', label: 'Publicar', icon: Rocket },
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
        {/* ============ OPERAÇÃO ============ */}
        {tab === 'operacao' && (
          <div className="anim-fade-up space-y-6">
            {/* Indicadores principais */}
            <div className="grid grid-cols-3 gap-3">
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
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="card-stat">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-indigo-500" /> COLABORADORES</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3">👥 Total <b className="float-right">{ind.totalColaboradores}</b></div>
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">🟢 Presentes <b className="float-right text-emerald-500">{ind.presentes}</b></div>
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">🔴 Faltas <b className="float-right text-red-500">{ind.faltas}</b></div>
                  <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 p-3">🔵 Substituições <b className="float-right text-sky-500">{ind.substituicoes}</b></div>
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
                <button onClick={() => setShowFechamento(true)} className="btn-primary mt-3 w-full">
                  <Lock className="h-4 w-4" /> FECHAR DIA · EXPORTAR
                </button>
              </div>
            </div>

            {/* Busca */}
            <div className="relative no-print">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar carro por prefixo, placa ou modelo…"
                className="input !pl-10 !py-3 !rounded-2xl glass" />
            </div>

            {/* Grade de carros */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {carrosFiltrados.map((carro, i) => {
                const st = statusCarro(carro, dia);
                const eq1 = statusEquipe(carro.posicoes[0], carro.posicoes[1], dia);
                const eq2 = statusEquipe(carro.posicoes[2], carro.posicoes[3], dia);
                return (
                  <div key={carro.id} className="glass anim-fade-up rounded-3xl p-4" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                          <CarIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-extrabold leading-tight">🚙 {carro.prefixo}</p>
                          <p className="text-xs text-slate-500">{carro.placa} · {carro.modelo}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${st.classe === 'ok' ? 'bg-emerald-500/15 text-emerald-500' : st.classe === 'warn' ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'}`}>
                        {st.classe === 'ok' ? '🟢' : st.classe === 'warn' ? '🟡' : '🔴'} {st.presentes}/4
                      </span>
                    </div>
                    {/* mini visão superior */}
                    <div className="car-body rounded-2xl p-3">
                      <p className="mb-2 text-center text-[10px] font-bold tracking-[0.3em] text-slate-400">FRENTE</p>
                      <MiniEquipe carroId={carro.id} ids={[carro.posicoes[0], carro.posicoes[1]]} eq="EQ 01" ok={eq1}
                        colabs={colabs} dia={dia} onPick={(id) => setAlvo({ carroId: carro.id, colabId: id })} />
                      <div className="my-2 border-t border-dashed border-slate-600" />
                      <MiniEquipe carroId={carro.id} ids={[carro.posicoes[2], carro.posicoes[3]]} eq="EQ 02" ok={eq2}
                        colabs={colabs} dia={dia} onPick={(id) => setAlvo({ carroId: carro.id, colabId: id })} />
                      <p className="mt-2 text-center text-[10px] font-bold tracking-[0.3em] text-slate-400">TRASEIRA</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">STATUS: {st.label.toUpperCase()}</span>
                      <button onClick={() => setCarroAberto(carro.id)} className="btn-ghost !py-1.5 !text-xs">
                        Visão superior ⤢
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {carrosFiltrados.length === 0 && (
              <p className="glass rounded-2xl p-8 text-center text-sm text-slate-500">Nenhum carro encontrado. Ajuste a busca ou cadastre um carro.</p>
            )}
          </div>
        )}

        {/* ============ COLABORADORES ============ */}
        {tab === 'colaboradores' && (
          <ColaboradoresTab
            colabs={colabs} setColabs={setColabs} carros={carros}
            onNew={() => { setEditColab(null); setShowNovoColab(true); }}
            onEdit={(c) => { setEditColab(c); setShowNovoColab(true); }}
          />
        )}

        {/* ============ CARROS ============ */}
        {tab === 'carros' && (
          <CarrosTab
            carros={carros} setCarros={setCarros} colabs={colabs}
            onNew={() => { setEditCarro(null); setShowNovoCarro(true); }}
            onEdit={(c) => { setEditCarro(c); setShowNovoCarro(true); }}
          />
        )}

        {/* ============ HISTÓRICO ============ */}
        {tab === 'historico' && (
          <div className="anim-fade-up space-y-4">
            <div className="glass rounded-3xl p-5">
              <h3 className="mb-1 flex items-center gap-2 font-bold"><BarChart3 className="h-5 w-5 text-indigo-500" /> FALTAS POR DIA</h3>
              <p className="mb-4 text-xs text-slate-500">Clique em um dia para carregar os registros.</p>
              <div className="flex items-end gap-2 overflow-x-auto pb-2">
                {hist.map((h) => (
                  <button
                    key={h.data}
                    onClick={() => { setDataSel(h.data); setTab('operacao'); }}
                    className={`flex min-w-[76px] flex-1 flex-col items-center gap-1.5 rounded-2xl p-3 transition-all hover:scale-105 ${h.data === dataSel ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    <span className="text-[10px] font-bold">{toBR(h.data).slice(0, 5)}</span>
                    <div className="flex h-24 w-full items-end justify-center gap-1">
                      <div className="w-5 rounded-t-md bg-gradient-to-t from-red-600 to-red-400 transition-all" style={{ height: `${Math.max(6, (h.faltas / maxHist) * 90)}px` }} title={`${h.faltas} faltas`} />
                      <div className="w-5 rounded-t-md bg-gradient-to-t from-sky-600 to-sky-400 transition-all" style={{ height: `${Math.max(6, (h.subs / Math.max(1, maxHist)) * 90)}px` }} title={`${h.subs} subs`} />
                    </div>
                    <span className="text-xs font-extrabold">🔴{h.faltas} 🔵{h.subs}</span>
                  </button>
                ))}
                {hist.length === 0 && <p className="text-sm text-slate-500">Sem histórico ainda.</p>}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-slate-500">
                <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-red-500" /> Faltas</span>
                <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-sky-500" /> Substituições</span>
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
            onVerDia={(data) => { setDataSel(data); setTab('operacao'); }}
          />
        )}

        {/* ============ PUBLICAR ============ */}
        {tab === 'publicar' && <PublicarTab />}
      </main>

      {/* ============ MODAL VISÃO SUPERIOR ============ */}
      {carroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setCarroAberto(null)}>
          <div className="anim-pop w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 p-4 text-white">
              <div>
                <p className="font-extrabold">🚙 {carroModal.prefixo} — visão superior</p>
                <p className="text-xs opacity-70">{carroModal.placa} · {carroModal.modelo} · clique em um colaborador</p>
              </div>
              <button onClick={() => setCarroAberto(null)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X className="h-5 w-5" /></button>
            </div>
            <div className="car-body p-6">
              <p className="mb-3 text-center text-xs font-bold tracking-[0.4em] text-slate-300">▲ FRENTE</p>
              <div className="rounded-2xl border border-slate-600/60 bg-slate-900/60 p-3">
                <p className="mb-2 text-center text-[11px] font-bold text-emerald-300">EQUIPE 01</p>
                <div className="flex justify-center gap-4">
                  {([0, 1] as const).map((i) => {
                    const id = carroModal.posicoes[i];
                    const c = colabById(id);
                    if (!c) return null;
                    const s = situacaoDe(id, dia);
                    const sub = dia?.[id]?.substitutoId ? colabById(dia![id].substitutoId!) : undefined;
                    return <Seat key={id} colab={c} equipe="EQUIPE 01" situacao={s} substituto={sub} grande onClick={() => { setCarroAberto(null); setAlvo({ carroId: carroModal.id, colabId: id }); }} />;
                  })}
                </div>
              </div>
              <div className="mx-auto my-3 h-1 w-2/3 rounded bg-slate-600/60" />
              <div className="rounded-2xl border border-slate-600/60 bg-slate-900/60 p-3">
                <p className="mb-2 text-center text-[11px] font-bold text-violet-300">EQUIPE 02</p>
                <div className="flex justify-center gap-4">
                  {([2, 3] as const).map((i) => {
                    const id = carroModal.posicoes[i];
                    const c = colabById(id);
                    if (!c) return null;
                    const s = situacaoDe(id, dia);
                    const sub = dia?.[id]?.substitutoId ? colabById(dia![id].substitutoId!) : undefined;
                    return <Seat key={id} colab={c} equipe="EQUIPE 02" situacao={s} substituto={sub} grande onClick={() => { setCarroAberto(null); setAlvo({ carroId: carroModal.id, colabId: id }); }} />;
                  })}
                </div>
              </div>
              <p className="mt-3 text-center text-xs font-bold tracking-[0.4em] text-slate-300">▼ TRASEIRA</p>
            </div>
            <div className="flex items-center justify-between p-4 text-xs text-slate-500">
              <button onClick={() => setCarroAberto(null)} className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Voltar</button>
              <span>FRENTE ↑ · posições 1-2 = EQ01 · 3-4 = EQ02</span>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL SITUAÇÃO ============ */}
      {alvo && alvoColab && (
        <StatusModal
          colab={alvoColab} carro={alvoCarro} dia={dia} disponiveis={disponiveis}
          onClose={() => setAlvo(null)} onPresente={() => marcarPresente(alvo.colabId)}
          onFalta={marcarFalta} onSub={marcarSubstituicao}
        />
      )}

      {/* ============ MODAL FECHAMENTO ============ */}
      {showFechamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowFechamento(false)}>
          <div className="anim-pop max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">🔒 FECHAMENTO — {toBR(dataSel)}</h2>
              <button onClick={() => setShowFechamento(false)} className="btn-ghost !px-3"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {[
                ['Total', ind.totalColaboradores, 'bg-slate-100 dark:bg-slate-800'],
                ['Presentes', `🟢 ${ind.presentes}`, 'bg-emerald-500/10 border border-emerald-500/30'],
                ['Faltas', `🔴 ${ind.faltas}`, 'bg-red-500/10 border border-red-500/30'],
                ['Substituições', `🔵 ${ind.substituicoes}`, 'bg-sky-500/10 border border-sky-500/30'],
                [`Equipes (${ind.totalEquipes})`, `🟢${ind.completas} 🟡${ind.incompletas} 🔴${ind.semEquipe}`, 'bg-slate-100 dark:bg-slate-800'],
                [`Carros (${ind.totalCarros})`, `🚙 ${ind.carrosOperando} oper.`, 'bg-slate-100 dark:bg-slate-800'],
              ].map(([k, v, cls]) => (
                <div key={k as string} className={`rounded-2xl p-3 text-center ${cls}`}>
                  <p className="text-[11px] font-bold uppercase text-slate-500">{k}</p>
                  <p className="text-xl font-extrabold">{v}</p>
                </div>
              ))}
            </div>
            <h3 className="mb-2 mt-5 text-sm font-bold">DETALHAMENTO DE FALTAS E SUBSTITUIÇÕES</h3>
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

      {/* ============ MODAL CARRO (novo/editar) ============ */}
      {showNovoCarro && (
        <CarroForm
          initial={editCarro} colabs={colabs} carros={carros} onClose={() => setShowNovoCarro(false)}
          onSave={(c) => {
            setCarros((prev) => (editCarro ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c]));
            setShowNovoCarro(false);
          }}
        />
      )}

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-400 no-print">
        Sistema de Controle de Faltas 4x4 · {ind.totalCarros} carros · {ind.totalEquipes} equipes · dados salvos localmente
      </footer>
    </div>
  );

  // ---------- tabela relatório (usa closure) ----------
  function RelatorioTable() {
    if (faltasLista.length === 0) {
      return (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" /> Nenhuma falta em {toBR(dataSel)}. Todas as equipes completas. 🎉
        </div>
      );
    }
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
            <tr>
              <th className="p-2.5">Colaborador</th><th className="p-2.5">Carro</th><th className="p-2.5">Eq.</th>
              <th className="p-2.5">Situação</th><th className="p-2.5">Substituto</th><th className="p-2.5">Hora</th>
            </tr>
          </thead>
          <tbody>
            {faltasLista.map((f) => (
              <tr key={f.colab.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-2.5 font-semibold">{f.colab.nome}</td>
                <td className="p-2.5">{f.carro.prefixo}</td>
                <td className="p-2.5">{f.equipe}</td>
                <td className="p-2.5">
                  <span className={`rounded-full px-2 py-0.5 font-bold text-white ${f.registro.situacao === 'falta' ? 'bg-red-500' : 'bg-sky-500'}`}>
                    {f.registro.situacao === 'falta' ? 'Falta' : 'Subst.'}
                  </span>
                </td>
                <td className="p-2.5">{f.substituto?.nome ?? '—'}</td>
                <td className="p-2.5">{f.registro.hora}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

// ---------------- Mini equipe no card ----------------
function MiniEquipe({ ids, eq, ok, colabs, dia, onPick }: {
  carroId?: string; ids: [string, string]; eq: string; ok: 'completa' | 'incompleta' | 'sem-equipe';
  colabs: Colaborador[]; dia: BancoRegistros[string] | undefined; onPick: (id: string) => void;
}) {
  return (
    <div>
      <p className={`mb-1.5 text-center text-[10px] font-bold ${ok === 'completa' ? 'text-emerald-300' : ok === 'incompleta' ? 'text-amber-300' : 'text-red-300'}`}>
        {ok === 'completa' ? '🟢' : ok === 'incompleta' ? '🟡' : '🔴'} {eq}
      </p>
      <div className="flex justify-center gap-2">
        {ids.map((id) => {
          const c = colabs.find((x) => x.id === id);
          if (!c) return <div key={id} className="w-[86px] rounded-xl border border-dashed border-slate-600 p-2 text-center text-[10px] text-slate-500">vago</div>;
          const r = dia?.[id];
          const s = r?.situacao ?? 'presente';
          const dot = s === 'presente' ? 'bg-emerald-500' : s === 'falta' ? 'bg-red-500' : 'bg-sky-500';
          const sub = r?.substitutoId ? colabs.find((x) => x.id === r.substitutoId) : undefined;
          return (
            <button key={id} onClick={() => onPick(id)}
              className={`flex w-[86px] flex-col items-center gap-1 rounded-xl border bg-slate-900/70 p-2 transition-all hover:scale-105 ${s === 'falta' ? 'border-red-500/70' : s === 'substituicao' ? 'border-sky-400/70' : 'border-slate-600/60'}`}>
              <span className="relative">
                <Avatar nome={sub?.nome ?? c.nome} foto={sub?.foto ?? c.foto} size={40} />
                <i className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${dot}`} />
              </span>
              <span className="w-full truncate text-[10px] font-bold text-white">{(sub?.nome ?? c.nome).split(' ').slice(0, 2).join(' ')}</span>
              {s === 'substituicao' && <span className="text-[9px] font-bold text-sky-300">SUB</span>}
              {s === 'falta' && <span className="text-[9px] font-bold text-red-300">FALTA</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Modal de situação ----------------
function StatusModal({ colab, carro, dia, disponiveis, onClose, onPresente, onFalta, onSub }: {
  colab: Colaborador; carro?: Carro; dia: BancoRegistros[string] | undefined;
  disponiveis: Colaborador[]; onClose: () => void;
  onPresente: () => void; onFalta: (id: string, motivo: string, obs: string) => void;
  onSub: (id: string, subId: string, motivo: string) => void;
}) {
  const [modo, setModo] = useState<'menu' | 'falta' | 'sub'>('menu');
  const [motivo, setMotivo] = useState('');
  const [obs, setObs] = useState('');
  const [buscaSub, setBuscaSub] = useState('');
  const reg = dia?.[colab.id];
  const subs = disponiveis.filter((c) => c.id !== colab.id && c.nome.toLowerCase().includes(buscaSub.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="anim-pop w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3">
          <Avatar nome={colab.nome} foto={colab.foto} size={60} />
          <div className="flex-1">
            <h2 className="font-extrabold leading-tight">{colab.nome}</h2>
            <p className="text-xs text-slate-500">{colab.funcao} · {carro?.prefixo ?? '—'} · {colab.matricula}</p>
            {reg && <p className="mt-1 text-xs">Atual: <b>{reg.situacao === 'falta' ? '🔴 Falta' : reg.situacao === 'substituicao' ? '🔵 Substituição' : '🟢 Presente'}</b> às {reg.hora}</p>}
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
      </div>
    </div>
  );
}

// ---------------- Aba colaboradores ----------------
function ColaboradoresTab({ colabs, setColabs, carros, onNew, onEdit }: {
  colabs: Colaborador[]; setColabs: (fn: (p: Colaborador[]) => Colaborador[]) => void;
  carros: Carro[]; onNew: () => void; onEdit: (c: Colaborador) => void;
}) {
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ativo' | 'reserva' | 'inativo'>('todos');
  const lista = colabs.filter((c) =>
    (filtro === 'todos' || c.status === filtro) &&
    (c.nome + c.funcao + c.matricula + c.cpf).toLowerCase().includes(q.toLowerCase()),
  );
  const carroDe = (id: string) => carros.find((c) => c.posicoes.includes(id))?.prefixo ?? '—';

  function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const rows = parseColaboradoresCSV(String(rd.result ?? ''));
      if (rows.length === 0) { alert('Nada para importar.'); return; }
      const novos: Colaborador[] = rows.map((r) => ({
        id: uid('c'), nome: r.nome, cpf: r.cpf, matricula: r.matricula, funcao: r.funcao,
        foto: '', status: 'reserva' as const,
      }));
      setColabs((prev) => [...prev, ...novos]);
      alert(`${novos.length} colaboradores importados como RESERVA.`);
    };
    rd.readAsText(f);
    e.target.value = '';
  }

  function modeloExcel() {
    const csv = 'Nome;CPF;Função;Matrícula\nJoão Silva;00000000000;Auxiliar;1001\nPedro Santos;00000000000;Auxiliar;1002\n';
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modelo-colaboradores.csv';
    a.click();
  }

  return (
    <div className="anim-fade-up space-y-4">
      <div className="glass flex flex-wrap items-center gap-2 rounded-3xl p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar colaborador…" className="input !pl-9" />
        </div>
        {(['todos', 'ativo', 'reserva', 'inativo'] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`rounded-xl px-3 py-2 text-xs font-bold uppercase ${filtro === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {f} ({f === 'todos' ? colabs.length : colabs.filter((c) => c.status === f).length})
          </button>
        ))}
        <label className="btn-ghost cursor-pointer !text-xs"><Upload className="h-4 w-4" /> Importar Excel/CSV
          <input type="file" accept=".csv,.txt" className="hidden" onChange={importar} />
        </label>
        <button onClick={modeloExcel} className="btn-ghost !text-xs"><Download className="h-4 w-4" /> Modelo</button>
        <button onClick={onNew} className="btn-primary !text-xs"><Plus className="h-4 w-4" /> Novo</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((c) => (
          <div key={c.id} className="glass flex items-center gap-3 rounded-2xl p-3.5 transition-all hover:-translate-y-0.5">
            <Avatar nome={c.nome} foto={c.foto} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{c.nome}</p>
              <p className="text-xs text-slate-500">{c.funcao} · {c.matricula} · {carroDe(c.id)}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.status === 'ativo' ? 'bg-emerald-500/15 text-emerald-500' : c.status === 'reserva' ? 'bg-sky-500/15 text-sky-500' : 'bg-slate-500/15 text-slate-500'}`}>
                {c.status === 'reserva' ? 'Disponível p/ substituição' : c.status}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <button onClick={() => onEdit(c)} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 hover:bg-indigo-500 hover:text-white" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => { if (confirm(`Excluir ${c.nome}?`)) setColabs((p) => p.filter((x) => x.id !== c.id)); }} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 hover:bg-red-500 hover:text-white" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
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
  const [funcao, setFuncao] = useState(initial?.funcao ?? 'Auxiliar');
  const [foto, setFoto] = useState(initial?.foto ?? '');
  const [status, setStatus] = useState<Colaborador['status']>(initial?.status ?? 'ativo');

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
              <option>Auxiliar</option><option>Motorista</option><option>Líder de Equipe</option><option>Operador</option>
            </select>
          </div>
          <div><label className="label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Colaborador['status'])} className="input">
              <option value="ativo">Ativo</option><option value="reserva">Disponível p/ substituição</option><option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={() => {
              if (!nome.trim()) { alert('Informe o nome.'); return; }
              onSave({ id: initial?.id ?? uid('c'), nome: nome.trim(), cpf: cpf || '00000000000', matricula: matricula || String(Date.now()).slice(-4), funcao, foto, status });
            }}
            className="btn-primary flex-1">Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Aba carros ----------------
function CarrosTab({ carros, setCarros, colabs, onNew, onEdit }: {
  carros: Carro[]; setCarros: (fn: (p: Carro[]) => Carro[]) => void;
  colabs: Colaborador[]; onNew: () => void; onEdit: (c: Carro) => void;
}) {
  return (
    <div className="anim-fade-up space-y-4">
      <div className="glass flex items-center justify-between rounded-3xl p-4">
        <p className="text-sm font-bold">{carros.length} carros · {carros.length * 2} equipes · {carros.length * 4} posições</p>
        <button onClick={onNew} className="btn-primary !text-xs"><Plus className="h-4 w-4" /> Novo carro</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {carros.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-extrabold">🚙 {c.prefixo} <span className="text-xs font-normal text-slate-500">{c.placa} · {c.modelo}</span></p>
              <div className="flex gap-1.5">
                <button onClick={() => onEdit(c)} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 hover:bg-indigo-500 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => { if (confirm(`Excluir ${c.prefixo}?`)) setCarros((p) => p.filter((x) => x.id !== c.id)); }} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 hover:bg-red-500 hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <p className="mb-1 font-bold text-emerald-500">EQUIPE 01</p>
                {[c.posicoes[0], c.posicoes[1]].map((id) => {
                  const p = colabs.find((x) => x.id === id);
                  return <p key={id} className="truncate">👤 {p?.nome ?? '— vago —'}</p>;
                })}
              </div>
              <div className="rounded-xl bg-violet-500/10 p-2.5">
                <p className="mb-1 font-bold text-violet-500">EQUIPE 02</p>
                {[c.posicoes[2], c.posicoes[3]].map((id) => {
                  const p = colabs.find((x) => x.id === id);
                  return <p key={id} className="truncate">👤 {p?.nome ?? '— vago —'}</p>;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Form carro ----------------
function CarroForm({ initial, colabs, carros, onClose, onSave }: {
  initial: Carro | null; colabs: Colaborador[]; carros: Carro[];
  onClose: () => void; onSave: (c: Carro) => void;
}) {
  const [prefixo, setPrefixo] = useState(initial?.prefixo ?? `4x4-${String(carros.length + 1).padStart(2, '0')}`);
  const [placa, setPlaca] = useState(initial?.placa ?? '');
  const [modelo, setModelo] = useState(initial?.modelo ?? 'Hilux 4x4');
  const [pos, setPos] = useState<[string, string, string, string]>(
    initial?.posicoes ?? (['', '', '', ''] as [string, string, string, string]),
  );
  const ativos = colabs.filter((c) => c.status === 'ativo');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="anim-pop max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-extrabold">{initial ? 'Editar carro' : 'Novo carro 4x4'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Prefixo *</label><input value={prefixo} onChange={(e) => setPrefixo(e.target.value)} className="input" /></div>
          <div><label className="label">Placa</label><input value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} className="input" placeholder="ABC-1234" /></div>
          <div className="col-span-2"><label className="label">Modelo</label>
            <select value={modelo} onChange={(e) => setModelo(e.target.value)} className="input">
              <option>Hilux 4x4</option><option>S10 4x4</option><option>Ranger 4x4</option><option>Triton 4x4</option><option>Frontier 4x4</option>
            </select>
          </div>
          {(['Pessoa 1 · EQ01', 'Pessoa 2 · EQ01', 'Pessoa 3 · EQ02', 'Pessoa 4 · EQ02'] as const).map((lbl, i) => (
            <div key={lbl} className={i < 2 ? '' : ''}>
              <label className="label">{lbl}</label>
              <select value={pos[i]} onChange={(e) => setPos((p) => { const n = [...p] as [string, string, string, string]; n[i] = e.target.value; return n; })} className="input">
                <option value="">— vago —</option>
                {ativos.map((c) => <option key={c.id} value={c.id}>{c.nome} ({c.matricula})</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={() => {
              if (!prefixo.trim()) { alert('Informe o prefixo.'); return; }
              if (pos.some((p) => !p)) { alert('Preencha as 4 posições (1 carro = 4 pessoas = 2 equipes).'); return; }
              const usados = pos.filter(Boolean);
              if (new Set(usados).size !== 4) { alert('Cada posição deve ter uma pessoa diferente.'); return; }
              onSave({ id: initial?.id ?? uid('car'), prefixo: prefixo.trim(), placa: placa || '—', modelo, posicoes: pos, status: 'operando' });
            }}
            className="btn-primary flex-1">Salvar carro</button>
        </div>
      </div>
    </div>
  );
}
