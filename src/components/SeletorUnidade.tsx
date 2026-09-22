import { Building2, MapPin, Waves } from 'lucide-react';
import type { Carro, Colaborador, RegionalId } from '../types';
import { contarPorRegional, regionalDoCarro } from '../utils';
import { TEMAS_UNIDADE } from '../unidadeTheme';

export type UnidadeId = RegionalId;

interface SeletorUnidadeProps {
  value: UnidadeId;
  onChange: (v: UnidadeId) => void;
  carros: Carro[];
  colabs: Colaborador[];
  compact?: boolean;
}

const ICONES: Record<UnidadeId, typeof Building2> = {
  ribas: Building2,
  'agua-clara': Waves,
};

const DESCRICAO: Record<UnidadeId, string> = {
  ribas: 'Base Ribas · operação principal',
  'agua-clara': 'Base Água Clara · operação secundária',
};

const GRADIENTE_ATIVO: Record<UnidadeId, string> = {
  ribas: 'from-emerald-600 via-teal-600 to-emerald-600',
  'agua-clara': 'from-sky-600 via-cyan-600 to-sky-600',
};

const GRADIENTE_SOFT: Record<UnidadeId, string> = {
  ribas: 'from-emerald-500/15 via-teal-500/10 to-transparent',
  'agua-clara': 'from-sky-500/15 via-cyan-500/10 to-transparent',
};

const ANEL_ATIVO: Record<UnidadeId, string> = {
  ribas: 'ring-2 ring-emerald-500/70 border-emerald-500/60 shadow-emerald-600/25',
  'agua-clara': 'ring-2 ring-sky-500/70 border-sky-500/60 shadow-sky-600/25',
};

/**
 * SeletorUnidade — aba de seleção exclusiva de unidade operacional.
 * Permite alternar SOMENTE entre Ribas e Água Clara (sem opção "todas").
 * SOLID: componente puro, sem estado interno; contagens derivadas via utils (DRY).
 * Acessível: role="tablist" + aria-selected + navegação por teclado.
 */
export default function SeletorUnidade({
  value,
  onChange,
  carros,
  colabs,
  compact = false,
}: SeletorUnidadeProps) {
  const contagem = contarPorRegional(carros, colabs);

  function carrosDaUnidade(id: UnidadeId): number {
    return carros.filter((c) => regionalDoCarro(c) === id).length;
  }

  function handleKey(e: React.KeyboardEvent, id: UnidadeId): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(id);
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(id === 'ribas' ? 'agua-clara' : 'ribas');
    }
  }

  return (
    <section
      aria-label="Seleção de unidade operacional"
      className="glass relative overflow-hidden rounded-3xl no-print"
    >
      {/* fundo decorativo em gradiente */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.07] via-violet-500/[0.06] to-transparent dark:from-indigo-400/[0.08] dark:via-violet-400/[0.07]"
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
          value === 'ribas'
            ? 'from-emerald-500 via-teal-400 to-emerald-500'
            : 'from-sky-500 via-cyan-400 to-sky-500'
        } transition-all duration-500`}
      />

      <div className={`relative ${compact ? 'p-3' : 'p-4 sm:p-5'}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
            Unidade operacional
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            {value === 'ribas' ? 'Ribas selecionada' : 'Água Clara selecionada'}
          </span>
        </div>

        {/* Abas — somente 2 unidades */}
        <div
          role="tablist"
          aria-label="Escolha a unidade: Ribas ou Água Clara"
          className="relative grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-1.5 backdrop-blur-xl border border-white/40 dark:border-slate-700/60"
        >
          {TEMAS_UNIDADE.map((tema) => {
            const id = tema.id as UnidadeId;
            const ativo = value === id;
            const Icone = ICONES[id] ?? MapPin;
            const totalCarros = carrosDaUnidade(id);
            const totalPessoas = contagem[id].colabs;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={ativo}
                aria-label={`${tema.nome} — ${totalCarros} carros, ${totalPessoas} pessoas`}
                tabIndex={0}
                onClick={() => onChange(id)}
                onKeyDown={(e) => handleKey(e, id)}
                className={`anim-pop group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 ${
                  ativo
                    ? `bg-gradient-to-r ${GRADIENTE_ATIVO[id]} text-white shadow-xl ${ANEL_ATIVO[id]} -translate-y-px`
                    : 'bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 hover:-translate-y-px hover:shadow-lg hover:border-indigo-400/50 dark:hover:border-indigo-500/50'
                }`}
              >
                {/* brilho suave quando ativo */}
                {ativo && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[unidadeShine_2.8s_ease-in-out_infinite]"
                  />
                )}
                {/* fundo suave quando inativo */}
                {!ativo && (
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${GRADIENTE_SOFT[id]} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                )}

                <span
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105 ${
                    ativo
                      ? 'bg-white/20 text-white'
                      : tema.id === 'ribas'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                  }`}
                >
                  <Icone className="h-5 w-5" />
                </span>

                <span className="relative min-w-0 flex-1">
                  <span
                    className={`flex items-center gap-1.5 text-sm font-extrabold leading-tight ${
                      ativo ? 'text-white' : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <i
                      className={`h-2 w-2 rounded-full ${ativo ? 'bg-white' : tema.dot}`}
                      aria-hidden="true"
                    />
                    {tema.nomeCurto}
                  </span>
                  {!compact && (
                    <span
                      className={`mt-0.5 block truncate text-[11px] font-semibold ${
                        ativo ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {DESCRICAO[id]}
                    </span>
                  )}
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      ativo
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🚙 {totalCarros} · 👥 {totalPessoas}
                  </span>
                </span>

                {/* check de selecionado */}
                <span
                  aria-hidden="true"
                  className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-all duration-300 ${
                    ativo
                      ? 'bg-white text-emerald-600 scale-100 opacity-100'
                      : 'bg-slate-200 dark:bg-slate-700 text-transparent scale-75 opacity-0 group-hover:opacity-40'
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>

        {!compact && (
          <p className="mt-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            Exibindo <b className={value === 'ribas' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}>
              {value === 'ribas' ? 'Regional de Ribas' : 'Regional de Água Clara'}
            </b>{' '}
            — operação, indicadores, carros e histórico filtrados para esta unidade.
          </p>
        )}
      </div>
    </section>
  );
}
