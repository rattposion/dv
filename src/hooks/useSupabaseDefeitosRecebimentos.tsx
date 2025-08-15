import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Defeito {
  id: string;
  equipamento: string;
  modelo: string;
  tipo_defeito: string;
  descricao_defeito?: string;
  quantidade: number;
  responsavel: string;
  data_registro: string;
  origem?: string;
  destino?: string;
  observacoes?: string;
  foto_url?: string;
  created_at: string;
}

export interface Recebimento {
  id: string;
  numero_documento: string;
  data_recebimento: string;
  origem: string;
  responsavel_recebimento: string;
  observacoes?: string;
  created_at: string;
  itens: ItemRecebimento[];
}

export interface ItemRecebimento {
  id: string;
  produto_nome: string;
  modelo: string;
  quantidade: number;
  observacoes?: string;
}

export const useSupabaseDefeitosRecebimentos = () => {
  const [defeitos, setDefeitos] = useState<Defeito[]>([]);
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
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
    }
  };

  const fetchRecebimentos = async () => {
    try {
      const { data: recebimentosData, error: recebimentosError } = await supabase
        .from('recebimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (recebimentosError) throw recebimentosError;

      // Buscar itens para cada recebimento
      const recebimentosComItens = await Promise.all(
        (recebimentosData || []).map(async (recebimento) => {
          const { data: itens, error: itensError } = await supabase
            .from('itens_recebimento')
            .select('*')
            .eq('recebimento_id', recebimento.id);

          if (itensError) {
            console.error('Erro ao buscar itens do recebimento:', itensError);
            return { ...recebimento, itens: [] };
          }

          return { ...recebimento, itens: itens || [] };
        })
      );

      setRecebimentos(recebimentosComItens);
    } catch (error: any) {
      console.error('Erro ao buscar recebimentos:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar recebimentos",
        description: error.message
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchDefeitos(), fetchRecebimentos()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Estatísticas derivadas
  const totalDefeitos = defeitos.reduce((total, defeito) => total + defeito.quantidade, 0);
  const totalRecebidos = recebimentos.reduce((total, recebimento) => 
    total + recebimento.itens.reduce((subTotal, item) => subTotal + item.quantidade, 0), 0
  );

  const defeitosPorTipo = defeitos.reduce((acc, defeito) => {
    acc[defeito.tipo_defeito] = (acc[defeito.tipo_defeito] || 0) + defeito.quantidade;
    return acc;
  }, {} as Record<string, number>);

  const recebimentosPorOrigem = recebimentos.reduce((acc, recebimento) => {
    const totalItens = recebimento.itens.reduce((sum, item) => sum + item.quantidade, 0);
    acc[recebimento.origem] = (acc[recebimento.origem] || 0) + totalItens;
    return acc;
  }, {} as Record<string, number>);

  return {
    defeitos,
    recebimentos,
    loading,
    totalDefeitos,
    totalRecebidos,
    defeitosPorTipo,
    recebimentosPorOrigem,
    refetch: fetchData
  };
};