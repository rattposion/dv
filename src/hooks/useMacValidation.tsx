import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para validação de endereços MAC
 * Inclui validação de formato e verificação de duplicatas globais
 */
export function useMacValidation() {
  const { toast } = useToast();

  // Formatar MAC address automaticamente
  const formatMacAddress = (input: string): string => {
    // Remove caracteres não hexadecimais
    const clean = input.replace(/[^0-9A-Fa-f]/g, '');
    
    // Adiciona dois pontos a cada 2 caracteres
    const formatted = clean.match(/.{1,2}/g)?.join(':') || clean;
    
    // Limita a 17 caracteres (formato AA:BB:CC:DD:EE:FF)
    return formatted.substring(0, 17);
  };

  // Validar formato do MAC address
  const validateMacFormat = (mac: string): boolean => {
    const macRegex = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  // Verificar se MAC já existe no sistema (verificação global)
  const checkMacExists = async (mac: string, excludeId?: string): Promise<boolean> => {
    try {
      const macUpper = mac.toUpperCase();
      
      // Verificar na tabela equipamentos
      const { data: equipamentos, error: equipError } = await supabase
        .from('equipamentos')
        .select('id, nome, mac_address')
        .eq('mac_address', macUpper)
        .neq('id', excludeId || '');

      if (equipError) {
        console.error('Erro ao verificar equipamentos:', equipError);
        return false;
      }

      if (equipamentos && equipamentos.length > 0) {
        toast({
          title: "MAC já registrado",
          description: `Este MAC já está registrado no equipamento: ${equipamentos[0].nome}`,
          variant: "destructive",
        });
        return true;
      }

      // Verificar na tabela caixas_inventario
      const { data: caixas, error: caixasError } = await supabase
        .from('caixas_inventario')
        .select('id, numero_caixa, equipamento, macs')
        .contains('macs', [macUpper])
        .neq('id', excludeId || '');

      if (caixasError) {
        console.error('Erro ao verificar caixas de inventário:', caixasError);
        return false;
      }

      if (caixas && caixas.length > 0) {
        toast({
          title: "MAC já registrado",
          description: `Este MAC já está registrado na caixa: ${caixas[0].numero_caixa} (${caixas[0].equipamento})`,
          variant: "destructive",
        });
        return true;
      }

      // Verificar na tabela defeitos
      const { data: defeitos, error: defeitosError } = await supabase
        .from('defeitos')
        .select('id, equipamento, modelo, macs')
        .contains('macs', [macUpper])
        .neq('id', excludeId || '');

      if (defeitosError) {
        console.error('Erro ao verificar defeitos:', defeitosError);
        return false;
      }

      if (defeitos && defeitos.length > 0) {
        toast({
          title: "MAC já registrado",
          description: `Este MAC já está registrado em defeitos: ${defeitos[0].equipamento} ${defeitos[0].modelo}`,
          variant: "destructive",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar duplicatas de MAC:', error);
      toast({
        title: "Erro de validação",
        description: "Não foi possível verificar se o MAC já existe. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Validar lista de MACs (verifica formato e duplicatas)
  const validateMacList = async (macs: string[], excludeId?: string): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = [];
    const seenMacs = new Set<string>();

    for (const mac of macs) {
      const macUpper = mac.toUpperCase();
      
      // Verificar formato
      if (!validateMacFormat(mac)) {
        errors.push(`MAC com formato inválido: ${mac}`);
        continue;
      }

      // Verificar duplicatas na própria lista
      if (seenMacs.has(macUpper)) {
        errors.push(`MAC duplicado na lista: ${mac}`);
        continue;
      }
      seenMacs.add(macUpper);

      // Verificar duplicatas globais
      const exists = await checkMacExists(mac, excludeId);
      if (exists) {
        errors.push(`MAC já registrado no sistema: ${mac}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Processar erro do banco de dados relacionado a MACs
  const handleDatabaseError = (error: any): void => {
    const errorMessage = error?.message || error?.toString() || '';
    
    if (errorMessage.includes('já está registrado')) {
      // Extrair informações do erro de MAC duplicado
      const macMatch = errorMessage.match(/MAC ([A-F0-9:]+) já está registrado/i);
      const tableMatch = errorMessage.match(/na tabela (\w+)/i);
      
      const mac = macMatch ? macMatch[1] : 'desconhecido';
      const table = tableMatch ? tableMatch[1] : 'sistema';
      
      let friendlyTableName = table;
      switch (table) {
        case 'equipamentos':
          friendlyTableName = 'equipamentos';
          break;
        case 'caixas_inventario':
          friendlyTableName = 'caixas de inventário';
          break;
        case 'defeitos':
          friendlyTableName = 'registros de defeitos';
          break;
      }
      
      toast({
        title: "MAC duplicado detectado",
        description: `O MAC ${mac} já está registrado em ${friendlyTableName}. Cada MAC deve ser único no sistema.`,
        variant: "destructive",
      });
    } else if (errorMessage.includes('está duplicado dentro do mesmo registro')) {
      const macMatch = errorMessage.match(/MAC ([A-F0-9:]+) está duplicado/i);
      const mac = macMatch ? macMatch[1] : 'desconhecido';
      
      toast({
        title: "MAC duplicado no registro",
        description: `O MAC ${mac} aparece mais de uma vez no mesmo registro. Remova as duplicatas.`,
        variant: "destructive",
      });
    } else {
      // Erro genérico
      toast({
        title: "Erro de validação",
        description: "Erro ao validar endereços MAC. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return {
    formatMacAddress,
    validateMacFormat,
    checkMacExists,
    validateMacList,
    handleDatabaseError
  };
}