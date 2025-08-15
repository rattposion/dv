import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface EquipamentoSupabase {
  id: string;
  nome: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  mac_address?: string;
  ip_address?: any; // Supabase retorna INET como unknown
  localizacao?: string;
  status: string;
  data_aquisicao?: string;
  valor_aquisicao?: number;
  garantia_ate?: string;
  observacoes?: string;
  responsavel_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipamentoLocal {
  id: string;
  nome: string;
  modelo: string;
  numeroSerie: string;
  mac: string;
  responsavel: string;
  status: "Ativo" | "Em Operação" | "Manutenção" | "Inativo";
  dataCadastro: Date;
  localizacao?: string;
  observacoes?: string;
}

export const useSupabaseEquipamentos = () => {
  const [equipamentos, setEquipamentos] = useState<EquipamentoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Converter de Supabase para formato local
  const convertFromSupabase = (equipamento: EquipamentoSupabase): EquipamentoLocal => ({
    id: equipamento.id,
    nome: equipamento.nome,
    modelo: equipamento.modelo || '',
    numeroSerie: equipamento.id, // Usar ID como número de série
    mac: equipamento.mac_address || '',
    responsavel: 'Sistema', // Padrão
    status: equipamento.status === 'ativo' ? 'Ativo' : 
           equipamento.status === 'manutencao' ? 'Manutenção' : 'Inativo',
    dataCadastro: new Date(equipamento.created_at),
    localizacao: equipamento.localizacao,
    observacoes: equipamento.observacoes
  });

  // Converter de formato local para Supabase
  const convertToSupabase = (equipamento: Omit<EquipamentoLocal, 'id' | 'dataCadastro'>): Omit<EquipamentoSupabase, 'id' | 'created_at' | 'updated_at'> => ({
    nome: equipamento.nome,
    tipo: 'equipamento', // Padrão
    modelo: equipamento.modelo,
    mac_address: equipamento.mac,
    status: equipamento.status === 'Ativo' ? 'ativo' : 
           equipamento.status === 'Manutenção' ? 'manutencao' : 'inativo',
    localizacao: equipamento.localizacao,
    observacoes: equipamento.observacoes
  });

  const fetchEquipamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const equipamentosLocais = (data || []).map(convertFromSupabase);
      setEquipamentos(equipamentosLocais);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar equipamentos",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const addEquipamento = async (equipamento: Omit<EquipamentoLocal, 'id' | 'dataCadastro'>) => {
    try {
      const equipamentoSupabase = convertToSupabase(equipamento);
      
      const { data, error } = await supabase
        .from('equipamentos')
        .insert([equipamentoSupabase])
        .select()
        .single();

      if (error) throw error;

      const novoEquipamento = convertFromSupabase(data);
      setEquipamentos(prev => [novoEquipamento, ...prev]);
      
      return novoEquipamento;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar equipamento",
        description: error.message
      });
      throw error;
    }
  };

  const updateEquipamento = async (id: string, updates: Partial<EquipamentoLocal>) => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update(convertToSupabase(updates as any))
        .eq('id', id);

      if (error) throw error;

      setEquipamentos(prev => 
        prev.map(eq => eq.id === id ? { ...eq, ...updates } : eq)
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar equipamento",
        description: error.message
      });
      throw error;
    }
  };

  const removeEquipamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEquipamentos(prev => prev.filter(eq => eq.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover equipamento",
        description: error.message
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchEquipamentos();
  }, []);

  return {
    equipamentos,
    loading,
    addEquipamento,
    updateEquipamento,
    removeEquipamento,
    refetch: fetchEquipamentos
  };
};