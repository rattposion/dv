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
      let equipamentosQuery = supabase
        .from('equipamentos')
        .select('id, nome, mac_address')
        .eq('mac_address', macUpper);
      if (excludeId) {
        equipamentosQuery = equipamentosQuery.neq('id', excludeId);
      }
      const { data: equipamentos, error: equipError } = await equipamentosQuery;

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
      let caixasQuery = supabase
        .from('caixas_inventario')
        .select('id, numero_caixa, equipamento, macs')
        .contains('macs', [macUpper]);
      if (excludeId) {
        caixasQuery = caixasQuery.neq('id', excludeId);
      }
      const { data: caixas, error: caixasError } = await caixasQuery;

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
      let defeitosQuery = supabase
        .from('defeitos')
        .select('id, equipamento, modelo, macs')
        .contains('macs', [macUpper]);
      if (excludeId) {
        defeitosQuery = defeitosQuery.neq('id', excludeId);
      }
      const { data: defeitos, error: defeitosError } = await defeitosQuery;

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

  // Verificar MAC com regra especial: Recuperação -> Produção permitido
  const checkMacExistsWithRecoveryRule = async (mac: string, currentPage: 'recuperacao' | 'producao' | 'other', excludeId?: string): Promise<boolean> => {
    try {
      const macUpper = mac.toUpperCase();
      
      // Verificar na tabela equipamentos
      let equipamentosQuery = supabase
        .from('equipamentos')
        .select('id, nome, mac_address')
        .eq('mac_address', macUpper);
      if (excludeId) {
        equipamentosQuery = equipamentosQuery.neq('id', excludeId);
      }
      const { data: equipamentos, error: equipError } = await equipamentosQuery;

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
      let caixasQuery = supabase
        .from('caixas_inventario')
        .select('id, numero_caixa, equipamento, macs')
        .contains('macs', [macUpper]);
      if (excludeId) {
        caixasQuery = caixasQuery.neq('id', excludeId);
      }
      const { data: caixas, error: caixasError } = await caixasQuery;

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
      let defeitosQuery = supabase
        .from('defeitos')
        .select('id, equipamento, modelo, macs')
        .contains('macs', [macUpper]);
      if (excludeId) {
        defeitosQuery = defeitosQuery.neq('id', excludeId);
      }
      const { data: defeitos, error: defeitosError } = await defeitosQuery;

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

      // Verificar na tabela recuperacoes
      let recuperacoesQuery = supabase
        .from('recuperacoes')
        .select('id, equipamento, responsavel, macs')
        .contains('macs', [macUpper]);
      if (excludeId) {
        recuperacoesQuery = recuperacoesQuery.neq('id', excludeId);
      }
      const { data: recuperacoes, error: recuperacoesError } = await recuperacoesQuery;

      if (recuperacoesError) {
        console.error('Erro ao verificar recuperações:', recuperacoesError);
        return false;
      }

      // Regra especial: Se estamos na página de Produção e o MAC existe em Recuperação, permitir
      if (currentPage === 'producao' && recuperacoes && recuperacoes.length > 0) {
        // Permitir o uso do MAC da recuperação na produção
        return false;
      }

      // Para outras páginas ou se não estamos na produção, aplicar validação normal
      if (recuperacoes && recuperacoes.length > 0) {
        // Se estamos na página de recuperação, não permitir duplicatas
        if (currentPage === 'recuperacao') {
          toast({
            title: "MAC já registrado",
            description: `Este MAC já está registrado em recuperação: ${recuperacoes[0].equipamento}`,
            variant: "destructive",
          });
          return true;
        }
        
        // Para outras páginas, mostrar que existe em recuperação mas não bloquear se for produção
        if (currentPage !== 'producao') {
          toast({
            title: "MAC já registrado",
            description: `Este MAC já está registrado em recuperação: ${recuperacoes[0].equipamento}`,
            variant: "destructive",
          });
          return true;
        }
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

  // Buscar todos os conflitos de um MAC específico
  const findMacConflicts = async (mac: string): Promise<{
    equipamentos: any[];
    caixas: any[];
    defeitos: any[];
  }> => {
    try {
      const macUpper = mac.toUpperCase();
      
      // Buscar em equipamentos
      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('id, nome, modelo, mac_address, created_at')
        .eq('mac_address', macUpper);
      
      // Buscar em caixas_inventario
      const { data: caixas } = await supabase
        .from('caixas_inventario')
        .select('id, numero_caixa, equipamento, modelo, macs, created_at')
        .contains('macs', [macUpper]);
      
      // Buscar em defeitos
      const { data: defeitos } = await supabase
        .from('defeitos')
        .select('id, equipamento, modelo, macs, data_registro, created_at')
        .contains('macs', [macUpper]);
      
      return {
        equipamentos: equipamentos || [],
        caixas: caixas || [],
        defeitos: defeitos || []
      };
    } catch (error) {
      console.error('Erro ao buscar conflitos de MAC:', error);
      return { equipamentos: [], caixas: [], defeitos: [] };
    }
  };

  // Processar erro do banco de dados relacionado a MACs
  const handleDatabaseError = (error: any): void => {
    const errorMessage = error?.message || error?.toString() || '';
    
    if (errorMessage.includes('já está registrado')) {
      // Extrair informações do erro de MAC duplicado com ID
      const macMatch = errorMessage.match(/MAC ([A-F0-9:]+) já está registrado/i);
      const tableMatch = errorMessage.match(/na tabela (\w+)/i);
      const idMatch = errorMessage.match(/\(ID: ([a-f0-9-]+)\)/i);
      
      const mac = macMatch ? macMatch[1] : 'desconhecido';
      const table = tableMatch ? tableMatch[1] : 'sistema';
      const recordId = idMatch ? idMatch[1] : null;
      
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
      
      let description = `O MAC ${mac} já está registrado em ${friendlyTableName}.`;
      if (recordId) {
        description += ` ID do registro: ${recordId.substring(0, 8)}...`;
      }
      description += ' Cada MAC deve ser único no sistema.';
      
      toast({
        title: "MAC duplicado detectado",
        description,
        variant: "destructive",
      });
    } else if (errorMessage.includes('está duplicado dentro do mesmo registro')) {
      const macMatch = errorMessage.match(/MAC ([A-F0-9:]+) está duplicado/i);
      const mac = macMatch ? macMatch[1] : 'desconhecido';
      
      toast({
        title: "MAC duplicado no registro",
        description: `O MAC ${mac} aparece mais de uma vez no mesmo registro. Remova as duplicatas antes de salvar.`,
        variant: "destructive",
      });
    } else if (errorMessage.includes('Remova as duplicatas antes de salvar')) {
      // Nova mensagem de erro melhorada
      const macMatch = errorMessage.match(/MAC ([A-F0-9:]+)/i);
      const mac = macMatch ? macMatch[1] : 'desconhecido';
      
      toast({
        title: "MAC duplicado no registro",
        description: `O MAC ${mac} está duplicado dentro do mesmo registro. Remova as duplicatas antes de salvar.`,
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

  // Validar lista de MACs com regra especial para Recuperação -> Produção
  const validateMacListWithRecoveryRule = async (macs: string[], currentPage: 'recuperacao' | 'producao' | 'other', excludeId?: string): Promise<{ valid: boolean; errors: string[] }> => {
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

      // Verificar duplicatas globais com regra especial
      const exists = await checkMacExistsWithRecoveryRule(mac, currentPage, excludeId);
      if (exists) {
        errors.push(`MAC já registrado no sistema: ${mac}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  return {
    formatMacAddress,
    validateMacFormat,
    checkMacExists,
    checkMacExistsWithRecoveryRule,
    validateMacList,
    validateMacListWithRecoveryRule,
    handleDatabaseError,
    findMacConflicts
  };
}