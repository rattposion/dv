import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type PeriodoPreset = 'dia' | 'semana' | 'mes' | 'ano' | 'personalizado';

export interface FiltroData {
  dataInicio: Date;
  dataFim: Date;
  periodo: PeriodoPreset;
  titulo: string;
}

export const useRelatorioFilters = () => {
  const [filtroAtual, setFiltroAtual] = useState<FiltroData>({
    dataInicio: new Date(),
    dataFim: new Date(),
    periodo: 'dia',
    titulo: 'Hoje'
  });

  const [dataPersonalizada, setDataPersonalizada] = useState({
    inicio: format(new Date(), 'yyyy-MM-dd'),
    fim: format(new Date(), 'yyyy-MM-dd')
  });

  // Filtros predefinidos para facilitar a seleção
  const filtrosPredefinidos = useMemo(() => {
    const hoje = new Date();
    
    return {
      dia: {
        dataInicio: hoje,
        dataFim: hoje,
        periodo: 'dia' as PeriodoPreset,
        titulo: 'Hoje'
      },
      ontem: {
        dataInicio: subDays(hoje, 1),
        dataFim: subDays(hoje, 1),
        periodo: 'dia' as PeriodoPreset,
        titulo: 'Ontem'
      },
      estaSemana: {
        dataInicio: startOfWeek(hoje, { weekStartsOn: 1 }),
        dataFim: endOfWeek(hoje, { weekStartsOn: 1 }),
        periodo: 'semana' as PeriodoPreset,
        titulo: 'Esta Semana'
      },
      semanaPassada: {
        dataInicio: startOfWeek(subWeeks(hoje, 1), { weekStartsOn: 1 }),
        dataFim: endOfWeek(subWeeks(hoje, 1), { weekStartsOn: 1 }),
        periodo: 'semana' as PeriodoPreset,
        titulo: 'Semana Passada'
      },
      esteMes: {
        dataInicio: startOfMonth(hoje),
        dataFim: endOfMonth(hoje),
        periodo: 'mes' as PeriodoPreset,
        titulo: 'Este Mês'
      },
      mesPassado: {
        dataInicio: startOfMonth(subMonths(hoje, 1)),
        dataFim: endOfMonth(subMonths(hoje, 1)),
        periodo: 'mes' as PeriodoPreset,
        titulo: 'Mês Passado'
      },
      esteAno: {
        dataInicio: startOfYear(hoje),
        dataFim: endOfYear(hoje),
        periodo: 'ano' as PeriodoPreset,
        titulo: 'Este Ano'
      },
      anoPassado: {
        dataInicio: startOfYear(subYears(hoje, 1)),
        dataFim: endOfYear(subYears(hoje, 1)),
        periodo: 'ano' as PeriodoPreset,
        titulo: 'Ano Passado'
      }
    };
  }, []);

  // Função para aplicar filtro predefinido
  const aplicarFiltroPredefinido = (chave: keyof typeof filtrosPredefinidos) => {
    setFiltroAtual(filtrosPredefinidos[chave]);
  };

  // Função para aplicar filtro personalizado
  const aplicarFiltroPersonalizado = () => {
    const inicio = new Date(dataPersonalizada.inicio);
    const fim = new Date(dataPersonalizada.fim);
    
    setFiltroAtual({
      dataInicio: inicio,
      dataFim: fim,
      periodo: 'personalizado',
      titulo: `${format(inicio, 'dd/MM/yyyy')} até ${format(fim, 'dd/MM/yyyy')}`
    });
  };

  // Função para filtrar dados por período
  const filtrarDadosPorPeriodo = <T extends { [key: string]: any }>(
    dados: T[], 
    campoData: string = 'created_at'
  ): T[] => {
    return dados.filter(item => {
      const itemDate = new Date(item[campoData]);
      return itemDate >= filtroAtual.dataInicio && itemDate <= filtroAtual.dataFim;
    });
  };

  // Função para gerar título de relatório automatico baseado no período
  const gerarTituloRelatorio = (tipoRelatorio: string): string => {
    const prefixos = {
      'completo': 'Relatório Completo',
      'defeitos': 'Relatório de Defeitos',
      'producao': 'Relatório de Produção',
      'recebimentos': 'Relatório de Recebimentos',
      'movimentacoes': 'Relatório de Movimentações',
      'garantias': 'Relatório de Garantias',
      'itens_faltantes': 'Itens Faltantes no Estoque'
    };

    const prefixo = prefixos[tipoRelatorio as keyof typeof prefixos] || 'Relatório';
    
    return `${prefixo} - ${filtroAtual.titulo}`;
  };

  return {
    filtroAtual,
    setFiltroAtual,
    dataPersonalizada,
    setDataPersonalizada,
    filtrosPredefinidos,
    aplicarFiltroPredefinido,
    aplicarFiltroPersonalizado,
    filtrarDadosPorPeriodo,
    gerarTituloRelatorio
  };
};