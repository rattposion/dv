-- Create table for recuperacao (equipment recovery)
CREATE TABLE public.recuperacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento TEXT NOT NULL,
  problema TEXT NOT NULL,
  solucao TEXT NOT NULL,
  macs TEXT[] NOT NULL DEFAULT '{}',
  data_recuperacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responsavel TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.recuperacoes ENABLE ROW LEVEL SECURITY;

-- Create policies for recuperacoes
CREATE POLICY "Authenticated users can view recuperacoes" 
ON public.recuperacoes 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert recuperacoes" 
ON public.recuperacoes 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update recuperacoes" 
ON public.recuperacoes 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Only admins can delete recuperacoes" 
ON public.recuperacoes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recuperacoes_updated_at
BEFORE UPDATE ON public.recuperacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();