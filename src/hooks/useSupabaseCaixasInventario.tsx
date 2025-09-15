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
    console.log('useSupabaseCaixasInventario: removeCaixa chamado para ID:', id);
    console.log('useSupabaseCaixasInventario: caixas antes da remoção:', caixas.length);
    
    try {
      // Primeiro, verificar se o usuário tem permissão
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('caixas_inventario')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('useSupabaseCaixasInventario: Erro no Supabase:', error);
        if (error.code === 'PGRST301') {
          throw new Error('Sem permissão para deletar esta caixa. Contate o administrador.');
        }
        throw error;
      }

      console.log('useSupabaseCaixasInventario: Remoção do Supabase bem-sucedida');
      
      setCaixas(prev => {
        const novasCaixas = prev.filter(c => c.id !== id);
        console.log('useSupabaseCaixasInventario: caixas após remoção local:', novasCaixas.length);
        return novasCaixas;
      });
      
      toast({
        title: "Caixa removida",
        description: "Caixa removida com sucesso",
      });
      
      console.log('useSupabaseCaixasInventario: removeCaixa concluído com sucesso');
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

    // Configurar escuta em tempo real para atualizações automáticas
    const channel = supabase
      .channel('caixas-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'caixas_inventario'
      }, (payload) => {
        console.log('Mudança detectada na tabela caixas_inventario:', payload);
        // Não recarregar automaticamente para evitar conflitos
        // fetchCaixas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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