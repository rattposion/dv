import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Caixa {
  id: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  responsavel: string;
  status: string;
  macs: string[];
}

interface InventarioContextType {
  caixas: Caixa[];
  removeCaixa: (id: string) => void;
  addCaixa: (caixa: Caixa) => void;
  updateCaixa: (id: string, updates: Partial<Caixa>) => void;
  syncEstoque?: (aumentarEstoque: (modelo: string, quantidade: number) => void, getEstoquePorModelo: (modelo: string) => number) => void;
}

const InventarioContext = createContext<InventarioContextType | undefined>(undefined);

const caixasIniciais: Caixa[] = [];

export function InventarioProvider({ children }: { children: ReactNode }) {
  const [caixas, setCaixas] = useState<Caixa[]>(caixasIniciais);
  const [estoqueCallbacks, setEstoqueCallbacks] = useState<{
    aumentarEstoque?: (modelo: string, quantidade: number) => void;
    getEstoquePorModelo?: (modelo: string) => number;
  }>({});

  const removeCaixa = (id: string) => {
    setCaixas(prevCaixas => prevCaixas.filter(caixa => caixa.id !== id));
  };

  const addCaixa = (caixa: Caixa) => {
    setCaixas(prevCaixas => [...prevCaixas, caixa]);
    
    // Sincroniza com o estoque automaticamente
    if (estoqueCallbacks.aumentarEstoque && estoqueCallbacks.getEstoquePorModelo) {
      const estoqueAtual = estoqueCallbacks.getEstoquePorModelo(caixa.modelo);
      if (estoqueAtual === 0) {
        // Se não existe estoque para este modelo, adiciona
        estoqueCallbacks.aumentarEstoque(caixa.modelo, caixa.quantidade);
      }
    }
  };

  const updateCaixa = (id: string, updates: Partial<Caixa>) => {
    setCaixas(prevCaixas => 
      prevCaixas.map(caixa => 
        caixa.id === id ? { ...caixa, ...updates } : caixa
      )
    );
  };

  const syncEstoque = (aumentarEstoque: (modelo: string, quantidade: number) => void, getEstoquePorModelo: (modelo: string) => number) => {
    setEstoqueCallbacks({ aumentarEstoque, getEstoquePorModelo });
    
    // Sincroniza caixas existentes ao conectar com estoque
    caixas.forEach(caixa => {
      const estoqueAtual = getEstoquePorModelo(caixa.modelo);
      if (estoqueAtual === 0) {
        aumentarEstoque(caixa.modelo, caixa.quantidade);
      }
    });
  };

  return (
    <InventarioContext.Provider value={{ caixas, removeCaixa, addCaixa, updateCaixa, syncEstoque }}>
      {children}
    </InventarioContext.Provider>
  );
}

export function useInventario() {
  const context = useContext(InventarioContext);
  if (context === undefined) {
    throw new Error('useInventario must be used within an InventarioProvider');
  }
  return context;
}