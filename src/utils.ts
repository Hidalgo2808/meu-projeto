import type { BancoRegistros, Carro, Colaborador, EquipeInfo, EquipeStatus, Indicadores, RegistrosDoDia } from './types';

export const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const toBR = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const nowHM = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const initials = (nome: string): string =>
  nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

export const uid = (p = 'id'): string => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function situacaoDe(colabId: string, dia: RegistrosDoDia | undefined): 'presente' | 'falta' | 'substituicao' {
  if (!dia || !dia[colabId]) return 'presente';
  return dia[colabId].situacao;
}

export function titulares(carros: Carro[]): string[] {
  return carros.flatMap((c) => c.posicoes);
}

export function equipesDoDia(carros: Carro[]): EquipeInfo[] {
  const out: EquipeInfo[] = [];
  for (const carro of carros) {
    out.push({
      codigo: `${carro.prefixo} · EQ01`,
      carroPrefixo: carro.prefixo,
      carroId: carro.id,
      membroIds: [carro.posicoes[0], carro.posicoes[1]],
      status: 'completa',
    });
    out.push({
      codigo: `${carro.prefixo} · EQ02`,
      carroPrefixo: carro.prefixo,
      carroId: carro.id,
      membroIds: [carro.posicoes[2], carro.posicoes[3]],
      status: 'completa',
    });
  }
  return out;
}

export function statusEquipe(m1: string, m2: string, dia: RegistrosDoDia | undefined): EquipeStatus {
  const ok = (id: string) => {
    const s = situacaoDe(id, dia);
    return s === 'presente' || s === 'substituicao';
  };
  const n = (ok(m1) ? 1 : 0) + (ok(m2) ? 1 : 0);
  if (n === 2) return 'completa';
  if (n === 1) return 'incompleta';
  return 'sem-equipe';
}

export function statusCarro(carro: Carro, dia: RegistrosDoDia | undefined): { presentes: number; label: string; classe: 'ok' | 'warn' | 'bad' } {
  const presentes = carro.posicoes.filter((id) => {
    const s = situacaoDe(id, dia);
    return s === 'presente' || s === 'substituicao';
  }).length;
  if (presentes === 4) return { presentes, label: '2 equipes completas', classe: 'ok' };
  if (presentes === 3) return { presentes, label: '1 completa + 1 incompleta', classe: 'warn' };
  if (presentes === 2) {
    const eq1 = statusEquipe(carro.posicoes[0], carro.posicoes[1], dia);
    const eq2 = statusEquipe(carro.posicoes[2], carro.posicoes[3], dia);
    if (eq1 === 'completa' || eq2 === 'completa') return { presentes, label: '1 equipe completa', classe: 'ok' };
    return { presentes, label: '2 equipes incompletas', classe: 'warn' };
  }
  if (presentes === 1) return { presentes, label: 'Equipe incompleta', classe: 'warn' };
  return { presentes, label: 'Sem equipe', classe: 'bad' };
}

export function calcIndicadores(
  colaboradores: Colaborador[],
  carros: Carro[],
  dia: RegistrosDoDia | undefined,
): Indicadores {
  const tids = titulares(carros).filter((id) => colaboradores.some((c) => c.id === id && c.status !== 'inativo'));
  const totalColaboradores = tids.length;
  let presentes = 0;
  let faltas = 0;
  let substituicoes = 0;
  for (const id of tids) {
    const s = situacaoDe(id, dia);
    if (s === 'presente') presentes += 1;
    else if (s === 'falta') faltas += 1;
    else if (s === 'substituicao') substituicoes += 1;
  }
  presentes += substituicoes; // substituto conta como presente operacionalmente? Não — mantemos separado. Corrige:
  presentes = tids.length - faltas - substituicoes;

  const equipes = equipesDoDia(carros);
  let completas = 0;
  let incompletas = 0;
  let semEquipe = 0;
  for (const e of equipes) {
    const st = statusEquipe(e.membroIds[0], e.membroIds[1], dia);
    if (st === 'completa') completas += 1;
    else if (st === 'incompleta') incompletas += 1;
    else semEquipe += 1;
  }
  let carrosOperando = 0;
  let carrosSemEquipe = 0;
  for (const c of carros) {
    const { presentes: p } = statusCarro(c, dia);
    if (p > 0) carrosOperando += 1;
    else carrosSemEquipe += 1;
  }
  return {
    totalColaboradores,
    presentes,
    faltas,
    substituicoes,
    totalEquipes: equipes.length,
    completas,
    incompletas,
    semEquipe,
    totalCarros: carros.length,
    carrosOperando,
    carrosSemEquipe,
  };
}

export function listaFaltas(
  colaboradores: Colaborador[],
  carros: Carro[],
  dia: RegistrosDoDia | undefined,
): Array<{ colab: Colaborador; carro: Carro; equipe: string; registro: NonNullable<RegistrosDoDia[string]>; substituto?: Colaborador }> {
  if (!dia) return [];
  const out: Array<{ colab: Colaborador; carro: Carro; equipe: string; registro: NonNullable<RegistrosDoDia[string]>; substituto?: Colaborador }> = [];
  for (const carro of carros) {
    carro.posicoes.forEach((id, idx) => {
      const r = dia[id];
      if (!r || r.situacao === 'presente') return;
      const colab = colaboradores.find((c) => c.id === id);
      if (!colab) return;
      const equipe = idx < 2 ? 'EQ01' : 'EQ02';
      const substituto = r.substitutoId ? colaboradores.find((c) => c.id === r.substitutoId) : undefined;
      out.push({ colab, carro, equipe, registro: r, substituto });
    });
  }
  return out;
}

// ---------- Exportação Excel (compatível, sem dependências) ----------
function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function exportarExcel(
  dataISO: string,
  indicadores: Indicadores,
  linhas: Array<{ data: string; carro: string; equipe: string; colaborador: string; funcao: string; situacao: string; substituto: string; hora: string }>,
): void {
  const detalheRows = linhas
    .map(
      (l) =>
        `<tr><td>${escHtml(l.data)}</td><td>${escHtml(l.carro)}</td><td>${escHtml(l.equipe)}</td><td>${escHtml(l.colaborador)}</td><td>${escHtml(l.funcao)}</td><td>${escHtml(l.situacao)}</td><td>${escHtml(l.substituto)}</td><td>${escHtml(l.hora)}</td></tr>`,
    )
    .join('');
  const resumoRows = [
    ['Total de colaboradores', indicadores.totalColaboradores],
    ['Presentes', indicadores.presentes],
    ['Faltas', indicadores.faltas],
    ['Substituições', indicadores.substituicoes],
    ['Total de equipes', indicadores.totalEquipes],
    ['Equipes completas', indicadores.completas],
    ['Equipes incompletas', indicadores.incompletas],
    ['Equipes sem efetivo', indicadores.semEquipe],
    ['Total de carros', indicadores.totalCarros],
    ['Carros operando', indicadores.carrosOperando],
    ['Carros sem equipe', indicadores.carrosSemEquipe],
  ]
    .map(([k, v]) => `<tr><td>${escHtml(String(k))}</td><td>${v}</td></tr>`)
    .join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>
<h2>Fechamento — ${escHtml(toBR(dataISO))}</h2>
<h3>Resumo Diário</h3>
<table border="1"><tr><th>Indicador</th><th>Quantidade</th></tr>${resumoRows}</table>
<h3>Detalhamento</h3>
<table border="1"><tr><th>Data</th><th>Carro</th><th>Equipe</th><th>Colaborador</th><th>Função</th><th>Situação</th><th>Substituto</th><th>Hora</th></tr>${detalheRows}</table>
</body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fechamento-${dataISO}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------- Exportação PDF (janela de impressão) ----------
export function exportarPDF(
  dataISO: string,
  indicadores: Indicadores,
  faltas: Array<{ colaborador: string; funcao: string; carro: string; equipe: string; situacao: string; substituto: string }>,
): void {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) {
    alert('Permita pop-ups para exportar o PDF.');
    return;
  }
  const rows = faltas
    .map(
      (f) =>
        `<tr><td>${escHtml(f.colaborador)}</td><td>${escHtml(f.funcao)}</td><td>${escHtml(f.carro)}</td><td>${escHtml(f.equipe)}</td><td>${escHtml(f.situacao)}</td><td>${escHtml(f.substituto)}</td></tr>`,
    )
    .join('');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Fechamento ${toBR(dataISO)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px}
.header{background:#0f172a;color:#fff;padding:20px 24px;border-radius:12px}
.header h1{margin:0;font-size:22px}.header p{margin:4px 0 0;opacity:.8}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
.card{border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center}
.card b{font-size:24px;display:block}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}
th{background:#f1f5f9}
.footer{margin-top:20px;font-size:12px;color:#64748b}
@media print{.noprint{display:none}}
</style></head><body>
<div class="header"><h1>CONTROLE DIÁRIO DE EQUIPES E FALTAS</h1><p>Data: ${toBR(dataISO)} · Sistema 4x4</p></div>
<div class="grid">
<div class="card"><span>Total colaboradores</span><b>${indicadores.totalColaboradores}</b></div>
<div class="card"><span>Presentes</span><b>${indicadores.presentes}</b></div>
<div class="card"><span>Faltas</span><b>${indicadores.faltas}</b></div>
<div class="card"><span>Substituições</span><b>${indicadores.substituicoes}</b></div>
<div class="card"><span>Equipes</span><b>${indicadores.totalEquipes}</b></div>
<div class="card"><span>Completas</span><b>${indicadores.completas}</b></div>
<div class="card"><span>Incompletas</span><b>${indicadores.incompletas}</b></div>
<div class="card"><span>Carros operando</span><b>${indicadores.carrosOperando}/${indicadores.totalCarros}</b></div>
</div>
<h3>Detalhamento de faltas e substituições</h3>
<table><thead><tr><th>Colaborador</th><th>Função</th><th>Carro</th><th>Equipe</th><th>Situação</th><th>Substituto</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Nenhuma falta registrada.</td></tr>'}</tbody></table>
<div class="footer">Gerado automaticamente pelo Sistema de Controle de Faltas 4x4.</div>
<div class="noprint" style="margin-top:16px"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
</body></html>`);
  w.document.close();
  w.focus();
}

// ---------- Importação simples de CSV/Excel-colado ----------
export function parseColaboradoresCSV(text: string): Array<Pick<Colaborador, 'nome' | 'cpf' | 'matricula' | 'funcao'>> {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const hasHeader = /nome/i.test(lines[0]);
  const body = hasHeader ? lines.slice(1) : lines;
  return body.slice(0, 500).map((line) => {
    const parts = line.split(/[,;|\t]/).map((p) => p.trim());
    return {
      nome: parts[0] || 'Sem nome',
      cpf: (parts[1] || '').replace(/\D/g, '').slice(0, 11) || '00000000000',
      funcao: parts[2] || 'Auxiliar',
      matricula: parts[3] || String(Math.floor(1000 + Math.random() * 9000)),
    };
  });
}

export function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveLS(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function historicoFaltas(registros: BancoRegistros): Array<{ data: string; faltas: number; subs: number }> {
  return Object.keys(registros)
    .sort()
    .slice(-14)
    .map((data) => {
      const dia = registros[data];
      const vals = Object.values(dia);
      return {
        data,
        faltas: vals.filter((v) => v.situacao === 'falta').length,
        subs: vals.filter((v) => v.situacao === 'substituicao').length,
      };
    });
}
