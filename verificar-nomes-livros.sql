-- =====================================================
-- SCRIPT PARA VERIFICAR NOMES DOS LIVROS NO BANCO
-- =====================================================
-- Execute este script primeiro para ver os nomes exatos dos livros

SELECT 
    id,
    nome,
    nome_abreviado,
    total_capitulos,
    ordem
FROM livros 
ORDER BY ordem;

-- =====================================================
-- TESTE ESPECÍFICO PARA ALGUNS LIVROS
-- =====================================================
-- Vamos testar se alguns nomes específicos existem:

SELECT 'Êxodo' as nome_testado, 
       (SELECT id FROM livros WHERE nome = 'Êxodo') as livro_id_encontrado;

SELECT '2 Reis' as nome_testado, 
       (SELECT id FROM livros WHERE nome = '2 Reis') as livro_id_encontrado;

SELECT 'Mateus' as nome_testado, 
       (SELECT id FROM livros WHERE nome = 'Mateus') as livro_id_encontrado;

-- =====================================================
-- VERIFICAR CARACTERES ESPECIAIS
-- =====================================================
-- Vamos ver se há diferenças de encoding ou caracteres especiais:

SELECT 
    nome,
    LENGTH(nome) as tamanho,
    ASCII(SUBSTRING(nome, 1, 1)) as primeiro_char_ascii,
    encode(nome::bytea, 'hex') as hex_encoding
FROM livros 
WHERE nome LIKE '%Êxodo%' OR nome LIKE '%Reis%' OR nome LIKE '%Mateus%'
ORDER BY ordem;