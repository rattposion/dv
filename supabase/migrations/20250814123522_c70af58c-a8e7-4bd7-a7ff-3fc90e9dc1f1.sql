-- Adicionar campos na tabela defeitos
ALTER TABLE public.defeitos ADD COLUMN foto_url TEXT;
ALTER TABLE public.defeitos ADD COLUMN destino TEXT;
ALTER TABLE public.defeitos ADD COLUMN descricao_defeito TEXT;

-- Atualizar tipos de defeito para ser mais específico
ALTER TABLE public.defeitos ALTER COLUMN tipo_defeito TYPE TEXT;

-- Adicionar comentário para documentar os valores possíveis do tipo_defeito
COMMENT ON COLUMN public.defeitos.tipo_defeito IS 'Valores possíveis: queimado, defeito_fabrica, dano_transporte, defeito_funcionamento, dano_manuseio, obsolescencia, outros';

-- Adicionar comentário para documentar os valores possíveis do destino  
COMMENT ON COLUMN public.defeitos.destino IS 'Valores possíveis: descartado, garantia, reparo, reciclagem, doacao, outros';