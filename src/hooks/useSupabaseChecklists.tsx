import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChecklistData {
  id?: string;
  created_at?: string;
  updated_at?: string;
  
  // Dados do Técnico
  nome_tecnico: string;
  data_atendimento: string;
  data_hora: string;
  
  // Dados do Equipamento
  tipo_equipamento: string;
  marca: string;
  modelo: string;
  endereco_ip?: string;
  mac_address?: string;
  sn_gpon?: string;
  
  // Testes Wi-Fi
  wifi_teste_realizado: boolean;
  wifi_resultado?: 'aprovado' | 'reprovado' | 'nao_aplicavel';
  wifi_observacoes?: string;
  
  // Teste de Portas LAN
  lan_teste_realizado: boolean;
  lan_resultado?: 'aprovado' | 'reprovado' | 'nao_aplicavel';
  lan_observacoes?: string;
  
  // Teste de Login
  login_teste_realizado: boolean;
  login_resultado?: 'aprovado' | 'reprovado' | 'nao_aplicavel';
  login_observacoes?: string;
  
  // Medição de Sinal
  medicao_teste_realizado: boolean;
  medicao_resultado?: 'aprovado' | 'reprovado' | 'nao_aplicavel';
  medicao_frequencia_testada?: string;
  medicao_potencia_recebida?: number;
  medicao_observacoes?: string;
  
  // Teste de Velocidade
  velocidade_teste_realizado: boolean;
  velocidade_resultado?: 'aprovado' | 'reprovado' | 'nao_aplicavel';
  velocidade_download?: number;
  velocidade_upload?: number;
  velocidade_observacoes?: string;
  
  // Dados Técnicos
  dados_teste_realizado: boolean;
  dados_resultado?: 'aprovado' | 'reprovado' | 'nao_aplicavel';
  dados_observacoes?: string;
  
  // Observações Finais
  observacoes_finais?: string;
  
  // Status e Progresso
  status_geral: 'em_andamento' | 'concluido' | 'pendente';
  progresso_percentual: number;
  
  // Metadados
  usuario_criacao?: string;
  usuario_ultima_alteracao?: string;
}

export interface ChecklistFilters {
  nome_tecnico?: string;
  data_inicio?: string;
  data_fim?: string;
  status_geral?: string;
  mac_address?: string;
  endereco_ip?: string;
}

export const useSupabaseChecklists = () => {
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar todos os checklists
  const fetchChecklists = async (filters?: ChecklistFilters) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters) {
        if (filters.nome_tecnico) {
          query = query.ilike('nome_tecnico', `%${filters.nome_tecnico}%`);
        }
        if (filters.data_inicio) {
          query = query.gte('data_atendimento', filters.data_inicio);
        }
        if (filters.data_fim) {
          query = query.lte('data_atendimento', filters.data_fim);
        }
        if (filters.status_geral) {
          query = query.eq('status_geral', filters.status_geral);
        }
        if (filters.mac_address) {
          query = query.ilike('mac_address', `%${filters.mac_address}%`);
        }
        if (filters.endereco_ip) {
          query = query.ilike('endereco_ip', `%${filters.endereco_ip}%`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setChecklists(data || []);
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar checklists';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar checklist por ID
  const fetchChecklistById = async (id: string): Promise<ChecklistData | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar checklist';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Criar novo checklist
  const createChecklist = async (checklistData: Omit<ChecklistData, 'id' | 'created_at' | 'updated_at'>): Promise<ChecklistData | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('checklists')
        .insert([checklistData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Checklist criado com sucesso!",
      });

      // Atualizar lista local
      setChecklists(prev => [data, ...prev]);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar checklist';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar checklist existente
  const updateChecklist = async (id: string, updates: Partial<ChecklistData>): Promise<ChecklistData | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Checklist atualizado com sucesso!",
      });

      // Atualizar lista local
      setChecklists(prev => 
        prev.map(checklist => 
          checklist.id === id ? { ...checklist, ...data } : checklist
        )
      );

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar checklist';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Excluir checklist
  const deleteChecklist = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Checklist excluído com sucesso!",
      });

      // Remover da lista local
      setChecklists(prev => prev.filter(checklist => checklist.id !== id));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir checklist';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar checklists por MAC address
  const findChecklistsByMac = async (macAddress: string): Promise<ChecklistData[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .ilike('mac_address', `%${macAddress}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar checklists por MAC';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar checklists por IP
  const findChecklistsByIP = async (ipAddress: string): Promise<ChecklistData[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .ilike('endereco_ip', `%${ipAddress}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar checklists por IP';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const getStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('status_geral, progresso_percentual');

      if (error) throw error;

      const total = data?.length || 0;
      const concluidos = data?.filter(item => item.status_geral === 'concluido').length || 0;
      const emAndamento = data?.filter(item => item.status_geral === 'em_andamento').length || 0;
      const pendentes = data?.filter(item => item.status_geral === 'pendente').length || 0;
      const progressoMedio = total > 0 
        ? Math.round((data?.reduce((acc, item) => acc + (item.progresso_percentual || 0), 0) || 0) / total)
        : 0;

      return {
        total,
        concluidos,
        emAndamento,
        pendentes,
        progressoMedio,
        taxaConclusao: total > 0 ? Math.round((concluidos / total) * 100) : 0
      };
    } catch (err) {
      console.error('Erro ao calcular estatísticas:', err);
      return {
        total: 0,
        concluidos: 0,
        emAndamento: 0,
        pendentes: 0,
        progressoMedio: 0,
        taxaConclusao: 0
      };
    }
  };

  return {
    checklists,
    loading,
    error,
    fetchChecklists,
    fetchChecklistById,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    findChecklistsByMac,
    findChecklistsByIP,
    getStatistics,
  };
};