-- Criar tabela para armazenar caixas de inventário com MACs
CREATE TABLE public.caixas_inventario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_caixa TEXT NOT NULL UNIQUE,
  equipamento TEXT NOT NULL,
  modelo TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  responsavel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Disponível',
  macs TEXT[] NOT NULL DEFAULT '{}',
  ordem_producao_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para controle de garantia de equipamentos
CREATE TABLE public.garantias_equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os TEXT NOT NULL,
  equipamento_id UUID,
  equipamento_nome TEXT NOT NULL,
  servico_realizado TEXT NOT NULL,
  data_servico DATE NOT NULL,
  garantia_expira DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.caixas_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garantias_equipamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para caixas_inventario
CREATE POLICY "Authenticated users can view caixas_inventario"
ON public.caixas_inventario
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert caixas_inventario"
ON public.caixas_inventario
FOR INSERT
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update caixas_inventario"
ON public.caixas_inventario
FOR UPDATE
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete caixas_inventario"
ON public.caixas_inventario
FOR DELETE
USING (auth.role() = 'authenticated'::text);

-- Políticas para garantias_equipamentos
CREATE POLICY "Authenticated users can view garantias_equipamentos"
ON public.garantias_equipamentos
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert garantias_equipamentos"
ON public.garantias_equipamentos
FOR INSERT
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update garantias_equipamentos"
ON public.garantias_equipamentos
FOR UPDATE
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Only admins can delete garantias_equipamentos"
ON public.garantias_equipamentos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_caixas_inventario_updated_at
BEFORE UPDATE ON public.caixas_inventario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garantias_equipamentos_updated_at
BEFORE UPDATE ON public.garantias_equipamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();