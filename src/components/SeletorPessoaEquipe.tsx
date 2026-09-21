import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { Carro, Colaborador } from '../types';
import { initials, isVago, regionalCurto, regionalDoColab, titulares } from '../utils';

interface Props {
  label: string;
  value: string;
  colabs: Colaborador[];
  carros: Carro[];
  /** ids já escolhidos em outras posições deste formulário (para marcar duplicado) */
  selecionados: string[];
  accent: 'indigo' | 'amber' | 'indigo-eq02';
  onChange: (id: string) => void;
}

function corAvatar(nome: string): string {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 45%)`;
}

export default function SeletorPessoaEquipe({ label, value, colabs, carros, selecionados, accent, onChange }: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');

  const emUso = useMemo(() => new Set(titulares(carros)), [carros]);

  const selecionado = colabs.find((c) => c.id === value);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return colabs
      .filter((c) => {
        if (c.status === 'inativo') return false;
        if (!q) return true;
        return (
          c.nome.toLowerCase().includes(q) ||
          c.matricula.toLowerCase().includes(q) ||
          c.funcao.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aLivre = !emUso.has(a.id) ? 0 : 1;
        const bLivre = !emUso.has(b.id) ? 0 : 1;
        if (aLivre !== bLivre) return aLivre - bLivre;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      })
      .slice(0, 80);
  }, [colabs, busca, emUso]);

  // Mesma cor da Equipe 1 para todas as equipes (índigo) — prop `accent` mantida por compatibilidade.
  void accent;
  const borda = 'focus-within:ring-indigo-500/50 focus-within:border-indigo-500';

  return (
    <div className="relative">
      <label className="label">{label}</label>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className={`input flex items-center gap-2.5 !py-2 text-left transition-all ${borda} ${value ? '!border-indigo-400 dark:!border-indigo-500' : ''}`}
      >
        {selecionado ? (
          <>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
              style={{ background: corAvatar(selecionado.nome) }}
            >
              {initials(selecionado.nome)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{selecionado.nome}</span>
              <span className="block truncate text-[11px] text-slate-500">
                {selecionado.funcao} · {selecionado.matricula}
              </span>
            </span>
            <span
              role="button"
              tabIndex={0}
              title="Limpar"
              onClick={(e) => { e.stopPropagation(); onChange(''); setBusca(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onChange(''); } }}
              className="rounded-lg p-1 text-slate-400 hover:bg-red-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          </>
        ) : (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 dark:border-slate-600">
              ?
            </span>
            <span className="flex-1 truncate text-sm text-slate-400">— Toque e escolha a pessoa —</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div className="anim-pop absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="relative border-b border-slate-100 p-2 dark:border-slate-800">
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, matrícula ou função…"
                className="input !pl-9 !py-2"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1.5">
              <button
                type="button"
                onClick={() => { onChange(''); setAberto(false); setBusca(''); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                — deixar vaga vazia —
              </button>
              {lista.map((c) => {
                const ocupado = emUso.has(c.id) && c.id !== value;
                const duplicado = selecionados.includes(c.id) && c.id !== value;
                const ativo = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={ocupado}
                    onClick={() => { onChange(c.id); setAberto(false); setBusca(''); }}
                    title={ocupado ? `${c.nome} já está em outra equipe` : `${c.nome} · ${c.funcao}`}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                      ativo
                        ? 'bg-indigo-600 text-white'
                        : duplicado
                          ? 'bg-indigo-500/10 hover:bg-indigo-500/20'
                          : ocupado
                            ? 'cursor-not-allowed opacity-45'
                            : 'hover:bg-indigo-500/10'
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                      style={{ background: corAvatar(c.nome) }}
                    >
                      {initials(c.nome)}
                    </span>
                    <span className="min-w-0 flex-1">
                      {/* NOME DA PESSOA — visível no ato da criação */}
                      <span className={`block truncate text-[13px] font-bold ${ativo ? 'text-white' : ''}`}>
                        {c.nome}
                      </span>
                      <span className={`block truncate text-[11px] ${ativo ? 'text-white/80' : 'text-slate-500'}`}>
                        {c.funcao} · {c.matricula} · 📍 {regionalCurto(regionalDoColab(c, carros))}
                      </span>
                      {ocupado && <span className="block text-[10px] font-bold text-red-500">já alocado em outra equipe</span>}
                      {duplicado && !ocupado && <span className="block text-[10px] font-bold text-indigo-600">⚠ já escolhido nesta equipe</span>}
                    </span>
                    {ativo && <Check className="h-4 w-4 shrink-0" />}
                    {!ativo && !ocupado && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${c.status === 'reserva' ? 'bg-sky-500/15 text-sky-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                        {c.status === 'reserva' ? 'reserva' : 'ativo'}
                      </span>
                    )}
                    {ocupado && (
                      <span className="shrink-0 rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-500">
                        ocupado
                      </span>
                    )}
                  </button>
                );
              })}
              {lista.length === 0 && (
                <p className="p-4 text-center text-xs text-slate-500">
                  Nenhuma pessoa encontrada para “{busca}”.
                </p>
              )}
            </div>
            <p className="border-t border-slate-100 px-3 py-2 text-[10px] font-semibold text-slate-400 dark:border-slate-800">
              {isVago(value) ? 'Nomes exibidos com função e regional — escolha para escalar.' : `Selecionado: ${selecionado?.nome}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
