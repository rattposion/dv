import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface CaixaInventario {
  id: string;
  numero_caixa: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  responsavel: string;
  status: 'Disponível' | 'Em Uso' | 'Em Transporte';
  macs: string[];
  ordem_producao_id?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseCaixasInventario = () => {
  const [caixas, setCaixas] = useState<CaixaInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCaixas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('caixas_inventario')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCaixas(data?.map(caixa => ({
        ...caixa,
        status: caixa.status as 'Disponível' | 'Em Uso' | 'Em Transporte'
      })) || []);
    } catch (error: any) {
      console.error('Erro ao carregar caixas:', error);
      toast({
        title: "Erro ao carregar caixas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCaixa = async (caixa: Omit<CaixaInventario, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('caixas_inventario')
        .insert([caixa])
        .select()
        .single();

      if (error) throw error;

      const caixaTyped = {
        ...data,
        status: data.status as 'Disponível' | 'Em Uso' | 'Em Transporte'
      };
      setCaixas(prev => [caixaTyped, ...prev]);
      
      toast({
        title: "Caixa adicionada",
        description: `Caixa ${caixa.numero_caixa} adicionada com sucesso`,
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao adicionar caixa:', error);
      toast({
        title: "Erro ao adicionar caixa",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCaixa = async (id: string, updates: Partial<CaixaInventario>) => {
    try {
      const { data, error } = await supabase
        .from('caixas_inventario')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const caixaTyped = {
        ...data,
        status: data.status as 'Disponível' | 'Em Uso' | 'Em Transporte'
      };
      setCaixas(prev => prev.map(c => c.id === id ? caixaTyped : c));
      
      toast({
        title: "Caixa atualizada",
        description: "Informações da caixa atualizadas com sucesso",
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar caixa:', error);
      toast({
        title: "Erro ao atualizar caixa",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeCaixa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('caixas_inventario')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCaixas(prev => prev.filter(c => c.id !== id));
      
      toast({
        title: "Caixa removida",
        description: "Caixa removida com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao remover caixa:', error);
      toast({
        title: "Erro ao remover caixa", 
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCaixas();
  }, []);

  return {
    caixas,
    loading,
    addCaixa,
    updateCaixa,
    removeCaixa,
    refetch: fetchCaixas
  };
};