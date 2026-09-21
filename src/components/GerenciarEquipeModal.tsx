import { useMemo, useState } from 'react';
import { ArrowLeftRight, Plus, Search, Trash2, Users, X } from 'lucide-react';
import type { Carro, Colaborador } from '../types';
import {
  alocarPessoa,
  carroDaPessoa,
  initials,
  isVago,
  pessoasLivres,
  regionalCurto,
  regionalDoCarro,
  regionalDoColab,
  regionalLabel,
  removerDoCarro,
} from '../utils';
import { equipeDePosicao } from '../equipeTheme';

interface Props {
  carro: Carro;
  carros: Carro[];
  colabs: Colaborador[];
  posFoco?: number | null;
  onClose: () => void;
  onChange: (novos: Carro[]) => void;
  onCriarColaborador?: () => void;
}

function AvatarMini({ nome, foto }: { nome: string; foto: string }) {
  const [err, setErr] = useState(false);
  if (!foto || err) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
        {initials(nome)}
      </div>
    );
  }
  return (
    <img
      src={foto}
      alt={nome}
      onError={() => setErr(true)}
      className="h-10 w-10 shrink-0 rounded-full object-cover"
      loading="lazy"
    />
  );
}

const ROTULOS = ['Pessoa 1 · EQ01 (frente-esq)', 'Pessoa 2 · EQ01 (frente-dir)', 'Pessoa 3 · EQ02 (trás-esq)', 'Pessoa 4 · EQ02 (trás-dir)'] as const;

export default function GerenciarEquipeModal({ carro, carros, colabs, posFoco = null, onClose, onChange, onCriarColaborador }: Props) {
  const [slotSel, setSlotSel] = useState<number>(posFoco ?? 0);
  const [busca, setBusca] = useState('');
  const [soRegional, setSoRegional] = useState(true);

  const regCarro = regionalDoCarro(carro);
  const livres = useMemo(() => pessoasLivres(colabs, carros), [colabs, carros]);

  const candidatos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return livres
      .filter((c) => {
        if (soRegional && regionalDoColab(c, carros) !== regCarro) return false;
        if (!q) return true;
        return (c.nome + ' ' + c.funcao + ' ' + c.matricula).toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // reservas primeiro, depois alfabético
        if (a.status === 'reserva' && b.status !== 'reserva') return -1;
        if (b.status === 'reserva' && a.status !== 'reserva') return 1;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      })
      .slice(0, 60);
  }, [livres, busca, soRegional, regCarro, carros]);

  const ocupante = (posIndex: number): Colaborador | undefined =>
    isVago(carro.posicoes[posIndex]) ? undefined : colabs.find((c) => c.id === carro.posicoes[posIndex]);

  function adicionar(colabId: string) {
    const anterior = carroDaPessoa(carros, colabId);
    const novos = alocarPessoa(carros, colabId, carro.id, slotSel);
    onChange(novos);
    if (anterior && anterior.carro.id !== carro.id) {
      // feedback implícito: moveu de outro carro
    }
    // avança para próxima vaga
    const atualizado = novos.find((c) => c.id === carro.id) ?? carro;
    const proxVaga = atualizado.posicoes.findIndex((p) => isVago(p));
    if (proxVaga >= 0) setSlotSel(proxVaga);
    setBusca('');
  }

  function remover(posIndex: number) {
    onChange(removerDoCarro(carros, carro.id, posIndex));
    setSlotSel(posIndex);
  }

  const ocupAtual = ocupante(slotSel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="anim-pop max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-0 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header gradiente */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold leading-tight">Trocar equipe · 🚙 {carro.prefixo}</h2>
              {/* NOME DA REGIONAL — header da troca de unidade/equipe */}
              <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                📍 {regionalLabel(regCarro)}
              </p>
              <p className="mt-1 text-xs text-white/85">
                {regionalCurto(regCarro)} · {carro.placa} · {carro.modelo} · toque numa vaga e escolha a pessoa
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white/15 p-2 transition hover:bg-white/25" title="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* NOME DA REGIONAL — banner da unidade em troca */}
          <div className="flex items-center gap-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-200">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white">📍</span>
            <span className="flex-1">
              Unidade em troca: <b>{regionalLabel(regCarro)}</b>
              <span className="block text-[11px] font-semibold text-slate-500">
                🚙 {carro.prefixo} · {carro.placa} · substitutos filtrados por esta regional
              </span>
            </span>
          </div>
          {/* 4 vagas — EQ01 e EQ02 na mesma cor da Equipe 1 (índigo) */}
          <div className="grid gap-2 sm:grid-cols-2">
            {([0, 1, 2, 3] as const).map((i) => {
              const oc = ocupante(i);
              const sel = slotSel === i;
              const equipe = equipeDePosicao(i);
              return (
                <button
                  key={i}
                  onClick={() => setSlotSel(i)}
                  className={`relative flex items-center gap-2.5 overflow-hidden rounded-2xl border-2 p-3 text-left transition-all hover:scale-[1.01] ${
                    sel
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/15'
                      : oc
                        ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
                        : 'border-dashed border-slate-300 bg-indigo-500/5 dark:border-slate-600'
                  }`}
                >
                  <i className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${equipe.gradient}`} aria-hidden="true" />
                  {oc ? (
                    <AvatarMini nome={oc.nome} foto={oc.foto} />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-indigo-400 bg-indigo-500/10 text-indigo-500">
                      <Plus className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow ${`bg-gradient-to-r ${equipe.gradient} ${equipe.gradientShadow}`}`}>
                      {equipe.id} · vaga {i + 1}
                    </span>
                    <span className={`block truncate text-sm font-bold ${oc ? '' : equipe.text}`}>
                      {oc ? oc.nome : '+ Adicionar pessoa'}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {oc ? `${oc.funcao} · ${oc.matricula}` : ROTULOS[i]}
                    </span>
                  </span>
                  {oc && (
                    <span
                      role="button"
                      tabIndex={0}
                      title={`Remover ${oc.nome} da equipe`}
                      onClick={(e) => {
                        e.stopPropagation();
                        remover(i);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') remover(i);
                      }}
                      className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-red-500 hover:text-white dark:bg-slate-700 dark:text-slate-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* slot em edição */}
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-3.5">
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-indigo-500">
              {ocupAtual ? `Ocupada por ${ocupAtual.nome.split(' ')[0]} — escolha para trocar` : `Vaga ${slotSel + 1} selecionada — escolha quem entra`}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {ocupAtual
                ? 'Ao escolher outra pessoa, ela assume a vaga e o ocupante atual fica livre para outra equipe.'
                : 'Somente pessoas livres (fora de qualquer carro) aparecem aqui. Ativos e reservas.'}
            </p>
            {ocupAtual && (
              <button onClick={() => remover(slotSel)} className="btn-ghost mt-2 !py-1.5 !text-xs">
                <Trash2 className="h-3.5 w-3.5" /> Deixar vaga vazia
              </button>
            )}
          </div>

          {/* busca + filtro */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar pessoa livre por nome, função, matrícula…"
                className="input !pl-9"
              />
            </div>
            <button
              onClick={() => setSoRegional(!soRegional)}
              className={`rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                soRegional ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
              title={`Filtrar pela regional do carro (${regionalLabel(regCarro)})`}
            >
              📍 {soRegional ? `só ${regionalLabel(regCarro)}` : 'todas regionais'}
            </button>
          </div>

          <p className="text-[11px] font-semibold text-slate-500">
            {livres.length} pessoas livres no total · mostrando {candidatos.length}
            {soRegional ? ` de ${regionalLabel(regCarro)}` : ' (todas as regionais)'}.
          </p>

          {/* lista candidatos */}
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-0.5">
            {candidatos.map((c) => (
              <button
                key={c.id}
                onClick={() => adicionar(c.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-2.5 text-left transition-all hover:-translate-y-px hover:border-indigo-400 hover:bg-indigo-500/10 hover:shadow-md dark:border-slate-700"
              >
                <AvatarMini nome={c.nome} foto={c.foto} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{c.nome}</span>
                  <span
                    className="block truncate text-[11px] text-slate-500"
                    title={regionalLabel(regionalDoColab(c, carros))}
                  >
                    {c.funcao} · {c.matricula} · 📍 {regionalLabel(regionalDoColab(c, carros))} ({regionalCurto(regionalDoColab(c, carros))})
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase ${
                    c.status === 'reserva' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                  }`}
                >
                  {c.status === 'reserva' ? 'reserva' : 'ativo'}
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-bold text-white">
                  <Plus className="h-3.5 w-3.5" /> Alocar
                </span>
              </button>
            ))}
            {candidatos.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                <p className="text-sm font-bold">Nenhuma pessoa livre encontrada.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Todas as pessoas {soRegional ? `de ${regionalCurto(regCarro)} ` : ''}já estão em equipes, ou a busca não retornou nada.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {soRegional && (
                    <button onClick={() => setSoRegional(false)} className="btn-ghost !py-2 !text-xs">
                      <ArrowLeftRight className="h-3.5 w-3.5" /> Ver todas as regionais
                    </button>
                  )}
                  {onCriarColaborador && (
                    <button onClick={onCriarColaborador} className="btn-primary !py-2 !text-xs">
                      <Plus className="h-3.5 w-3.5" /> Cadastrar pessoa
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-primary flex-1">
              Concluir — voltar à operação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
