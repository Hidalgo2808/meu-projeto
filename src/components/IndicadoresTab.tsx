import { useMemo, useState } from 'react';
import {
  Award,
  Car as CarIcon,
  Crown,
  Download,
  Filter,
  MapPin,
  Medal,
  Search,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Users,
} from 'lucide-react';
import type { BancoRegistros, Carro, Colaborador, FiltroRegionalId } from '../types';
import { distribuicaoOcupacaoCarros, filtrarCarrosPorRegional, regionalDoColab, toBR } from '../utils';
import FiltroMes from './FiltroMes';
import {
  exportarRankingCSV,
  listarMesesDisponiveis,
  rankingDoMes,
  resumosPorMes,
  rotuloMes,
  rotuloMesLongo,
} from '../indicadores';

interface Props {
  registros: BancoRegistros;
  colabs: Colaborador[];
  carros?: Carro[];
  regionalFiltro?: FiltroRegionalId;
  onRegionalChange?: (v: FiltroRegionalId) => void;
  onVerDia: (dataISO: string) => void;
}

type Ordenacao = 'faltas' | 'total' | 'nome';

function AvatarMini({ nome, foto }: { nome: string; foto: string }) {
  const [err, setErr] = useState(false);
  if (!foto || err) {
    const ini = nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
        {ini}
      </div>
    );
  }
  return (
    <img
      src={foto}
      alt={nome}
      onError={() => setErr(true)}
      className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/20"
      loading="lazy"
    />
  );
}

function medalha(i: number): string {
  if (i === 0) return 'from-amber-300 to-yellow-600 text-white';
  if (i === 1) return 'from-slate-300 to-slate-500 text-white';
  if (i === 2) return 'from-orange-300 to-amber-700 text-white';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
}

const OPCOES_REGIONAIS: Array<{ id: FiltroRegionalId; label: string; grad: string }> = [
  { id: 'todas', label: 'Todas', grad: 'from-indigo-600 to-violet-600' },
  { id: 'ribas', label: '📍 Ribas', grad: 'from-emerald-600 to-teal-600' },
  { id: 'agua-clara', label: '📍 Água Clara', grad: 'from-sky-600 to-cyan-600' },
];

export default function IndicadoresTab({ registros, colabs, carros = [], regionalFiltro, onRegionalChange, onVerDia }: Props) {
  const meses = useMemo(() => listarMesesDisponiveis(registros), [registros]);
  const [mesSel, setMesSel] = useState<string>(meses[0] ?? '');
  const mesEfetivo = meses.includes(mesSel) ? mesSel : (meses[0] ?? '');
  const [busca, setBusca] = useState('');
  const [ord, setOrd] = useState<Ordenacao>('faltas');
  const [somenteFaltas, setSomenteFaltas] = useState(true);
  const [regionalLocal, setRegionalLocal] = useState<FiltroRegionalId>('todas');

  const regionalAtiva: FiltroRegionalId = regionalFiltro ?? regionalLocal;
  const setRegional = (v: FiltroRegionalId) => {
    if (onRegionalChange) onRegionalChange(v);
    else setRegionalLocal(v);
  };

  const colabsFiltrados = useMemo(() => {
    if (regionalAtiva === 'todas') return colabs;
    return colabs.filter((c) => regionalDoColab(c, carros) === regionalAtiva);
  }, [colabs, carros, regionalAtiva]);

  const idsDaRegional = useMemo(() => new Set(colabsFiltrados.map((c) => c.id)), [colabsFiltrados]);

  const ranking = useMemo(
    () => (mesEfetivo ? rankingDoMes(registros, colabsFiltrados, mesEfetivo) : []),
    [registros, colabsFiltrados, mesEfetivo],
  );
  const resumos = useMemo(() => resumosPorMes(registros, colabsFiltrados), [registros, colabsFiltrados]);
  const totaisFiltroMes = useMemo(() => {
    const map: Record<string, { faltas: number; subs: number; afastados: number; dias: number }> = {};
    for (const r of resumos) {
      map[r.mesKey] = { faltas: r.totalFaltas, subs: r.totalSubs, afastados: r.totalAfastados ?? 0, dias: r.diasComLancamento };
    }
    return map;
  }, [resumos]);

  const motivos = useMemo(() => {
    if (!mesEfetivo) return [] as Array<{ motivo: string; qtd: number }>;
    const map = new Map<string, number>();
    for (const [data, dia] of Object.entries(registros)) {
      if (!data.startsWith(mesEfetivo)) continue;
      for (const [colabId, reg] of Object.entries(dia)) {
        if (!idsDaRegional.has(colabId)) continue;
        if (reg.situacao === 'presente') continue;
        const m = reg.situacao === 'afastado'
          ? `Afastado ${((reg.afastadoTipo ?? reg.motivo ?? 'INSS') as string).trim() || 'INSS'}`
          : (reg.motivo ?? '').trim() === '' ? 'Sem motivo informado' : (reg.motivo as string).trim();
        map.set(m, (map.get(m) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .map(([motivo, qtd]) => ({ motivo, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [registros, mesEfetivo, idsDaRegional]);
  const maxMotivo = Math.max(1, ...motivos.map((m) => m.qtd));

  const filtrado = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let lista = ranking.filter((r) => {
      const matchBusca =
        q === '' || (r.nome + r.funcao + r.matricula).toLowerCase().includes(q);
      const matchTipo = somenteFaltas ? r.faltas > 0 : r.totalAusencias > 0;
      return matchBusca && matchTipo;
    });
    if (ord === 'nome') lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    else if (ord === 'total')
      lista = [...lista].sort((a, b) => b.totalAusencias - a.totalAusencias || b.faltas - a.faltas);
    return lista;
  }, [ranking, busca, ord, somenteFaltas]);

  const top3 = filtrado.slice(0, 3);
  const resto = filtrado.slice(3);
  const maxFaltas = Math.max(1, ...ranking.map((r) => r.faltas));
  const totalFaltasMes = ranking.reduce((s, r) => s + r.faltas, 0);
  const totalSubsMes = ranking.reduce((s, r) => s + r.substituicoes, 0);
  const totalAfastMes = ranking.reduce((s, r) => s + (r.afastamentos ?? 0), 0);
  const pessoasComFalta = ranking.filter((r) => r.faltas > 0).length;

  // Ocupação dos carros (alocação atual, respeita filtro de regional)
  const carrosDaRegional = useMemo(
    () => filtrarCarrosPorRegional(carros, regionalAtiva),
    [carros, regionalAtiva],
  );
  const ocupacao = useMemo(
    () => distribuicaoOcupacaoCarros(carrosDaRegional, colabs),
    [carrosDaRegional, colabs],
  );
  const maxOcup = Math.max(1, ocupacao.com4, ocupacao.com3, ocupacao.com2);

  const rotuloRegional = regionalAtiva === 'todas' ? 'Todas as regionais' : regionalAtiva === 'ribas' ? 'Regional de Ribas' : 'Regional de Água Clara';

  if (meses.length === 0) {
    return (
      <div className="glass anim-fade-up rounded-3xl p-10 text-center">
        <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h3 className="font-extrabold">Sem indicadores ainda</h3>
        <p className="mt-1 text-sm text-slate-500">Registre faltas na aba Operação para ver o ranking mensal aqui.</p>
      </div>
    );
  }

  return (
    <div className="anim-fade-up space-y-5">
      {/* Filtro por regional */}
      <div className="glass rounded-3xl p-4 no-print">
        <span className="mb-2.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-indigo-500" />
          Filtrar ranking por regional
        </span>
        <div className="grid gap-2 sm:grid-cols-3">
          {OPCOES_REGIONAIS.map((op) => {
            const ativo = regionalAtiva === op.id;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => setRegional(op.id)}
                aria-pressed={ativo}
                className={`rounded-2xl px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide transition-all duration-300 hover:-translate-y-0.5 ${
                  ativo
                    ? `bg-gradient-to-r ${op.grad} text-white shadow-lg`
                    : 'bg-slate-100 text-slate-500 hover:shadow-md dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {op.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] font-semibold text-slate-400">
          Exibindo: <b className="text-indigo-500">{rotuloRegional}</b> · {colabsFiltrados.length} pessoas no escopo
        </p>
      </div>

      {/* Seletor de mês — pesquisa por mês reutilizável */}
      <FiltroMes
        meses={meses}
        value={mesEfetivo}
        onChange={(v) => setMesSel(v === 'todos' ? (meses[0] ?? '') : v)}
        permitirTodos={false}
        totais={totaisFiltroMes}
      />
      <div className="glass rounded-3xl p-4">
        <h2 className="bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 bg-clip-text text-xl font-extrabold text-transparent sm:text-2xl">
          🏆 Quem mais faltou — {rotuloMesLongo(mesEfetivo)} · {rotuloRegional}
        </h2>
      </div>

      {/* KPIs do mês */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'Faltas no mês', value: String(totalFaltasMes), icon: '🔴', border: '!border-t-red-500' },
          { label: 'Substituições', value: String(totalSubsMes), icon: '🔵', border: '!border-t-sky-500' },
          { label: 'Afastados', value: String(totalAfastMes), icon: '🟠', border: '!border-t-orange-500' },
          { label: 'Pessoas c/ falta', value: String(pessoasComFalta), icon: '👥', border: '!border-t-amber-500' },
          {
            label: 'Campeão do mês',
            value: ranking[0] ? `${ranking[0].faltas} faltas` : '—',
            sub: ranking[0]?.nome.split(' ').slice(0, 2).join(' ') ?? '—',
            icon: '👑',
            border: '!border-t-violet-500',
          },
        ].map((k) => (
          <div key={k.label} className={`card-stat border-t-4 text-center ${k.border}`}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{k.icon} {k.label}</p>
            <p className="mt-1 text-2xl font-extrabold">{k.value}</p>
            {'sub' in k && k.sub ? <p className="truncate text-xs font-semibold text-violet-500">{k.sub}</p> : null}
          </div>
        ))}
      </div>

      {/* Ocupação dos carros — quantos fechados com 4 / com 3 / com 2 pessoas */}
      <div className="glass overflow-hidden rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 px-5 py-3.5 text-white">
          <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
            <CarIcon className="h-5 w-5" /> Ocupação dos carros · {rotuloRegional}
          </h3>
          <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide backdrop-blur">
            {ocupacao.total} carro{ocupacao.total === 1 ? '' : 's'} no escopo
          </span>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <div className="card-stat border-t-4 !border-t-emerald-500 text-center !shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">🚙 Fechados · 4 pessoas</p>
            <p className="mt-1 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-4xl font-extrabold text-transparent">
              {ocupacao.com4}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              {ocupacao.total > 0 ? Math.round((ocupacao.com4 / ocupacao.total) * 100) : 0}% da frota · 2 equipes
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-700"
                style={{ width: `${ocupacao.total > 0 ? (ocupacao.com4 / ocupacao.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="card-stat border-t-4 !border-t-sky-500 text-center !shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">🚗 Com 3 pessoas</p>
            <p className="mt-1 bg-gradient-to-r from-sky-500 to-cyan-500 bg-clip-text text-4xl font-extrabold text-transparent">
              {ocupacao.com3}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              {ocupacao.total > 0 ? Math.round((ocupacao.com3 / ocupacao.total) * 100) : 0}% da frota · 1 equipe de 3
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-700"
                style={{ width: `${ocupacao.total > 0 ? (ocupacao.com3 / ocupacao.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="card-stat border-t-4 !border-t-amber-500 text-center !shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">🚗 Com 2 pessoas</p>
            <p className="mt-1 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-4xl font-extrabold text-transparent">
              {ocupacao.com2}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              {ocupacao.total > 0 ? Math.round((ocupacao.com2 / ocupacao.total) * 100) : 0}% da frota · 1 equipe de 2
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700"
                style={{ width: `${ocupacao.total > 0 ? (ocupacao.com2 / ocupacao.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-5 pb-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            👤 1 pessoa: <b className="text-slate-700 dark:text-slate-200">{ocupacao.com1}</b>
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            ⛔ Vazios: <b className="text-slate-700 dark:text-slate-200">{ocupacao.vazios}</b>
          </span>
          <span className="ml-auto hidden sm:inline">4 = fechado · 3 e 2 = equipe única</span>
        </div>
        {ocupacao.detalhe.length > 0 && (
          <div className="max-h-56 overflow-y-auto border-t border-slate-200/70 px-5 py-3 dark:border-slate-700/60">
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {ocupacao.detalhe.map((d) => (
                <div
                  key={d.carroId}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs ${
                    d.ocupados >= 4
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : d.ocupados === 3
                        ? 'border-sky-500/40 bg-sky-500/10'
                        : d.ocupados === 2
                          ? 'border-amber-500/40 bg-amber-500/10'
                          : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
                  }`}
                  title={`${d.prefixo} · ${d.placa} — ${d.ocupados} pessoa(s)`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white ${
                      d.ocupados >= 4
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : d.ocupados === 3
                          ? 'bg-gradient-to-br from-sky-500 to-cyan-600'
                          : d.ocupados === 2
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : 'bg-gradient-to-br from-slate-400 to-slate-600'
                    }`}
                  >
                    {d.ocupados}p
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{d.prefixo}</b>
                    <span className="block truncate text-[10px] text-slate-500">
                      {d.ocupados >= 4 ? '✅ fechado' : d.ocupados === 0 ? 'vazio' : `${d.ocupados} pessoa(s)`} · {d.placa}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {ocupacao.total === 0 && (
          <p className="px-5 pb-5 text-center text-sm text-slate-500">Nenhum carro nesta regional.</p>
        )}
      </div>

      {/* Pódio Top 3 */}
      {top3.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-4 flex items-center gap-2 font-extrabold">
            <Crown className="h-5 w-5 text-amber-500" /> PÓDIO DO MÊS — {rotuloRegional.toUpperCase()}
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {top3.map((r, i) => (
              <div
                key={r.colabId}
                className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur transition-all hover:-translate-y-1 ${
                  i === 0
                    ? 'border-amber-400/50 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
                }`}
              >
                <span
                  className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-extrabold shadow ${medalha(i)}`}
                >
                  {i + 1}º
                </span>
                <div className="flex items-center gap-3">
                  <AvatarMini nome={r.nome} foto={r.foto} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">
                      {i === 0 ? '👑 ' : i === 1 ? '🥈 ' : '🥉 '}{r.nome}
                    </p>
                    <p className="text-xs text-slate-500">{r.funcao} · {r.matricula}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-3xl font-extrabold text-red-500">{r.faltas}<span className="text-xs font-bold text-slate-400"> faltas</span></p>
                    <p className="text-[11px] text-slate-500">+ {r.substituicoes} subst. · {r.taxaFalta}% dos dias</p>
                  </div>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 transition-all duration-700"
                    style={{ width: `${Math.max(4, (r.faltas / maxFaltas) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 truncate text-[11px] text-slate-500">Última: {r.ultimaFalta ? toBR(r.ultimaFalta) : '—'} · {r.principalMotivo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros + ranking completo */}
      <div className="glass rounded-3xl p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no ranking…"
              className="input !pl-9"
            />
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><Filter className="h-3.5 w-3.5" /> Ordenar:</span>
          {([['faltas', 'Mais faltas'], ['total', 'Mais ausências'], ['nome', 'A–Z']] as Array<[Ordenacao, string]>).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setOrd(v)}
              className={`rounded-xl px-3 py-2 text-xs font-bold ${ord === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
            >
              {l}
            </button>
          ))}
          <button
            onClick={() => setSomenteFaltas(!somenteFaltas)}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${somenteFaltas ? 'bg-red-500/15 text-red-500 border border-red-500/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
            title="Alternar entre só faltas ou faltas + substituições"
          >
            {somenteFaltas ? '🔴 só faltas' : '🔴+🔵+🟠 todas ausências'}
          </button>
          <button
            onClick={() => mesEfetivo && exportarRankingCSV(mesEfetivo, filtrado)}
            className="btn-ghost !py-2 !text-xs"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>

        {resto.length > 0 || top3.length > 0 ? (
          <div className="space-y-2">
            {[...top3, ...resto].map((r, i) => (
              <div
                key={r.colabId}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-3 transition-all hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/50"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-extrabold ${medalha(i)}`}>
                  {i + 1}º
                </span>
                <AvatarMini nome={r.nome} foto={r.foto} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{r.nome}</p>
                  <p className="truncate text-[11px] text-slate-500">{r.funcao} · {r.principalMotivo}</p>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-400"
                      style={{ width: `${Math.max(3, (r.faltas / maxFaltas) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-extrabold leading-none text-red-500">🔴 {r.faltas}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">🔵 {r.substituicoes}{(r.afastamentos ?? 0) > 0 ? ` · 🟠 ${r.afastamentos}` : ''} · {r.taxaFalta}%</p>
                </div>
                <button
                  onClick={() => r.ultimaFalta && onVerDia(r.ultimaFalta)}
                  className="hidden shrink-0 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-indigo-600 hover:text-white sm:block dark:bg-slate-700"
                  title="Ver último dia com falta"
                >
                  ver dia →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center text-sm text-emerald-600 dark:text-emerald-300">
            Nenhuma falta em {rotuloMesLongo(mesEfetivo)} na {rotuloRegional}. 🎉
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Motivos do mês */}
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-1 flex items-center gap-2 font-extrabold">
            <TriangleAlert className="h-5 w-5 text-amber-500" /> MOTIVOS NO MÊS
          </h3>
          <p className="mb-3 text-xs text-slate-500">O que mais gerou ausência em {rotuloMes(mesEfetivo)} · {rotuloRegional}.</p>
          <div className="space-y-2.5">
            {motivos.map((m) => (
              <div key={m.motivo}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="max-w-[75%] truncate font-semibold">{m.motivo}</span>
                  <b>{m.qtd}</b>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400"
                    style={{ width: `${(m.qtd / maxMotivo) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {motivos.length === 0 && <p className="text-sm text-slate-500">Sem motivos registrados.</p>}
          </div>
        </div>

        {/* Campeões de cada mês */}
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-1 flex items-center gap-2 font-extrabold">
            <Medal className="h-5 w-5 text-indigo-500" /> CAMPEÕES DE CADA MÊS
          </h3>
          <p className="mb-3 text-xs text-slate-500">Quem mais faltou em cada mês com lançamento · {rotuloRegional}.</p>
          <div className="space-y-2">
            {resumos.map((r) => (
              <button
                key={r.mesKey}
                onClick={() => setMesSel(r.mesKey)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                  r.mesKey === mesEfetivo
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : 'border-slate-200/70 bg-white/50 dark:border-slate-700/60 dark:bg-slate-800/50'
                }`}
              >
                <span className="flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                  <b className="text-xs uppercase leading-none">{r.rotulo.split('/')[0]}</b>
                  <span className="text-[10px] opacity-70">{r.rotulo.split('/')[1]?.slice(2)}</span>
                </span>
                {r.campeao ? (
                  <>
                    <AvatarMini nome={r.campeao.nome} foto={r.campeao.foto} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{r.campeao.nome}</span>
                      <span className="block text-[11px] text-slate-500">
                        🔴 {r.campeao.faltas} faltas · {r.totalFaltas} no mês · {r.diasComLancamento} dias lançados
                      </span>
                    </span>
                    <Trophy className={`h-5 w-5 shrink-0 ${r.mesKey === mesEfetivo ? 'text-indigo-500' : 'text-amber-500'}`} />
                  </>
                ) : (
                  <span className="text-sm text-slate-500">Sem faltas</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Evolução / reincidência */}
      <div className="glass rounded-3xl p-5">
        <h3 className="mb-1 flex items-center gap-2 font-extrabold">
          <TrendingUp className="h-5 w-5 text-emerald-500" /> REINCIDÊNCIA — FALTAS POR MÊS (TOP 5)
        </h3>
        <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5" /> Quem aparece em vários meses seguidos merece atenção · {rotuloRegional}.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="uppercase text-slate-500">
                <th className="p-2.5">Colaborador</th>
                {resumos.slice().reverse().map((r) => (
                  <th key={r.mesKey} className="p-2.5 text-center">{r.rotulo}</th>
                ))}
                <th className="p-2.5 text-center"><Award className="mx-auto h-4 w-4" /></th>
              </tr>
            </thead>
            <tbody>
              {ranking.slice(0, 5).map((r) => {
                const porMes = new Map<string, number>();
                for (const [data, dia] of Object.entries(registros)) {
                  const mk = data.slice(0, 7);
                  const reg = dia[r.colabId];
                  if (reg?.situacao === 'falta') porMes.set(mk, (porMes.get(mk) ?? 0) + 1);
                }
                const total = [...porMes.values()].reduce((s, v) => s + v, 0);
                const mesesComFalta = porMes.size;
                return (
                  <tr key={r.colabId} className="border-t border-slate-200/70 dark:border-slate-700/60">
                    <td className="p-2.5">
                      <span className="flex items-center gap-2">
                        <AvatarMini nome={r.nome} foto={r.foto} />
                        <span>
                          <b className="block max-w-[160px] truncate text-[13px]">{r.nome}</b>
                          <span className="text-[11px] text-slate-500">{r.funcao}</span>
                        </span>
                      </span>
                    </td>
                    {resumos.slice().reverse().map((m) => {
                      const v = porMes.get(m.mesKey) ?? 0;
                      return (
                        <td key={m.mesKey} className="p-2.5 text-center">
                          <span
                            className={`inline-flex min-w-[34px] justify-center rounded-lg px-2 py-1 font-extrabold ${
                              v >= 3
                                ? 'bg-red-500 text-white'
                                : v === 2
                                  ? 'bg-orange-500/20 text-orange-500 border border-orange-500/40'
                                  : v === 1
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                            }`}
                          >
                            {v}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-center font-extrabold">
                      {total} <span className="font-normal text-slate-400">({mesesComFalta}m)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
