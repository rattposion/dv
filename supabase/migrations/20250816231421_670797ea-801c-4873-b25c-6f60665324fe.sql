-- Add DELETE policies to protect critical business data from unauthorized deletion

-- Funcionarios (Employees) - Only admins can delete employee records
CREATE POLICY "Only admins can delete employees" 
ON public.funcionarios 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Produtos (Products) - Only admins can delete product records
CREATE POLICY "Only admins can delete products" 
ON public.produtos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Equipamentos (Equipment) - Only admins can delete equipment records
CREATE POLICY "Only admins can delete equipment" 
ON public.equipamentos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Manutencoes (Maintenance) - Only admins can delete maintenance records
CREATE POLICY "Only admins can delete maintenance records" 
ON public.manutencoes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- RMAs - Only admins can delete RMA records
CREATE POLICY "Only admins can delete RMAs" 
ON public.rmas 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Defeitos (Defects) - Only admins can delete defect records
CREATE POLICY "Only admins can delete defects" 
ON public.defeitos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Recebimentos (Receipts) - Only admins can delete receipt records
CREATE POLICY "Only admins can delete receipts" 
ON public.recebimentos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Ordens de Producao (Production Orders) - Only admins can delete production orders
CREATE POLICY "Only admins can delete production orders" 
ON public.ordens_producao 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Producao Diaria (Daily Production) - Only admins can delete daily production records
CREATE POLICY "Only admins can delete daily production" 
ON public.producao_diaria 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Estoque Recebimento (Receipt Stock) - Only admins can delete stock records
CREATE POLICY "Only admins can delete receipt stock" 
ON public.estoque_recebimento 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Consumo Producao (Production Consumption) - Only admins can delete consumption records
CREATE POLICY "Only admins can delete production consumption" 
ON public.consumo_producao 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Note: Tables like movimentacoes_estoque, itens_recebimento, resets, and relatorios
-- are intentionally left without DELETE policies as they serve as audit logs
-- and should never be deleted to maintain data integrity and audit trails