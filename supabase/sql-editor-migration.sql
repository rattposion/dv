-- =====================================================
-- MIGRAÇÃO PARA SQL EDITOR - SISTEMA DE CHECKLIST
-- Copie e cole este conteúdo no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/zteglnzyhthfhsqpmaey/sql/new
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Remover tabela existente se houver (descomente se necessário)
-- DROP TABLE IF EXISTS public.checklists CASCADE;

-- =====================================================
-- TABELA PRINCIPAL: CHECKLISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.checklists (
    -- Identificação e timestamps
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
    usuario_ultima_alteracao TEXT,
    
    -- Campos adicionais para auditoria
    ip_criacao INET,
    user_agent TEXT,
    versao_app TEXT DEFAULT '1.0.0'
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_checklists_created_at ON public.checklists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_updated_at ON public.checklists(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_nome_tecnico ON public.checklists(nome_tecnico);
CREATE INDEX IF NOT EXISTS idx_checklists_data_atendimento ON public.checklists(data_atendimento DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_status_geral ON public.checklists(status_geral);
CREATE INDEX IF NOT EXISTS idx_checklists_mac_address ON public.checklists(mac_address) WHERE mac_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checklists_endereco_ip ON public.checklists(endereco_ip) WHERE endereco_ip IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checklists_sn_gpon ON public.checklists(sn_gpon) WHERE sn_gpon IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checklists_tecnico_data ON public.checklists(nome_tecnico, data_atendimento DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_status_data ON public.checklists(status_geral, created_at DESC);

-- Índice para busca de texto
CREATE INDEX IF NOT EXISTS idx_checklists_search ON public.checklists USING gin(
    to_tsvector('portuguese', 
        coalesce(nome_tecnico, '') || ' ' ||
        coalesce(tipo_equipamento, '') || ' ' ||
        coalesce(marca, '') || ' ' ||
        coalesce(modelo, '') || ' ' ||
        coalesce(mac_address, '') || ' ' ||
        coalesce(observacoes_finais, '')
    )
);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_checklists_updated_at ON public.checklists;
CREATE TRIGGER update_checklists_updated_at 
    BEFORE UPDATE ON public.checklists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular progresso automaticamente
CREATE OR REPLACE FUNCTION calculate_checklist_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_tests INTEGER := 6;
    completed_tests INTEGER := 0;
    progress_percent INTEGER;
BEGIN
    -- Contar testes realizados
    IF NEW.wifi_teste_realizado THEN completed_tests := completed_tests + 1; END IF;
    IF NEW.lan_teste_realizado THEN completed_tests := completed_tests + 1; END IF;
    IF NEW.login_teste_realizado THEN completed_tests := completed_tests + 1; END IF;
    IF NEW.medicao_teste_realizado THEN completed_tests := completed_tests + 1; END IF;
    IF NEW.velocidade_teste_realizado THEN completed_tests := completed_tests + 1; END IF;
    IF NEW.dados_teste_realizado THEN completed_tests := completed_tests + 1; END IF;
    
    -- Calcular percentual
    progress_percent := ROUND((completed_tests::DECIMAL / total_tests) * 100);
    
    -- Atualizar progresso
    NEW.progresso_percentual := progress_percent;
    
    -- Atualizar status baseado no progresso
    IF progress_percent = 100 THEN
        NEW.status_geral := 'concluido';
    ELSIF progress_percent > 0 THEN
        NEW.status_geral := 'em_andamento';
    ELSE
        NEW.status_geral := 'pendente';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular progresso automaticamente
DROP TRIGGER IF EXISTS calculate_progress_trigger ON public.checklists;
CREATE TRIGGER calculate_progress_trigger
    BEFORE INSERT OR UPDATE ON public.checklists
    FOR EACH ROW
    EXECUTE FUNCTION calculate_checklist_progress();

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar checklists" ON public.checklists;
DROP POLICY IF EXISTS "Usuários autenticados podem criar checklists" ON public.checklists;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar checklists" ON public.checklists;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir checklists" ON public.checklists;

-- Políticas para operações CRUD
CREATE POLICY "checklist_select_policy" ON public.checklists
    FOR SELECT USING (
        auth.role() = 'authenticated' OR
        auth.role() = 'anon'
    );

CREATE POLICY "checklist_insert_policy" ON public.checklists
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR
        auth.role() = 'anon'
    );

CREATE POLICY "checklist_update_policy" ON public.checklists
    FOR UPDATE USING (
        auth.role() = 'authenticated' OR
        auth.role() = 'anon'
    );

CREATE POLICY "checklist_delete_policy" ON public.checklists
    FOR DELETE USING (
        auth.role() = 'authenticated' OR
        auth.role() = 'anon'
    );

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para estatísticas de checklists
CREATE OR REPLACE VIEW checklist_stats AS
SELECT 
    COUNT(*) as total_checklists,
    COUNT(*) FILTER (WHERE status_geral = 'concluido') as concluidos,
    COUNT(*) FILTER (WHERE status_geral = 'em_andamento') as em_andamento,
    COUNT(*) FILTER (WHERE status_geral = 'pendente') as pendentes,
    AVG(progresso_percentual) as progresso_medio,
    COUNT(DISTINCT nome_tecnico) as total_tecnicos,
    DATE_TRUNC('month', created_at) as mes
FROM public.checklists
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- View para relatório por técnico
CREATE OR REPLACE VIEW checklist_por_tecnico AS
SELECT 
    nome_tecnico,
    COUNT(*) as total_checklists,
    COUNT(*) FILTER (WHERE status_geral = 'concluido') as concluidos,
    AVG(progresso_percentual) as progresso_medio,
    MAX(created_at) as ultimo_checklist
FROM public.checklists
GROUP BY nome_tecnico
ORDER BY total_checklists DESC;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.checklists IS 'Tabela principal para armazenar checklists técnicos de rede e equipamentos';
COMMENT ON COLUMN public.checklists.id IS 'Identificador único do checklist';
COMMENT ON COLUMN public.checklists.nome_tecnico IS 'Nome do técnico responsável pelo atendimento';
COMMENT ON COLUMN public.checklists.data_atendimento IS 'Data do atendimento técnico';
COMMENT ON COLUMN public.checklists.endereco_ip IS 'Endereço IP do equipamento testado';
COMMENT ON COLUMN public.checklists.mac_address IS 'Endereço MAC do equipamento';
COMMENT ON COLUMN public.checklists.sn_gpon IS 'Serial Number GPON do equipamento';
COMMENT ON COLUMN public.checklists.progresso_percentual IS 'Percentual de conclusão do checklist (0-100)';
COMMENT ON COLUMN public.checklists.status_geral IS 'Status geral do checklist (pendente, em_andamento, concluido)';

-- =====================================================
-- INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

INSERT INTO public.checklists (
    nome_tecnico, data_atendimento, data_hora,
    tipo_equipamento, marca, modelo,
    endereco_ip, mac_address,
    wifi_teste_realizado, wifi_resultado,
    usuario_criacao
) VALUES (
    'João Silva', CURRENT_DATE, NOW(),
    'Router', 'TP-Link', 'Archer C6',
    '192.168.1.1'::inet, '00:11:22:33:44:55',
    true, 'aprovado',
    'sistema'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'checklists' 
    AND table_schema = 'public'
ORDER BY ordinal_position;