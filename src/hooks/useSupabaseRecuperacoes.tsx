import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RecuperacaoSupabase {
  id: string;
  equipamento: string;
  problema: string;
  solucao: string;
  macs: string[];
  responsavel: string;
  data_recuperacao: string;
  created_at: string;
  updated_at: string;
}


export const useSupabaseRecuperacoes = () => {
  const [recuperacoes, setRecuperacoes] = useState<RecuperacaoSupabase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecuperacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('recuperacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const recuperacoesData = (data || []).map(item => ({
        id: item.id,
        equipamento: item.equipamento,
        problema: item.problema,
        solucao: item.solucao,
        macs: item.macs,
        responsavel: item.responsavel,
        data_recuperacao: item.data_recuperacao,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setRecuperacoes(recuperacoesData);
    } catch (error: any) {
      console.error('Erro ao buscar recuperações:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar recuperações",
        description: error.message
      });
    }
  };


  const createRecuperacao = async (recuperacao: Omit<RecuperacaoSupabase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('recuperacoes')
        .insert([recuperacao])
        .select()
        .single();

      if (error) throw error;

      const novaRecuperacao = {
        id: data.id,
        equipamento: data.equipamento,
        problema: data.problema,
        solucao: data.solucao,
        macs: data.macs,
        responsavel: data.responsavel,
        data_recuperacao: data.data_recuperacao,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setRecuperacoes(prev => [novaRecuperacao, ...prev]);
      
      toast({
        title: "Recuperação registrada",
        description: `${recuperacao.macs.length} equipamento(s) registrado(s) com sucesso.`
      });

      return novaRecuperacao;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar recuperação",
        description: error.message
      });
      throw error;
    }
  };


  const deleteRecuperacao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recuperacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecuperacoes(prev => prev.filter(r => r.id !== id));
      
      toast({
        title: "Recuperação removida",
        description: "Registro removido com sucesso."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover recuperação",
        description: error.message
      });
      throw error;
    }
  };


  const fetchData = async () => {
    setLoading(true);
    await fetchRecuperacoes();
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Estatísticas derivadas
  const totalRecuperados = recuperacoes.reduce((total, rec) => total + rec.macs.length, 0);

  return {
    recuperacoes,
    loading,
    totalRecuperados,
    createRecuperacao,
    deleteRecuperacao,
    refetch: fetchData
  };
};