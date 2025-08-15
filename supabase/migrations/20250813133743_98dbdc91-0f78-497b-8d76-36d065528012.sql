-- Criar tabela de manutenções
CREATE TABLE public.manutencoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_tarefa TEXT NOT NULL UNIQUE,
  equipamento_id UUID REFERENCES public.equipamentos(id),
  origem_equipamento TEXT NOT NULL,
  defeito_equipamento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta',
  destino_envio TEXT,
  laudo_tecnico TEXT,
  vezes_faturado INTEGER NOT NULL DEFAULT 0,
  houve_reparo BOOLEAN NOT NULL DEFAULT false,
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fechamento DATE,
  tecnico_responsavel TEXT,
  valor_servico NUMERIC,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Authenticated users can view manutencoes" 
ON public.manutencoes 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert manutencoes" 
ON public.manutencoes 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update manutencoes" 
ON public.manutencoes 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_manutencoes_updated_at
BEFORE UPDATE ON public.manutencoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_manutencoes_numero_tarefa ON public.manutencoes(numero_tarefa);
CREATE INDEX idx_manutencoes_equipamento_id ON public.manutencoes(equipamento_id);
CREATE INDEX idx_manutencoes_status ON public.manutencoes(status);