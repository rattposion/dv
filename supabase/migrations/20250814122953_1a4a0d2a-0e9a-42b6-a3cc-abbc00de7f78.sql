-- Criar tabela de recebimentos
CREATE TABLE public.recebimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_documento TEXT NOT NULL,
  origem TEXT NOT NULL,
  responsavel_recebimento TEXT NOT NULL,
  data_recebimento DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens do recebimento
CREATE TABLE public.itens_recebimento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recebimento_id UUID NOT NULL REFERENCES public.recebimentos(id) ON DELETE CASCADE,
  produto_nome TEXT NOT NULL,
  modelo TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de estoque de recebimento (separado do principal)
CREATE TABLE public.estoque_recebimento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo TEXT NOT NULL UNIQUE,
  quantidade_disponivel INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de defeitos/queimados
CREATE TABLE public.defeitos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento TEXT NOT NULL,
  modelo TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  tipo_defeito TEXT NOT NULL, -- 'queimado', 'defeito', 'danificado'
  responsavel TEXT NOT NULL,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  origem TEXT, -- de onde veio o equipamento defeituoso
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_recebimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_recebimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defeitos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view recebimentos" 
ON public.recebimentos 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert recebimentos" 
ON public.recebimentos 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update recebimentos" 
ON public.recebimentos 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can view itens_recebimento" 
ON public.itens_recebimento 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert itens_recebimento" 
ON public.itens_recebimento 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can view estoque_recebimento" 
ON public.estoque_recebimento 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert estoque_recebimento" 
ON public.estoque_recebimento 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update estoque_recebimento" 
ON public.estoque_recebimento 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can view defeitos" 
ON public.defeitos 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert defeitos" 
ON public.defeitos 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update defeitos" 
ON public.defeitos 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Create triggers for updated_at
CREATE TRIGGER update_recebimentos_updated_at
BEFORE UPDATE ON public.recebimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estoque_recebimento_updated_at
BEFORE UPDATE ON public.estoque_recebimento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_defeitos_updated_at
BEFORE UPDATE ON public.defeitos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();