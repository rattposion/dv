import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalRecebidos: number;
  estoqueDisponivel: number;
  equipamentosComProblemas: number;
  equipamentosRecuperados: number;
  estoquesPorModelo: { [modelo: string]: number };
  defeitosPorTipo: { [tipo: string]: number };
  producaoDiaria: Array<{
    colaborador: string;
    modelo: string;
    quantidade_caixas: number;
    quantidade_equipamentos: number;
    data_producao: string;
  }>;
}

export const useSupabaseDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRecebidos: 0,
    estoqueDisponivel: 0,
    equipamentosComProblemas: 0,
    equipamentosRecuperados: 0,
    estoquesPorModelo: {},
    defeitosPorTipo: {},
    producaoDiaria: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Buscar estoque de recebimento atual (será usado para Total Recebidos e Estoque por Modelo)
      const { data: estoqueRecebimento, error: estoqueError } = await supabase
        .from('estoque_recebimento')
        .select('modelo, quantidade_disponivel');

      if (estoqueError) throw estoqueError;

      // Total Recebidos = soma atual do estoque de recebimento
      const totalRecebidos = (estoqueRecebimento || []).reduce((total, item) => total + item.quantidade_disponivel, 0);

      // 2. Calcular estoque por modelo (mesma fonte dos dados)
      const estoquesPorModelo: { [modelo: string]: number } = {};
      (estoqueRecebimento || []).forEach(item => {
        estoquesPorModelo[item.modelo] = item.quantidade_disponivel;
      });

      // 3. Buscar caixas do inventário para calcular estoque disponível real
      const { data: caixasInventario, error: caixasError } = await supabase
        .from('caixas_inventario')
        .select('quantidade');

      if (caixasError) throw caixasError;

      // Estoque disponível = soma de todas as quantidades das caixas no inventário
      const estoqueDisponivel = (caixasInventario || []).reduce((total, caixa) => total + caixa.quantidade, 0);

      // 4. Buscar total de equipamentos com problemas/defeitos
      const { data: defeitos, error: defeitosError } = await supabase
        .from('defeitos')
        .select('quantidade, tipo_defeito');

      if (defeitosError) throw defeitosError;

      const equipamentosComProblemas = (defeitos || []).reduce((total, defeito) => total + defeito.quantidade, 0);
      
      const defeitosPorTipo: { [tipo: string]: number } = {};
      (defeitos || []).forEach(defeito => {
        defeitosPorTipo[defeito.tipo_defeito] = (defeitosPorTipo[defeito.tipo_defeito] || 0) + defeito.quantidade;
      });

      // 5. Buscar produção do dia atual
      const hoje = new Date().toISOString().split('T')[0];
      const { data: producaoDiaria, error: producaoDiariaError } = await supabase
        .from('producao_diaria')
        .select('*')
        .eq('data_producao', hoje)
        .order('colaborador');

      if (producaoDiariaError) throw producaoDiariaError;

      // 6. Buscar recuperações
      const { data: recuperacoes, error: recuperacoesError } = await supabase
        .from('relatorios')
        .select('dados')
        .eq('tipo', 'recuperacao');

      if (recuperacoesError) throw recuperacoesError;

      // Calcular total de equipamentos recuperados
      const equipamentosRecuperados = (recuperacoes || []).reduce((total, item) => {
        const dados = item.dados as any;
        return total + (dados?.macs?.length || 0);
      }, 0);

      setStats({
        totalRecebidos,
        estoqueDisponivel,
        equipamentosComProblemas,
        equipamentosRecuperados,
        estoquesPorModelo,
        defeitosPorTipo,
        producaoDiaria: producaoDiaria || []
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar estatísticas do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    // Configurar escuta em tempo real para atualizações automáticas
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'producao_diaria'
      }, () => {
        fetchDashboardStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'caixas_inventario'
      }, () => {
        fetchDashboardStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'defeitos'
      }, () => {
        fetchDashboardStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'estoque_recebimento'
      }, () => {
        fetchDashboardStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'relatorios'
      }, () => {
        fetchDashboardStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    stats,
    loading,
    refetch: fetchDashboardStats
  };
};