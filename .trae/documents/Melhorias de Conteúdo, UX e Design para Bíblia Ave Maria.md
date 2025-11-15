## Diagnóstico Atual
- Stack: React (CRA) com Tailwind (`package.json`), ícones `lucide-react`, Supabase via REST manual.
- Estrutura: Tela única com trocas por estado `tela` em `src/App.jsx:141`. Páginas: Login, Livros, Capítulos, Player, Admin Upload, Planos, Checklist, Progresso.
- Estilos: Tailwind ativo com classes padrão e predominância de âmbar/laranja (`src/index.css:14-16`, `tailwind.config.js:3-9`).
- Dados: Bible via tabelas `livros`, `capitulos`, `versiculos`. Planos de leitura via RPC/visões em `src/services/planosLeituraService.js`.
- Supabase: Config caseiro em `src/App.jsx:13-139`; login inseguro por senha em texto (`src/App.jsx:220-326`).

## Conteúdo: Catequese e Itens Interessantes
- Criar módulo "Catequese" com categorias: Doutrina, Sacramentos, Moral, Liturgia, Orações.
- Modelo de dados no Supabase: `catequeses(id, titulo, conteudo_md, categoria, tags[], fonte, autor, created_at)` e `temas_catequese(id, nome)`. Suporte a Markdown para formatação simples.
- Páginas: Lista por categorias, busca, detalhe com leitura limpa, sugestões relacionadas.
- Itens adicionais: Biblioteca de Orações, Santos do dia, Calendário litúrgico básico, Leituras diárias ligadas ao plano, Destaques/Anotações e Favoritos.

## UX/UI: Visualizações mais limpas e rápidas
- Navegação: Introduzir `react-router-dom` com rotas claras (`/biblia`, `/catequese`, `/planos`, `/checklist`, `/progresso`, `/admin`).
- Home: Painel com acesso rápido às últimas leituras, catequeses recentes e itens úteis.
- Listas: Alternar modo Lista/Grade; cartões compactos com progresso; skeleton loaders.
- Player: Controles mais enxutos, barra fixa mobile já existe — ajustar contraste e foco; atalhos (←/→, espaço).
- Busca: Campo global com escopo (Bíblia, Catequese, Orações), sugestões instantâneas.
- Ações rápidas: "Marcar como lido", "Favoritar", "Compartilhar" em cartões.

## Paleta de Cores e Tipografia
- Paleta: Primária azul profundo (`#0e3a5b`), secundária dourado (`#cfa23a`), neutros quentes; estados com verdes/azuis suaves.
- Tailwind Theme: definir tokens `colors.brand`, `colors.accent`, `colors.neutral` em `tailwind.config.js:6-9` e substituir classes âmbar.
- Tipografia: Títulos com `serif` (legibilidade litúrgica), corpo com `sans` moderna; ajustar `leading` e `spacing` para leitura.
- Dark mode opcional com `media` ou toggle.

## Arquitetura Técnica
- Supabase: Migrar para `@supabase/supabase-js` com `createClient`, mover config para `src/lib/supabase.js`, usar `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY` (já no `.env`).
- Auth: Trocar login inseguro por Supabase Auth (email/senha) e perfis; remover validação de senha em texto (`src/App.jsx:220-326`).
- Modularização: Quebrar `App.jsx` em páginas e componentes; usar layout comum (Header, BottomNav, Container).
- Acessibilidade: Labels, `aria-*`, foco visível, contraste; revisar botões e controles.

## Performance
- Consultas: Paginação e `select` enxuto; índices em tabelas (Supabase) para `livro_id`, `numero`.
- UI: Lazy loading com `React.lazy/Suspense`; memoização; virtualização para listas longas.
- Cache/Offline: Service Worker básico para CSS/JS e caching de capítulos recentes; preferências no `localStorage`.
- Áudio: Pré-carregar próximo capítulo; tratamento de erros centralizado; remover `console.log` excessivos.

## Páginas/Componentes a Introduzir
- `src/pages/CatequeseList.jsx`, `src/pages/CatequeseDetail.jsx`, `src/pages/Home.jsx`.
- `src/components/NavBar.jsx`, `src/components/BottomNav.jsx`, `src/components/SearchBar.jsx`, `src/components/CardItem.jsx`.
- `src/lib/supabase.js` (cliente oficial) e `src/services/catequeseService.js`.

## Milestones
- Fase 1: Base de navegação, tema de cores, layout comum; migrar Supabase client e Auth.
- Fase 2: Módulo Catequese (dados, lista, detalhe, busca); Biblioteca de Orações.
- Fase 3: Refinos de UX (visualizações, skeletons, favoritos, compartilhamento) e performance.
- Fase 4: Acessibilidade e dark mode; itens extra (Santos/calendário) conforme prioridade.

## Referências de Código
- Supabase config manual: `src/App.jsx:13-21`, objeto custom: `src/App.jsx:23-139`.
- Login atual: `src/App.jsx:220-326`.
- Tailwind base: `src/index.css:14-16`; config: `tailwind.config.js:3-9`.
- Planos/Checklist/Progresso: `src/components/PlanosLeitura.jsx`, `src/components/ChecklistLeitura.jsx`, `src/components/ProgressoLeitura.jsx`.

## Confirmação
- Posso começar pela Fase 1: criar navegação por rotas, aplicar nova paleta no Tailwind, extrair o cliente Supabase oficial e ajustar o login. Em seguida implemento Catequese (Fase 2). Confirma essa direção?