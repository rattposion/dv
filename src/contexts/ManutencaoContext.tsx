import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseManutencoes } from '@/hooks/useSupabaseManutencoes';
import type { ManutencaoLocal } from '@/hooks/useSupabaseManutencoes';

export type Manutencao = ManutencaoLocal;

interface ManutencaoContextType {
  manutencoes: Manutencao[];
  loading: boolean;
  addManutencao: (manutencao: Omit<Manutencao, 'id' | 'dataCadastro'>) => Promise<Manutencao>;
  updateManutencao: (id: string, updates: Partial<Manutencao>) => Promise<void>;
}

const ManutencaoContext = createContext<ManutencaoContextType | undefined>(undefined);

export function ManutencaoProvider({ children }: { children: ReactNode }) {
  const { 
    manutencoes, 
    loading,
    addManutencao, 
    updateManutencao 
  } = useSupabaseManutencoes();

  return (
    <ManutencaoContext.Provider value={{ 
      manutencoes, 
      loading,
      addManutencao, 
      updateManutencao
    }}>
      {children}
    </ManutencaoContext.Provider>
  );
}

export function useManutencao() {
  const context = useContext(ManutencaoContext);
  if (context === undefined) {
    throw new Error('useManutencao must be used within a ManutencaoProvider');
  }
  return context;
}