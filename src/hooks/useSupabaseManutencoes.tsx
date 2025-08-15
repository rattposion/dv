import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ManutencaoSupabase {
  id: string;
  numero_tarefa: string;
  equipamento_id?: string;
  origem_equipamento: string;
  defeito_equipamento: string;
  status: string;
  destino_envio?: string;
  laudo_tecnico?: string;
  vezes_faturado: number;
  houve_reparo: boolean;
  data_abertura: string;
  data_fechamento?: string;
  tecnico_responsavel?: string;
  valor_servico?: number;
  observacoes?: string;
  anexos_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface ManutencaoLocal {
  id: string;
  numeroTarefa: string;
  equipamentoId?: string;
  origemEquipamento: string;
  defeitoEquipamento: string;
  status: string;
  destinoEnvio?: string;
  laudoTecnico?: string;
  vezesFaturado: number;
  houveReparo: boolean;
  dataAbertura: string;
  dataFechamento?: string;
  tecnicoResponsavel?: string;
  valorServico?: number;
  observacoes?: string;
  anexosIds?: string[];
  dataCadastro: string;
}

export function useSupabaseManutencoes() {
  const [manutencoes, setManutencoes] = useState<ManutencaoLocal[]>([]);
  const [loading, setLoading] = useState(true);

  const convertFromSupabase = (manutencao: ManutencaoSupabase): ManutencaoLocal => ({
    id: manutencao.id,
    numeroTarefa: manutencao.numero_tarefa,
    equipamentoId: manutencao.equipamento_id,
    origemEquipamento: manutencao.origem_equipamento,
    defeitoEquipamento: manutencao.defeito_equipamento,
    status: manutencao.status,
    destinoEnvio: manutencao.destino_envio,
    laudoTecnico: manutencao.laudo_tecnico,
    vezesFaturado: manutencao.vezes_faturado,
    houveReparo: manutencao.houve_reparo,
    dataAbertura: manutencao.data_abertura,
    dataFechamento: manutencao.data_fechamento,
    tecnicoResponsavel: manutencao.tecnico_responsavel,
    valorServico: manutencao.valor_servico,
    observacoes: manutencao.observacoes,
    anexosIds: manutencao.anexos_ids,
    dataCadastro: manutencao.created_at
  });

  const convertToSupabase = (manutencao: Omit<ManutencaoLocal, 'id' | 'dataCadastro'>): Omit<ManutencaoSupabase, 'id' | 'created_at' | 'updated_at'> => ({
    numero_tarefa: manutencao.numeroTarefa,
    equipamento_id: manutencao.equipamentoId,
    origem_equipamento: manutencao.origemEquipamento,
    defeito_equipamento: manutencao.defeitoEquipamento,
    status: manutencao.status,
    destino_envio: manutencao.destinoEnvio,
    laudo_tecnico: manutencao.laudoTecnico,
    vezes_faturado: manutencao.vezesFaturado,
    houve_reparo: manutencao.houveReparo,
    data_abertura: manutencao.dataAbertura,
    data_fechamento: manutencao.dataFechamento,
    tecnico_responsavel: manutencao.tecnicoResponsavel,
    valor_servico: manutencao.valorServico,
    observacoes: manutencao.observacoes,
    anexos_ids: manutencao.anexosIds
  });

  const fetchManutencoes = async () => {
    try {
      const { data, error } = await supabase
        .from('manutencoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const manutencoesMapped = data?.map(convertFromSupabase) || [];
      setManutencoes(manutencoesMapped);
    } catch (error) {
      console.error('Erro ao buscar manutenções:', error);
    } finally {
      setLoading(false);
    }
  };

  const addManutencao = async (manutencao: Omit<ManutencaoLocal, 'id' | 'dataCadastro'>): Promise<ManutencaoLocal> => {
    try {
      const supabaseManutencao = convertToSupabase(manutencao);
      
      const { data, error } = await supabase
        .from('manutencoes')
        .insert([supabaseManutencao])
        .select()
        .single();

      if (error) throw error;

      const newManutencao = convertFromSupabase(data);
      setManutencoes(prev => [newManutencao, ...prev]);
      
      return newManutencao;
    } catch (error) {
      console.error('Erro ao adicionar manutenção:', error);
      throw error;
    }
  };

  const updateManutencao = async (id: string, updates: Partial<ManutencaoLocal>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('manutencoes')
        .update({
          destino_envio: updates.destinoEnvio,
          laudo_tecnico: updates.laudoTecnico,
          vezes_faturado: updates.vezesFaturado,
          houve_reparo: updates.houveReparo,
          status: updates.status,
          data_fechamento: updates.dataFechamento,
          tecnico_responsavel: updates.tecnicoResponsavel,
          valor_servico: updates.valorServico,
          observacoes: updates.observacoes,
          anexos_ids: updates.anexosIds
        })
        .eq('id', id);

      if (error) throw error;

      setManutencoes(prev => 
        prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar manutenção:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchManutencoes();
  }, []);

  return {
    manutencoes,
    loading,
    addManutencao,
    updateManutencao,
    refetch: fetchManutencoes
  };
}