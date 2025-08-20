-- Fix funcionarios table access policies to allow authenticated users to work with employee data
-- while maintaining security for sensitive operations

-- Drop the overly restrictive policies
DROP POLICY "Only admins can view employee data" ON public.funcionarios;
DROP POLICY "Only admins can insert employees" ON public.funcionarios;
DROP POLICY "Only admins can update employees" ON public.funcionarios;

-- Create more balanced policies
-- Allow authenticated users to view employee data (needed for the application to work)
CREATE POLICY "Authenticated users can view employee data" 
ON public.funcionarios 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert employee data (for registration)
CREATE POLICY "Authenticated users can insert employees" 
ON public.funcionarios 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update employee data
CREATE POLICY "Authenticated users can update employees" 
ON public.funcionarios 
FOR UPDATE 
USING (auth.role() = 'authenticated');