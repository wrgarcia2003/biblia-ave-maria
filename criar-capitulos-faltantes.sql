-- =====================================================
-- SCRIPT PARA CRIAR CAPÍTULOS FALTANTES
-- =====================================================
-- Execute este script no SQL Editor do Supabase para criar todos os capítulos necessários

-- Primeiro, vamos inserir os capítulos para cada livro baseado no número correto de capítulos

-- ANTIGO TESTAMENTO
-- Gênesis (50 capítulos) - já existe
-- Êxodo (40 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Êxodo'), 
    generate_series(1, 40)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Levítico (27 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Levítico'), 
    generate_series(1, 27)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Números (36 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Números'), 
    generate_series(1, 36)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Deuteronômio (34 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Deuteronômio'), 
    generate_series(1, 34)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Josué (24 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Josué'), 
    generate_series(1, 24)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Juízes (21 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Juízes'), 
    generate_series(1, 21)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Rute (4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Rute'), 
    generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Samuel (31 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '1 Samuel'), 
    generate_series(1, 31)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Samuel (24 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '2 Samuel'), 
    generate_series(1, 24)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Reis (22 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '1 Reis'), 
    generate_series(1, 22)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Reis (25 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '2 Reis'), 
    generate_series(1, 25)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Crônicas (29 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '1 Crônicas'), 
    generate_series(1, 29)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Crônicas (36 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '2 Crônicas'), 
    generate_series(1, 36)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Esdras (10 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Esdras'), 
    generate_series(1, 10)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Neemias (13 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Neemias'), 
    generate_series(1, 13)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Tobias (14 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Tobias'), 
    generate_series(1, 14)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Judite (16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Judite'), 
    generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Ester (16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Ester'), 
    generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Macabeus (16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '1 Macabeus'), 
    generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Macabeus (15 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '2 Macabeus'), 
    generate_series(1, 15)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Jó (42 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Jó'), 
    generate_series(1, 42)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Salmos (150 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Salmos'), 
    generate_series(1, 150)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Provérbios (31 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Provérbios'), 
    generate_series(1, 31)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Eclesiastes (12 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Eclesiastes'), 
    generate_series(1, 12)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Cânticos dos Cânticos (8 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Cânticos dos Cânticos'), 
    generate_series(1, 8)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Sabedoria (19 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Sabedoria'), 
    generate_series(1, 19)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Eclesiástico (51 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Eclesiástico'), 
    generate_series(1, 51)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Isaías (66 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Isaías'), 
    generate_series(1, 66)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Jeremias (52 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Jeremias'), 
    generate_series(1, 52)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Lamentações (5 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Lamentações'), 
    generate_series(1, 5)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Baruc (6 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Baruc'), 
    generate_series(1, 6)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Ezequiel (48 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Ezequiel'), 
    generate_series(1, 48)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Daniel (14 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Daniel'), 
    generate_series(1, 14)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Oséias (14 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Oséias'), 
    generate_series(1, 14)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Joel (4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Joel'), 
    generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Amós (9 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Amós'), 
    generate_series(1, 9)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Abdias (1 capítulo)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Abdias'), 
    generate_series(1, 1)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Jonas (4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Jonas'), 
    generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Miqueias (7 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Miqueias'), 
    generate_series(1, 7)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Naum (3 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Naum'), 
    generate_series(1, 3)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Habacuc (3 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Habacuc'), 
    generate_series(1, 3)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Sofonias (3 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Sofonias'), 
    generate_series(1, 3)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Ageu (2 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Ageu'), 
    generate_series(1, 2)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Zacarias (14 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Zacarias'), 
    generate_series(1, 14)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Malaquias (4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Malaquias'), 
    generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- NOVO TESTAMENTO

-- Mateus (28 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Mateus'), 
    generate_series(1, 28)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Marcos (16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Marcos'), 
    generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Lucas (24 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Lucas'), 
    generate_series(1, 24)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- João (21 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'João'), 
    generate_series(1, 21)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Atos dos Apóstolos (28 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Atos dos Apóstolos'), 
    generate_series(1, 28)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Romanos (16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Romanos'), 
    generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Coríntios (16 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '1 Coríntios'), 
    generate_series(1, 16)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Coríntios (13 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '2 Coríntios'), 
    generate_series(1, 13)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Gálatas (6 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Gálatas'), 
    generate_series(1, 6)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Efésios (6 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Efésios'), 
    generate_series(1, 6)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Filipenses (4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Filipenses'), 
    generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Colossenses (4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Colossenses'), 
    generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Tessalonicenses (5 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '1 Tessalonicenses'), 
    generate_series(1, 5)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Tessalonicenses (3 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '2 Tessalonicenses'), 
    generate_series(1, 3)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Timóteo (6 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '1 Timóteo'), 
    generate_series(1, 6)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Timóteo (4 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '2 Timóteo'), 
    generate_series(1, 4)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Tito (3 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Tito'), 
    generate_series(1, 3)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Filemon (1 capítulo)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Filemon'), 
    generate_series(1, 1)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Hebreus (13 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Hebreus'), 
    generate_series(1, 13)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Tiago (5 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Tiago'), 
    generate_series(1, 5)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 Pedro (5 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '1 Pedro'), 
    generate_series(1, 5)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 Pedro (3 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '2 Pedro'), 
    generate_series(1, 3)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 1 João (5 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '1 João'), 
    generate_series(1, 5)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 2 João (1 capítulo)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '2 João'), 
    generate_series(1, 1)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- 3 João (1 capítulo)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = '3 João'), 
    generate_series(1, 1)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Judas (1 capítulo)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Judas'), 
    generate_series(1, 1)
ON CONFLICT (livro_id, numero) DO NOTHING;

-- Apocalipse (22 capítulos)
INSERT INTO capitulos (livro_id, numero) 
SELECT 
    (SELECT id FROM livros WHERE nome = 'Apocalipse'), 
    generate_series(1, 22)
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