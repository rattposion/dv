import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ProdutoSupabase {
  id: string;
  nome: string;
  codigo?: string;
  descricao?: string;
  categoria?: string;
  unidade_medida: string;
  preco_unitario?: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number;
  localizacao_estoque?: string;
  fornecedor?: string;
  created_at: string;
  updated_at: string;
}

export interface CaixaLocal {
  id: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  responsavel: string;
  status: "Disponível" | "Em Uso" | "Em Transporte";
  macs: string[];
}

export const useSupabaseProdutos = () => {
  const [produtos, setProdutos] = useState<ProdutoSupabase[]>([]);
  const [caixas, setCaixas] = useState<CaixaLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Converter produtos para caixas (mantém compatibilidade)
  const convertProdutoToCaixa = (produto: ProdutoSupabase): CaixaLocal => ({
    id: produto.codigo || produto.id,
    equipamento: produto.nome,
    modelo: produto.categoria || 'Padrão',
    quantidade: produto.estoque_atual,
    responsavel: 'Sistema',
    status: produto.estoque_atual > 0 ? 'Disponível' : 'Em Uso',
    macs: [] // MACs serão gerenciados separadamente
  });

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProdutos(data || []);
      
      // Converter para caixas para compatibilidade
      const caixasConvertidas = (data || []).map(convertProdutoToCaixa);
      setCaixas(caixasConvertidas);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const addCaixa = async (caixa: Omit<CaixaLocal, 'id'>) => {
    try {
      const produto: Omit<ProdutoSupabase, 'id' | 'created_at' | 'updated_at'> = {
        nome: caixa.equipamento,
        codigo: `CX${Date.now()}`,
        categoria: caixa.modelo,
        unidade_medida: 'UN',
        estoque_atual: caixa.quantidade,
        estoque_minimo: 0,
        localizacao_estoque: 'Inventário'
      };

      const { data, error } = await supabase
        .from('produtos')
        .insert([produto])
        .select()
        .single();

      if (error) throw error;

      const novaCaixa = convertProdutoToCaixa(data);
      novaCaixa.macs = caixa.macs; // Preservar MACs
      
      setProdutos(prev => [data, ...prev]);
      setCaixas(prev => [novaCaixa, ...prev]);
      
      return novaCaixa;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar caixa",
        description: error.message
      });
      throw error;
    }
  };

  const removeCaixa = async (id: string) => {
    try {
      // Buscar produto pelo código
      const { data: produto, error: findError } = await supabase
        .from('produtos')
        .select('id')
        .eq('codigo', id)
        .single();

      if (findError) throw findError;

      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produto.id);

      if (error) throw error;

      setProdutos(prev => prev.filter(p => p.codigo !== id));
      setCaixas(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover caixa",
        description: error.message
      });
      throw error;
    }
  };

  const updateEstoque = async (modelo: string, novaQuantidade: number) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ estoque_atual: novaQuantidade })
        .eq('categoria', modelo);

      if (error) throw error;

      // Atualizar estado local
      setProdutos(prev => 
        prev.map(p => p.categoria === modelo ? { ...p, estoque_atual: novaQuantidade } : p)
      );
      
      setCaixas(prev => 
        prev.map(c => c.modelo === modelo ? { ...c, quantidade: novaQuantidade } : c)
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar estoque",
        description: error.message
      });
      throw error;
    }
  };

  const getEstoquePorModelo = (modelo: string): number => {
    const produto = produtos.find(p => p.categoria === modelo);
    return produto?.estoque_atual || 0;
  };

  const diminuirEstoque = (modelo: string, quantidade: number): boolean => {
    const estoqueAtual = getEstoquePorModelo(modelo);
    if (estoqueAtual >= quantidade) {
      updateEstoque(modelo, estoqueAtual - quantidade);
      return true;
    }
    return false;
  };

  const aumentarEstoque = (modelo: string, quantidade: number) => {
    const estoqueAtual = getEstoquePorModelo(modelo);
    updateEstoque(modelo, estoqueAtual + quantidade);
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  return {
    produtos,
    caixas,
    loading,
    addCaixa,
    removeCaixa,
    updateEstoque,
    getEstoquePorModelo,
    diminuirEstoque,
    aumentarEstoque,
    refetch: fetchProdutos
  };
};