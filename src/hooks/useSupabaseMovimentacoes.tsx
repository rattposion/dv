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
      // Para movimentações de caixas, apenas registrar localmente
      // As caixas têm seu próprio sistema de rastreamento e não precisam
      // ser registradas na tabela movimentacoes_estoque que é para produtos
      const novaOperacao: OperacaoLocal = {
        ...operacao,
        id: crypto.randomUUID(),
        data: new Date()
      };

      setOperacoes(prev => [novaOperacao, ...prev]);

      toast({
        title: "Operação registrada",
        description: `${operacao.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso`,
      });
      
      return novaOperacao;
    } catch (error: any) {
      console.error('Erro ao adicionar operação:', error);
      toast({
        title: "Erro ao registrar operação",
        description: error.message,
        variant: "destructive",
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