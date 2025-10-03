-- Criação da tabela de checklists técnicos
CREATE TABLE IF NOT EXISTS public.checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Dados do Técnico
    nome_tecnico TEXT NOT NULL,
    data_atendimento DATE NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Dados do Equipamento
    tipo_equipamento TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    endereco_ip INET,
    mac_address TEXT,
    sn_gpon TEXT,
    
    -- Testes Wi-Fi
    wifi_teste_realizado BOOLEAN DEFAULT false,
    wifi_resultado TEXT CHECK (wifi_resultado IN ('aprovado', 'reprovado', 'nao_aplicavel')),
    wifi_observacoes TEXT,
    
    -- Teste de Portas LAN
    lan_teste_realizado BOOLEAN DEFAULT false,
    lan_resultado TEXT CHECK (lan_resultado IN ('aprovado', 'reprovado', 'nao_aplicavel')),
    lan_observacoes TEXT,
    
    -- Teste de Login
    login_teste_realizado BOOLEAN DEFAULT false,
    login_resultado TEXT CHECK (login_resultado IN ('aprovado', 'reprovado', 'nao_aplicavel')),
    login_observacoes TEXT,
    
    -- Medição de Sinal
    medicao_teste_realizado BOOLEAN DEFAULT false,
    medicao_resultado TEXT CHECK (medicao_resultado IN ('aprovado', 'reprovado', 'nao_aplicavel')),
    medicao_frequencia_testada TEXT,
    medicao_potencia_recebida DECIMAL(5,2),
    medicao_observacoes TEXT,
    
    -- Teste de Velocidade
    velocidade_teste_realizado BOOLEAN DEFAULT false,
    velocidade_resultado TEXT CHECK (velocidade_resultado IN ('aprovado', 'reprovado', 'nao_aplicavel')),
    velocidade_download DECIMAL(8,2),
    velocidade_upload DECIMAL(8,2),
    velocidade_observacoes TEXT,
    
    -- Dados Técnicos
    dados_teste_realizado BOOLEAN DEFAULT false,
    dados_resultado TEXT CHECK (dados_resultado IN ('aprovado', 'reprovado', 'nao_aplicavel')),
    dados_observacoes TEXT,
    
    -- Observações Finais
    observacoes_finais TEXT,
    
    -- Status e Progresso
    status_geral TEXT DEFAULT 'em_andamento' CHECK (status_geral IN ('em_andamento', 'concluido', 'pendente')),
    progresso_percentual INTEGER DEFAULT 0 CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100),
    
    -- Metadados
    usuario_criacao TEXT,
    usuario_ultima_alteracao TEXT
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checklists_created_at ON public.checklists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_nome_tecnico ON public.checklists(nome_tecnico);
CREATE INDEX IF NOT EXISTS idx_checklists_data_atendimento ON public.checklists(data_atendimento DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_status_geral ON public.checklists(status_geral);
CREATE INDEX IF NOT EXISTS idx_checklists_mac_address ON public.checklists(mac_address);
CREATE INDEX IF NOT EXISTS idx_checklists_endereco_ip ON public.checklists(endereco_ip);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_checklists_updated_at 
    BEFORE UPDATE ON public.checklists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar checklists" ON public.checklists
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Usuários autenticados podem criar checklists" ON public.checklists
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar checklists" ON public.checklists
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir exclusão para usuários autenticados
CREATE POLICY "Usuários autenticados podem excluir checklists" ON public.checklists
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE public.checklists IS 'Tabela para armazenar checklists técnicos de rede';
COMMENT ON COLUMN public.checklists.nome_tecnico IS 'Nome do técnico responsável pelo atendimento';
COMMENT ON COLUMN public.checklists.data_atendimento IS 'Data do atendimento técnico';
COMMENT ON COLUMN public.checklists.endereco_ip IS 'Endereço IP do equipamento';
COMMENT ON COLUMN public.checklists.mac_address IS 'Endereço MAC do equipamento';
COMMENT ON COLUMN public.checklists.sn_gpon IS 'Serial Number GPON do equipamento';
COMMENT ON COLUMN public.checklists.progresso_percentual IS 'Percentual de conclusão do checklist (0-100)';