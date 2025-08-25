import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ResetSupabase {
  id: string;
  equipamento: string;
  modelo: string;
  responsavel: string;
  quantidade: number;
  observacao?: string;
  created_at: string;
}

export const useSupabaseResets = () => {
  const [resets, setResets] = useState<ResetSupabase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchResets = async () => {
    try {
      const { data, error } = await supabase
        .from('resets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setResets(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar resets",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const addReset = async (resetData: {
    equipamento: string;
    modelo: string;
    responsavel: string;
    quantidade: number;
    observacao?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('resets')
        .insert([resetData])
        .select()
        .single();

      if (error) throw error;

      setResets(prev => [data, ...prev]);
      
      toast({
        title: "Reset registrado",
        description: `Reset de ${resetData.quantidade} equipamentos registrado com sucesso`,
      });

      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar reset",
        description: error.message
      });
      throw error;
    }
  };

  const getTotalResets = () => {
    return resets.reduce((total, reset) => total + reset.quantidade, 0);
  };

  const getResetsPorModelo = (modelo: string) => {
    return resets.filter(reset => reset.modelo === modelo);
  };

  useEffect(() => {
    fetchResets();
  }, []);

  return {
    resets,
    loading,
    addReset,
    getTotalResets,
    getResetsPorModelo,
    refetch: fetchResets
  };
};