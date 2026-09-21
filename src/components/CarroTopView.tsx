import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { BancoRegistros, Carro, Colaborador } from '../types';
import { initials, isVago, situacaoDe, statusEquipe } from '../utils';
import { equipeDePosicao, temaEquipe } from '../equipeTheme';

interface CarroTopViewProps {
  carro: Carro;
  colabs: Colaborador[];
  dia: BancoRegistros[string] | undefined;
  onPick: (colabId: string) => void;
  onAdd: (posGlobal: number) => void;
}

function MiniAvatar({ nome, foto, size = 36 }: { nome: string; foto: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!foto || err) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200"
        style={{ width: size, height: size, fontSize: size * 0.32 }}
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
      loading="lazy"
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

type Sit = 'presente' | 'falta' | 'substituicao' | 'afastado' | 'ferias' | string;

function sitMeta(s: Sit): { dot: string; ring: string; text: string; label: string } {
  switch (s) {
    case 'falta':
      return { dot: 'bg-red-500', ring: 'border-red-200 dark:border-red-500/40', text: 'text-red-600 dark:text-red-400', label: 'Falta' };
    case 'substituicao':
      return { dot: 'bg-sky-500', ring: 'border-sky-200 dark:border-sky-500/40', text: 'text-sky-600 dark:text-sky-400', label: 'Substituto' };
    case 'afastado':
      return { dot: 'bg-amber-500', ring: 'border-amber-200 dark:border-amber-500/40', text: 'text-amber-600 dark:text-amber-400', label: 'Afastado' };
    case 'ferias':
      return { dot: 'bg-violet-500', ring: 'border-violet-200 dark:border-violet-500/40', text: 'text-violet-600 dark:text-violet-400', label: 'Férias' };
    default:
      return { dot: 'bg-emerald-500', ring: 'border-slate-200 dark:border-slate-700', text: 'text-slate-400', label: 'Presente' };
  }
}

function Assento({
  posGlobal,
  colabId,
  colabs,
  dia,
  onPick,
  onAdd,
}: {
  posGlobal: number;
  colabId: string;
  colabs: Colaborador[];
  dia: BancoRegistros[string] | undefined;
  onPick: (id: string) => void;
  onAdd: (pos: number) => void;
}) {
  const equipe = equipeDePosicao(posGlobal);

  if (isVago(colabId)) {
    return (
      <button
        onClick={() => onAdd(posGlobal)}
        title={`${equipe.id} · Vaga ${posGlobal + 1} — toque para escalar`}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-transparent px-2 py-3 text-slate-400 transition-colors dark:border-slate-700 ${equipe.vagaButton}`}
      >
        <Plus className="h-4 w-4" />
        <span className="text-[11px] font-medium">Vago</span>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest ${equipe.badge}`}>
          {equipe.id}
        </span>
      </button>
    );
  }

  const c = colabs.find((x) => x.id === colabId);
  if (!c) return null;
  const reg = dia?.[colabId];
  const sit = (reg?.situacao ?? situacaoDe(colabId, dia)) as Sit;
  const sub = reg?.substitutoId ? colabs.find((x) => x.id === reg.substitutoId) : undefined;
  const nomeExibido = sub?.nome ?? c.nome;
  const primeiroNome = nomeExibido.split(' ')[0];
  const meta = sitMeta(sit);
  const presente = sit === 'presente';

  return (
    <button
      onClick={() => onPick(colabId)}
      title={`${nomeExibido} · ${c.funcao} · ${equipe.id} · ${meta.label}`}
      className={`relative flex w-full flex-col items-center gap-1 overflow-hidden rounded-xl border bg-white px-2 pb-2.5 pt-2 transition-all hover:shadow-md dark:bg-slate-900 ${presente ? equipe.assentoRing : meta.ring}`}
    >
      {/* Filete superior com a cor da equipe — a "outra cor" da aba Operação */}
      <i className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${equipe.gradient}`} aria-hidden="true" />
      <span className="relative mt-0.5">
        <MiniAvatar nome={nomeExibido} foto={sub?.foto ?? c.foto} size={36} />
        <i className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${meta.dot}`} />
      </span>
      <span className="w-full truncate text-center text-xs font-semibold leading-tight text-slate-700 dark:text-slate-200">
        {primeiroNome}
      </span>
      <span className="flex items-center gap-1">
        <i className={`h-1.5 w-1.5 rounded-full ${equipe.dot}`} />
        <span className={`text-[10px] font-extrabold uppercase tracking-widest ${equipe.text}`}>
          {equipe.id}
        </span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span className={`text-[10px] font-medium leading-none ${sit === 'presente' ? 'text-slate-400' : meta.text}`}>
          {meta.label}
        </span>
      </span>
    </button>
  );
}

function FileiraHeader({ equipeId, status }: { equipeId: 'EQ01' | 'EQ02'; status: 'completa' | 'incompleta' | 'sem-equipe' }) {
  const t = temaEquipe(equipeId);
  const stDot = status === 'completa' ? 'bg-emerald-500' : status === 'incompleta' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="mb-1.5 flex items-center gap-1.5 px-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${t.gradient} px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md ${t.gradientShadow}`}>
        <i className="h-1.5 w-1.5 rounded-full bg-white/90" />
        {t.nomeCurto}
      </span>
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <i className={`h-1.5 w-1.5 rounded-full ${stDot}`} />
        {status === 'completa' ? 'completa' : status === 'incompleta' ? 'incompleta' : 'sem equipe'}
      </span>
    </div>
  );
}

/**
 * Desenho minimalista do carro (visão superior).
 * EQ01 e EQ02 usam a mesma cor da Equipe 1 (índigo/azul).
 * Detalhes (função, motivo, substituto) ficam no tooltip / modal.
 */
export default function CarroTopView({ carro, colabs, dia, onPick, onAdd }: CarroTopViewProps) {
  const eq1 = statusEquipe(carro.posicoes[0], carro.posicoes[1], dia);
  const eq2 = statusEquipe(carro.posicoes[2], carro.posicoes[3], dia);
  const t1 = temaEquipe('EQ01');
  const t2 = temaEquipe('EQ02');

  return (
    <div className="rounded-2xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
      {/* Para-brisa — única referência de orientação */}
      <div className="mx-10 mb-3 h-1.5 rounded-full bg-slate-300/70 dark:bg-slate-700" title="Frente do veículo" />
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Frente
      </p>

      {/* EQ01 — índigo (mesma cor da Equipe 1) */}
      <FileiraHeader equipeId="EQ01" status={eq1} />
      <div className={`rounded-xl border border-transparent p-1.5 ${t1.softBg} ${t1.frame}`}>
        <div className="grid grid-cols-2 gap-2">
          <Assento posGlobal={0} colabId={carro.posicoes[0]} colabs={colabs} dia={dia} onPick={onPick} onAdd={onAdd} />
          <Assento posGlobal={1} colabId={carro.posicoes[1]} colabs={colabs} dia={dia} onPick={onPick} onAdd={onAdd} />
        </div>
      </div>

      <div className="mx-1 my-3 border-t border-dashed border-slate-200 dark:border-slate-700" />

      {/* EQ02 — mesma cor da Equipe 1 (índigo) */}
      <FileiraHeader equipeId="EQ02" status={eq2} />
      <div className={`rounded-xl border border-transparent p-1.5 ${t2.softBg} ${t2.frame}`}>
        <div className="grid grid-cols-2 gap-2">
          <Assento posGlobal={2} colabId={carro.posicoes[2]} colabs={colabs} dia={dia} onPick={onPick} onAdd={onAdd} />
          <Assento posGlobal={3} colabId={carro.posicoes[3]} colabs={colabs} dia={dia} onPick={onPick} onAdd={onAdd} />
        </div>
      </div>

      <div className="mx-10 mt-3 h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-700/60" title="Traseira do veículo" />
    </div>
  );
}
