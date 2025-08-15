import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ItemRecebimento {
  id?: string;
  produto_nome: string;
  modelo: string;
  quantidade: number;
  observacoes?: string;
}

export interface Recebimento {
  id: string;
  numero_documento: string;
  origem: string;
  responsavel_recebimento: string;
  data_recebimento: string;
  observacoes?: string;
  created_at: string;
  itens?: ItemRecebimento[];
}

export interface EstoqueRecebimento {
  id: string;
  modelo: string;
  quantidade_disponivel: number;
  created_at: string;
  updated_at: string;
}

export function useSupabaseRecebimentos() {
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [estoqueRecebimento, setEstoqueRecebimento] = useState<EstoqueRecebimento[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRecebimentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recebimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar itens para cada recebimento
      const recebimentosComItens = await Promise.all(
        (data || []).map(async (recebimento) => {
          const { data: itens, error: itensError } = await supabase
            .from('itens_recebimento')
            .select('*')
            .eq('recebimento_id', recebimento.id);

          if (itensError) throw itensError;
          
          return { ...recebimento, itens: itens || [] };
        })
      );

      setRecebimentos(recebimentosComItens);
    } catch (error) {
      console.error('Erro ao buscar recebimentos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar recebimentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEstoqueRecebimento = async () => {
    try {
      const { data, error } = await supabase
        .from('estoque_recebimento')
        .select('*')
        .order('modelo');

      if (error) throw error;
      setEstoqueRecebimento(data || []);
    } catch (error) {
      console.error('Erro ao buscar estoque de recebimento:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar estoque de recebimento",
        variant: "destructive",
      });
    }
  };

  const diminuirEstoqueRecebimento = async (modelo: string, quantidade: number): Promise<boolean> => {
    try {
      const { data: estoqueAtual, error: fetchError } = await supabase
        .from('estoque_recebimento')
        .select('*')
        .eq('modelo', modelo)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!estoqueAtual || estoqueAtual.quantidade_disponivel < quantidade) {
        return false; // Estoque insuficiente
      }

      const novaQuantidade = estoqueAtual.quantidade_disponivel - quantidade;

      const { error: updateError } = await supabase
        .from('estoque_recebimento')
        .update({ quantidade_disponivel: novaQuantidade })
        .eq('modelo', modelo);

      if (updateError) throw updateError;

      // Atualizar estado local
      setEstoqueRecebimento(prev => 
        prev.map(item => 
          item.modelo === modelo 
            ? { ...item, quantidade_disponivel: novaQuantidade }
            : item
        )
      );

      return true;
    } catch (error) {
      console.error('Erro ao diminuir estoque de recebimento:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar estoque de recebimento",
        variant: "destructive",
      });
      return false;
    }
  };

  const getEstoqueDisponivel = (modelo: string): number => {
    const item = estoqueRecebimento.find(e => e.modelo === modelo);
    return item ? item.quantidade_disponivel : 0;
  };

  useEffect(() => {
    fetchRecebimentos();
    fetchEstoqueRecebimento();
  }, []);

  return {
    recebimentos,
    estoqueRecebimento,
    loading,
    fetchRecebimentos,
    fetchEstoqueRecebimento,
    diminuirEstoqueRecebimento,
    getEstoqueDisponivel,
    refetch: () => {
      fetchRecebimentos();
      fetchEstoqueRecebimento();
    }
  };
}