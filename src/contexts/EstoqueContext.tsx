import { createContext, useContext, useState, ReactNode } from 'react';

export interface EstoqueModelo {
  modelo: string;
  disponivel: number;
}

interface EstoqueContextType {
  estoque: EstoqueModelo[];
  diminuirEstoque: (modelo: string, quantidade: number) => boolean;
  aumentarEstoque: (modelo: string, quantidade: number) => void;
  getEstoquePorModelo: (modelo: string) => number;
  updateEstoque: (modelo: string, novaQuantidade: number) => void;
}

const EstoqueContext = createContext<EstoqueContextType | undefined>(undefined);

const estoqueInicial: EstoqueModelo[] = [];

export function EstoqueProvider({ children }: { children: ReactNode }) {
  const [estoque, setEstoque] = useState<EstoqueModelo[]>(estoqueInicial);

  const diminuirEstoque = (modelo: string, quantidade: number): boolean => {
    const estoqueAtual = getEstoquePorModelo(modelo);
    
    console.log(`Diminuindo estoque: ${modelo} - Atual: ${estoqueAtual}, Diminuir: ${quantidade}`);
    
    if (estoqueAtual < quantidade) {
      console.log(`Estoque insuficiente para ${modelo}`);
      return false; // Estoque insuficiente
    }

    setEstoque(prevEstoque => {
      const novoEstoque = prevEstoque.map(item => 
        item.modelo === modelo 
          ? { ...item, disponivel: item.disponivel - quantidade }
          : item
      );
      
      console.log(`Estoque atualizado para ${modelo}:`, novoEstoque.find(item => item.modelo === modelo));
      return novoEstoque;
    });
    
    return true; // Sucesso na diminuição
  };

  const aumentarEstoque = (modelo: string, quantidade: number) => {
    setEstoque(prevEstoque => {
      const modeloExiste = prevEstoque.find(item => item.modelo === modelo);
      
      if (modeloExiste) {
        return prevEstoque.map(item => 
          item.modelo === modelo 
            ? { ...item, disponivel: item.disponivel + quantidade }
            : item
        );
      } else {
        // Se o modelo não existe, adiciona um novo
        return [...prevEstoque, { modelo, disponivel: quantidade }];
      }
    });
  };

  const getEstoquePorModelo = (modelo: string): number => {
    const item = estoque.find(e => e.modelo === modelo);
    return item ? item.disponivel : 0;
  };

  const updateEstoque = (modelo: string, novaQuantidade: number) => {
    setEstoque(prevEstoque => {
      const modeloExiste = prevEstoque.find(item => item.modelo === modelo);
      
      if (modeloExiste) {
        return prevEstoque.map(item => 
          item.modelo === modelo 
            ? { ...item, disponivel: novaQuantidade }
            : item
        );
      } else {
        return [...prevEstoque, { modelo, disponivel: novaQuantidade }];
      }
    });
  };

  return (
    <EstoqueContext.Provider value={{ 
      estoque, 
      diminuirEstoque, 
      aumentarEstoque, 
      getEstoquePorModelo,
      updateEstoque
    }}>
      {children}
    </EstoqueContext.Provider>
  );
}

export function useEstoque() {
  const context = useContext(EstoqueContext);
  if (context === undefined) {
    throw new Error('useEstoque must be used within an EstoqueProvider');
  }
  return context;
}