import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

const LS_KEY = 'f44_company_logo';
const CANDIDATES = ['./logo-empresa.png', './logo-empresa.jpg', './logo-empresa.jpeg', './logo-empresa.webp', './logo-empresa.svg', '/logo-empresa.png', '/logo-empresa.svg'];

interface CompanyLogoProps {
  size?: number;
  rounded?: string;
  showFallbackIcon?: boolean;
}

/**
 * Logo da empresa no topo do app.
 * Prioridade: 1) logo enviado pelo usuário (localStorage) 2) /public/logo-empresa.png 3) SVG padrão 4) ícone.
 * Para trocar: coloque o arquivo "logo da empresa.PNG" renomeado como `public/logo-empresa.png` e recarregue.
 */
export default function CompanyLogo({ size = 48, rounded = 'rounded-2xl', showFallbackIcon = true }: CompanyLogoProps) {
  const [custom, setCustom] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [idx, setIdx] = useState(0);
  const [failedAll, setFailedAll] = useState(false);

  useEffect(() => {
    try {
      if (custom) localStorage.setItem(LS_KEY, custom);
      else localStorage.removeItem(LS_KEY);
    } catch {
      /* storage indisponível */
    }
  }, [custom]);

  const src = custom || (idx < CANDIDATES.length ? CANDIDATES[idx] : '');

  function handleError() {
    if (custom) {
      setCustom('');
      setIdx(0);
      return;
    }
    if (idx + 1 < CANDIDATES.length) setIdx((i) => i + 1);
    else setFailedAll(true);
  }

  if (failedAll || !src) {
    if (!showFallbackIcon) return null;
    return (
      <div
        className={`logo-empresa logo-empresa--fallback flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/30 ${rounded}`}
        style={{ width: size, height: size }}
        title="Logo da empresa"
      >
        <Building2 style={{ width: size * 0.52, height: size * 0.52 }} className="text-white" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Logo da empresa"
      width={size}
      height={size}
      onError={handleError}
      loading="eager"
      draggable={false}
      className={`logo-empresa object-contain bg-white dark:bg-white/95 ${rounded} shadow-lg shadow-indigo-600/20 ring-1 ring-white/40 dark:ring-slate-700/60 p-1`}
      style={{ width: size, height: size }}
    />
  );
}

/** Botão discreto no header para o gestor trocar o logo sem mexer em código. */
export function LogoUploadButton() {
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1_500_000) {
      alert('Logo muito grande (máx 1,5MB). Comprima o PNG e tente de novo.');
      return;
    }
    const rd = new FileReader();
    rd.onload = () => {
      try {
        localStorage.setItem(LS_KEY, String(rd.result));
        location.reload();
      } catch {
        alert('Não foi possível salvar o logo neste navegador.');
      }
    };
    rd.readAsDataURL(f);
    e.target.value = '';
  }

  function reset() {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* noop */
    }
    location.reload();
  }

  return (
    <span className="hidden sm:inline-flex items-center gap-1 text-[11px]">
      <label
        className="cursor-pointer rounded-lg px-2 py-1 font-semibold text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
        title="Trocar logo da empresa (PNG/JPG/SVG até 1,5MB)"
      >
        Trocar logo
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      <button
        onClick={reset}
        className="rounded-lg px-1.5 py-1 text-slate-500 hover:text-red-500 transition-colors"
        title="Voltar ao logo padrão de public/logo-empresa.png"
      >
        ✕
      </button>
    </span>
  );
}
