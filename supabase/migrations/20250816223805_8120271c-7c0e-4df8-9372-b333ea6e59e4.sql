-- Atualizar tabela RMA removendo campos não utilizados
ALTER TABLE public.rmas 
DROP COLUMN IF EXISTS numero_serie,
DROP COLUMN IF EXISTS origem_original,
DROP COLUMN IF EXISTS cliente,
DROP COLUMN IF EXISTS contato_cliente;