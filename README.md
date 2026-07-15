# MetaPoupança

Aplicação web para acompanhar metas financeiras — desafio técnico de processo seletivo.

## Demo

Aplicação disponível em: [https://simplainvest.vercel.app](https://simplainvest.vercel.app)

## Stack

- **Front-end:** Next.js 16, React 19, Tailwind CSS
- **Back-end:** API Routes / Server Actions do Next.js
- **Banco:** Supabase (PostgreSQL)
- **Deploy:** Vercel

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o arquivo `supabase/schema.sql`
3. Copie `.env.local.example` para `.env.local`
4. Preencha com URL e anon key do seu projeto (Settings > API)

### 3. Rodar o servidor

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do projeto

```
src/
├── app/              # Páginas e rotas (App Router)
├── lib/
│   └── supabase/     # Clientes Supabase (browser e server)
└── types/
    └── database.ts   # Tipos TypeScript das tabelas
supabase/
└── schema.sql        # Schema do banco de dados
```

## Cronograma de desenvolvimento

| Fase | Dia | Foco |
|------|-----|------|
| 1 | Dia 1 | Setup (este commit) |
| 2 | Dia 2 | Backend — APIs e lógica de cálculo |
| 3 | Dia 3-4 | Frontend — telas e componentes |
| 4 | Dia 5-6 | Extras — gráficos, alertas, múltiplas metas |
| 5 | Dia 7 | Deploy, README final, testes |

## Issues no GitHub

Crie um Project Board (Kanban) com as issues abaixo para demonstrar organização:

**Fase 1 — Setup**
- Criar projeto Next.js + Tailwind
- Configurar Supabase e criar tabelas

**Fase 2 — Backend**
- CRUD de metas
- CRUD de movimentações
- Lógica de cálculo (valor mensal, progresso)

**Fase 3 — Frontend**
- Tela de cadastro de meta
- Listagem de metas
- Barra de progresso
- Modal de registrar aporte

**Fase 4 — Extras**
- Rendimento
- Gráfico de evolução
- Alertas
- Melhorias no frontend

**Fase 5 — Finalização**
- Deploy Vercel
- README e testes finais
