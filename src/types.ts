export type Situacao = 'presente' | 'falta' | 'substituicao' | 'afastado' | 'ferias';
export type StatusColaborador = 'ativo' | 'inativo' | 'reserva';

/** Regionais operacionais */
export type RegionalId = 'ribas' | 'agua-clara';
export type FiltroRegionalId = RegionalId | 'todas';

export interface RegionalInfo {
  id: RegionalId;
  nome: string;
  nomeCurto: string;
}

/** Funções oficiais do colaborador (usadas no cadastro, filtros e importação). */
export const FUNCOES_COLABORADOR = [
  'Auxiliar de Inventário Florestal',
  'Líder de Pesquisa',
  'Líder de Inventário Florestal',
] as const;

export type FuncaoColaborador = (typeof FUNCOES_COLABORADOR)[number];

export interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  funcao: FuncaoColaborador | string;
  foto: string;
  status: StatusColaborador;
  /** Regional do colaborador. Opcional para compatibilidade com dados antigos salvos no localStorage. */
  regional?: RegionalId;
}

export interface Carro {
  id: string;
  prefixo: string;
  placa: string;
  modelo: string;
  /** 4 posições: [p1, p2] = Equipe 01, [p3, p4] = Equipe 02 */
  posicoes: [string, string, string, string];
  status: 'operando' | 'manutencao' | 'inativo';
  /** Regional do carro / base operacional. Opcional para compatibilidade com dados antigos. */
  regional?: RegionalId;
}

export interface Registro {
  situacao: Situacao;
  substitutoId?: string;
  motivo?: string;
  observacao?: string;
  hora: string;
  responsavel: string;
  /** Período de férias (somente quando situacao === 'ferias'). Formato yyyy-mm-dd. */
  feriasInicio?: string;
  feriasFim?: string;
  /** Período / detalhe do afastamento (somente quando situacao === 'afastado'). */
  afastadoInicio?: string;
  afastadoFim?: string;
  /** Órgão / tipo do afastamento. Ex: INSS, Atestado médico. */
  afastadoTipo?: string;
}

/** Motivos padrão para afastamento (INSS primeiro, conforme operação). */
export const MOTIVOS_AFASTAMENTO = [
  'INSS',
  'Atestado médico',
  'Licença médica',
  'Acidente de trabalho',
  'Outros',
] as const;

export type RegistrosDoDia = Record<string, Registro>; // colabId -> registro
export type BancoRegistros = Record<string, RegistrosDoDia>; // yyyy-mm-dd -> dia

export interface Indicadores {
  totalColaboradores: number;
  presentes: number;
  faltas: number;
  substituicoes: number;
  afastados: number;
  totalEquipes: number;
  completas: number;
  incompletas: number;
  semEquipe: number;
  totalCarros: number;
  carrosOperando: number;
  carrosSemEquipe: number;
}

export type EquipeStatus = 'completa' | 'incompleta' | 'sem-equipe';

export interface EquipeInfo {
  codigo: string;
  carroPrefixo: string;
  carroId: string;
  membroIds: [string, string];
  status: EquipeStatus;
}
