-- Corrigir função para incluir search_path seguro
CREATE OR REPLACE FUNCTION validate_mac_quantity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se o número de MACs corresponde à quantidade para caixas_inventario
  IF TG_TABLE_NAME = 'caixas_inventario' THEN
    IF NEW.macs IS NOT NULL AND array_length(NEW.macs, 1) != NEW.quantidade THEN
      RAISE EXCEPTION 'Número de MACs (%) não corresponde à quantidade (%). Registre % MACs.', 
        array_length(NEW.macs, 1), NEW.quantidade, NEW.quantidade;
    END IF;
  END IF;
  
  -- Verifica se o número de MACs corresponde à quantidade para defeitos
  IF TG_TABLE_NAME = 'defeitos' THEN
    IF NEW.macs IS NOT NULL AND array_length(NEW.macs, 1) != NEW.quantidade THEN
      RAISE EXCEPTION 'Número de MACs (%) não corresponde à quantidade (%). Registre % MACs.', 
        array_length(NEW.macs, 1), NEW.quantidade, NEW.quantidade;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;