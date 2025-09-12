-- Corrigir política de delete para caixas_inventario
-- Permitir que usuários autenticados possam deletar caixas

-- Remover política existente
DROP POLICY IF EXISTS "Only admins can delete caixas_inventario" ON public.caixas_inventario;
DROP POLICY IF EXISTS "Authenticated users can delete caixas_inventario" ON public.caixas_inventario;

-- Criar nova política que permite delete para usuários autenticados
CREATE POLICY "Authenticated users can delete caixas_inventario"
ON public.caixas_inventario
FOR DELETE
USING (auth.role() = 'authenticated'::text);