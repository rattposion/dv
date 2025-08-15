import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface RelatorioSupabase {
  id: string;
  titulo: string;
  tipo: string; // Mudança aqui para aceitar string genérico
  periodo_inicio?: string;
  periodo_fim?: string;
  dados?: any;
  gerado_por: string;
  created_at: string;
}

export const useSupabaseRelatorios = () => {
  const [relatorios, setRelatorios] = useState<RelatorioSupabase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRelatorios = async () => {
    try {
      const { data, error } = await supabase
        .from('relatorios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRelatorios(data as any || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar relatórios",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const createRelatorio = async (relatorio: Omit<RelatorioSupabase, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('relatorios')
        .insert([relatorio])
        .select()
        .single();

      if (error) throw error;

      setRelatorios(prev => [data as any, ...prev]);
      
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar relatório",
        description: error.message
      });
      throw error;
    }
  };

  const deleteRelatorio = async (id: string) => {
    try {
      const { error } = await supabase
        .from('relatorios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRelatorios(prev => prev.filter(r => r.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar relatório",
        description: error.message
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchRelatorios();
  }, []);

  return {
    relatorios,
    loading,
    createRelatorio,
    deleteRelatorio,
    refetch: fetchRelatorios
  };
};