import { useState } from 'react';
import { Building2, MapPin, Save, X } from 'lucide-react';
import type { Carro, RegionalId } from '../types';
import { REGIONAIS, regionalDoCarro, regionalLabel } from '../utils';

interface Props {
  carro: Carro;
  onClose: () => void;
  onSave: (atualizado: Carro) => void;
}

const MODELOS = ['Hilux 4x4', 'S10 4x4', 'Ranger 4x4', 'Triton 4x4', 'Frontier 4x4'] as const;

/**
 * Modal de edição rápida usado DENTRO da aba Operação.
 * Permite alterar Unidade (Regional) + dados do carro sem sair da operação.
 * O NOME DA REGIONAL fica em:
 *  1) banner no topo do modal (unidade atual por extenso),
 *  2) título do bloco "Unidade / Regional",
 *  3) botões de opção com nome completo + badge de confirmação,
 *  4) linha de resumo antes de salvar.
 */
export default function EditarUnidadeCarroModal({ carro, onClose, onSave }: Props) {
  const [prefixo, setPrefixo] = useState(carro.prefixo);
  const [placa, setPlaca] = useState(carro.placa);
  const [modelo, setModelo] = useState(carro.modelo);
  const [regional, setRegional] = useState<RegionalId>(regionalDoCarro(carro));
  const [status, setStatus] = useState<Carro['status']>(carro.status);

  const unidadeAtual = regionalLabel(regionalDoCarro(carro));
  const unidadeNova = regionalLabel(regional);
  const mudou = regional !== regionalDoCarro(carro);

  function salvar() {
    if (!prefixo.trim()) {
      alert('Informe o prefixo do carro (ex: 4x4-01).');
      return;
    }
    onSave({
      ...carro,
      prefixo: prefixo.trim(),
      placa: placa.trim().toUpperCase() || '—',
      modelo: modelo.trim() || 'Hilux 4x4',
      regional,
      status,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="anim-pop w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold leading-tight">Trocar unidade · 🚙 {carro.prefixo}</h2>
              {/* NOME DA REGIONAL — topo do modal */}
              <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                <MapPin className="h-3 w-3" /> Unidade atual: {unidadeAtual}
              </p>
              <p className="mt-1 text-xs text-white/85">
                {carro.placa} · {carro.modelo} · altere a unidade sem sair da Operação
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white/15 p-2 transition hover:bg-white/25" title="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-3.5">
            {/* NOME DA REGIONAL — título do bloco */}
            <label className="label !mb-1 !text-emerald-600 dark:!text-emerald-300">
              📍 Unidade / Regional * — {unidadeNova}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REGIONAIS.map((r) => {
                const ativo = regional === r.id;
                const cls = r.id === 'ribas' ? 'from-emerald-600 to-teal-600' : 'from-sky-600 to-cyan-600';
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRegional(r.id)}
                    aria-pressed={ativo}
                    title={r.nome}
                    className={`rounded-xl px-3 py-2.5 text-left transition-all ${
                      ativo
                        ? `bg-gradient-to-r ${cls} text-white shadow-lg`
                        : 'bg-slate-100 text-slate-500 hover:shadow dark:bg-slate-800'
                    }`}
                  >
                    <span className="block text-xs font-extrabold uppercase tracking-wide">
                      📍 {r.curto}
                    </span>
                    {/* NOME COMPLETO DA REGIONAL dentro da opção */}
                    <span className={`block text-[11px] font-semibold ${ativo ? 'text-white/90' : 'text-slate-400'}`}>
                      {r.nome}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* NOME DA REGIONAL — resumo / confirmação */}
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span>
                {mudou ? (
                  <>Trocando de <b>{unidadeAtual}</b> → <b className="text-emerald-600">{unidadeNova}</b></>
                ) : (
                  <>Unidade selecionada: <b>{unidadeNova}</b></>
                )}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              A unidade define o filtro regional, os indicadores e de onde vêm os substitutos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prefixo *</label>
              <input value={prefixo} onChange={(e) => setPrefixo(e.target.value)} className="input" placeholder="4x4-01" />
            </div>
            <div>
              <label className="label">Placa</label>
              <input
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="input"
                placeholder="ABC-1234"
              />
            </div>
            <div>
              <label className="label">Modelo</label>
              <select value={modelo} onChange={(e) => setModelo(e.target.value)} className="input">
                {MODELOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Carro['status'])} className="input">
                <option value="operando">🚙 Operando</option>
                <option value="manutencao">🔧 Manutenção</option>
                <option value="inativo">⛔ Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
            <button onClick={salvar} className="btn-primary flex-1">
              <Save className="h-4 w-4" /> Salvar em {unidadeNova.replace('Regional de ', '')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
