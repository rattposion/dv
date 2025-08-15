import { createContext, useContext, useState, ReactNode } from 'react';

export interface OperacaoHistorico {
  id: string;
  tipo: 'entrada' | 'saida';
  usuario: string;
  caixaId: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  destino?: string; // Para saídas
  data: Date;
  observacao?: string;
}

interface HistoricoContextType {
  operacoes: OperacaoHistorico[];
  addOperacao: (operacao: Omit<OperacaoHistorico, 'id' | 'data'>) => void;
  getOperacoesPorUsuario: (usuario: string) => OperacaoHistorico[];
  getOperacoesPorTipo: (tipo: 'entrada' | 'saida') => OperacaoHistorico[];
}

const HistoricoContext = createContext<HistoricoContextType | undefined>(undefined);

const operacoesIniciais: OperacaoHistorico[] = [];

export function HistoricoProvider({ children }: { children: ReactNode }) {
  const [operacoes, setOperacoes] = useState<OperacaoHistorico[]>(operacoesIniciais);

  const addOperacao = (operacao: Omit<OperacaoHistorico, 'id' | 'data'>) => {
    const novaOperacao: OperacaoHistorico = {
      ...operacao,
      id: `OP${String(operacoes.length + 1).padStart(3, '0')}`,
      data: new Date()
    };
    setOperacoes(prev => [novaOperacao, ...prev]);
  };

  const getOperacoesPorUsuario = (usuario: string) => {
    return operacoes.filter(op => op.usuario === usuario);
  };

  const getOperacoesPorTipo = (tipo: 'entrada' | 'saida') => {
    return operacoes.filter(op => op.tipo === tipo);
  };

  return (
    <HistoricoContext.Provider value={{ 
      operacoes, 
      addOperacao, 
      getOperacoesPorUsuario, 
      getOperacoesPorTipo 
    }}>
      {children}
    </HistoricoContext.Provider>
  );
}

export function useHistorico() {
  const context = useContext(HistoricoContext);
  if (context === undefined) {
    throw new Error('useHistorico must be used within a HistoricoProvider');
  }
  return context;
}