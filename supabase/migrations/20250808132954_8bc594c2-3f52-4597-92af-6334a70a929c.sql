-- Criar tabelas para sistema de gestão industrial

-- Tabela de Equipamentos
CREATE TABLE public.equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'pc', 'impressora', 'servidor', etc
  marca TEXT,
  modelo TEXT,
  mac_address TEXT UNIQUE,
  ip_address INET,
  localizacao TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao', 'descartado')),
  data_aquisicao DATE,
  valor_aquisicao DECIMAL(10,2),
  garantia_ate DATE,
  observacoes TEXT,
  responsavel_id UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Funcionários
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  cargo TEXT,
  departamento TEXT,
  data_admissao DATE,
  salario DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias', 'licenca')),
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Produtos/Estoque
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  descricao TEXT,
  categoria TEXT,
  unidade_medida TEXT NOT NULL DEFAULT 'UN', -- UN, KG, L, M, etc
  preco_unitario DECIMAL(10,2),
  estoque_atual INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 0,
  estoque_maximo INTEGER,
  localizacao_estoque TEXT,
  fornecedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Movimentações de Estoque
CREATE TABLE public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo_movimento TEXT NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida', 'ajuste')),
  quantidade INTEGER NOT NULL,
  valor_unitario DECIMAL(10,2),
  motivo TEXT,
  documento TEXT, -- NF, requisição, etc
  funcionario_id UUID REFERENCES public.funcionarios(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Ordens de Produção
CREATE TABLE public.ordens_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ordem TEXT UNIQUE NOT NULL,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade_planejada INTEGER NOT NULL,
  quantidade_produzida INTEGER NOT NULL DEFAULT 0,
  data_inicio DATE,
  data_fim_prevista DATE,
  data_fim_real DATE,
  status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada', 'em_andamento', 'concluida', 'cancelada')),
  responsavel_id UUID REFERENCES public.funcionarios(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Relatórios
CREATE TABLE public.relatorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('estoque', 'producao', 'funcionarios', 'equipamentos', 'financeiro')),
  periodo_inicio DATE,
  periodo_fim DATE,
  dados JSONB, -- Dados do relatório em formato JSON
  gerado_por UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS em todas as tabelas
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY "Authenticated users can view equipamentos" ON public.equipamentos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert equipamentos" ON public.equipamentos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update equipamentos" ON public.equipamentos FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view funcionarios" ON public.funcionarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert funcionarios" ON public.funcionarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update funcionarios" ON public.funcionarios FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view produtos" ON public.produtos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert produtos" ON public.produtos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update produtos" ON public.produtos FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view movimentacoes" ON public.movimentacoes_estoque FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert movimentacoes" ON public.movimentacoes_estoque FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view ordens" ON public.ordens_producao FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert ordens" ON public.ordens_producao FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update ordens" ON public.ordens_producao FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view relatorios" ON public.relatorios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert relatorios" ON public.relatorios FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Triggers para updated_at
CREATE TRIGGER update_equipamentos_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ordens_producao_updated_at BEFORE UPDATE ON public.ordens_producao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_equipamentos_mac ON public.equipamentos(mac_address);
CREATE INDEX idx_equipamentos_status ON public.equipamentos(status);
CREATE INDEX idx_funcionarios_cpf ON public.funcionarios(cpf);
CREATE INDEX idx_produtos_codigo ON public.produtos(codigo);
CREATE INDEX idx_movimentacoes_produto ON public.movimentacoes_estoque(produto_id);
CREATE INDEX idx_ordens_status ON public.ordens_producao(status);