-- Adicionar campos funcao e turno à tabela funcionarios
ALTER TABLE public.funcionarios 
ADD COLUMN IF NOT EXISTS funcao text,
ADD COLUMN IF NOT EXISTS turno text;