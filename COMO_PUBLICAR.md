# Como publicar — Controle de Faltas 4x4

Seu projeto já está pronto para publicar. Escolha um caminho:

## Opção 1 — Vercel (recomendada, ~3 min, grátis)

```bash
npm run build
git init
git add .
git commit -m "deploy inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/controle-faltas-4x4.git
git push -u origin main
```

1. Acesse `vercel.com` → **New Project** → importe o repositório.
2. O `vercel.json` já configura `build = npm run build` e `output = dist`.
3. Clique em **Deploy**. URL tipo `https://controle-faltas-4x4.vercel.app`.

## Opção 2 — Netlify (~4 min, grátis)

```bash
npm run build
```

- **Rápida:** arraste a pasta `dist/` em `app.netlify.com` → Sites.
- **Via Git:** conecte o repositório. O `netlify.toml` já define build + publish + redirect SPA.

## Opção 3 — GitHub Pages (~6 min, grátis)

O workflow `.github/workflows/deploy.yml` já faz tudo automaticamente.

```bash
git init
git add .
git commit -m "deploy inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/controle-faltas-4x4.git
git push -u origin main
```

Depois: repositório → **Settings → Pages → Source: GitHub Actions**.

URL: `https://SEU-USUARIO.github.io/controle-faltas-4x4/`

## Opção 4 — Hospedagem própria / VPS

```bash
npm run build
scp -r dist/* usuario@seu-servidor:/var/www/faltas-4x4/
```

Nginx (SPA):

```nginx
server {
  listen 80;
  root /var/www/faltas-4x4;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## Comandos úteis

| Comando | Para que serve |
|---|---|
| `npm run dev` | desenvolver local |
| `npm run build` | gerar `dist/` de produção (valida TypeScript) |
| `npm run preview` | testar o build em http://127.0.0.1:8080 |

## Checklist

- [x] `base: './'` no `vite.config.ts`
- [x] `vercel.json` + `netlify.toml` + workflow Pages
- [ ] `npm run build` passa sem erro
- [ ] `npm run preview` testado
- [ ] push para o GitHub feito

> Nota: os dados ficam no `localStorage` do navegador (`f44_colabs`, `f44_carros`,
> `f44_regs`). Cada visitante vê seus próprios dados. Para dados compartilhados,
> conecte um backend (Firebase / Supabase) como próximo passo.
>
> Dica: dentro do app, abra a aba **Publicar 🚀** para o guia interativo com
> botões de copiar.
