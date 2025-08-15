-- Criar tabela de resets
CREATE TABLE public.resets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento TEXT NOT NULL,
  modelo TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  responsavel TEXT NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view resets" ON public.resets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert resets" ON public.resets FOR INSERT WITH CHECK (auth.role() = 'authenticated');