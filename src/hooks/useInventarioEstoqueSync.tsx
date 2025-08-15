import { useEffect } from 'react';
import { useInventario } from '@/contexts/InventarioContext';
import { useEstoque } from '@/contexts/EstoqueContext';

export function useInventarioEstoqueSync() {
  const { syncEstoque } = useInventario();
  const { aumentarEstoque, getEstoquePorModelo } = useEstoque();

  useEffect(() => {
    if (syncEstoque) {
      syncEstoque(aumentarEstoque, getEstoquePorModelo);
    }
  }, [syncEstoque, aumentarEstoque, getEstoquePorModelo]);
}