export type Situacao = 'presente' | 'falta' | 'substituicao';
export type StatusColaborador = 'ativo' | 'inativo' | 'reserva';

export interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  funcao: string;
  foto: string;
  status: StatusColaborador;
}

export interface Carro {
  id: string;
  prefixo: string;
  placa: string;
  modelo: string;
  /** 4 posições: [p1, p2] = Equipe 01, [p3, p4] = Equipe 02 */
  posicoes: [string, string, string, string];
  status: 'operando' | 'manutencao' | 'inativo';
}

export interface Registro {
  situacao: Situacao;
  substitutoId?: string;
  motivo?: string;
  observacao?: string;
  hora: string;
  responsavel: string;
}

export type RegistrosDoDia = Record<string, Registro>; // colabId -> registro
export type BancoRegistros = Record<string, RegistrosDoDia>; // yyyy-mm-dd -> dia

export interface Indicadores {
  totalColaboradores: number;
  presentes: number;
  faltas: number;
  substituicoes: number;
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
