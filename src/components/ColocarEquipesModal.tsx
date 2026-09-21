import { useMemo, useState } from 'react';
import { Search, Users, X, Zap } from 'lucide-react';
import type { Carro, Colaborador } from '../types';
import {
  initials,
  isVago,
  pessoasLivres,
  regionalCurto,
  regionalDoCarro,
  regionalDoColab,
} from '../utils';

interface Props {
  carro: Carro;
  carros: Carro[];
  colabs: Colaborador[];
  onClose: () => void;
  /** Recebe o mapa posIndex -> colabId com a composição final das 2 equipes. */
  onConfirm: (escala: Record<number, string>) => void;
}

function AvatarMini({ nome, foto }: { nome: string; foto: string }) {
  const [err, setErr] = useState(false);
  if (!foto || err) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
        {initials(nome)}
      </div>
    );
  }
  return <img src={foto} alt={nome} onError={() => setErr(true)} className="h-9 w-9 shrink-0 rounded-full object-cover" loading="lazy" />;
}

/**
 * Botão "Colocar equipes": monta EQ01 (pos 0-1) + EQ02 (pos 2-3) de uma vez,
 * com filtro por unidade, busca e preenchimento automático.
 */
export default function ColocarEquipesModal({ carro, carros, colabs, onClose, onConfirm }: Props) {
  const regCarro = regionalDoCarro(carro);
  const [busca, setBusca] = useState('');
  const [soRegional, setSoRegional] = useState(true);
  const [escala, setEscala] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    carro.posicoes.forEach((id, i) => {
      if (!isVago(id)) init[i] = id;
    });
    return init;
  });
  const [slotAlvo, setSlotAlvo] = useState<number>(() => {
    const vago = carro.posicoes.findIndex((p) => isVago(p));
    return vago >= 0 ? vago : 0;
  });

  const livres = useMemo(() => pessoasLivres(colabs, carros), [colabs, carros]);

  const candidatos = useMemo(() => {
    const emEscala = new Set(Object.values(escala));
    const q = busca.trim().toLowerCase();
    return livres
      .filter((c) => !emEscala.has(c.id))
      .filter((c) => {
        if (soRegional && regionalDoColab(c, carros) !== regCarro) return false;
        if (!q) return true;
        return (c.nome + ' ' + c.funcao + ' ' + c.matricula).toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.status === 'reserva' && b.status !== 'reserva') return -1;
        if (b.status === 'reserva' && a.status !== 'reserva') return 1;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      })
      .slice(0, 60);
  }, [livres, escala, busca, soRegional, regCarro, carros]);

  const nomeDe = (id?: string) => (id ? colabs.find((c) => c.id === id) : undefined);

  function escolher(colabId: string) {
    setEscala((prev) => ({ ...prev, [slotAlvo]: colabId }));
    // avança para o próximo slot vazio / seguinte
    const ordem = [0, 1, 2, 3];
    const atual = { ...escala, [slotAlvo]: colabId };
    const proximo = ordem.find((i) => !atual[i]);
    setSlotAlvo(proximo ?? (slotAlvo + 1) % 4);
    setBusca('');
  }

  function limparSlot(i: number) {
    setEscala((prev) => {
      const n = { ...prev };
      delete n[i];
      return n;
    });
    setSlotAlvo(i);
  }

  function preenchimentoAutomatico() {
    const pool = [...candidatos];
    // prioriza mesma unidade, depois reservas
    setEscala((prev) => {
      const n = { ...prev };
      for (const i of [0, 1, 2, 3]) {
        if (n[i]) continue;
        const pick = pool.shift();
        if (!pick) break;
        n[i] = pick.id;
        // remove do pool para não repetir
        const idx = pool.findIndex((c) => c.id === pick.id);
        if (idx >= 0) pool.splice(idx, 1);
      }
      return n;
    });
  }

  const totalPreenchidos = Object.keys(escala).length;
  const podeConfirmar = totalPreenchidos > 0;

  function blocoEquipe(titulo: string, slots: [number, number], cor: string) {
    return (
      <div className={`rounded-2xl border p-3 ${cor}`}>
        <p className="mb-2 text-center text-[11px] font-extrabold uppercase tracking-widest">{titulo}</p>
        <div className="grid gap-2">
          {slots.map((i) => {
            const oc = nomeDe(escala[i]);
            const sel = slotAlvo === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSlotAlvo(i)}
                className={`flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all ${
                  sel
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/15'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60'
                }`}
              >
                {oc ? <AvatarMini nome={oc.nome} foto={oc.foto} /> : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-indigo-400 bg-indigo-500/10 text-xs font-extrabold text-indigo-500">
                    {i + 1}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{oc ? oc.nome : `Vaga ${i + 1} — toque p/ selecionar`}</span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {oc ? `${oc.funcao} · 📍 ${regionalCurto(regionalDoColab(oc, carros))}` : 'vazia'}
                  </span>
                </span>
                {oc && (
                  <span
                    role="button"
                    tabIndex={0}
                    title="Limpar vaga"
                    onClick={(e) => { e.stopPropagation(); limparSlot(i); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') limparSlot(i); }}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-red-500 hover:text-white dark:bg-slate-700"
                  >
                    ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="anim-pop max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold leading-tight">👥 Colocar equipes · 🚙 {carro.prefixo}</h2>
              <p className="text-xs text-white/85">📍 {regionalCurto(regCarro)} · monte EQ01 + EQ02 de uma vez</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white/15 p-2 transition hover:bg-white/25" title="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {blocoEquipe('🔵 Equipe 01 · frente', [0, 1], 'border-indigo-500/25 bg-indigo-500/5')}
            {blocoEquipe('🔵 Equipe 02 · traseira', [2, 3], 'border-indigo-500/25 bg-indigo-500/5')}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={preenchimentoAutomatico} className="btn-ghost !py-2 !text-xs" title="Completa vagas vazias com pessoas livres">
              <Zap className="h-3.5 w-3.5" /> ⚡ Preenchimento automático ({4 - totalPreenchidos} vagas)
            </button>
            <button
              onClick={() => setSoRegional(!soRegional)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${soRegional ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
            >
              📍 {soRegional ? `só ${regionalCurto(regCarro)}` : 'todas unidades'}
            </button>
            <span className="ml-auto text-[11px] font-semibold text-slate-500">
              Slot alvo: <b className="text-indigo-500">vaga {slotAlvo + 1}</b> · {totalPreenchidos}/4 preenchidas
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Buscar pessoa livre para a vaga ${slotAlvo + 1}…`}
              className="input !pl-9"
            />
          </div>

          <div className="max-h-60 space-y-1.5 overflow-y-auto pr-0.5">
            {candidatos.map((c) => (
              <button
                key={c.id}
                onClick={() => escolher(c.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-2.5 text-left transition-all hover:-translate-y-px hover:border-indigo-400 hover:bg-indigo-500/10 hover:shadow-md dark:border-slate-700"
              >
                <AvatarMini nome={c.nome} foto={c.foto} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{c.nome}</span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {c.funcao} · {c.matricula} · 📍 {regionalCurto(regionalDoColab(c, carros))}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase ${c.status === 'reserva' ? 'bg-sky-500/15 text-sky-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                  {c.status === 'reserva' ? 'reserva' : 'ativo'}
                </span>
                <span className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-bold text-white">
                  → vaga {slotAlvo + 1}
                </span>
              </button>
            ))}
            {candidatos.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-700">
                Nenhuma pessoa livre encontrada. Ajuste a busca ou o filtro de unidade.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
            <button
              disabled={!podeConfirmar}
              onClick={() => { onConfirm(escala); onClose(); }}
              className="btn-primary flex-1"
            >
              <Users className="h-4 w-4" /> Colocar equipes ({totalPreenchidos}/4)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
