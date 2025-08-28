import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseRelatorios } from './useSupabaseRelatorios';
import { useSupabaseDefeitosRecebimentos } from './useSupabaseDefeitosRecebimentos';
import { useSupabaseRecuperacoes } from './useSupabaseRecuperacoes';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useAutoRelatorios = () => {
  const { user } = useAuth();
  const { createRelatorio } = useSupabaseRelatorios();
  const { defeitos, recebimentos, totalDefeitos, totalRecebidos } = useSupabaseDefeitosRecebimentos();
  const { recuperacoes, totalRecuperados } = useSupabaseRecuperacoes();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const gerarRelatorioAutomatico = async () => {
    if (!user?.id) return;

    try {
      const hoje = new Date();
      const dataFormatada = format(hoje, 'dd/MM/yyyy', { locale: ptBR });
      
      // Buscar dados de produção
      const { data: producoes } = await supabase
        .from('producao_diaria')
        .select('*')
        .gte('created_at', format(hoje, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      // Buscar dados de movimentações
      const { data: movimentacoes } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .gte('created_at', format(hoje, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      // Buscar RMAs do dia
      const { data: rmas } = await supabase
        .from('rmas')
        .select('*')
        .gte('created_at', format(hoje, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      // Filtrar dados do dia atual
      const defeitosDoDia = defeitos.filter(d => 
        new Date(d.created_at).toDateString() === hoje.toDateString()
      );
      
      const recebimentosDoDia = recebimentos.filter(r => 
        new Date(r.created_at).toDateString() === hoje.toDateString()
      );
      
      const recuperacoesDoDia = recuperacoes.filter(r => 
        new Date(r.data_recuperacao).toDateString() === hoje.toDateString()
      );

      // Calcular totais do dia
      const totalDefeitosDia = defeitosDoDia.reduce((acc, d) => acc + d.quantidade, 0);
      const totalRecuperadosDia = recuperacoesDoDia.reduce((acc, r) => acc + r.macs.length, 0);
      const totalProducoesDia = producoes?.reduce((acc, p) => acc + (p.quantidade_equipamentos || 0), 0) || 0;

      // Criar relatório automático
      const relatorioData = {
        titulo: `Relatório Automático - ${dataFormatada}`,
        tipo: 'automatico_diario',
        periodo_inicio: format(hoje, 'yyyy-MM-dd'),
        periodo_fim: format(hoje, 'yyyy-MM-dd'),
        dados: {
          resumoDia: {
            data: dataFormatada,
            totalDefeitos: totalDefeitosDia,
            totalRecuperados: totalRecuperadosDia,
            totalProducoes: totalProducoesDia,
            totalMovimentacoes: movimentacoes?.length || 0,
            totalRMAs: rmas?.length || 0,
            totalRecebimentos: recebimentosDoDia.length
          },
          defeitosDoDia,
          recebimentosDoDia,
          recuperacoesDoDia,
          producoesDoDia: producoes || [],
          movimentacoesDoDia: movimentacoes || [],
          rmasDoDia: rmas || [],
          automatico: true,
          geradoEm: hoje.toISOString(),
          observacoes: 'Relatório gerado automaticamente às 23:00'
        },
        gerado_por: user.id
      };

      await createRelatorio(relatorioData);
      console.log('Relatório automático gerado com sucesso para', dataFormatada);
      
    } catch (error) {
      console.error('Erro ao gerar relatório automático:', error);
    }
  };

  const verificarHorario = () => {
    const agora = new Date();
    const hora = agora.getHours();
    const minuto = agora.getMinutes();
    
    // Verificar se é 23:00
    if (hora === 23 && minuto === 0) {
      const dataHoje = format(agora, 'yyyy-MM-dd');
      const ultimoRelatorio = localStorage.getItem('ultimo_relatorio_automatico');
      
      // Só gerar se não foi gerado hoje
      if (ultimoRelatorio !== dataHoje) {
        gerarRelatorioAutomatico();
        localStorage.setItem('ultimo_relatorio_automatico', dataHoje);
      }
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Verificar a cada minuto
    intervalRef.current = setInterval(verificarHorario, 60000);
    
    // Verificar imediatamente ao carregar
    verificarHorario();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.id, defeitos, recebimentos, recuperacoes]);

  return {
    gerarRelatorioAutomatico
  };
};