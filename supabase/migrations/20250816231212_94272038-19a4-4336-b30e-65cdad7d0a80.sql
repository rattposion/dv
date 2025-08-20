-- Fix security vulnerability: Restrict access to funcionarios table based on user roles
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can insert funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can update funcionarios" ON public.funcionarios;

-- Create secure role-based policies for funcionarios table

-- Policy 1: Only HR and Admin can view all employee data including sensitive information
CREATE POLICY "HR and Admin can view all employee data" 
ON public.funcionarios 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'hr'::app_role)
);

-- Policy 2: Supervisors can view basic employee info (no sensitive data like salary, CPF, personal contact)
-- This would require a view or function, but for now we'll restrict supervisors to HR-level access
-- If needed later, we can create a separate view for supervisors with limited fields

-- Policy 3: Only HR and Admin can insert new employee records
CREATE POLICY "HR and Admin can insert employees" 
ON public.funcionarios 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'hr'::app_role)
);

-- Policy 4: Only HR and Admin can update employee records
CREATE POLICY "HR and Admin can update employees" 
ON public.funcionarios 
FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'hr'::app_role)
);

-- Policy 5: No DELETE policy - maintain audit trail (existing behavior)
-- Employee records should not be deleted for compliance and audit purposes

-- Create a secure view for supervisors if needed (optional - can be implemented later)
-- CREATE VIEW public.funcionarios_basic AS
-- SELECT id, nome, cargo, departamento, status, funcao, turno
-- FROM public.funcionarios;

-- Add policy for the view (if created)
-- ALTER VIEW public.funcionarios_basic ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Supervisors can view basic employee info" 
-- ON public.funcionarios_basic 
-- FOR SELECT 
-- TO authenticated
-- USING (public.has_role(auth.uid(), 'supervisor'::app_role));