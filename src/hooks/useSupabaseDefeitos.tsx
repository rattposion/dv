import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DefeitoSupabase {
  id: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  tipo_defeito: string;
  responsavel: string;
  data_registro: string;
  observacoes?: string;
  origem?: string;
  created_at: string;
  foto_url?: string;
  destino?: string;
  descricao_defeito?: string;
  macs?: string[];
}

export const useSupabaseDefeitos = () => {
  const [defeitos, setDefeitos] = useState<DefeitoSupabase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDefeitos = async () => {
    try {
      const { data, error } = await supabase
        .from('defeitos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDefeitos(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar defeitos:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar defeitos",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefeito = async (defeito: Omit<DefeitoSupabase, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('defeitos')
        .insert([defeito])
        .select()
        .single();

      if (error) throw error;

      const novoDefeito: DefeitoSupabase = {
        id: data.id,
        equipamento: data.equipamento,
        modelo: data.modelo,
        quantidade: data.quantidade,
        tipo_defeito: data.tipo_defeito,
        responsavel: data.responsavel,
        data_registro: data.data_registro,
        observacoes: data.observacoes,
        origem: data.origem,
        created_at: data.created_at,
        foto_url: data.foto_url,
        destino: data.destino,
        descricao_defeito: data.descricao_defeito,
        macs: data.macs
      };

      setDefeitos(prev => [novoDefeito, ...prev]);
      
      toast({
        title: "Defeito registrado",
        description: "Registro criado com sucesso."
      });

      return novoDefeito;
    } catch (error: any) {
      console.error('Erro ao criar defeito:', error);
      toast({
        variant: "destructive",
        title: "Erro ao registrar defeito",
        description: error.message
      });
      throw error;
    }
  };

  const updateDefeito = async (id: string, defeito: Partial<Omit<DefeitoSupabase, 'id' | 'created_at'>>) => {
    try {
      console.log('Atualizando defeito com dados:', defeito);

      const { data, error } = await supabase
        .from('defeitos')
        .update(defeito)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase ao atualizar:', error);
        throw error;
      }

      console.log('Dados atualizados com sucesso:', data);

      const defeitoAtualizado = {
        id: data.id,
        equipamento: data.equipamento,
        modelo: data.modelo,
        quantidade: data.quantidade,
        tipo_defeito: data.tipo_defeito,
        responsavel: data.responsavel,
        data_registro: data.data_registro,
        observacoes: data.observacoes,
        origem: data.origem,
        created_at: data.created_at,
        foto_url: data.foto_url,
        destino: data.destino,
        descricao_defeito: data.descricao_defeito,
        macs: data.macs
      };

      setDefeitos(prev => prev.map(d => d.id === id ? defeitoAtualizado : d));
      
      toast({
        title: "Defeito atualizado",
        description: "Registro atualizado com sucesso."
      });

      return defeitoAtualizado;
    } catch (error: any) {
      console.error('Erro completo ao atualizar defeito:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar defeito",
        description: error.message
      });
      throw error;
    }
  };

  const deleteDefeito = async (id: string) => {
    try {
      const { error } = await supabase
        .from('defeitos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDefeitos(prev => prev.filter(d => d.id !== id));
      
      toast({
        title: "Defeito removido",
        description: "Registro removido com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao deletar defeito:', error);
      toast({
        variant: "destructive",
        title: "Erro ao remover defeito",
        description: error.message
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchDefeitos();
  }, []);

  return {
    defeitos,
    loading,
    fetchDefeitos,
    createDefeito,
    updateDefeito,
    deleteDefeito
  };
};