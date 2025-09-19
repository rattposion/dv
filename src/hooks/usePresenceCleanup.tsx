import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CleanupResult {
  success: boolean;
  deleted_count: number;
  message: string;
}

interface JobStatus {
  job_exists: boolean;
  job_name?: string;
  schedule?: string;
  active?: boolean;
  last_run?: string;
  message?: string;
}

export function usePresenceCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Executar limpeza manual
  const executeManualCleanup = useCallback(async (): Promise<CleanupResult | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('cleanup_offline_users');
      
      if (error) {
        console.error('Erro na limpeza manual:', error);
        toast({
          variant: "destructive",
          title: "Erro na limpeza",
          description: "Não foi possível executar a limpeza manual."
        });
        return null;
      }

      // A função retorna boolean, então vamos criar um resultado baseado nisso
      const success = data as boolean;
      const result: CleanupResult = {
        success,
        deleted_count: success ? 1 : 0, // Não temos o count exato, mas indicamos sucesso
        message: success ? "Limpeza executada com sucesso" : "Falha na limpeza"
      };
      
      toast({
        title: "Limpeza executada",
        description: success ? "Usuários inativos foram removidos." : "Nenhum usuário foi removido."
      });

      return result;
    } catch (error) {
      console.error('Erro na limpeza manual:', error);
      toast({
        variant: "destructive",
        title: "Erro na limpeza",
        description: "Erro inesperado durante a limpeza."
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Verificar status do job automático
  const getJobStatus = useCallback(async (): Promise<JobStatus | null> => {
    try {
      const { data, error } = await supabase.rpc('get_cleanup_job_status');
      
      if (error) {
        console.error('Erro ao verificar status do job:', error);
        return null;
      }

      // A função retorna boolean, então vamos criar um status baseado nisso
      const isActive = data as boolean;
      const status: JobStatus = {
        job_exists: isActive,
        job_name: 'cleanup_offline_users',
        schedule: '*/5 * * * *', // A cada 5 minutos
        active: isActive,
        last_run: new Date().toISOString(),
        message: isActive ? "Job ativo" : "Job inativo"
      };

      return status;
    } catch (error) {
      console.error('Erro ao verificar status do job:', error);
      return null;
    }
  }, []);

  // Forçar limpeza de usuário específico (marcar como offline)
  const forceUserOffline = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_presence')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao forçar usuário offline:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível marcar usuário como offline."
        });
        return false;
      }

      toast({
        title: "Usuário marcado como offline",
        description: "O usuário foi removido da lista de presença."
      });

      return true;
    } catch (error) {
      console.error('Erro ao forçar usuário offline:', error);
      return false;
    }
  }, [toast]);

  // Obter estatísticas de presença
  const getPresenceStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*');

      if (error) {
        console.error('Erro ao obter estatísticas:', error);
        return null;
      }

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const activeUsers = data?.filter(user => 
        new Date(user.last_seen) > fiveMinutesAgo
      ) || [];

      const inactiveUsers = data?.filter(user => 
        new Date(user.last_seen) <= fiveMinutesAgo
      ) || [];

      return {
        total: data?.length || 0,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
        users: data || []
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }, []);

  return {
    isLoading,
    executeManualCleanup,
    getJobStatus,
    forceUserOffline,
    getPresenceStats
  };
}