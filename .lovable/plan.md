## Objetivo

Expandir o banco no Lovable Cloud (Supabase) com tudo que faltava: perfil mais rico, categorias customizadas, sistema de roles seguro e histórico de atividade — além de telas para usar essas tabelas na prática.

## Mudanças no banco

### 1. Expandir `public.profiles`
Adicionar colunas: `username` (único), `avatar_url`, `phone`, `city`, `country`, `gender`.

### 2. Nova tabela `public.categories`
Categorias customizadas por usuário para organizar anotações.
- Campos: `name`, `color`, `user_id`
- RLS: cada usuário só vê/edita as próprias categorias
- Vincular `learning_notes.category_id` (nullable, FK) mantendo o campo `category` textual atual para compatibilidade

### 3. Sistema de roles (padrão seguro)
- Enum `app_role` com valores `admin` e `user`
- Tabela `public.user_roles` separada (nunca no profiles) com `user_id` + `role`
- Função `SECURITY DEFINER` `public.has_role(_user_id, _role)` para usar em RLS sem recursão
- Trigger no signup atribui role `user` automaticamente
- Admins poderão ler todos os perfis/atividades via policies que usam `has_role`

### 4. Histórico de atividade `public.activity_log`
Registra eventos como `login`, `logout`, `note_created`, `note_updated`, `note_deleted`, `profile_updated`.
- Campos: `user_id`, `action`, `metadata` (jsonb), `created_at`
- RLS: usuário lê o próprio histórico; admin lê tudo; inserts feitos pelo cliente apenas para o próprio user_id

### 5. RLS e GRANTs
Toda tabela nova com RLS habilitada, policies escopadas por `auth.uid()` + `has_role`, e GRANTs explícitos para `authenticated` e `service_role`.

## Mudanças no frontend

- **`/auth`**: capturar `username` opcional no cadastro
- **`/profile`**: adicionar campos novos (username, avatar URL, telefone, cidade, país, gênero)
- **`/dashboard`**: substituir o input de texto livre de categoria por um seletor que lista categorias do usuário + botão "nova categoria"; ao salvar/editar/excluir nota, gravar em `activity_log`
- **Nova rota `/activity`**: lista o histórico recente do usuário (login, ações em notas, atualizações de perfil)
- Registrar `login` no `activity_log` ao detectar `SIGNED_IN` no `onAuthStateChange`

## Detalhes técnicos

- A função `handle_new_user` existente será estendida para também inserir em `user_roles` o role padrão `user`
- `has_role` com `SECURITY DEFINER`, `STABLE`, `search_path = public` — evita recursão em RLS
- `learning_notes.category_id` será adicionada como `UUID NULL REFERENCES public.categories(id) ON DELETE SET NULL`; o campo `category` (texto) permanece para não quebrar dados existentes
- Policies de admin usam `public.has_role(auth.uid(), 'admin')`
- `activity_log` recebe inserts do cliente com `WITH CHECK (auth.uid() = user_id)`; SELECT permitido para dono e admin

## Fora do escopo

- UI de administração (gestão de usuários/roles) — pode vir num próximo passo
- Upload real de avatar (por enquanto só URL); storage bucket fica para depois se quiser
