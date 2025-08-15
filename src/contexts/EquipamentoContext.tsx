import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseEquipamentos } from '@/hooks/useSupabaseEquipamentos';
import type { EquipamentoLocal } from '@/hooks/useSupabaseEquipamentos';

export type Equipamento = EquipamentoLocal;

interface EquipamentoContextType {
  equipamentos: Equipamento[];
  loading: boolean;
  addEquipamento: (equipamento: Omit<Equipamento, 'id' | 'dataCadastro'>) => Promise<Equipamento>;
  updateEquipamento: (id: string, updates: Partial<Equipamento>) => Promise<void>;
  removeEquipamento: (id: string) => Promise<void>;
}

const EquipamentoContext = createContext<EquipamentoContextType | undefined>(undefined);

export function EquipamentoProvider({ children }: { children: ReactNode }) {
  const { 
    equipamentos, 
    loading,
    addEquipamento, 
    updateEquipamento, 
    removeEquipamento 
  } = useSupabaseEquipamentos();

  return (
    <EquipamentoContext.Provider value={{ 
      equipamentos, 
      loading,
      addEquipamento, 
      updateEquipamento, 
      removeEquipamento
    }}>
      {children}
    </EquipamentoContext.Provider>
  );
}

export function useEquipamento() {
  const context = useContext(EquipamentoContext);
  if (context === undefined) {
    throw new Error('useEquipamento must be used within an EquipamentoProvider');
  }
  return context;
}