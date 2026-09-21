import { LayoutGrid, MapPin } from 'lucide-react';
import type { FiltroRegionalId } from '../types';
import { REGIONAIS, contarPorRegional } from '../utils';
import type { Carro, Colaborador } from '../types';

interface Props {
  value: FiltroRegionalId;
  onChange: (v: FiltroRegionalId) => void;
  carros: Carro[];
  colabs: Colaborador[];
  compact?: boolean;
}

const ESTILOS: Record<FiltroRegionalId, { ativo: string; dot: string; icone: string }> = {
  todas: {
    ativo: 'from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 border-transparent',
    dot: 'bg-white',
    icone: 'bg-white/20 text-white',
  },
  ribas: {
    ativo: 'from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border-transparent',
    dot: 'bg-emerald-400',
    icone: 'bg-emerald-500/15 text-emerald-500',
  },
  'agua-clara': {
    ativo: 'from-sky-600 to-cyan-600 text-white shadow-lg shadow-sky-600/30 border-transparent',
    dot: 'bg-sky-400',
    icone: 'bg-sky-500/15 text-sky-500',
  },
};

export default function FiltroRegional({ value, onChange, carros, colabs, compact = false }: Props) {
  const contagem = contarPorRegional(carros, colabs);

  const opcoes: Array<{ id: FiltroRegionalId; rotulo: string; sub: string }> = [
    { id: 'todas', rotulo: 'Todas as regionais', sub: `${contagem.todas.carros} carros` },
    {
      id: 'ribas',
      rotulo: REGIONAIS[0].nome,
      sub: `${contagem.ribas.carros} carros · ${contagem.ribas.colabs} pessoas`,
    },
    {
      id: 'agua-clara',
      rotulo: REGIONAIS[1].nome,
      sub: `${contagem['agua-clara'].carros} carros · ${contagem['agua-clara'].colabs} pessoas`,
    },
  ];

  return (
    <div
      className={`glass rounded-3xl ${compact ? 'p-3' : 'p-4'} no-print`}
      role="group"
      aria-label="Filtro por regional"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-indigo-500" />
          Filtrar por regional
        </span>
        {!compact && (
          <span className="text-[11px] font-semibold text-slate-400">
            {value === 'todas' ? 'visão consolidada' : value === 'ribas' ? 'base Ribas' : 'base Água Clara'}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {opcoes.map((op) => {
          const ativo = value === op.id;
          const est = ESTILOS[op.id];
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => onChange(op.id)}
              aria-pressed={ativo}
              className={`anim-pop flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                ativo
                  ? `bg-gradient-to-r border ${est.ativo}`
                  : 'border-slate-200/80 bg-white/60 hover:border-indigo-400/60 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-800/60 dark:hover:border-indigo-500/60'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  ativo ? 'bg-white/20 text-white' : est.icone
                }`}
              >
                {op.id === 'todas' ? <LayoutGrid className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[13px] font-extrabold leading-tight ${ativo ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                  {op.id === 'todas' ? 'Todas' : op.id === 'ribas' ? 'Ribas' : 'Água Clara'}
                </span>
                <span className={`block truncate text-[11px] font-semibold ${ativo ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'}`}>
                  {op.id === 'todas' ? op.sub : op.rotulo.replace('Regional de ', '') + ` · ${op.sub.split(' · ')[0]}`}
                </span>
                {!compact && (
                  <span className={`mt-0.5 hidden text-[10px] font-medium sm:block ${ativo ? 'text-white/75' : 'text-slate-400'}`}>
                    {op.id === 'todas' ? 'Consolidado geral' : op.rotulo}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <i className={`h-2.5 w-2.5 rounded-full ${ativo ? est.dot : op.id === 'todas' ? 'bg-indigo-400' : est.dot}`} />
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {op.id === 'todas'
                    ? contagem.todas.carros
                    : op.id === 'ribas'
                      ? contagem.ribas.carros
                      : contagem['agua-clara'].carros}
                  {' '}🚙
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
