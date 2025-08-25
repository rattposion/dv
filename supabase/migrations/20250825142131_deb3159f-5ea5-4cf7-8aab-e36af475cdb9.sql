-- Atualizar a constraint da tabela relatorios para incluir todos os tipos de relatório
ALTER TABLE public.relatorios 
DROP CONSTRAINT IF EXISTS relatorios_tipo_check;

-- Criar nova constraint com todos os tipos de relatório suportados
ALTER TABLE public.relatorios 
ADD CONSTRAINT relatorios_tipo_check 
CHECK (tipo = ANY (ARRAY[
    'completo'::text, 
    'defeitos'::text, 
    'producao'::text, 
    'recebimentos'::text, 
    'movimentacoes'::text, 
    'garantias'::text, 
    'itens_faltantes'::text,
    'estoque'::text,
    'funcionarios'::text,
    'equipamentos'::text,
    'financeiro'::text
]));