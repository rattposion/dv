import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseFuncionarios } from '@/hooks/useSupabaseFuncionarios';
import type { FuncionarioLocal } from '@/hooks/useSupabaseFuncionarios';

export type Funcionario = FuncionarioLocal;

interface FuncionarioContextType {
  funcionarios: Funcionario[];
  funcionariosAprovados: Funcionario[];
  loading: boolean;
  addFuncionario: (funcionario: Omit<Funcionario, 'id'>) => Promise<Funcionario>;
  updateFuncionario: (id: string, updates: Partial<Funcionario>) => Promise<void>;
  removeFuncionario: (id: string) => Promise<void>;
  aprovarFuncionario: (id: string) => Promise<void>;
}

const FuncionarioContext = createContext<FuncionarioContextType | undefined>(undefined);

export function FuncionarioProvider({ children }: { children: ReactNode }) {
  const { 
    funcionarios,
    funcionariosAprovados,
    loading,
    addFuncionario, 
    updateFuncionario, 
    removeFuncionario,
    aprovarFuncionario
  } = useSupabaseFuncionarios();

  return (
    <FuncionarioContext.Provider value={{ 
      funcionarios,
      funcionariosAprovados,
      loading,
      addFuncionario, 
      updateFuncionario, 
      removeFuncionario,
      aprovarFuncionario
    }}>
      {children}
    </FuncionarioContext.Provider>
  );
}

export function useFuncionario() {
  const context = useContext(FuncionarioContext);
  if (context === undefined) {
    throw new Error('useFuncionario must be used within a FuncionarioProvider');
  }
  return context;
}