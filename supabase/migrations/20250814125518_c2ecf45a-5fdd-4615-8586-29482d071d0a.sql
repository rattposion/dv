-- Criar tabela para produção diária por colaborador
CREATE TABLE IF NOT EXISTS public.producao_diaria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_producao DATE NOT NULL DEFAULT CURRENT_DATE,
  colaborador TEXT NOT NULL,
  modelo TEXT NOT NULL,
  quantidade_caixas INTEGER NOT NULL DEFAULT 0,
  quantidade_equipamentos INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(data_producao, colaborador, modelo)
);

-- Enable RLS
ALTER TABLE public.producao_diaria ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view producao_diaria" 
ON public.producao_diaria 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert producao_diaria" 
ON public.producao_diaria 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update producao_diaria" 
ON public.producao_diaria 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_producao_diaria_updated_at
BEFORE UPDATE ON public.producao_diaria
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_producao_diaria_data_colaborador ON public.producao_diaria(data_producao, colaborador);