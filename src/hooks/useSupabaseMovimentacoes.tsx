import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface MovimentacaoSupabase {
  id: string;
  produto_id: string;
  tipo_movimento: string; // Mudança aqui para aceitar string genérico
  quantidade: number;
  valor_unitario?: number;
  motivo?: string;
  documento?: string;
  funcionario_id?: string;
  observacoes?: string;
  created_at: string;
}

export interface OperacaoLocal {
  id: string;
  tipo: "entrada" | "saida";
  usuario: string;
  caixaId: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  destino?: string;
  observacao?: string;
  data: Date;
}

export const useSupabaseMovimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoSupabase[]>([]);
  const [operacoes, setOperacoes] = useState<OperacaoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Converter movimentação para operação local
  const convertToOperacao = (mov: any): OperacaoLocal => ({
    id: mov.id,
    tipo: (mov.tipo_movimento === 'entrada' || mov.tipo_movimento === 'saida') ? mov.tipo_movimento : 'entrada',
    usuario: 'Sistema', // Será melhorado com joins
    caixaId: mov.documento || 'N/A',
    equipamento: 'Equipamento', // Será melhorado com joins
    modelo: 'Modelo', // Será melhorado com joins
    quantidade: mov.quantidade,
    destino: mov.motivo,
    observacao: mov.observacoes,
    data: new Date(mov.created_at)
  });

  const fetchMovimentacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMovimentacoes(data as any || []);
      
      // Converter para operações locais
      const operacoesConvertidas = (data || []).map((item: any) => convertToOperacao(item));
      setOperacoes(operacoesConvertidas);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar movimentações",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const addOperacao = async (operacao: Omit<OperacaoLocal, 'id' | 'data'>) => {
    try {
      // Buscar produto pelo código da caixa
      const { data: produto, error: findError } = await supabase
        .from('produtos')
        .select('id')
        .eq('codigo', operacao.caixaId)
        .single();

      if (findError) {
        // Se não encontrar produto, criar uma movimentação genérica
        console.warn('Produto não encontrado para caixa:', operacao.caixaId);
      }

      const movimentacao: Omit<MovimentacaoSupabase, 'id' | 'created_at'> = {
        produto_id: produto?.id || '00000000-0000-0000-0000-000000000000',
        tipo_movimento: operacao.tipo,
        quantidade: operacao.quantidade,
        motivo: operacao.destino,
        documento: operacao.caixaId,
        observacoes: operacao.observacao
      };

      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .insert([movimentacao])
        .select()
        .single();

      if (error) throw error;

      const novaOperacao: OperacaoLocal = {
        ...operacao,
        id: data.id,
        data: new Date()
      };

      setMovimentacoes(prev => [data as any, ...prev]);
      setOperacoes(prev => [novaOperacao, ...prev]);
      
      return novaOperacao;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar operação",
        description: error.message
      });
      throw error;
    }
  };

  const getOperacoesPorTipo = (tipo: "entrada" | "saida"): OperacaoLocal[] => {
    return operacoes.filter(op => op.tipo === tipo);
  };

  useEffect(() => {
    fetchMovimentacoes();
  }, []);

  return {
    movimentacoes,
    operacoes,
    loading,
    addOperacao,
    getOperacoesPorTipo,
    refetch: fetchMovimentacoes
  };
};