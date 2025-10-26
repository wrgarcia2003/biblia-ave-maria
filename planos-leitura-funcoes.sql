-- =====================================================
-- FUNÇÕES PARA CÁLCULO DE PLANOS DE LEITURA
-- =====================================================

-- Função para obter capítulos a partir de um ponto específico
DROP FUNCTION IF EXISTS obter_capitulos_a_partir_de(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION obter_capitulos_a_partir_de(
    livro_inicio_id INTEGER,
    capitulo_inicio_numero INTEGER
)
RETURNS TABLE(
    livro_id INTEGER,
    livro_nome VARCHAR(255),
    capitulo_numero INTEGER,
    ordem_sequencial INTEGER
) AS $$
BEGIN
    -- Verificar se existem capítulos no banco
    IF NOT EXISTS (SELECT 1 FROM capitulos LIMIT 1) THEN
        RETURN;
    END IF;
    
    -- Verificar se o ponto de início existe
    IF NOT EXISTS (
        SELECT 1 FROM capitulos c 
        JOIN livros l ON c.livro_id = l.id 
        WHERE c.livro_id = livro_inicio_id AND c.numero = capitulo_inicio_numero
    ) THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    WITH capitulos_ordenados AS (
        SELECT 
            c.livro_id,
            l.nome as livro_nome,
            c.numero as capitulo_numero,
            ROW_NUMBER() OVER (ORDER BY l.ordem, c.numero) as ordem_global
        FROM capitulos c
        JOIN livros l ON c.livro_id = l.id
    ),
    ponto_inicio AS (
        SELECT ordem_global as inicio_ordem
        FROM capitulos_ordenados co_inicio
        WHERE co_inicio.livro_id = livro_inicio_id AND co_inicio.capitulo_numero = capitulo_inicio_numero
    )
    SELECT 
        co.livro_id,
        co.livro_nome,
        co.capitulo_numero,
        (co.ordem_global - pi.inicio_ordem + 1)::INTEGER as ordem_sequencial
    FROM capitulos_ordenados co
    CROSS JOIN ponto_inicio pi
    WHERE co.ordem_global >= pi.inicio_ordem
    ORDER BY co.ordem_global;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular total de capítulos a partir de um ponto
CREATE OR REPLACE FUNCTION total_capitulos_a_partir_de(
    livro_inicio_id INTEGER,
    capitulo_inicio_numero INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COUNT(*) INTO total
    FROM obter_capitulos_a_partir_de(livro_inicio_id, capitulo_inicio_numero);
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Função para distribuir capítulos por dias
CREATE OR REPLACE FUNCTION distribuir_capitulos_por_dias(
    livro_inicio_id INTEGER,
    capitulo_inicio_numero INTEGER,
    duracao_dias INTEGER
)
RETURNS TABLE(
    dia INTEGER,
    data_programada DATE,
    capitulos JSONB
) AS $$
DECLARE
    total_caps INTEGER;
    caps_por_dia DECIMAL;
    caps_restantes DECIMAL := 0;
    dia_atual INTEGER := 1;
    data_atual DATE := CURRENT_DATE;
    capitulos_dia JSONB := '[]'::jsonb;
    cap_record RECORD;
BEGIN
    -- Calcular total de capítulos e capítulos por dia
    SELECT total_capitulos_a_partir_de(livro_inicio_id, capitulo_inicio_numero) INTO total_caps;
    caps_por_dia := total_caps::DECIMAL / duracao_dias;
    
    -- Iterar pelos capítulos e distribuir por dias
    FOR cap_record IN 
        SELECT * FROM obter_capitulos_a_partir_de(livro_inicio_id, capitulo_inicio_numero)
        ORDER BY ordem_sequencial
    LOOP
        -- Adicionar capítulo ao dia atual
        capitulos_dia := capitulos_dia || jsonb_build_object(
            'livro_id', cap_record.livro_id,
            'livro_nome', cap_record.livro_nome,
            'capitulo', cap_record.capitulo_numero
        );
        
        caps_restantes := caps_restantes + 1;
        
        -- Verificar se deve avançar para o próximo dia
        IF caps_restantes >= caps_por_dia OR 
           cap_record.ordem_sequencial = total_caps THEN
            
            -- Retornar o dia atual
            RETURN QUERY SELECT 
                dia_atual,
                data_atual,
                capitulos_dia;
            
            -- Preparar próximo dia
            dia_atual := dia_atual + 1;
            data_atual := data_atual + INTERVAL '1 day';
            capitulos_dia := '[]'::jsonb;
            caps_restantes := caps_restantes - caps_por_dia;
            
            -- Parar se chegou ao final dos dias
            IF dia_atual > duracao_dias THEN
                EXIT;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para criar um plano de leitura completo
CREATE OR REPLACE FUNCTION criar_plano_leitura(
    p_usuario_email TEXT,
    p_tipo_plano_id INTEGER,
    p_livro_inicio_id INTEGER,
    p_capitulo_inicio_numero INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    novo_plano_id INTEGER;
    tipo_plano RECORD;
    dia_record RECORD;
BEGIN
    -- Obter informações do tipo de plano
    SELECT * INTO tipo_plano 
    FROM tipos_planos_leitura 
    WHERE id = p_tipo_plano_id AND ativo = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tipo de plano não encontrado ou inativo';
    END IF;
    
    -- Criar o plano do usuário
    INSERT INTO planos_leitura_usuarios (
        usuario_email,
        tipo_plano_id,
        livro_inicio_id,
        capitulo_inicio_numero,
        data_inicio,
        data_fim_prevista
    ) VALUES (
        p_usuario_email,
        p_tipo_plano_id,
        p_livro_inicio_id,
        p_capitulo_inicio_numero,
        CURRENT_DATE,
        CURRENT_DATE + (tipo_plano.duracao_dias || ' days')::INTERVAL
    ) RETURNING id INTO novo_plano_id;
    
    -- Criar o progresso diário
    FOR dia_record IN 
        SELECT * FROM distribuir_capitulos_por_dias(
            p_livro_inicio_id, 
            p_capitulo_inicio_numero, 
            tipo_plano.duracao_dias
        )
    LOOP
        INSERT INTO progresso_leitura_diario (
            plano_id,
            data_leitura,
            capitulos_programados
        ) VALUES (
            novo_plano_id,
            dia_record.data_programada,
            dia_record.capitulos
        );
    END LOOP;
    
    -- Criar checklist de capítulos
    INSERT INTO capitulos_lidos_usuarios (
        plano_id,
        livro_id,
        capitulo_numero,
        data_programada
    )
    SELECT DISTINCT
        novo_plano_id,  -- Esta é a variável local
        (cap_info->>'livro_id')::INTEGER,
        (cap_info->>'capitulo')::INTEGER,
        prog.data_leitura
    FROM progresso_leitura_diario prog
    CROSS JOIN LATERAL jsonb_array_elements(prog.capitulos_programados) as cap_info
    WHERE prog.plano_id = novo_plano_id;  -- Agora não há ambiguidade
    
    RETURN novo_plano_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter status do plano do usuário
DROP FUNCTION IF EXISTS obter_status_plano_usuario(TEXT);
CREATE OR REPLACE FUNCTION obter_status_plano_usuario(p_usuario_email TEXT)
RETURNS TABLE(
    plano_id INTEGER,
    tipo_plano VARCHAR(100),
    data_inicio DATE,
    data_fim_prevista DATE,
    dias_decorridos INTEGER,
    dias_restantes INTEGER,
    total_capitulos INTEGER,
    capitulos_lidos INTEGER,
    percentual_concluido DECIMAL,
    esta_atrasado BOOLEAN,
    dias_atraso INTEGER,
    capitulos_hoje JSONB,
    proximos_capitulos JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH plano_ativo AS (
        SELECT 
            plu.*,
            tpl.nome as tipo_nome
        FROM planos_leitura_usuarios plu
        JOIN tipos_planos_leitura tpl ON plu.tipo_plano_id = tpl.id
        WHERE plu.usuario_email = p_usuario_email 
        AND plu.ativo = true
        ORDER BY plu.created_at DESC
        LIMIT 1
    ),
    estatisticas AS (
        SELECT 
            pa.id,
            pa.tipo_nome,
            pa.data_inicio,
            pa.data_fim_prevista,
            (CURRENT_DATE - pa.data_inicio)::INTEGER as dias_decorridos,
            (pa.data_fim_prevista - CURRENT_DATE)::INTEGER as dias_restantes,
            (
                SELECT COUNT(*) 
                FROM obter_capitulos_a_partir_de(pa.livro_inicio_id, pa.capitulo_inicio_numero)
            )::INTEGER as total_capitulos,
            COALESCE(COUNT(clu.id) FILTER (WHERE clu.lido = true), 0)::INTEGER as capitulos_lidos,
            ROUND(
                COALESCE(COUNT(clu.id) FILTER (WHERE clu.lido = true), 0)::DECIMAL * 100 / 
                NULLIF((
                    SELECT COUNT(*) 
                    FROM obter_capitulos_a_partir_de(pa.livro_inicio_id, pa.capitulo_inicio_numero)
                ), 0), 2
            ) as percentual_concluido
        FROM plano_ativo pa
        LEFT JOIN capitulos_lidos_usuarios clu ON pa.id = clu.plano_id
        GROUP BY pa.id, pa.tipo_nome, pa.data_inicio, pa.data_fim_prevista, pa.livro_inicio_id, pa.capitulo_inicio_numero
    ),
    atraso_info AS (
        SELECT 
            est.*,
            CASE 
                WHEN CURRENT_DATE > est.data_fim_prevista THEN true
                WHEN (
                    SELECT COUNT(*) 
                    FROM progresso_leitura_diario prd 
                    WHERE prd.plano_id = est.id 
                    AND prd.data_leitura < CURRENT_DATE 
                    AND prd.concluido = false
                ) > 0 THEN true
                ELSE false
            END as esta_atrasado,
            GREATEST(0, (CURRENT_DATE - est.data_fim_prevista)::INTEGER) as dias_atraso
        FROM estatisticas est
    ),
    capitulos_info AS (
        SELECT 
            ai.*,
            COALESCE(
                (SELECT capitulos_programados 
                 FROM progresso_leitura_diario prd_hoje
                 WHERE prd_hoje.plano_id = ai.id AND prd_hoje.data_leitura = CURRENT_DATE), 
                '[]'::jsonb
            ) as capitulos_hoje,
            COALESCE(
                (SELECT jsonb_agg(capitulos_programados ORDER BY data_leitura) 
                 FROM progresso_leitura_diario prd_proximos
                 WHERE prd_proximos.plano_id = ai.id 
                 AND prd_proximos.data_leitura BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 7), 
                '[]'::jsonb
            ) as proximos_capitulos
        FROM atraso_info ai
    )
    SELECT 
        ci.id,
        ci.tipo_nome,
        ci.data_inicio,
        ci.data_fim_prevista,
        ci.dias_decorridos,
        ci.dias_restantes,
        ci.total_capitulos,
        ci.capitulos_lidos,
        ci.percentual_concluido,
        ci.esta_atrasado,
        ci.dias_atraso,
        ci.capitulos_hoje,
        ci.proximos_capitulos
    FROM capitulos_info ci;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar capítulo como lido
CREATE OR REPLACE FUNCTION marcar_capitulo_lido(
    p_plano_id INTEGER,
    p_livro_id INTEGER,
    p_capitulo_numero INTEGER,
    p_lido BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE capitulos_lidos_usuarios 
    SET 
        lido = p_lido,
        data_leitura = CASE WHEN p_lido THEN NOW() ELSE NULL END
    WHERE plano_id = p_plano_id 
    AND livro_id = p_livro_id 
    AND capitulo_numero = p_capitulo_numero;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    -- Atualizar progresso diário se necessário
    IF updated_rows > 0 THEN
        UPDATE progresso_leitura_diario 
        SET 
            concluido = (
                SELECT COUNT(*) = jsonb_array_length(capitulos_programados)
                FROM capitulos_lidos_usuarios clu
                WHERE clu.plano_id = progresso_leitura_diario.plano_id
                AND clu.data_programada = progresso_leitura_diario.data_leitura
                AND clu.lido = true
            ),
            updated_at = NOW()
        WHERE plano_id = p_plano_id
        AND EXISTS (
            SELECT 1 FROM capitulos_lidos_usuarios clu2
            WHERE clu2.plano_id = p_plano_id 
            AND clu2.livro_id = p_livro_id 
            AND clu2.capitulo_numero = p_capitulo_numero
            AND clu2.data_programada = progresso_leitura_diario.data_leitura
        );
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONSULTAS DE TESTE
-- =====================================================

-- Testar distribuição de capítulos (exemplo: começar em Gênesis 1, plano de 90 dias)
/*
SELECT * FROM distribuir_capitulos_por_dias(1, 1, 90) LIMIT 10;

-- Testar criação de plano
SELECT criar_plano_leitura('usuario@teste.com', 1, 1, 1);

-- Testar status do plano
SELECT * FROM obter_status_plano_usuario('usuario@teste.com');
*/