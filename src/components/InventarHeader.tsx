import { useState } from 'react';

/**
 * Faixa superior institucional da Inventar.
 * Coloca o logo da Inventar no topo da página, acima do header operacional.
 *
 * Como usar o JPG original:
 * 1. Copie o arquivo `logo_inventar_expandWEB_novo2.jpg` para `public/`
 *    (ou renomeie para `public/logo-inventar.jpg`).
 * 2. Recarregue — o componente detecta automaticamente, sem mexer em código.
 *
 * Fallback: se nenhum JPG for encontrado, usa `public/logo-inventar.svg`
 * e por fim um wordmark em texto (sempre visível, light/dark).
 */

const LOGO_CANDIDATES = [
  './logo_inventar_expandWEB_novo2.jpg',
  '/logo_inventar_expandWEB_novo2.jpg',
  './logo-inventar.jpg',
  '/logo-inventar.jpg',
  './logo-inventar.png',
  '/logo-inventar.png',
  './logo-inventar.svg',
  '/logo-inventar.svg',
] as const;

interface InventarHeaderProps {
  compact?: boolean;
}

export default function InventarHeader({ compact = false }: InventarHeaderProps) {
  const [idx, setIdx] = useState(0);
  const [failedAll, setFailedAll] = useState(false);

  const src = LOGO_CANDIDATES[idx] ?? '';

  function handleError() {
    if (idx + 1 < LOGO_CANDIDATES.length) {
      setIdx((i) => i + 1);
    } else {
      setFailedAll(true);
    }
  }

  return (
    <div className="inventar-top no-print">
      <div className="inventar-top__inner">
        {/* brilho de fundo */}
        <div aria-hidden="true" className="inventar-top__glow" />

        <div className="inventar-top__content">
          {/* Logo */}
          <div className="inventar-top__logo-wrap">
            {!failedAll && src ? (
              <img
                src={src}
                alt="Inventar"
                onError={handleError}
                draggable={false}
                loading="eager"
                className={`inventar-top__logo ${compact ? 'inventar-top__logo--compact' : ''}`}
              />
            ) : (
              <div className="inventar-top__fallback" role="img" aria-label="Inventar">
                <span className="inventar-top__mark" aria-hidden="true">
                  <svg viewBox="0 0 48 48" width="28" height="28" fill="none">
                    <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#invTopBg)" />
                    <g stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 18 L11 15 L11 11 L15 11" />
                      <path d="M34 18 L37 15 L37 11 L33 11" />
                      <path d="M14 30 L11 33 L11 37 L15 37" />
                      <path d="M34 30 L37 33 L37 37 L33 37" />
                    </g>
                    <circle cx="24" cy="24" r="5" fill="#fff" />
                    <circle cx="24" cy="24" r="2" fill="#2563EB" />
                    <defs>
                      <linearGradient id="invTopBg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0EA5E9" />
                        <stop offset="55%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <span className="inventar-top__wordmark">
                  INVENTAR
                  <small>EXPAND · WEB</small>
                </span>
              </div>
            )}
          </div>

          {/* divisor */}
          <span aria-hidden="true" className="inventar-top__divider" />

          {/* texto institucional */}
          <div className="inventar-top__text">
            <p className="inventar-top__title">Inventar — Gestão Operacional</p>
            <p className="inventar-top__subtitle">Controle de Faltas 4x4 · Presença · Equipes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
