import { supabase } from '@/integrations/supabase/client';

/**
 * Remove registros duplicados de presença de usuários
 * Mantém apenas o registro mais recente para cada user_id
 */
export async function cleanupDuplicatePresenceRecords(): Promise<{
  success: boolean;
  removedCount: number;
  error?: string;
}> {
  try {
    // Primeiro, buscar todos os registros duplicados
    const { data: allRecords, error: fetchError } = await supabase
      .from('user_presence')
      .select('*')
      .order('user_id, last_seen', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    if (!allRecords || allRecords.length === 0) {
      return { success: true, removedCount: 0 };
    }

    // Agrupar por user_id e identificar duplicatas
    const userGroups = new Map<string, typeof allRecords>();
    
    allRecords.forEach(record => {
      const userId = record.user_id;
      if (!userGroups.has(userId)) {
        userGroups.set(userId, []);
      }
      userGroups.get(userId)!.push(record);
    });

    // Identificar IDs dos registros a serem removidos (manter apenas o mais recente)
    const idsToRemove: string[] = [];
    
    userGroups.forEach(records => {
      if (records.length > 1) {
        // Ordenar por last_seen (mais recente primeiro)
        records.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());
        
        // Adicionar todos exceto o primeiro (mais recente) à lista de remoção
        records.slice(1).forEach(record => {
          idsToRemove.push(record.id);
        });
      }
    });

    if (idsToRemove.length === 0) {
      return { success: true, removedCount: 0 };
    }

    // Remover registros duplicados
    const { error: deleteError } = await supabase
      .from('user_presence')
      .delete()
      .in('id', idsToRemove);

    if (deleteError) {
      throw deleteError;
    }

    return { 
      success: true, 
      removedCount: idsToRemove.length 
    };

  } catch (error) {
    console.error('Erro ao limpar registros duplicados:', error);
    return { 
      success: false, 
      removedCount: 0, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Remove registros de presença muito antigos (offline há mais de 1 hora)
 */
export async function cleanupOldPresenceRecords(): Promise<{
  success: boolean;
  removedCount: number;
  error?: string;
}> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_presence')
      .delete()
      .eq('is_online', false)
      .lt('updated_at', oneHourAgo)
      .select('id');

    if (error) {
      throw error;
    }

    return {
      success: true,
      removedCount: data?.length || 0
    };

  } catch (error) {
    console.error('Erro ao limpar registros antigos:', error);
    return {
      success: false,
      removedCount: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Executa limpeza completa do sistema de presença
 */
export async function performFullPresenceCleanup(): Promise<{
  success: boolean;
  duplicatesRemoved: number;
  oldRecordsRemoved: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let duplicatesRemoved = 0;
  let oldRecordsRemoved = 0;

  // Limpar duplicatas
  const duplicateResult = await cleanupDuplicatePresenceRecords();
  if (duplicateResult.success) {
    duplicatesRemoved = duplicateResult.removedCount;
  } else {
    errors.push(`Erro ao limpar duplicatas: ${duplicateResult.error}`);
  }

  // Limpar registros antigos
  const oldRecordsResult = await cleanupOldPresenceRecords();
  if (oldRecordsResult.success) {
    oldRecordsRemoved = oldRecordsResult.removedCount;
  } else {
    errors.push(`Erro ao limpar registros antigos: ${oldRecordsResult.error}`);
  }

  return {
    success: errors.length === 0,
    duplicatesRemoved,
    oldRecordsRemoved,
    errors
  };
}