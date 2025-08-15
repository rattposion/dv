import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ResetSupabase {
  id: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  responsavel: string;
  observacao?: string;
  created_at: string;
}

export interface ResetLocal {
  id: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  responsavel: string;
  observacao?: string;
  data: Date;
}

export const useSupabaseResets = () => {
  const [resets, setResets] = useState<ResetLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Converter de Supabase para formato local
  const convertFromSupabase = (reset: ResetSupabase): ResetLocal => ({
    id: reset.id,
    equipamento: reset.equipamento,
    modelo: reset.modelo,
    quantidade: reset.quantidade,
    responsavel: reset.responsavel,
    observacao: reset.observacao,
    data: new Date(reset.created_at)
  });

  // Converter de formato local para Supabase
  const convertToSupabase = (reset: Omit<ResetLocal, 'id' | 'data'>): Omit<ResetSupabase, 'id' | 'created_at'> => ({
    equipamento: reset.equipamento,
    modelo: reset.modelo,
    quantidade: reset.quantidade,
    responsavel: reset.responsavel,
    observacao: reset.observacao
  });

  const fetchResets = async () => {
    try {
      const { data, error } = await supabase
        .from('resets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const resetsLocais = (data || []).map(convertFromSupabase);
      setResets(resetsLocais);
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

  const addReset = async (reset: Omit<ResetLocal, 'id' | 'data'>) => {
    try {
      const resetSupabase = convertToSupabase(reset);
      
      const { data, error } = await supabase
        .from('resets')
        .insert([resetSupabase])
        .select()
        .single();

      if (error) throw error;

      const novoReset = convertFromSupabase(data);
      setResets(prev => [novoReset, ...prev]);
      
      return novoReset;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar reset",
        description: error.message
      });
      throw error;
    }
  };

  const getResetsPorModelo = (modelo: string): ResetLocal[] => {
    return resets.filter(reset => reset.modelo === modelo);
  };

  const getTotalResets = (): number => {
    return resets.reduce((acc, reset) => acc + reset.quantidade, 0);
  };

  useEffect(() => {
    fetchResets();
  }, []);

  return {
    resets,
    loading,
    addReset,
    getResetsPorModelo,
    getTotalResets,
    refetch: fetchResets
  };
};