-- Criar tabela RMA com todos os campos obrigatórios
CREATE TABLE public.rmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_rma TEXT NOT NULL UNIQUE,
  equipamento TEXT NOT NULL,
  modelo TEXT,
  numero_serie TEXT,
  mac_address TEXT,
  origem_equipamento TEXT NOT NULL,
  origem_original TEXT,
  destino_envio TEXT NOT NULL,
  defeito_relatado TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto',
  cliente TEXT NOT NULL,
  contato_cliente TEXT,
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  data_conclusao DATE,
  tecnico_responsavel TEXT,
  diagnostico TEXT,
  solucao TEXT,
  observacoes TEXT,
  nota_fiscal TEXT,
  anexos_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.rmas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Authenticated users can view RMAs" 
ON public.rmas 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert RMAs" 
ON public.rmas 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update RMAs" 
ON public.rmas 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Criar trigger para atualizar timestamp
CREATE TRIGGER update_rmas_updated_at
BEFORE UPDATE ON public.rmas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_rmas_numero_rma ON public.rmas(numero_rma);
CREATE INDEX idx_rmas_status ON public.rmas(status);
CREATE INDEX idx_rmas_data_abertura ON public.rmas(data_abertura);

-- Criar bucket para anexos RMA
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rma-anexos', 'rma-anexos', false);

-- Criar políticas para anexos RMA
CREATE POLICY "Users can view RMA attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'rma-anexos' AND auth.role() = 'authenticated'::text);

CREATE POLICY "Users can upload RMA attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'rma-anexos' AND auth.role() = 'authenticated'::text);

CREATE POLICY "Users can update RMA attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'rma-anexos' AND auth.role() = 'authenticated'::text);

CREATE POLICY "Users can delete RMA attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'rma-anexos' AND auth.role() = 'authenticated'::text);