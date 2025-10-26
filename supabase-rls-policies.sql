-- =====================================================
-- POLÍTICAS RLS PARA BÍBLIA AVE MARIA
-- =====================================================
-- Execute este script no SQL Editor do Supabase para configurar as políticas de segurança

-- 1. Habilitar RLS nas tabelas principais
ALTER TABLE usuarios_app ENABLE ROW LEVEL SECURITY;
ALTER TABLE livros ENABLE ROW LEVEL SECURITY;
ALTER TABLE capitulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE versiculos ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para tabela usuarios_app
-- Permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados" ON usuarios_app
    FOR SELECT USING (auth.uid()::text = id::text OR auth.jwt() ->> 'email' = email);

-- Permitir login (busca por email/senha)
CREATE POLICY "Permitir login por email" ON usuarios_app
    FOR SELECT USING (true);

-- 3. Políticas para tabela livros
-- Todos podem ler livros
CREATE POLICY "Todos podem ler livros" ON livros
    FOR SELECT USING (true);

-- Apenas admins podem modificar livros
CREATE POLICY "Apenas admins podem modificar livros" ON livros
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_app 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

-- 4. Políticas para tabela capitulos
-- Todos podem ler capítulos
CREATE POLICY "Todos podem ler capítulos" ON capitulos
    FOR SELECT USING (true);

-- Apenas admins podem modificar capítulos
CREATE POLICY "Apenas admins podem modificar capítulos" ON capitulos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_app 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

-- 5. Políticas para tabela versiculos
-- Todos podem ler versículos
CREATE POLICY "Todos podem ler versículos" ON versiculos
    FOR SELECT USING (true);

-- Apenas admins podem inserir versículos
CREATE POLICY "Apenas admins podem inserir versículos" ON versiculos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_app 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

-- Apenas admins podem atualizar versículos
CREATE POLICY "Apenas admins podem atualizar versículos" ON versiculos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios_app 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

-- Apenas admins podem deletar versículos
CREATE POLICY "Apenas admins podem deletar versículos" ON versiculos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios_app 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS ALTERNATIVAS (CASO AS ACIMA NÃO FUNCIONEM)
-- =====================================================
-- Se você estiver usando autenticação customizada (sem auth.uid()),
-- descomente as políticas abaixo e comente as acima:

-- EXECUTE ESTAS POLÍTICAS SE ESTIVER TENDO PROBLEMAS DE DELEÇÃO:

-- Política mais permissiva para versículos (TEMPORÁRIA - APENAS PARA TESTE)
DROP POLICY IF EXISTS "Apenas admins podem inserir versículos" ON versiculos;
CREATE POLICY "Permitir inserção de versículos" ON versiculos
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Apenas admins podem atualizar versículos" ON versiculos;
CREATE POLICY "Permitir atualização de versículos" ON versiculos
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Apenas admins podem deletar versículos" ON versiculos;
CREATE POLICY "Permitir deleção de versículos" ON versiculos
    FOR DELETE USING (true);

-- =====================================================
-- POLÍTICAS MAIS SEGURAS (USAR APÓS TESTAR)
-- =====================================================
-- Depois que a funcionalidade estiver funcionando, substitua pelas políticas abaixo:

/*
DROP POLICY IF EXISTS "Permitir inserção de versículos" ON versiculos;
CREATE POLICY "Apenas admins podem inserir versículos" ON versiculos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_app 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Permitir atualização de versículos" ON versiculos;
CREATE POLICY "Apenas admins podem atualizar versículos" ON versiculos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios_app 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Permitir deleção de versículos" ON versiculos;
CREATE POLICY "Apenas admins podem deletar versículos" ON versiculos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios_app 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );
*/

-- =====================================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- =====================================================
-- Execute estas consultas para verificar se as políticas foram criadas:

-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Se ainda houver problemas de permissão, descomente as políticas alternativas
-- 3. Teste a importação de versículos na aplicação
-- 4. Se funcionar com as políticas permissivas, ajuste gradualmente para mais segurança