import type { BancoRegistros, Carro, Colaborador, EquipeInfo, EquipeStatus, FiltroRegionalId, Indicadores, RegionalId, RegistrosDoDia, Situacao } from './types';
import { FUNCOES_COLABORADOR } from './types';

// ---------- Funções de colaborador ----------
/** Mapa de migração das funções removidas (Auxiliar, Motorista, Líder de Equipe, Operador). */
const FUNCOES_REMOVIDAS_MAP: Record<string, string> = {
  auxiliar: 'Auxiliar de Inventário Florestal',
  motorista: 'Auxiliar de Inventário Florestal',
  operador: 'Auxiliar de Inventário Florestal',
  'lider de equipe': 'Líder de Inventário Florestal',
};

/** Normaliza variações sem acento / caixa diferente para o nome oficial da função. */
export function normalizarFuncao(v: unknown): string {
  const txt = String(v ?? '').trim();
  if (!txt) return 'Auxiliar de Inventário Florestal';
  const semAcento = txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const achada = (FUNCOES_COLABORADOR as readonly string[]).find((f) => {
    const n = f
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    return n === semAcento;
  });
  if (achada) return achada;
  // Migra funções antigas removidas para as oficiais atuais
  if (FUNCOES_REMOVIDAS_MAP[semAcento]) return FUNCOES_REMOVIDAS_MAP[semAcento];
  // Aceita legado / valores livres mantendo o texto original capitalizado
  return txt;
}

/** Migra lista de colaboradores com funções antigas para as funções oficiais atuais. */
export function migrarFuncoesColabs(colabs: Colaborador[]): Colaborador[] {
  return colabs.map((c) => ({ ...c, funcao: normalizarFuncao(c.funcao) }));
}

// ---------- Regionais ----------
export const REGIONAIS: Array<{ id: RegionalId; nome: string; curto: string }> = [
  { id: 'ribas', nome: 'Regional de Ribas', curto: 'Ribas' },
  { id: 'agua-clara', nome: 'Regional de Água Clara', curto: 'Água Clara' },
];

export function regionalLabel(id: RegionalId | string | undefined | null): string {
  if (id === 'agua-clara') return 'Regional de Água Clara';
  if (id === 'ribas') return 'Regional de Ribas';
  return 'Regional de Ribas';
}

export function regionalCurto(id: RegionalId | string | undefined | null): string {
  if (id === 'agua-clara') return 'Água Clara';
  return 'Ribas';
}

export function normalizaRegional(v: unknown): RegionalId {
  return v === 'agua-clara' ? 'agua-clara' : 'ribas';
}

export function regionalDoCarro(carro: Carro): RegionalId {
  return normalizaRegional(carro.regional);
}

export function regionalDoColab(
  colab: Colaborador,
  carros: Carro[],
): RegionalId {
  if (colab.regional === 'ribas' || colab.regional === 'agua-clara') return colab.regional;
  const carro = carros.find((c) => c.posicoes.includes(colab.id));
  if (carro) return regionalDoCarro(carro);
  return 'ribas';
}

/** Migra dados antigos (sem regional) distribuindo por prefixo/posição para preview imediato. */
export function migrarCarrosComRegional(carros: Carro[], colabs: Colaborador[]): Carro[] {
  return carros.map((carro, idx) => {
    if (carro.regional === 'ribas' || carro.regional === 'agua-clara') return carro;
    // Heurística: tenta herdar da maioria dos titulares; senão alterna por índice (metade Ribas, metade Água Clara)
    const votos = carro.posicoes.map((id) => colabs.find((c) => c.id === id)?.regional);
    const agua = votos.filter((v) => v === 'agua-clara').length;
    const rib = votos.filter((v) => v === 'ribas').length;
    if (agua !== rib) return { ...carro, regional: agua > rib ? 'agua-clara' : 'ribas' };
    const metade = Math.ceil(carros.length / 2);
    return { ...carro, regional: idx < metade ? 'ribas' : 'agua-clara' };
  });
}

export function migrarColabsComRegional(colabs: Colaborador[], carros: Carro[]): Colaborador[] {
  const mapaCarro = new Map<string, RegionalId>();
  for (const carro of carros) {
    for (const id of carro.posicoes) {
      mapaCarro.set(id, normalizaRegional(carro.regional));
    }
  }
  return colabs.map((c, idx) => {
    if (c.regional === 'ribas' || c.regional === 'agua-clara') return c;
    const herdada = mapaCarro.get(c.id);
    if (herdada) return { ...c, regional: herdada };
    // Reservas sem vínculo: alterna para equilibrar
    return { ...c, regional: idx % 2 === 0 ? 'ribas' : 'agua-clara' };
  });
}

export function filtrarCarrosPorRegional(carros: Carro[], filtro: FiltroRegionalId): Carro[] {
  if (filtro === 'todas') return carros;
  return carros.filter((c) => regionalDoCarro(c) === filtro);
}

export function filtrarColabsPorRegional(
  colabs: Colaborador[],
  carros: Carro[],
  filtro: FiltroRegionalId,
): Colaborador[] {
  if (filtro === 'todas') return colabs;
  return colabs.filter((c) => regionalDoColab(c, carros) === filtro);
}

export function contarPorRegional(
  carros: Carro[],
  colabs: Colaborador[],
): Record<FiltroRegionalId, { carros: number; colabs: number }> {
  const ribasCarros = carros.filter((c) => regionalDoCarro(c) === 'ribas').length;
  const aguaCarros = carros.filter((c) => regionalDoCarro(c) === 'agua-clara').length;
  const ribasColabs = colabs.filter((c) => regionalDoColab(c, carros) === 'ribas').length;
  const aguaColabs = colabs.filter((c) => regionalDoColab(c, carros) === 'agua-clara').length;
  return {
    todas: { carros: carros.length, colabs: colabs.length },
    ribas: { carros: ribasCarros, colabs: ribasColabs },
    'agua-clara': { carros: aguaCarros, colabs: aguaColabs },
  };
}

export function historicoFaltasPorRegional(
  registros: BancoRegistros,
  carros: Carro[],
  colabs: Colaborador[],
  filtro: FiltroRegionalId,
): Array<{ data: string; faltas: number; subs: number; afastados: number }> {
  if (filtro === 'todas') return historicoFaltas(registros);
  const idsDaRegional = new Set(
    filtrarColabsPorRegional(colabs, carros, filtro).map((c) => c.id),
  );
  // Também inclui qualquer titular dos carros da regional (garante consistência com Operação)
  // CORREÇÃO: ignora lugares vazios — nunca adiciona '' ao escopo
  for (const carro of filtrarCarrosPorRegional(carros, filtro)) {
    for (const id of carro.posicoes) {
      if (!isVago(id)) idsDaRegional.add(id);
    }
  }
  return Object.keys(registros)
    .sort()
    .slice(-14)
    .map((data) => {
      const dia = registros[data];
      let faltas = 0;
      let subs = 0;
      let afastados = 0;
      for (const [colabId, reg] of Object.entries(dia)) {
        if (isVago(colabId)) continue;
        if (!idsDaRegional.has(colabId)) continue;
        if (reg.situacao === 'falta') faltas += 1;
        else if (reg.situacao === 'substituicao') subs += 1;
        else if (reg.situacao === 'afastado' || reg.situacao === 'ferias') afastados += 1;
      }
      return { data, faltas, subs, afastados };
    });
}

export const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Data automática de entrada no aplicativo — sempre o dia atual local (yyyy-mm-dd). */
export const dataAutomaticaHoje = (): string => todayKey();

/** True se a data informada é hoje (usado para selo "Hoje · automática"). */
export const isHoje = (iso: string): boolean => iso === todayKey();

/** Nome do dia da semana em pt-BR para uma chave yyyy-mm-dd. */
export const diaSemanaBR = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('pt-BR', { weekday: 'long' });
};

/** Data longa em pt-BR: "terça-feira · 22/09/2026". */
export const dataLongaBR = (iso: string): string => {
  const sem = diaSemanaBR(iso);
  const cap = sem ? sem.charAt(0).toUpperCase() + sem.slice(1) : '';
  return cap ? `${cap} · ${toBR(iso)}` : toBR(iso);
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

export function situacaoDe(colabId: string, dia: RegistrosDoDia | undefined): Situacao {
  if (!dia || !dia[colabId]) return 'presente';
  return dia[colabId].situacao ?? 'presente';
}

/** Rótulo amigável da situação (inclui Afastado INSS). */
export function situacaoLabel(s: Situacao, motivo?: string): string {
  if (s === 'presente') return 'Presente';
  if (s === 'falta') return 'Falta';
  if (s === 'substituicao') return 'Substituição';
  if (s === 'ferias') return 'Férias';
  if (s === 'afastado') {
    const m = (motivo ?? '').trim().toUpperCase();
    if (m === 'INSS' || m === '') return 'Afastado INSS';
    return `Afastado ${motivo}`;
  }
  return 'Presente';
}

/** True para qualquer ausência que tira o titular da operação (falta, afastado, férias). */
export function isAusencia(s: Situacao): boolean {
  return s === 'falta' || s === 'afastado' || s === 'ferias';
}

/** Slot vago? (string vazia, nula, indefinida ou só espaços) */
export function isVago(id: unknown): boolean {
  return !id || (typeof id === 'string' && id.trim() === '');
}

export function titulares(carros: Carro[]): string[] {
  // CORREÇÃO: nunca contar lugares vazios ('' / null / '   ') como pessoa
  return carros.flatMap((c) => c.posicoes).filter((id) => !isVago(id));
}

/** Encontra o carro + índice da posição onde a pessoa está alocada. */
export function carroDaPessoa(
  carros: Carro[],
  colabId: string,
): { carro: Carro; posIndex: number } | null {
  if (isVago(colabId)) return null;
  for (const carro of carros) {
    const idx = carro.posicoes.findIndex((p) => p === colabId);
    if (idx >= 0) return { carro, posIndex: idx };
  }
  return null;
}

/** Lista pessoas livres (sem carro) para alocar — exclui inativos e quem já está em algum carro. */
export function pessoasLivres(colabs: Colaborador[], carros: Carro[]): Colaborador[] {
  const emUso = new Set(titulares(carros));
  return colabs.filter((c) => c.status !== 'inativo' && !emUso.has(c.id));
}

/** Conta vagas (slots vazios) de um carro. */
export function vagasDoCarro(carro: Carro): number {
  return carro.posicoes.filter((p) => isVago(p)).length;
}

/** Total de pessoas realmente alocadas (ignora lugares vazios). */
export function totalOcupados(carros: Carro[]): number {
  return titulares(carros).length;
}

/** Total de vagas vazias em um conjunto de carros. */
export function totalVagas(carros: Carro[]): number {
  return carros.reduce((s, c) => s + vagasDoCarro(c), 0);
}

/** Total real de equipes (2 pessoas = 1, 3 pessoas = 1, 4 pessoas = 2, 0 = 0). Nunca conta vaga vazia. */
export function totalEquipesReais(carros: Carro[]): number {
  return carros.reduce((s, c) => s + quantEquipesDoCarro(c), 0);
}

/**
 * Distribuição de ocupação dos carros.
 * - com4 = carro fechado com 4 pessoas (lotação máxima / 2 equipes)
 * - com3 = carro com 3 pessoas (1 equipe de 3)
 * - com2 = carro com 2 pessoas (1 equipe de 2)
 * - com1 / vazios para completar o quadro
 * Ignora vagas vazias, ids fantasmas e inativos quando `colabs` é informado.
 */
export function distribuicaoOcupacaoCarros(
  carros: Carro[],
  colabs?: Colaborador[],
): { com4: number; com3: number; com2: number; com1: number; vazios: number; total: number; detalhe: Array<{ carroId: string; prefixo: string; placa: string; ocupados: number; fechado4: boolean }> } {
  let com4 = 0;
  let com3 = 0;
  let com2 = 0;
  let com1 = 0;
  let vazios = 0;
  const detalhe: Array<{ carroId: string; prefixo: string; placa: string; ocupados: number; fechado4: boolean }> = [];
  for (const carro of carros) {
    const ocupados = colabs ? ocupadosValidosDoCarro(carro, colabs) : ocupadosDoCarro(carro);
    const n = ocupados.length;
    if (n >= 4) com4 += 1;
    else if (n === 3) com3 += 1;
    else if (n === 2) com2 += 1;
    else if (n === 1) com1 += 1;
    else vazios += 1;
    detalhe.push({ carroId: carro.id, prefixo: carro.prefixo, placa: carro.placa, ocupados: n, fechado4: n >= 4 });
  }
  detalhe.sort((a, b) => b.ocupados - a.ocupados || a.prefixo.localeCompare(b.prefixo, 'pt-BR'));
  return { com4, com3, com2, com1, vazios, total: carros.length, detalhe };
}

/**
 * Aloca uma pessoa em um carro/posição.
 * - Remove automaticamente do carro anterior (troca de equipe).
 * - Retorna lista nova de carros (imutável).
 */
export function alocarPessoa(
  carros: Carro[],
  colabId: string,
  carroDestinoId: string,
  posIndex: number,
): Carro[] {
  if (!colabId || posIndex < 0 || posIndex > 3) return carros;
  return carros.map((c) => {
    // remove de onde estava
    let pos = c.posicoes.map((p) => (p === colabId ? '' : p)) as [string, string, string, string];
    // aloca no destino
    if (c.id === carroDestinoId) {
      const nova = [...pos] as [string, string, string, string];
      nova[posIndex] = colabId;
      pos = nova;
    }
    if (pos.every((p, i) => p === c.posicoes[i])) return c;
    return { ...c, posicoes: pos };
  });
}

/** Remove (deixa vago) uma posição de um carro. */
export function removerDoCarro(carros: Carro[], carroId: string, posIndex: number): Carro[] {
  return carros.map((c) => {
    if (c.id !== carroId) return c;
    const nova = [...c.posicoes] as [string, string, string, string];
    nova[posIndex] = '';
    return { ...c, posicoes: nova };
  });
}

/** Troca duas pessoas de posição (mesmo carro ou entre carros). */
export function trocarPosicoes(
  carros: Carro[],
  a: { carroId: string; posIndex: number },
  b: { carroId: string; posIndex: number },
): Carro[] {
  const ca = carros.find((c) => c.id === a.carroId);
  const cb = carros.find((c) => c.id === b.carroId);
  if (!ca || !cb) return carros;
  const va = ca.posicoes[a.posIndex] ?? '';
  const vb = cb.posicoes[b.posIndex] ?? '';
  return carros.map((c) => {
    if (c.id === a.carroId && c.id === b.carroId) {
      const nova = [...c.posicoes] as [string, string, string, string];
      nova[a.posIndex] = vb;
      nova[b.posIndex] = va;
      return { ...c, posicoes: nova };
    }
    if (c.id === a.carroId) {
      const nova = [...c.posicoes] as [string, string, string, string];
      nova[a.posIndex] = vb;
      return { ...c, posicoes: nova };
    }
    if (c.id === b.carroId) {
      const nova = [...c.posicoes] as [string, string, string, string];
      nova[b.posIndex] = va;
      return { ...c, posicoes: nova };
    }
    return c;
  });
}

/** Pessoas alocadas (slots preenchidos) de um carro — ignora lugares vazios. */
export function ocupadosDoCarro(carro: Carro): string[] {
  return carro.posicoes.filter((p) => !isVago(p));
}

/** Ocupantes válidos: slot preenchido E pessoa existente (não inativa quando colabs informado). */
export function ocupadosValidosDoCarro(carro: Carro, colabs?: Colaborador[]): string[] {
  const base = ocupadosDoCarro(carro);
  if (!colabs) return base;
  const validos = new Set(colabs.filter((c) => c.status !== 'inativo').map((c) => c.id));
  return base.filter((id) => validos.has(id));
}

/** Remove id fantasma (pessoa excluída) dos carros — vira vaga vazia. */
export function sanearCarros(carros: Carro[], colabs: Colaborador[]): Carro[] {
  const validos = new Set(colabs.map((c) => c.id));
  let mudou = false;
  const out = carros.map((carro) => {
    const nova = carro.posicoes.map((p) => {
      if (isVago(p)) return p;
      if (!validos.has(p)) {
        mudou = true;
        return '';
      }
      return p;
    }) as [string, string, string, string];
    if (nova.every((p, i) => p === carro.posicoes[i])) return carro;
    return { ...carro, posicoes: nova };
  });
  return mudou ? out : carros;
}

/**
 * REGRA OFICIAL DE EQUIPES POR CARRO (indicador corrigido):
 * - carro com 2 pessoas alocadas = 1 equipe
 * - carro com 3 pessoas alocadas = 1 equipe
 * - carro com 4 pessoas alocadas = 2 equipes
 * - carro com 0-1 pessoa = 0/1 equipe (1 pessoa = 1 equipe incompleta)
 */
export function quantEquipesDoCarro(carro: Carro): number {
  const n = ocupadosDoCarro(carro).length;
  if (n === 0) return 0;
  if (n <= 3) return 1;
  return 2;
}

/** Status de uma equipe com N membros (2 ou 3 na equipe única). */
export function statusEquipeMembros(membros: string[], dia: RegistrosDoDia | undefined): EquipeStatus {
  const ocup = membros.filter((m) => !isVago(m));
  if (ocup.length === 0) return 'sem-equipe';
  const ok = (id: string): boolean => {
    const s = situacaoDe(id, dia);
    return s === 'presente' || s === 'substituicao';
  };
  const nOk = ocup.filter(ok).length;
  if (nOk === 0) return 'sem-equipe';
  // 1 pessoa sozinha nunca forma equipe completa
  if (ocup.length === 1) return 'incompleta';
  if (nOk === ocup.length) return 'completa';
  return 'incompleta';
}

/** Equipes de um carro seguindo a regra 2-3 = 1 equipe, 4 = 2 equipes. */
export function equipesDoCarro(carro: Carro): EquipeInfo[] {
  const ocupados = ocupadosDoCarro(carro);
  if (ocupados.length === 0) return [];
  if (ocupados.length <= 3) {
    return [
      {
        codigo: `${carro.prefixo} · EQ única (${ocupados.length}p)`,
        carroPrefixo: carro.prefixo,
        carroId: carro.id,
        membroIds: [...ocupados],
        status: 'completa',
      },
    ];
  }
  return [
    {
      codigo: `${carro.prefixo} · EQ01`,
      carroPrefixo: carro.prefixo,
      carroId: carro.id,
      membroIds: [carro.posicoes[0], carro.posicoes[1]],
      status: 'completa',
    },
    {
      codigo: `${carro.prefixo} · EQ02`,
      carroPrefixo: carro.prefixo,
      carroId: carro.id,
      membroIds: [carro.posicoes[2], carro.posicoes[3]],
      status: 'completa',
    },
  ];
}

export function equipesDoDia(carros: Carro[]): EquipeInfo[] {
  return carros.flatMap((carro) => equipesDoCarro(carro));
}

export function statusEquipe(m1: string, m2: string, dia: RegistrosDoDia | undefined): EquipeStatus {
  return statusEquipeMembros([m1, m2], dia);
}

export function statusCarro(carro: Carro, dia: RegistrosDoDia | undefined, colabs?: Colaborador[]): { presentes: number; alocados: number; vagos: number; qtdEquipes: number; label: string; classe: 'ok' | 'warn' | 'bad' } {
  // CORREÇÃO: alocados = somente slots preenchidos com pessoa válida; vagas vazias e ids fantasmas nunca contam
  const ocupados = colabs ? ocupadosValidosDoCarro(carro, colabs) : ocupadosDoCarro(carro);
  const vagos = carro.posicoes.length - ocupados.length;
  const alocados = ocupados.length;
  const qtdEquipes = alocados === 0 ? 0 : alocados <= 3 ? 1 : 2;
  const presentes = ocupados.filter((id) => {
    const s = situacaoDe(id, dia);
    return s === 'presente' || s === 'substituicao';
  }).length;

  // Carro vazio
  if (alocados === 0) return { presentes, alocados, vagos, qtdEquipes, label: 'Sem equipe · carro vazio', classe: 'bad' };
  // REGRA: 2 ou 3 pessoas = 1 equipe única
  if (alocados <= 3) {
    if (presentes === 0) return { presentes, alocados, vagos, qtdEquipes, label: 'Sem equipe (faltas/afast.)', classe: 'bad' };
    if (alocados === 1) return { presentes, alocados, vagos, qtdEquipes, label: 'Equipe incompleta (1 pessoa)', classe: 'warn' };
    if (presentes === alocados) {
      return {
        presentes, alocados, vagos, qtdEquipes,
        label: alocados === 2 ? '1 equipe completa (2 pessoas)' : '1 equipe completa (3 pessoas)',
        classe: 'ok',
      };
    }
    return { presentes, alocados, vagos, qtdEquipes, label: `1 equipe incompleta (${presentes}/${alocados})`, classe: 'warn' };
  }
  // REGRA: 4 pessoas = 2 equipes
  if (presentes === 4) return { presentes, alocados, vagos, qtdEquipes, label: '2 equipes completas', classe: 'ok' };
  if (presentes === 3) return { presentes, alocados, vagos, qtdEquipes, label: '1 completa + 1 incompleta', classe: 'warn' };
  if (presentes === 2) {
    const eq1 = statusEquipeMembros([carro.posicoes[0], carro.posicoes[1]], dia);
    const eq2 = statusEquipeMembros([carro.posicoes[2], carro.posicoes[3]], dia);
    if (eq1 === 'completa' || eq2 === 'completa') return { presentes, alocados, vagos, qtdEquipes, label: '1 equipe completa', classe: 'ok' };
    return { presentes, alocados, vagos, qtdEquipes, label: '2 equipes incompletas', classe: 'warn' };
  }
  if (presentes === 1) return { presentes, alocados, vagos, qtdEquipes, label: 'Equipes incompletas', classe: 'warn' };
  if (vagos > 0) return { presentes, alocados, vagos, qtdEquipes, label: `${vagos} vaga${vagos === 1 ? '' : 's'} em aberto`, classe: 'bad' };
  return { presentes, alocados, vagos, qtdEquipes, label: 'Sem equipe', classe: 'bad' };
}

export function calcIndicadores(
  colaboradores: Colaborador[],
  carros: Carro[],
  dia: RegistrosDoDia | undefined,
): Indicadores {
  // CORREÇÃO: ignora lugares vazios, ids fantasmas e inativos em todas as contagens
  const ativos = new Map(colaboradores.filter((c) => c.status !== 'inativo').map((c) => [c.id, c]));
  const tids = titulares(carros).filter((id) => {
    if (isVago(id)) return false;
    return ativos.has(id);
  });
  const totalColaboradores = tids.length;
  let presentes = 0;
  let faltas = 0;
  let substituicoes = 0;
  let afastados = 0;
  for (const id of tids) {
    const s = situacaoDe(id, dia);
    if (s === 'presente') presentes += 1;
    else if (s === 'falta') faltas += 1;
    else if (s === 'substituicao') substituicoes += 1;
    else if (s === 'afastado' || s === 'ferias') afastados += 1;
    else presentes += 1;
  }

  // CORREÇÃO: equipes montadas só com ocupantes válidos — vaga vazia / fantasma nunca gera equipe
  const equipes: EquipeInfo[] = [];
  for (const carro of carros) {
    const validos = ocupadosValidosDoCarro(carro, colaboradores);
    if (validos.length === 0) continue;
    if (validos.length <= 3) {
      equipes.push({
        codigo: `${carro.prefixo} · EQ única (${validos.length}p)`,
        carroPrefixo: carro.prefixo,
        carroId: carro.id,
        membroIds: [...validos],
        status: 'completa',
      });
    } else {
      const eq1 = [carro.posicoes[0], carro.posicoes[1]].filter((id) => !isVago(id) && ativos.has(id));
      const eq2 = [carro.posicoes[2], carro.posicoes[3]].filter((id) => !isVago(id) && ativos.has(id));
      if (eq1.length > 0) {
        equipes.push({ codigo: `${carro.prefixo} · EQ01`, carroPrefixo: carro.prefixo, carroId: carro.id, membroIds: eq1, status: 'completa' });
      }
      if (eq2.length > 0) {
        equipes.push({ codigo: `${carro.prefixo} · EQ02`, carroPrefixo: carro.prefixo, carroId: carro.id, membroIds: eq2, status: 'completa' });
      }
    }
  }
  let completas = 0;
  let incompletas = 0;
  let semEquipe = 0;
  for (const e of equipes) {
    const st = statusEquipeMembros(e.membroIds, dia);
    if (st === 'completa') completas += 1;
    else if (st === 'incompleta') incompletas += 1;
    else semEquipe += 1;
  }
  let carrosOperando = 0;
  let carrosSemEquipe = 0;
  for (const c of carros) {
    const { presentes: p } = statusCarro(c, dia, colaboradores);
    if (p > 0) carrosOperando += 1;
    else carrosSemEquipe += 1;
  }
  // Ocupação: quantos carros fechados com 4 / com 3 / com 2 pessoas
  const ocup = distribuicaoOcupacaoCarros(carros, colaboradores);
  return {
    totalColaboradores,
    presentes,
    faltas,
    substituicoes,
    afastados,
    totalEquipes: equipes.length,
    completas,
    incompletas,
    semEquipe,
    totalCarros: carros.length,
    carrosOperando,
    carrosSemEquipe,
    carrosCom4: ocup.com4,
    carrosCom3: ocup.com3,
    carrosCom2: ocup.com2,
    carrosCom1: ocup.com1,
    carrosVazios: ocup.vazios,
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
      // CORREÇÃO: pula lugares vazios antes de qualquer contagem
      if (isVago(id)) return;
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
  linhas: Array<{ data: string; regional?: string; carro: string; equipe: string; colaborador: string; funcao: string; situacao: string; substituto: string; hora: string }>,
): void {
  const temRegional = linhas.some((l) => Boolean(l.regional));
  const detalheRows = linhas
    .map(
      (l) =>
        `<tr><td>${escHtml(l.data)}</td>${temRegional ? `<td>${escHtml(l.regional ?? '—')}</td>` : ''}<td>${escHtml(l.carro)}</td><td>${escHtml(l.equipe)}</td><td>${escHtml(l.colaborador)}</td><td>${escHtml(l.funcao)}</td><td>${escHtml(l.situacao)}</td><td>${escHtml(l.substituto)}</td><td>${escHtml(l.hora)}</td></tr>`,
    )
    .join('');
  const resumoRows = [
    ['Total de colaboradores', indicadores.totalColaboradores],
    ['Presentes', indicadores.presentes],
    ['Faltas', indicadores.faltas],
    ['Substituições', indicadores.substituicoes],
    ['Afastados', indicadores.afastados ?? 0],
    ['Total de equipes', indicadores.totalEquipes],
    ['Equipes completas', indicadores.completas],
    ['Equipes incompletas', indicadores.incompletas],
    ['Equipes sem efetivo', indicadores.semEquipe],
    ['Total de carros', indicadores.totalCarros],
    ['Carros operando', indicadores.carrosOperando],
    ['Carros sem equipe', indicadores.carrosSemEquipe],
    ['Carros fechados com 4 pessoas', (indicadores as Indicadores).carrosCom4 ?? 0],
    ['Carros com 3 pessoas', (indicadores as Indicadores).carrosCom3 ?? 0],
    ['Carros com 2 pessoas', (indicadores as Indicadores).carrosCom2 ?? 0],
  ]
    .map(([k, v]) => `<tr><td>${escHtml(String(k))}</td><td>${v}</td></tr>`)
    .join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>
<h2>Fechamento — ${escHtml(toBR(dataISO))}</h2>
<h3>Resumo Diário</h3>
<table border="1"><tr><th>Indicador</th><th>Quantidade</th></tr>${resumoRows}</table>
<h3>Detalhamento</h3>
<table border="1"><tr><th>Data</th>${temRegional ? '<th>Regional</th>' : ''}<th>Carro</th><th>Equipe</th><th>Colaborador</th><th>Função</th><th>Situação</th><th>Substituto</th><th>Hora</th></tr>${detalheRows}</table>
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
<div class="card"><span>Afastados</span><b>${indicadores.afastados ?? 0}</b></div>
<div class="card"><span>Equipes</span><b>${indicadores.totalEquipes}</b></div>
<div class="card"><span>Completas</span><b>${indicadores.completas}</b></div>
<div class="card"><span>Incompletas</span><b>${indicadores.incompletas}</b></div>
<div class="card"><span>Carros operando</span><b>${indicadores.carrosOperando}/${indicadores.totalCarros}</b></div>
<div class="card"><span>Fechados com 4 pessoas</span><b>${(indicadores as Indicadores).carrosCom4 ?? 0}</b></div>
<div class="card"><span>Carros com 3 pessoas</span><b>${(indicadores as Indicadores).carrosCom3 ?? 0}</b></div>
<div class="card"><span>Carros com 2 pessoas</span><b>${(indicadores as Indicadores).carrosCom2 ?? 0}</b></div>
</div>
<h3>Detalhamento de faltas e substituições</h3>
<table><thead><tr><th>Colaborador</th><th>Função</th><th>Carro</th><th>Equipe</th><th>Situação</th><th>Substituto</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Nenhuma falta registrada.</td></tr>'}</tbody></table>
<div class="footer">Gerado automaticamente pelo Sistema de Controle de Faltas 4x4.</div>
<div class="noprint" style="margin-top:16px"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
</body></html>`);
  w.document.close();
  w.focus();
}

// ---------- Importação da planilha padrão: Regional | Nome | Função ----------
export interface ColaboradorImportRow {
  nome: string;
  cpf: string;
  matricula: string;
  funcao: string;
  regional: RegionalId;
  regionalRaw: string;
  linha: number;
}

function semAcentoLower(v: unknown): string {
  return String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normaliza qualquer variação de regional para o id oficial. */
export function normalizaRegionalImport(v: unknown): { id: RegionalId; raw: string } {
  const raw = String(v ?? '').trim();
  const n = semAcentoLower(raw).replace(/[-_]/g, ' ');
  if (/(agua\s*clara)/.test(n) || n === 'agua clara' || n.includes('agua')) {
    if (n.includes('agua') || n.includes('clara')) return { id: 'agua-clara', raw };
  }
  if (/(ribas)/.test(n) || n.includes('riba')) return { id: 'ribas', raw };
  // códigos curtos comuns
  if (n === 'ac') return { id: 'agua-clara', raw };
  if (n === 'rb' || n === 'r') return { id: 'ribas', raw };
  // fallback: vazio ou desconhecido -> ribas (mantém compatibilidade)
  return { id: 'ribas', raw };
}

function detectarDelimitador(header: string): string {
  const candidatos = [';', ',', '\t', '|'];
  let melhor = ';';
  let melhorQtd = -1;
  for (const d of candidatos) {
    const qtd = header.split(d).length;
    if (qtd > melhorQtd) {
      melhorQtd = qtd;
      melhor = d;
    }
  }
  return melhor;
}

/** Divide linha respeitando aspas duplas ("campo; com; ponto-e-vírgula"). */
function splitLinhaCSV(line: string, delim: string): string[] {
  const out: string[] = [];
  let atual = '';
  let emAspas = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (emAspas && line[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        emAspas = !emAspas;
      }
    } else if (ch === delim && !emAspas) {
      out.push(atual.trim());
      atual = '';
    } else {
      atual += ch;
    }
  }
  out.push(atual.trim());
  return out.map((s) => s.replace(/^"|"$/g, '').trim());
}

function indiceColuna(headers: string[], sinonimos: string[]): number {
  const norm = headers.map((h) => semAcentoLower(h).replace(/[-_]/g, ' '));
  for (const s of sinonimos) {
    const idx = norm.findIndex((h) => h === s || h.includes(s));
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * Parser oficial da planilha de importação.
 * Formato padrão (novo): `Regional;Nome;Função`
 * Também aceita legado: `Nome;CPF;Função;Matrícula` e variações de ordem/caixa/acentos/delimitador.
 */
export function parseColaboradoresCSV(text: string): ColaboradorImportRow[] {
  const semBOM = String(text ?? '').replace(/^\uFEFF/, '');
  const lines = semBOM.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const primeiraLinha = lines[0];
  const delim = detectarDelimitador(primeiraLinha);
  const headersRaw = splitLinhaCSV(primeiraLinha, delim);
  const headersNorm = headersRaw.map((h) => semAcentoLower(h));

  const temNome = headersNorm.some((h) => ['nome', 'colaborador', 'funcionario', 'name'].some((s) => h.includes(s)));
  const temFuncao = headersNorm.some((h) => ['funcao', 'cargo', 'role', 'occupation'].some((s) => h.includes(s)));
  const temRegional = headersNorm.some((h) => ['regional', 'regiao', 'base', 'filial', 'unidade'].some((s) => h.includes(s)));
  const hasHeader = temNome || temFuncao || temRegional || /nome/i.test(primeiraLinha);

  const headers = hasHeader ? headersRaw : [];
  const body = hasHeader ? lines.slice(1) : lines;

  let idxRegional = hasHeader ? indiceColuna(headers, ['regional', 'regiao', 'base', 'filial', 'unidade']) : 0;
  let idxNome = hasHeader ? indiceColuna(headers, ['nome', 'colaborador', 'funcionario', 'name']) : 1;
  let idxFuncao = hasHeader ? indiceColuna(headers, ['funcao', 'cargo', 'role']) : 2;
  const idxCpf = hasHeader ? indiceColuna(headers, ['cpf', 'documento']) : -1;
  const idxMat = hasHeader ? indiceColuna(headers, ['matricula', 're', 'chapa']) : -1;

  // Sem cabeçalho: assume ordem nova Regional | Nome | Função (ou legado de 4 colunas)
  if (!hasHeader) {
    const colsPrimeira = splitLinhaCSV(primeiraLinha, delim).length;
    if (colsPrimeira >= 4) {
      // legado posicional: Nome | CPF | Função | Matrícula
      idxNome = 0; idxFuncao = 2; idxRegional = -1;
    } else {
      idxRegional = 0; idxNome = 1; idxFuncao = 2;
    }
  } else if (idxNome < 0 && idxFuncao < 0 && idxRegional < 0) {
    // cabeçalho não reconhecido -> posicional novo
    idxRegional = 0; idxNome = 1; idxFuncao = 2;
  } else {
    // completa índices faltantes com fallback posicional do novo layout
    if (idxRegional < 0 && headersRaw.length === 3) idxRegional = 0;
    if (idxNome < 0) idxNome = headersRaw.length === 3 ? 1 : 0;
    if (idxFuncao < 0) idxFuncao = headersRaw.length === 3 ? 2 : 2;
  }

  const out: ColaboradorImportRow[] = [];
  body.slice(0, 2000).forEach((line, i) => {
    const parts = splitLinhaCSV(line, delim);
    if (parts.every((p) => !p)) return;
    const get = (idx: number): string => (idx >= 0 && idx < parts.length ? parts[idx].trim() : '');

    const nome = get(idxNome).replace(/^"|"$/g, '').trim();
    if (!nome || /^sep *=/i.test(nome)) return;

    const funcaoRaw = get(idxFuncao);
    const regionalRaw = idxRegional >= 0 ? get(idxRegional) : '';
    const { id: regional } = normalizaRegionalImport(regionalRaw);

    const cpf = idxCpf >= 0
      ? get(idxCpf).replace(/\D/g, '').slice(0, 11) || '00000000000'
      : (parts[3] && /^\d/.test(parts[3]) ? parts[3].replace(/\D/g, '').slice(0, 11) : '00000000000') || '00000000000';
    const matricula = idxMat >= 0 && get(idxMat)
      ? get(idxMat)
      : String(1000 + Math.floor(Math.random() * 9000)) + String(i).padStart(2, '0');

    out.push({
      nome,
      cpf: cpf || '00000000000',
      matricula,
      funcao: normalizarFuncao(funcaoRaw || 'Auxiliar de Inventário Florestal'),
      regional,
      regionalRaw,
      linha: i + (hasHeader ? 2 : 1),
    });
  });
  return out;
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

export function historicoFaltas(registros: BancoRegistros): Array<{ data: string; faltas: number; subs: number; afastados: number }> {
  return Object.keys(registros)
    .sort()
    .slice(-14)
    .map((data) => {
      const dia = registros[data];
      // CORREÇÃO: ignora chaves de lugares vazios ('', '   ') que nunca são pessoa
      const entries = Object.entries(dia).filter(([id]) => !isVago(id));
      return {
        data,
        faltas: entries.filter(([, v]) => v.situacao === 'falta').length,
        subs: entries.filter(([, v]) => v.situacao === 'substituicao').length,
        afastados: entries.filter(([, v]) => v.situacao === 'afastado' || v.situacao === 'ferias').length,
      };
    });
}

// ---------- Filtro por mês (pesquisa mensal) ----------
export type MesFiltro = string; // 'todos' | 'yyyy-MM'

const MES_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMesKey(v: string): boolean {
  return MES_KEY_RE.test(v);
}

export function normalizarMesFiltro(v: string): MesFiltro {
  const t = v.trim();
  if (t === '' || t.toLowerCase() === 'todos') return 'todos';
  if (isMesKey(t)) return t;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t.slice(0, 7);
  return 'todos';
}

export function mesChaveAtual(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Lista meses (yyyy-MM) que possuem lançamento, mais recente primeiro. */
export function listarMesesComLancamento(registros: BancoRegistros): string[] {
  const set = new Set<string>();
  for (const data of Object.keys(registros)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) set.add(data.slice(0, 7));
  }
  return [...set].sort().reverse();
}

/** Totais de um mês para badges/resumos. */
export function totaisDoMes(
  registros: BancoRegistros,
  mes: MesFiltro,
): { faltas: number; subs: number; afastados: number; dias: number } {
  if (mes === 'todos') {
    let faltas = 0;
    let subs = 0;
    let afastados = 0;
    for (const dia of Object.values(registros)) {
      // CORREÇÃO: não conta lugares vazios
      for (const [id, r] of Object.entries(dia)) {
        if (isVago(id)) continue;
        if (r.situacao === 'falta') faltas += 1;
        else if (r.situacao === 'substituicao') subs += 1;
        else if (r.situacao === 'afastado' || r.situacao === 'ferias') afastados += 1;
      }
    }
    return { faltas, subs, afastados, dias: Object.keys(registros).length };
  }
  let faltas = 0;
  let subs = 0;
  let afastados = 0;
  let dias = 0;
  for (const [data, dia] of Object.entries(registros)) {
    if (!data.startsWith(mes)) continue;
    dias += 1;
    for (const [id, r] of Object.entries(dia)) {
      if (isVago(id)) continue;
      if (r.situacao === 'falta') faltas += 1;
      else if (r.situacao === 'substituicao') subs += 1;
      else if (r.situacao === 'afastado' || r.situacao === 'ferias') afastados += 1;
    }
  }
  return { faltas, subs, afastados, dias };
}

/** Mapa de totais por mês (para badges do FiltroMes). */
export function totaisPorMes(registros: BancoRegistros): Record<string, { faltas: number; subs: number; afastados: number; dias: number }> {
  const out: Record<string, { faltas: number; subs: number; afastados: number; dias: number }> = {};
  for (const mes of listarMesesComLancamento(registros)) {
    out[mes] = totaisDoMes(registros, mes);
  }
  return out;
}
