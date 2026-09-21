/**
 * Tema visual por EQUIPE (aba Operação).
 * EQ01 e EQ02 usam a mesma cor (índigo / azul da Equipe 1),
 * independente da cor da unidade (Ribas = verde, Água Clara = azul).
 *
 * - EQ01 → índigo / azul (cor principal)
 * - EQ02 → mesma cor da EQ01 (índigo / azul)
 *
 * Todas as classes Tailwind são literais (sem interpolação dinâmica)
 * para sobreviver ao purge do Tailwind. DRY + SOLID: centraliza aqui
 * e consome via `temaEquipe()` nos componentes.
 */

export type EquipeId = 'EQ01' | 'EQ02';

export interface EquipeTheme {
  id: EquipeId;
  nome: string;
  nomeCurto: string;
  /** Gradiente do pill / cabeçalho da fileira */
  gradient: string;
  /** Sombra do pill */
  gradientShadow: string;
  /** Badge pill (fundo suave + borda) */
  badge: string;
  /** Dot indicador */
  dot: string;
  /** Texto colorido */
  text: string;
  /** Fundo suave da fileira no CarroTopView */
  softBg: string;
  /** Borda lateral / contorno da fileira */
  frame: string;
  /** Borda do assento ocupado (estado presente) */
  assentoRing: string;
  /** Botão vaga (tracejado colorido) */
  vagaButton: string;
}

const EQ01: EquipeTheme = {
  id: 'EQ01',
  nome: 'Equipe 01',
  nomeCurto: 'Eq. 01',
  gradient: 'from-indigo-500 to-blue-600',
  gradientShadow: 'shadow-indigo-500/30',
  badge:
    'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
  dot: 'bg-indigo-500',
  text: 'text-indigo-600 dark:text-indigo-400',
  softBg: 'bg-indigo-500/[0.07]',
  frame: '!border-indigo-500/30 dark:!border-indigo-500/25',
  assentoRing: '!border-indigo-500/40',
  vagaButton:
    'hover:!border-indigo-400 hover:!text-indigo-500',
};

const EQ02: EquipeTheme = {
  id: 'EQ02',
  nome: 'Equipe 02',
  nomeCurto: 'Eq. 02',
  gradient: 'from-indigo-500 to-blue-600',
  gradientShadow: 'shadow-indigo-500/30',
  badge:
    'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
  dot: 'bg-indigo-500',
  text: 'text-indigo-600 dark:text-indigo-400',
  softBg: 'bg-indigo-500/[0.07]',
  frame: '!border-indigo-500/30 dark:!border-indigo-500/25',
  assentoRing: '!border-indigo-500/40',
  vagaButton:
    'hover:!border-indigo-400 hover:!text-indigo-500',
};

/** Normaliza qualquer variação para EQ01/EQ02. Posições 0-1 = EQ01, 2-3 = EQ02. */
export function temaEquipe(id: EquipeId | string | number | undefined | null): EquipeTheme {
  if (typeof id === 'number') return id < 2 ? EQ01 : EQ02;
  const n = String(id ?? 'EQ01').trim().toUpperCase().replace(/[\s._-]+/g, '');
  if (n === 'EQ02' || n === 'EQUIPE02' || n === 'EQUIPE2' || n === 'EQ2' || n === '2') return EQ02;
  return EQ01;
}

/** Retorna a equipe de uma posição global do carro (0-3). */
export function equipeDePosicao(posGlobal: number): EquipeTheme {
  return posGlobal < 2 ? EQ01 : EQ02;
}

/** Retorna o id da equipe de uma posição global. */
export function equipeIdDePosicao(posGlobal: number): EquipeId {
  return posGlobal < 2 ? 'EQ01' : 'EQ02';
}

/** Lista ordenada para legendas. */
export const TEMAS_EQUIPE: EquipeTheme[] = [EQ01, EQ02];
