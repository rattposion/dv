import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface GarantiaEquipamento {
  id: string;
  numero_os: string;
  equipamento_id?: string;
  equipamento_nome: string;
  servico_realizado: string;
  data_servico: string;
  garantia_expira: string;
  status: 'Ativa' | 'Próximo ao Vencimento' | 'Expirada';
  created_at: string;
  updated_at: string;
}

export const useSupabaseGarantias = () => {
  const [garantias, setGarantias] = useState<GarantiaEquipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGarantias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('garantias_equipamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Atualizar status baseado na data de expiração
      const garantiasComStatus = (data || []).map(garantia => {
        const hoje = new Date();
        const dataExpiracao = new Date(garantia.garantia_expira);
        const diasRestantes = Math.ceil((dataExpiracao.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
        
        let status: 'Ativa' | 'Próximo ao Vencimento' | 'Expirada';
        if (diasRestantes > 30) {
          status = 'Ativa';
        } else if (diasRestantes > 0) {
          status = 'Próximo ao Vencimento';
        } else {
          status = 'Expirada';
        }

        return { ...garantia, status };
      });

      setGarantias(garantiasComStatus);
    } catch (error: any) {
      console.error('Erro ao carregar garantias:', error);
      toast({
        title: "Erro ao carregar garantias",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addGarantia = async (garantia: Omit<GarantiaEquipamento, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('garantias_equipamentos')
        .insert([garantia])
        .select()
        .single();

      if (error) throw error;

      // Calcular status antes de adicionar à lista
      const hoje = new Date();
      const dataExpiracao = new Date(data.garantia_expira);
      const diasRestantes = Math.ceil((dataExpiracao.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
      
      let status: 'Ativa' | 'Próximo ao Vencimento' | 'Expirada';
      if (diasRestantes > 30) {
        status = 'Ativa';
      } else if (diasRestantes > 0) {
        status = 'Próximo ao Vencimento';
      } else {
        status = 'Expirada';
      }

      const garantiaComStatus = { ...data, status };
      setGarantias(prev => [garantiaComStatus, ...prev]);
      
      toast({
        title: "Garantia cadastrada",
        description: `Registro de garantia ${garantia.numero_os} cadastrado com sucesso`,
      });

      return garantiaComStatus;
    } catch (error: any) {
      console.error('Erro ao adicionar garantia:', error);
      toast({
        title: "Erro ao cadastrar garantia",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateGarantia = async (id: string, updates: Partial<GarantiaEquipamento>) => {
    try {
      const { data, error } = await supabase
        .from('garantias_equipamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Recalcular status após atualização
      const hoje = new Date();
      const dataExpiracao = new Date(data.garantia_expira);
      const diasRestantes = Math.ceil((dataExpiracao.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
      
      let status: 'Ativa' | 'Próximo ao Vencimento' | 'Expirada';
      if (diasRestantes > 30) {
        status = 'Ativa';
      } else if (diasRestantes > 0) {
        status = 'Próximo ao Vencimento';
      } else {
        status = 'Expirada';
      }

      const garantiaAtualizada = { ...data, status };
      setGarantias(prev => prev.map(g => g.id === id ? garantiaAtualizada : g));
      
      toast({
        title: "Garantia atualizada",
        description: "Informações da garantia atualizadas com sucesso",
      });

      return garantiaAtualizada;
    } catch (error: any) {
      console.error('Erro ao atualizar garantia:', error);
      toast({
        title: "Erro ao atualizar garantia",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchGarantias();
  }, []);

  return {
    garantias,
    loading,
    addGarantia,
    updateGarantia,
    refetch: fetchGarantias
  };
};