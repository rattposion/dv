-- Criar tabela para controlar consumo de materiais na produção
CREATE TABLE IF NOT EXISTS public.consumo_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_producao_id UUID REFERENCES public.ordens_producao(id),
  modelo_consumido TEXT NOT NULL,
  quantidade_consumida INTEGER NOT NULL DEFAULT 0,
  produto_final_id UUID REFERENCES public.produtos(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consumo_producao ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view consumo_producao" 
ON public.consumo_producao 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert consumo_producao" 
ON public.consumo_producao 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update consumo_producao" 
ON public.consumo_producao 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_consumo_producao_updated_at
BEFORE UPDATE ON public.consumo_producao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();