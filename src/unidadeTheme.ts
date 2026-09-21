import type { RegionalId } from './types';

/**
 * Tema visual por unidade (regional).
 * Centraliza todas as cores usadas na aba Operação para manter
 * consistência entre cards, badges, botões e filtros (DRY + SOLID).
 *
 * - Ribas      → verde esmeralda / teal
 * - Água Clara → azul sky / ciano
 *
 * Todas as classes Tailwind são literais (sem interpolação dinâmica)
 * para sobreviver ao purge do Tailwind.
 */
export interface UnidadeTheme {
  id: RegionalId;
  nome: string;
  nomeCurto: string;
  /** Faixa superior do card */
  bar: string;
  /** Borda superior do card */
  borderTop: string;
  /** Anel / borda suave do card */
  cardRing: string;
  /** Ícone do carro (fundo em gradiente) */
  icon: string;
  /** Sombra do ícone */
  iconShadow: string;
  /** Badge pill da unidade */
  badge: string;
  /** Dot indicador */
  dot: string;
  /** Fundo suave (para placas / detalhes) */
  softBg: string;
  /** Texto colorido */
  text: string;
  /** Botão "trocar unidade" (outline colorido) */
  unitButton: string;
  /** Cor da borda do CarroTopView */
  carroFrame: string;
}

const RIBAS: UnidadeTheme = {
  id: 'ribas',
  nome: 'Regional de Ribas',
  nomeCurto: 'Ribas',
  bar: 'from-emerald-500 via-teal-500 to-emerald-600',
  borderTop: '!border-t-emerald-500',
  cardRing: 'ring-1 ring-emerald-500/20 hover:ring-emerald-500/40',
  icon: 'from-emerald-600 to-teal-600',
  iconShadow: 'shadow-emerald-600/30',
  badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  dot: 'bg-emerald-500',
  softBg: 'bg-emerald-500/10 border-emerald-500/25',
  text: 'text-emerald-600 dark:text-emerald-400',
  unitButton:
    '!bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300 !border !border-emerald-500/40 hover:!bg-emerald-500 hover:!text-white hover:!border-emerald-500',
  carroFrame: '!border-emerald-500/30 dark:!border-emerald-500/25',
};

const AGUA_CLARA: UnidadeTheme = {
  id: 'agua-clara',
  nome: 'Regional de Água Clara',
  nomeCurto: 'Água Clara',
  bar: 'from-sky-500 via-cyan-500 to-sky-600',
  borderTop: '!border-t-sky-500',
  cardRing: 'ring-1 ring-sky-500/20 hover:ring-sky-500/40',
  icon: 'from-sky-600 to-cyan-600',
  iconShadow: 'shadow-sky-600/30',
  badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
  dot: 'bg-sky-500',
  softBg: 'bg-sky-500/10 border-sky-500/25',
  text: 'text-sky-600 dark:text-sky-400',
  unitButton:
    '!bg-sky-500/10 !text-sky-700 dark:!text-sky-300 !border !border-sky-500/40 hover:!bg-sky-500 hover:!text-white hover:!border-sky-500',
  carroFrame: '!border-sky-500/30 dark:!border-sky-500/25',
};

/** Retorna o tema da unidade. Fallback seguro para Ribas. */
export function temaUnidade(id: RegionalId | string | undefined | null): UnidadeTheme {
  if (id === 'agua-clara') return AGUA_CLARA;
  return RIBAS;
}

/** Lista ordenada para legendas e filtros. */
export const TEMAS_UNIDADE: UnidadeTheme[] = [RIBAS, AGUA_CLARA];
