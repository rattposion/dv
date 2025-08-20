-- Fix security vulnerability: Restrict access to funcionarios table based on user roles
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can insert funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can update funcionarios" ON public.funcionarios;

-- Create secure role-based policies for funcionarios table
-- Only admin users can access employee data (including sensitive information like salaries, CPF, etc.)

-- Policy 1: Only Admin users can view employee data
CREATE POLICY "Only admins can view employee data" 
ON public.funcionarios 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy 2: Only Admin users can insert new employee records
CREATE POLICY "Only admins can insert employees" 
ON public.funcionarios 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy 3: Only Admin users can update employee records
CREATE POLICY "Only admins can update employees" 
ON public.funcionarios 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy 4: No DELETE policy - maintain audit trail (existing behavior)
-- Employee records should not be deleted for compliance and audit purposes