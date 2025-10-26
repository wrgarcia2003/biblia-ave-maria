-- =====================================================
-- POLÍTICAS RLS PARA PLANOS DE LEITURA
-- =====================================================
-- Execute este script APÓS executar o planos-leitura-schema.sql

-- 1. Habilitar RLS nas novas tabelas
ALTER TABLE tipos_planos_leitura ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_leitura_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_leitura_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE capitulos_lidos_usuarios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- REMOVER POLÍTICAS EXISTENTES (SE HOUVER)
-- =====================================================

-- Remover políticas de tipos_planos_leitura
DROP POLICY IF EXISTS "Todos podem ler tipos de planos" ON tipos_planos_leitura;
DROP POLICY IF EXISTS "Apenas admins podem modificar tipos de planos" ON tipos_planos_leitura;

-- Remover políticas de planos_leitura_usuarios
DROP POLICY IF EXISTS "Usuários veem apenas seus planos" ON planos_leitura_usuarios;
DROP POLICY IF EXISTS "Usuários podem criar seus planos" ON planos_leitura_usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar seus planos" ON planos_leitura_usuarios;
DROP POLICY IF EXISTS "Usuários podem deletar seus planos" ON planos_leitura_usuarios;
DROP POLICY IF EXISTS "Admins podem ver todos os planos" ON planos_leitura_usuarios;
DROP POLICY IF EXISTS "Permitir criação de planos" ON planos_leitura_usuarios;
DROP POLICY IF EXISTS "Permitir todas operações em planos" ON planos_leitura_usuarios;

-- Remover políticas de progresso_leitura_diario
DROP POLICY IF EXISTS "Usuários veem apenas seu progresso" ON progresso_leitura_diario;
DROP POLICY IF EXISTS "Usuários podem inserir seu progresso" ON progresso_leitura_diario;
DROP POLICY IF EXISTS "Usuários podem atualizar seu progresso" ON progresso_leitura_diario;
DROP POLICY IF EXISTS "Permitir inserção de progresso" ON progresso_leitura_diario;
DROP POLICY IF EXISTS "Permitir todas operações em progresso" ON progresso_leitura_diario;

-- Remover políticas de capitulos_lidos_usuarios
DROP POLICY IF EXISTS "Usuários veem apenas seus capítulos lidos" ON capitulos_lidos_usuarios;
DROP POLICY IF EXISTS "Usuários podem marcar seus capítulos" ON capitulos_lidos_usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar seus capítulos lidos" ON capitulos_lidos_usuarios;
DROP POLICY IF EXISTS "Permitir marcação de capítulos" ON capitulos_lidos_usuarios;
DROP POLICY IF EXISTS "Permitir todas operações em capítulos" ON capitulos_lidos_usuarios;

-- =====================================================
-- POLÍTICAS PARA tipos_planos_leitura
-- =====================================================

-- Todos podem ler os tipos de planos disponíveis
CREATE POLICY "Todos podem ler tipos de planos" ON tipos_planos_leitura
    FOR SELECT USING (ativo = true);

-- Apenas admins podem modificar tipos de planos
CREATE POLICY "Apenas admins podem modificar tipos de planos" ON tipos_planos_leitura
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_app 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS SIMPLIFICADAS E PERMISSIVAS
-- =====================================================

-- Políticas permissivas para planos_leitura_usuarios
CREATE POLICY "Permitir todas operações em planos" ON planos_leitura_usuarios
    FOR ALL USING (true) WITH CHECK (true);

-- Políticas permissivas para progresso_leitura_diario
CREATE POLICY "Permitir todas operações em progresso" ON progresso_leitura_diario
    FOR ALL USING (true) WITH CHECK (true);

-- Políticas permissivas para capitulos_lidos_usuarios
CREATE POLICY "Permitir todas operações em capítulos" ON capitulos_lidos_usuarios
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- =====================================================
-- Execute esta consulta para verificar se as políticas foram criadas:

SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tipos_planos_leitura', 'planos_leitura_usuarios', 'progresso_leitura_diario', 'capitulos_lidos_usuarios')
ORDER BY tablename, policyname;