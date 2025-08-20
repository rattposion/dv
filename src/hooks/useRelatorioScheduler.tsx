import { useEffect } from 'react';
import { useSupabaseRelatorios } from './useSupabaseRelatorios';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, subWeeks, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useRelatorioScheduler = (gerarDadosRelatorio: (tipo: string, inicio?: string, fim?: string) => any) => {
  const { createRelatorio, relatorios } = useSupabaseRelatorios();
  const { user } = useAuth();

  // Verificar se já existe um relatório para o período
  const jaExisteRelatorio = (tipo: string, inicio: Date, fim: Date): boolean => {
    return relatorios.some(relatorio => {
      if (relatorio.tipo !== tipo) return false;
      
      const relatorioInicio = relatorio.periodo_inicio ? new Date(relatorio.periodo_inicio) : null;
      const relatorioFim = relatorio.periodo_fim ? new Date(relatorio.periodo_fim) : null;
      
      if (!relatorioInicio || !relatorioFim) return false;
      
      return relatorioInicio.getTime() === inicio.getTime() && 
             relatorioFim.getTime() === fim.getTime();
    });
  };

  // Gerar relatório automático
  const gerarRelatorioAutomatico = async (
    tipo: string, 
    titulo: string, 
    inicio: Date, 
    fim: Date
  ) => {
    if (!user?.id) return;
    
    if (jaExisteRelatorio(tipo, inicio, fim)) {
      console.log(`Relatório ${tipo} para o período já existe`);
      return;
    }

    try {
      const dadosRelatorio = gerarDadosRelatorio(
        tipo,
        format(inicio, 'yyyy-MM-dd'),
        format(fim, 'yyyy-MM-dd')
      );

      const relatorioCompleto = {
        titulo,
        tipo,
        periodo_inicio: format(inicio, 'yyyy-MM-dd'),
        periodo_fim: format(fim, 'yyyy-MM-dd'),
        dados: {
          ...dadosRelatorio,
          geradoEm: new Date().toISOString(),
          automatico: true,
          parametros: {
            periodo: {
              inicio: format(inicio, 'yyyy-MM-dd'),
              fim: format(fim, 'yyyy-MM-dd')
            }
          }
        },
        gerado_por: user.id
      };

      await createRelatorio(relatorioCompleto);
      console.log(`Relatório automático ${tipo} gerado para ${titulo}`);
    } catch (error) {
      console.error('Erro ao gerar relatório automático:', error);
    }
  };

  // Verificar e gerar relatórios automaticos
  const verificarRelatoriosAutomaticos = async () => {
    if (!user?.id) return;

    const hoje = new Date();
    
    // Relatório da semana passada (toda segunda-feira)
    if (hoje.getDay() === 1) { // Segunda-feira
      const inicioSemanaPassada = startOfWeek(subWeeks(hoje, 1), { weekStartsOn: 1 });
      const fimSemanaPassada = endOfWeek(subWeeks(hoje, 1), { weekStartsOn: 1 });
      
      await gerarRelatorioAutomatico(
        'completo',
        `Relatório Semanal - ${format(inicioSemanaPassada, 'dd/MM', { locale: ptBR })} a ${format(fimSemanaPassada, 'dd/MM/yyyy', { locale: ptBR })}`,
        inicioSemanaPassada,
        fimSemanaPassada
      );
    }

    // Relatório do mês passado (todo dia 1)
    if (hoje.getDate() === 1) {
      const inicioMesPassado = startOfMonth(subMonths(hoje, 1));
      const fimMesPassado = endOfMonth(subMonths(hoje, 1));
      
      await gerarRelatorioAutomatico(
        'completo',
        `Relatório Mensal - ${format(inicioMesPassado, 'MMMM/yyyy', { locale: ptBR })}`,
        inicioMesPassado,
        fimMesPassado
      );
    }

    // Relatório do ano passado (todo dia 1 de janeiro)
    if (hoje.getDate() === 1 && hoje.getMonth() === 0) { // 1 de Janeiro
      const inicioAnoPassado = startOfYear(subYears(hoje, 1));
      const fimAnoPassado = endOfYear(subYears(hoje, 1));
      
      await gerarRelatorioAutomatico(
        'completo',
        `Relatório Anual - ${format(inicioAnoPassado, 'yyyy', { locale: ptBR })}`,
        inicioAnoPassado,
        fimAnoPassado
      );
    }
  };

  // Executar verificação na inicialização
  useEffect(() => {
    if (relatorios.length >= 0) { // Só executa quando os relatórios foram carregados
      verificarRelatoriosAutomaticos();
    }
  }, [user?.id, relatorios.length]);

  return {
    verificarRelatoriosAutomaticos,
    gerarRelatorioAutomatico
  };
};