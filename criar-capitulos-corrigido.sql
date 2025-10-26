-- =====================================================
-- SCRIPT CORRIGIDO PARA CRIAR CAPÍTULOS FALTANTES
-- =====================================================
-- Este script usa os IDs exatos dos livros do banco de dados

-- Gênesis (ID: 1, 50 capítulos) - já existe, mas vamos garantir
INSERT INTO capitulos (livro_id, numero) 
SELECT 1, generate_series(1, 50)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Êxodo (ID: 2, 40 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 2, generate_series(1, 40)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Levítico (ID: 3, 27 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 3, generate_series(1, 27)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Números (ID: 4, 36 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 4, generate_series(1, 36)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Deuteronômio (ID: 5, 34 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 5, generate_series(1, 34)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Mateus (ID: 6, 28 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 6, generate_series(1, 28)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Marcos (ID: 7, 16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 7, generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Lucas (ID: 8, 24 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 8, generate_series(1, 24)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- João (ID: 9, 21 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 9, generate_series(1, 21)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Atos dos Apóstolos (ID: 10, 28 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 10, generate_series(1, 28)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Josué (ID: 11, 24 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 11, generate_series(1, 24)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Juízes (ID: 12, 21 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 12, generate_series(1, 21)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Rute (ID: 13, 4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 13, generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Samuel (ID: 14, 31 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 14, generate_series(1, 31)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Samuel (ID: 15, 24 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 15, generate_series(1, 24)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Reis (ID: 16, 22 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 16, generate_series(1, 22)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Reis (ID: 17, 25 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 17, generate_series(1, 25)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Crônicas (ID: 18, 29 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 18, generate_series(1, 29)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Crônicas (ID: 19, 36 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 19, generate_series(1, 36)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Esdras (ID: 20, 10 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 20, generate_series(1, 10)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Neemias (ID: 21, 13 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 21, generate_series(1, 13)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Tobias (ID: 22, 14 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 22, generate_series(1, 14)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Judite (ID: 23, 16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 23, generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Ester (ID: 24, 16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 24, generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Macabeus (ID: 25, 16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 25, generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Macabeus (ID: 26, 15 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 26, generate_series(1, 15)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Jó (ID: 27, 42 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 27, generate_series(1, 42)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Salmos (ID: 28, 150 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 28, generate_series(1, 150)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Provérbios (ID: 29, 31 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 29, generate_series(1, 31)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Eclesiastes (ID: 30, 12 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 30, generate_series(1, 12)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Cânticos dos Cânticos (ID: 31, 8 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 31, generate_series(1, 8)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Sabedoria (ID: 32, 19 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 32, generate_series(1, 19)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Eclesiástico (ID: 33, 51 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 33, generate_series(1, 51)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Isaías (ID: 34, 66 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 34, generate_series(1, 66)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Jeremias (ID: 35, 52 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 35, generate_series(1, 52)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Lamentações (ID: 36, 5 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 36, generate_series(1, 5)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Baruc (ID: 37, 6 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 37, generate_series(1, 6)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Ezequiel (ID: 38, 48 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 38, generate_series(1, 48)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Daniel (ID: 39, 14 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 39, generate_series(1, 14)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Oséias (ID: 40, 14 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 40, generate_series(1, 14)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Joel (ID: 41, 4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 41, generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Amós (ID: 42, 9 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 42, generate_series(1, 9)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Abdias (ID: 43, 1 capítulo)
INSERT INTO capitulos (livro_id, numero) 
SELECT 43, generate_series(1, 1)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Jonas (ID: 44, 4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 44, generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Miqueias (ID: 45, 7 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 45, generate_series(1, 7)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Naum (ID: 46, 3 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 46, generate_series(1, 3)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Habacuc (ID: 47, 3 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 47, generate_series(1, 3)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Sofonias (ID: 48, 3 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 48, generate_series(1, 3)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Ageu (ID: 49, 2 capítulos) - assumindo baseado no padrão
INSERT INTO capitulos (livro_id, numero) 
SELECT 49, generate_series(1, 2)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO DOS RESULTADOS
-- =====================================================
-- Execute esta consulta para verificar quantos capítulos foram criados por livro:

SELECT 
    l.nome as livro,
    l.total_capitulos as esperado,
    COUNT(c.id) as criados,
    CASE 
        WHEN COUNT(c.id) = l.total_capitulos THEN '✓ OK'
        ELSE '❌ FALTANDO'
    END as status
FROM livros l
LEFT JOIN capitulos c ON l.id = c.livro_id
GROUP BY l.id, l.nome, l.total_capitulos, l.ordem
ORDER BY l.ordem;