-- =====================================================
-- SCHEMA PARA PLANOS DE LEITURA - BÍBLIA AVE MARIA
-- =====================================================
-- Execute este script no SQL Editor do Supabase para criar as tabelas necessárias

-- 1. Tabela de tipos de planos de leitura
CREATE TABLE IF NOT EXISTS tipos_planos_leitura (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL, -- "Anual", "6 Meses", "3 Meses"
    duracao_dias INTEGER NOT NULL, -- 365, 180, 90
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de planos de leitura dos usuários
CREATE TABLE IF NOT EXISTS planos_leitura_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_email VARCHAR(255) NOT NULL REFERENCES usuarios_app(email) ON DELETE CASCADE,
    tipo_plano_id INTEGER NOT NULL REFERENCES tipos_planos_leitura(id),
    
    -- Ponto de início personalizado
    livro_inicio_id INTEGER NOT NULL REFERENCES livros(id),
    capitulo_inicio_numero INTEGER NOT NULL,
    
    -- Controle de datas
    data_inicio DATE NOT NULL,
    data_fim_prevista DATE NOT NULL,
    data_conclusao DATE NULL, -- NULL = ainda não concluído
    
    -- Status do plano
    ativo BOOLEAN DEFAULT true,
    pausado BOOLEAN DEFAULT false,
    data_pausa DATE NULL,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir que capitulo_inicio existe
    CONSTRAINT fk_capitulo_inicio 
        FOREIGN KEY (livro_inicio_id, capitulo_inicio_numero) 
        REFERENCES capitulos(livro_id, numero)
);

-- 3. Tabela de progresso diário do usuário
CREATE TABLE IF NOT EXISTS progresso_leitura_diario (
    id SERIAL PRIMARY KEY,
    plano_id INTEGER NOT NULL REFERENCES planos_leitura_usuarios(id) ON DELETE CASCADE,
    data_leitura DATE NOT NULL,
    
    -- Capítulos que deveriam ser lidos neste dia
    capitulos_programados JSONB NOT NULL, -- [{"livro_id": 1, "capitulo": 1}, {"livro_id": 1, "capitulo": 2}]
    
    -- Capítulos efetivamente lidos
    capitulos_lidos JSONB DEFAULT '[]'::jsonb,
    
    -- Status do dia
    concluido BOOLEAN DEFAULT false,
    atrasado BOOLEAN DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única por plano e data
    UNIQUE(plano_id, data_leitura)
);

-- 4. Tabela de capítulos lidos (checklist detalhado)
CREATE TABLE IF NOT EXISTS capitulos_lidos_usuarios (
    id SERIAL PRIMARY KEY,
    plano_id INTEGER NOT NULL REFERENCES planos_leitura_usuarios(id) ON DELETE CASCADE,
    livro_id INTEGER NOT NULL REFERENCES livros(id),
    capitulo_numero INTEGER NOT NULL,
    
    -- Controle de leitura
    lido BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP WITH TIME ZONE NULL,
    data_programada DATE NULL, -- Quando deveria ter sido lido
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única por plano e capítulo
    UNIQUE(plano_id, livro_id, capitulo_numero),
    
    -- Constraint para garantir que o capítulo existe
    FOREIGN KEY (livro_id, capitulo_numero) 
        REFERENCES capitulos(livro_id, numero)
);

-- =====================================================
-- INSERIR TIPOS DE PLANOS PADRÃO
-- =====================================================
INSERT INTO tipos_planos_leitura (nome, duracao_dias, descricao) VALUES
('Plano Anual', 365, 'Leia toda a Bíblia em 1 ano - aproximadamente 3-4 capítulos por dia'),
('Plano 6 Meses', 180, 'Leia toda a Bíblia em 6 meses - aproximadamente 6-7 capítulos por dia'),
('Plano 3 Meses', 90, 'Leia toda a Bíblia em 3 meses - aproximadamente 12-13 capítulos por dia')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_planos_usuario_email ON planos_leitura_usuarios(usuario_email);
CREATE INDEX IF NOT EXISTS idx_planos_ativo ON planos_leitura_usuarios(ativo, usuario_email);
CREATE INDEX IF NOT EXISTS idx_progresso_plano_data ON progresso_leitura_diario(plano_id, data_leitura);
CREATE INDEX IF NOT EXISTS idx_capitulos_lidos_plano ON capitulos_lidos_usuarios(plano_id, lido);
CREATE INDEX IF NOT EXISTS idx_capitulos_lidos_data ON capitulos_lidos_usuarios(data_programada, lido);

-- =====================================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_planos_leitura_usuarios_updated_at 
    BEFORE UPDATE ON planos_leitura_usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progresso_leitura_diario_updated_at 
    BEFORE UPDATE ON progresso_leitura_diario 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular total de capítulos da Bíblia
CREATE OR REPLACE FUNCTION total_capitulos_biblia()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT SUM(total_capitulos) FROM livros);
END;
$$ LANGUAGE plpgsql;

-- Função para calcular capítulos por dia
CREATE OR REPLACE FUNCTION capitulos_por_dia(duracao_dias INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(total_capitulos_biblia()::DECIMAL / duracao_dias, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONSULTAS DE VERIFICAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tipos_planos_leitura', 'planos_leitura_usuarios', 'progresso_leitura_diario', 'capitulos_lidos_usuarios')
ORDER BY table_name;

-- Verificar tipos de planos inseridos
SELECT id, nome, duracao_dias, capitulos_por_dia(duracao_dias) as capitulos_por_dia
FROM tipos_planos_leitura 
WHERE ativo = true;

-- Verificar total de capítulos
SELECT total_capitulos_biblia() as total_capitulos;