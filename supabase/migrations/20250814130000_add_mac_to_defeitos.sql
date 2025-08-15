-- Adicionar campo MAC à tabela defeitos
ALTER TABLE public.defeitos ADD COLUMN macs TEXT[];

-- Adicionar comentário para documentar o campo MACs
COMMENT ON COLUMN public.defeitos.macs IS 'Array de MACs dos equipamentos com defeito';
