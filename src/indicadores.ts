import type { BancoRegistros, Colaborador, RegistrosDoDia } from './types';

export interface RankingMensalItem {
  colabId: string;
  nome: string;
  foto: string;
  funcao: string;
  matricula: string;
  faltas: number;
  substituicoes: number;
  afastamentos: number;
  totalAusencias: number;
  diasAtivosNoMes: number;
  taxaFalta: number;
  principalMotivo: string;
  motivos: Record<string, number>;
  ultimaFalta: string;
}

export interface MesResumo {
  mesKey: string; // yyyy-MM
  rotulo: string; // ex: set/2026
  rotuloLongo: string; // ex: Setembro de 2026
  totalFaltas: number;
  totalSubs: number;
  totalAfastados: number;
  diasComLancamento: number;
  campeao?: RankingMensalItem;
}

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function mesKeyDeData(iso: string): string {
  return iso.slice(0, 7);
}

export function rotuloMes(mesKey: string): string {
  const [y, m] = mesKey.split('-').map(Number);
  if (!y || !m) return mesKey;
  return `${MESES_CURTO[m - 1]}/${y}`;
}

export function rotuloMesLongo(mesKey: string): string {
  const [y, m] = mesKey.split('-').map(Number);
  if (!y || !m) return mesKey;
  return `${MESES_PT[m - 1]} de ${y}`;
}

export function listarMesesDisponiveis(registros: BancoRegistros): string[] {
  const set = new Set<string>();
  for (const data of Object.keys(registros)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) set.add(mesKeyDeData(data));
  }
  return [...set].sort().reverse();
}

function normalizaMotivo(m?: string): string {
  const v = (m ?? '').trim();
  return v === '' ? 'Sem motivo informado' : v;
}

export function rankingDoMes(
  registros: BancoRegistros,
  colabs: Colaborador[],
  mesKey: string,
): RankingMensalItem[] {
  const porColab = new Map<string, { faltas: number; subs: number; afastamentos: number; motivos: Record<string, number>; ultima: string }>();
  const diasSet = new Set<string>();

  for (const [data, dia] of Object.entries(registros)) {
    if (!data.startsWith(mesKey)) continue;
    diasSet.add(data);
    for (const [colabId, reg] of Object.entries(dia)) {
      // CORREÇÃO: nunca conta lugar vazio ('', '   ') no ranking
      if (!colabId || colabId.trim() === '') continue;
      if (reg.situacao === 'presente') continue;
      const acc = porColab.get(colabId) ?? { faltas: 0, subs: 0, afastamentos: 0, motivos: {}, ultima: '' };
      if (reg.situacao === 'falta') acc.faltas += 1;
      else if (reg.situacao === 'substituicao') acc.subs += 1;
      else if (reg.situacao === 'afastado' || reg.situacao === 'ferias') acc.afastamentos += 1;
      else acc.subs += 1;
      const mot = reg.situacao === 'afastado'
        ? `Afastado ${(reg.afastadoTipo ?? reg.motivo ?? 'INSS').toString().trim() || 'INSS'}`
        : normalizaMotivo(reg.motivo);
      acc.motivos[mot] = (acc.motivos[mot] ?? 0) + 1;
      if (data > acc.ultima) acc.ultima = data;
      porColab.set(colabId, acc);
    }
  }

  const diasAtivos = diasSet.size;
  const out: RankingMensalItem[] = [];

  for (const [colabId, acc] of porColab) {
    const c = colabs.find((x) => x.id === colabId);
    const nome = c?.nome ?? `Colaborador ${colabId}`;
    const total = acc.faltas + acc.subs + acc.afastamentos;
    const principal = Object.entries(acc.motivos).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    out.push({
      colabId,
      nome,
      foto: c?.foto ?? '',
      funcao: c?.funcao ?? '—',
      matricula: c?.matricula ?? '—',
      faltas: acc.faltas,
      substituicoes: acc.subs,
      afastamentos: acc.afastamentos,
      totalAusencias: total,
      diasAtivosNoMes: diasAtivos,
      taxaFalta: diasAtivos > 0 ? Math.round((acc.faltas / diasAtivos) * 1000) / 10 : 0,
      principalMotivo: principal,
      motivos: acc.motivos,
      ultimaFalta: acc.ultima,
    });
  }

  out.sort((a, b) => {
    if (b.faltas !== a.faltas) return b.faltas - a.faltas;
    if (b.totalAusencias !== a.totalAusencias) return b.totalAusencias - a.totalAusencias;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });

  return out;
}

export function resumosPorMes(registros: BancoRegistros, colabs: Colaborador[]): MesResumo[] {
  const meses = listarMesesDisponiveis(registros);
  return meses.map((mesKey) => {
    const ranking = rankingDoMes(registros, colabs, mesKey);
    const dias = new Set(Object.keys(registros).filter((d) => d.startsWith(mesKey))).size;
    const totalFaltas = ranking.reduce((s, r) => s + r.faltas, 0);
    const totalSubs = ranking.reduce((s, r) => s + r.substituicoes, 0);
    const totalAfastados = ranking.reduce((s, r) => s + (r.afastamentos ?? 0), 0);
    return {
      mesKey,
      rotulo: rotuloMes(mesKey),
      rotuloLongo: rotuloMesLongo(mesKey),
      totalFaltas,
      totalSubs,
      totalAfastados,
      diasComLancamento: dias,
      campeao: ranking[0],
    };
  });
}

export function motivosDoMes(registros: BancoRegistros, mesKey: string): Array<{ motivo: string; qtd: number }> {
  const map = new Map<string, number>();
  for (const [data, dia] of Object.entries(registros)) {
    if (!data.startsWith(mesKey)) continue;
    for (const [id, reg] of Object.entries(dia)) {
      if (!id || id.trim() === '') continue;
      if (reg.situacao === 'presente') continue;
      const m = reg.situacao === 'afastado'
        ? `Afastado ${((reg.afastadoTipo ?? reg.motivo ?? 'INSS') as string).trim() || 'INSS'}`
        : normalizaMotivo(reg.motivo);
      map.set(m, (map.get(m) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([motivo, qtd]) => ({ motivo, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 8);
}

export function evolucaoMensalColaborador(registros: BancoRegistros, colabId: string): Array<{ mesKey: string; faltas: number; afastamentos: number }> {
  const meses = listarMesesDisponiveis(registros).sort();
  return meses.map((mesKey) => {
    let faltas = 0;
    let afastamentos = 0;
    for (const [data, dia] of Object.entries(registros)) {
      if (!data.startsWith(mesKey)) continue;
      const r = (dia as RegistrosDoDia)[colabId];
      if (r && r.situacao === 'falta') faltas += 1;
      else if (r && (r.situacao === 'afastado' || r.situacao === 'ferias')) afastamentos += 1;
    }
    return { mesKey, faltas, afastamentos };
  });
}

export function exportarRankingCSV(mesKey: string, ranking: RankingMensalItem[]): void {
  const header = 'Posição;Colaborador;Matrícula;Função;Faltas;Substituições;Afastamentos;Total ausências;Taxa de falta (%);Motivo principal;Última falta\n';
  const body = ranking
    .map(
      (r, i) =>
        `${i + 1};${r.nome};${r.matricula};${r.funcao};${r.faltas};${r.substituicoes};${r.afastamentos ?? 0};${r.totalAusencias};${String(r.taxaFalta).replace('.', ',')};${r.principalMotivo};${r.ultimaFalta}`,
    )
    .join('\n');
  const blob = new Blob(['﻿' + header + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ranking-faltas-${mesKey}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
