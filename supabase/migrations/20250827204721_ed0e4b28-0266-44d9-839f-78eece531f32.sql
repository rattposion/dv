-- Aprovar o usuário Rodrigo Costa para permitir seus lançamentos
UPDATE profiles 
SET status = 'approved', 
    approved_at = now(),
    updated_at = now()
WHERE full_name = 'Rodrigo Costa' AND status = 'pending';

-- Criar função para validar MACs vs quantidade
CREATE OR REPLACE FUNCTION validate_mac_quantity()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Aplicar trigger para caixas_inventario
CREATE TRIGGER check_mac_quantity_caixas
  BEFORE INSERT OR UPDATE ON caixas_inventario
  FOR EACH ROW
  EXECUTE FUNCTION validate_mac_quantity();

-- Aplicar trigger para defeitos  
CREATE TRIGGER check_mac_quantity_defeitos
  BEFORE INSERT OR UPDATE ON defeitos
  FOR EACH ROW
  EXECUTE FUNCTION validate_mac_quantity();