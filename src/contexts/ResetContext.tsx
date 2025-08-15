import { createContext, useContext, useState, ReactNode } from 'react';

export interface ResetRegistro {
  id: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  responsavel: string;
  data: Date;
  observacao?: string;
}

interface ResetContextType {
  resets: ResetRegistro[];
  addReset: (reset: Omit<ResetRegistro, 'id' | 'data'>) => void;
  getResetsPorModelo: (modelo: string) => ResetRegistro[];
  getTotalResets: () => number;
}

const ResetContext = createContext<ResetContextType | undefined>(undefined);

const resetsIniciais: ResetRegistro[] = [];

export function ResetProvider({ children }: { children: ReactNode }) {
  const [resets, setResets] = useState<ResetRegistro[]>(resetsIniciais);

  const addReset = (reset: Omit<ResetRegistro, 'id' | 'data'>) => {
    const novoReset: ResetRegistro = {
      ...reset,
      id: `RST${String(resets.length + 1).padStart(3, '0')}`,
      data: new Date()
    };
    setResets(prev => [novoReset, ...prev]);
  };

  const getResetsPorModelo = (modelo: string) => {
    return resets.filter(reset => reset.modelo === modelo);
  };

  const getTotalResets = () => {
    return resets.reduce((acc, reset) => acc + reset.quantidade, 0);
  };

  return (
    <ResetContext.Provider value={{ 
      resets, 
      addReset, 
      getResetsPorModelo,
      getTotalResets
    }}>
      {children}
    </ResetContext.Provider>
  );
}

export function useReset() {
  const context = useContext(ResetContext);
  if (context === undefined) {
    throw new Error('useReset must be used within a ResetProvider');
  }
  return context;
}