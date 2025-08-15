-- Create storage bucket for maintenance attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('manutencao-anexos', 'manutencao-anexos', false);

-- Create storage policies for maintenance attachments
CREATE POLICY "Authenticated users can view their maintenance attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'manutencao-anexos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload maintenance attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'manutencao-anexos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their maintenance attachments"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'manutencao-anexos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their maintenance attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'manutencao-anexos' AND auth.role() = 'authenticated');

-- Add attachment fields to manutencoes table
ALTER TABLE public.manutencoes 
ADD COLUMN anexos_ids text[];

-- Add total_equipamentos_produzidos to track total production
ALTER TABLE public.produtos 
ADD COLUMN total_produzido integer NOT NULL DEFAULT 0;