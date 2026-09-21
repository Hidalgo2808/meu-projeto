import { useMemo, useState } from 'react';
import { CalendarSearch, Eraser, Search } from 'lucide-react';
import { rotuloMes, rotuloMesLongo } from '../indicadores';

export type MesFiltroValor = string; // 'todos' | 'yyyy-MM'

interface TotaisMes {
  faltas: number;
  subs: number;
  afastados?: number;
  dias: number;
}

interface FiltroMesProps {
  /** Lista de meses com lançamento, formato yyyy-MM (ordenada desc de preferência). */
  meses: string[];
  /** Valor atual: 'todos' ou 'yyyy-MM'. */
  value: MesFiltroValor;
  onChange: (v: MesFiltroValor) => void;
  /** Exibe a opção "Todos". Default true. */
  permitirTodos?: boolean;
  /** Totais opcionais por mês para exibir badge nas pílulas. */
  totais?: Record<string, TotaisMes>;
  compact?: boolean;
  id?: string;
}

const MES_RE = /^\d{4}-\d{2}$/;
const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizarMesValor(v: string): MesFiltroValor {
  const t = v.trim();
  if (t === '' || t.toLowerCase() === 'todos') return 'todos';
  if (MES_RE.test(t)) {
    const m = Number(t.slice(5, 7));
    if (m >= 1 && m <= 12) return t;
  }
  if (DIA_RE.test(t)) return t.slice(0, 7);
  return 'todos';
}

export function mesAtualKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Filtra uma lista de datas ISO (yyyy-MM-dd) pelo mês selecionado. */
export function filtrarDatasPorMes<T extends { data: string }>(lista: T[], mes: MesFiltroValor): T[] {
  if (mes === 'todos') return lista;
  return lista.filter((i) => i.data.startsWith(mes));
}

export default function FiltroMes({
  meses,
  value,
  onChange,
  permitirTodos = true,
  totais,
  compact = false,
  id = 'filtro-mes',
}: FiltroMesProps) {
  const [campo, setCampo] = useState<string>(value === 'todos' ? '' : value);

  const mesesOrdenados = useMemo(() => {
    const únicos = [...new Set(meses.filter((m) => MES_RE.test(m)))].sort().reverse();
    if (value !== 'todos' && MES_RE.test(value) && !únicos.includes(value)) {
      return [value, ...únicos].sort().reverse();
    }
    return únicos;
  }, [meses, value]);

  const minMes = useMemo(
    () => (mesesOrdenados.length > 0 ? [...mesesOrdenados].sort()[0] : undefined),
    [mesesOrdenados],
  );
  const maxMes = useMemo(
    () => (mesesOrdenados.length > 0 ? [...mesesOrdenados].sort().reverse()[0] : mesAtualKey()),
    [mesesOrdenados],
  );

  const rotuloAtivo =
    value === 'todos'
      ? 'Todos os meses'
      : (() => {
          try {
            return rotuloMesLongo(value);
          } catch {
            return value;
          }
        })();

  function aplicar(mesDigitado: string): void {
    onChange(normalizarMesValor(mesDigitado || 'todos'));
  }

  function limpar(): void {
    setCampo('');
    onChange(permitirTodos ? 'todos' : (mesesOrdenados[0] ?? mesAtualKey()));
  }

  return (
    <div
      className={`glass rounded-3xl ${compact ? 'p-3' : 'p-4'} no-print`}
      role="group"
      aria-label="Filtro pesquisar por mês"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <CalendarSearch className="h-3.5 w-3.5 text-indigo-500" />
          Pesquisar por mês
        </span>
        <span className="text-[11px] font-semibold text-slate-400">
          Exibindo: <b className="text-indigo-500">{rotuloAtivo}</b>
        </span>
      </div>

      {/* Linha de pesquisa: input month nativo + ações */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={id} className="sr-only">
          Digite ou escolha o mês (aaaa-mm)
        </label>
        <input
          id={id}
          type="month"
          value={campo}
          min={minMes}
          max={maxMes}
          onChange={(e) => setCampo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') aplicar(campo);
          }}
          className="input flex-1 !py-2.5 [color-scheme:light] dark:[color-scheme:dark]"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => aplicar(campo)}
            className="btn-primary flex-1 !py-2.5 !text-xs sm:flex-none sm:px-5"
          >
            <Search className="h-4 w-4" /> Buscar
          </button>
          {value !== 'todos' && permitirTodos && (
            <button
              type="button"
              onClick={limpar}
              className="btn-ghost !py-2.5 !text-xs"
              title="Limpar filtro de mês"
            >
              <Eraser className="h-4 w-4" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Pílulas rápidas */}
      {mesesOrdenados.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {permitirTodos && (
            <button
              key="todos"
              type="button"
              onClick={() => {
                setCampo('');
                onChange('todos');
              }}
              aria-pressed={value === 'todos'}
              className={`anim-pop rounded-xl px-3.5 py-2 text-xs font-extrabold uppercase tracking-wide transition-all duration-300 hover:-translate-y-0.5 ${
                value === 'todos'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Todos
            </button>
          )}
          {mesesOrdenados.map((m) => {
            const ativo = value === m;
            const t = totais?.[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setCampo(m);
                  onChange(m);
                }}
                aria-pressed={ativo}
                title={(() => {
                  try {
                    return rotuloMesLongo(m);
                  } catch {
                    return m;
                  }
                })()}
                className={`anim-pop rounded-xl px-3.5 py-2 text-xs font-extrabold uppercase tracking-wide transition-all duration-300 hover:-translate-y-0.5 ${
                  ativo
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {rotuloMes(m)}
                {typeof t !== 'undefined' && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                      ativo ? 'bg-white/20 text-white' : 'bg-red-500/15 text-red-500'
                    }`}
                  >
                    🔴{t.faltas}{(t.afastados ?? 0) > 0 ? ` 🟠${t.afastados}` : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!compact && mesesOrdenados.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">
          Nenhum mês com lançamento ainda. Use o campo acima para pesquisar por qualquer mês (aaaa-mm).
        </p>
      )}
    </div>
  );
}
