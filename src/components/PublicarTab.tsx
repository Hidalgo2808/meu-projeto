import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Github,
  Globe,
  Rocket,
  Server,
  Terminal,
  Zap,
} from 'lucide-react';

type Host = 'vercel' | 'netlify' | 'github' | 'vps';

interface Passo {
  titulo: string;
  detalhe: string;
  comando?: string;
}

const CONTEUDO: Record<Host, { nome: string; tempo: string; custo: string; passos: Passo[] }> = {
  vercel: {
    nome: 'Vercel',
    tempo: '~3 min',
    custo: 'Grátis',
    passos: [
      {
        titulo: '1. Gere o build de produção',
        detalhe: 'Valida TypeScript + gera a pasta dist/ pronta para publicar.',
        comando: 'npm run build',
      },
      {
        titulo: '2. Suba o código para o GitHub',
        detalhe: 'Crie um repositório e envie o projeto.',
        comando: 'git init\ngit add .\ngit commit -m "deploy inicial"\ngit branch -M main\ngit remote add origin https://github.com/SEU-USUARIO/controle-faltas-4x4.git\ngit push -u origin main',
      },
      {
        titulo: '3. Importe na Vercel',
        detalhe: 'Acesse vercel.com → New Project → Import do repositório. O arquivo vercel.json deste projeto já configura tudo (framework Vite, output dist). É só clicar em Deploy.',
      },
      {
        titulo: '4. Pronto! URL pública',
        detalhe: 'Você recebe uma URL tipo https://controle-faltas-4x4.vercel.app. Cada push na main gera um novo deploy automático.',
      },
    ],
  },
  netlify: {
    nome: 'Netlify',
    tempo: '~4 min',
    custo: 'Grátis',
    passos: [
      {
        titulo: '1. Gere o build',
        detalhe: 'Confirma que o dist/ é gerado sem erros.',
        comando: 'npm run build',
      },
      {
        titulo: '2. Opção arrastar-e-soltar (mais rápida)',
        detalhe: 'Acesse app.netlify.com → Sites → arraste a pasta dist/ para a área indicada. Em segundos você tem um link público.',
      },
      {
        titulo: '3. Opção via Git (recomendada)',
        detalhe: 'Conecte o repositório GitHub. O arquivo netlify.toml deste projeto já define build = npm run build e publish = dist. Clique em Deploy site.',
      },
      {
        titulo: '4. Domínio personalizado (opcional)',
        detalhe: 'Em Site settings → Domain management você troca o nome para algo como faltas-4x4.netlify.app.',
      },
    ],
  },
  github: {
    nome: 'GitHub Pages',
    tempo: '~6 min',
    custo: 'Grátis',
    passos: [
      {
        titulo: '1. Push para o GitHub',
        detalhe: 'O workflow .github/workflows/deploy.yml deste projeto já faz o deploy automático.',
        comando: 'git init\ngit add .\ngit commit -m "deploy inicial"\ngit branch -M main\ngit remote add origin https://github.com/SEU-USUARIO/controle-faltas-4x4.git\ngit push -u origin main',
      },
      {
        titulo: '2. Ative o Pages',
        detalhe: 'No repositório: Settings → Pages → Source: GitHub Actions. Salve.',
      },
      {
        titulo: '3. Deploy automático',
        detalhe: 'Cada push na main roda npm ci + npm run build e publica a pasta dist/. A URL fica em https://SEU-USUARIO.github.io/controle-faltas-4x4/',
      },
    ],
  },
  vps: {
    nome: 'VPS / Hospedagem própria',
    tempo: '~10 min',
    custo: 'Seu servidor',
    passos: [
      {
        titulo: '1. Build local',
        detalhe: 'Gera os arquivos estáticos.',
        comando: 'npm run build',
      },
      {
        titulo: '2. Envie a pasta dist/ para o servidor',
        detalhe: 'Via SCP, FTP ou painel da hospedagem (Hostinger, KingHost, etc.).',
        comando: 'scp -r dist/* usuario@seu-servidor:/var/www/faltas-4x4/',
      },
      {
        titulo: '3. Configure o Nginx',
        detalhe: 'Sirva index.html para todas as rotas (SPA).',
        comando: 'server {\n  listen 80;\n  root /var/www/faltas-4x4;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}',
      },
    ],
  },
};

const CHECKLIST_PRE_DEPLOY = [
  { item: 'npm run build passa sem erro', feito: true },
  { item: 'base: "./" configurado no vite.config.ts', feito: true },
  { item: 'vercel.json + netlify.toml + workflow Pages incluídos', feito: true },
  { item: 'Testar preview local antes de subir', feito: false, comando: 'npm run preview' },
  { item: 'Repositório GitHub criado e push feito', feito: false },
];

function BlocoComando({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      setCopiado(false);
    }
  }
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950 p-4">
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-emerald-300">
        {codigo}
      </pre>
      <button
        onClick={copiar}
        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur transition-all hover:bg-white/20"
        title="Copiar comando"
      >
        {copiado ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copiado ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  );
}

export default function PublicarTab() {
  const [host, setHost] = useState<Host>('vercel');
  const [check, setCheck] = useState<boolean[]>(CHECKLIST_PRE_DEPLOY.map((c) => c.feito));
  const ativo = CONTEUDO[host];
  const concluidos = check.filter(Boolean).length;

  const tabs: Array<{ k: Host; label: string; icon: typeof Globe }> = [
    { k: 'vercel', label: 'Vercel', icon: Zap },
    { k: 'netlify', label: 'Netlify', icon: Globe },
    { k: 'github', label: 'GitHub Pages', icon: Github },
    { k: 'vps', label: 'VPS própria', icon: Server },
  ];

  return (
    <div className="anim-fade-up space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-2xl shadow-indigo-600/30 dark:border-slate-700 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Rocket className="h-7 w-7" />
          </div>
          <div className="min-w-[220px] flex-1">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Como publicar seu app 🚀
            </h2>
            <p className="mt-1 text-sm text-white/85">
              Seu projeto já está <b>pronto para deploy</b>: build configurado, base relativa e
              arquivos da Vercel / Netlify / GitHub Pages incluídos. Escolha um destino abaixo.
            </p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur">
              <p className="text-lg font-extrabold leading-none">{concluidos}/{check.length}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-80">checklist</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur">
              <p className="text-lg font-extrabold leading-none">{ativo.tempo}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-80">{ativo.custo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist pré-deploy */}
      <div className="glass rounded-3xl p-5">
        <h3 className="mb-1 flex items-center gap-2 font-bold">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Checklist pré-publicação
        </h3>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Faça nesta ordem. O comando de preview abre o build final em http://127.0.0.1:8080
        </p>
        <div className="space-y-2">
          {CHECKLIST_PRE_DEPLOY.map((c, i) => (
            <button
              key={c.item}
              onClick={() => setCheck((p) => p.map((v, j) => (j === i ? !v : v)))}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left text-sm font-semibold transition-all hover:scale-[1.005] ${
                check[i]
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                  check[i] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                {check[i] ? '✓' : (i + 1)}
              </span>
              <span className="flex-1">{c.item}</span>
              {c.comando && <code className="rounded-lg bg-slate-950 px-2 py-1 font-mono text-[11px] text-emerald-300">{c.comando}</code>}
            </button>
          ))}
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${(concluidos / check.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Seletor de hospedagem */}
      <div className="glass flex gap-2 overflow-x-auto rounded-3xl p-3">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setHost(t.k)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
              host === t.k
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Passos */}
      <div className="grid gap-3">
        {ativo.passos.map((p, i) => (
          <div key={p.titulo} className="glass anim-fade-up rounded-3xl p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-extrabold text-white">
                {i + 1}
              </span>
              <h4 className="font-bold">{p.titulo}</h4>
            </div>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{p.detalhe}</p>
            {p.comando && <BlocoComando codigo={p.comando} />}
          </div>
        ))}
      </div>

      {/* Comandos úteis */}
      <div className="glass rounded-3xl p-5">
        <h3 className="mb-3 flex items-center gap-2 font-bold">
          <Terminal className="h-5 w-5 text-indigo-500" /> Comandos que você vai usar
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { t: 'Desenvolver', c: 'npm run dev' },
            { t: 'Gerar build', c: 'npm run build' },
            { t: 'Testar build local', c: 'npm run preview' },
          ].map((b) => (
            <div key={b.t}>
              <p className="label">{b.t}</p>
              <BlocoComando codigo={b.c} />
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-300">
          ⚠️ <b>Importante:</b> os dados do app ficam no <b>localStorage</b> do navegador (f44_colabs,
          f44_carros, f44_regs). Cada visitante vê seus próprios dados. Para dados compartilhados
          entre usuários, o próximo passo seria conectar um backend (Firebase / Supabase).
        </p>
      </div>
    </div>
  );
}
