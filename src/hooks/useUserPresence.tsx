import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

// Import the SUPABASE_URL constant
const SUPABASE_URL = "https://zteglnzyhthfhsqpmaey.supabase.co";

// Função para obter o título da página baseado na rota
const getPageTitle = (pathname: string): string => {
  const pageMap: Record<string, string> = {
    '/': 'Dashboard',
    '/funcionarios': 'Funcionários',
    '/equipamentos': 'Equipamentos',
    '/defeitos': 'Defeitos',
    '/manutencoes': 'Manutenções',
    '/recebimentos': 'Recebimentos',
    '/saida': 'Saída',
    '/rma': 'RMA',
    '/inventario': 'Inventário',
    '/producao': 'Produção',
    '/recuperacao': 'Recuperação',
    '/relatorios': 'Relatórios',
    '/status': 'Status',
    '/auth': 'Autenticação'
  };

  return pageMap[pathname] || 'Página Desconhecida';
};

interface UserPresenceData {
  user_id: string;
  user_email: string;
  user_name: string;
  current_page: string;
  page_title: string;
  is_online: boolean;
  last_seen: string;
}

export const useUserPresence = () => {
  const { user } = useAuth();
  const location = useLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');

  // Gerar session ID único para esta sessão/aba
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Função para atualizar presença do usuário
  const updatePresence = useCallback(async () => {
    if (!user) return;

    try {
      const pageTitle = getPageTitle(location.pathname);
      
      await supabase.rpc('upsert_user_presence', {
        _user_id: user.id,
        _user_email: user.email || '',
        _user_name: user.user_metadata?.full_name || user.email || 'Usuário',
        _current_page: location.pathname,
        _page_title: pageTitle,
        _session_id: sessionIdRef.current
      });
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
    }
  }, [user, location.pathname]);

  // Função para marcar usuário como offline
  const setOffline = useCallback(async () => {
    if (!user) return;

    try {
      await supabase.rpc('set_user_offline', {
        _user_id: user.id,
        _session_id: sessionIdRef.current
      });
    } catch (error) {
      console.error('Erro ao marcar como offline:', error);
    }
  }, [user]);

  // Configurar presença quando usuário está logado
  useEffect(() => {
    if (!user) {
      // Limpar interval se usuário não está logado
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Atualizar presença imediatamente
    updatePresence();

    // Configurar interval para atualizar presença a cada 30 segundos
    intervalRef.current = setInterval(updatePresence, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, updatePresence]);

  // Atualizar presença quando a rota muda
  useEffect(() => {
    if (user) {
      updatePresence();
    }
  }, [location.pathname, user, updatePresence]);

  // Configurar eventos para detectar quando o usuário sai da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        // Usar sendBeacon para garantir que a requisição seja enviada mesmo quando a página está fechando
        navigator.sendBeacon(
          `${SUPABASE_URL}/rest/v1/rpc/set_user_offline`,
          JSON.stringify({
            _user_id: user.id,
            _session_id: sessionIdRef.current
          })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página ficou oculta (usuário mudou de aba ou minimizou)
        setOffline();
      } else {
        // Página ficou visível novamente
        if (user) {
          updatePresence();
        }
      }
    };

    // Adicionar event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, setOffline, updatePresence]);

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (user) {
        setOffline();
      }
    };
  }, [user, setOffline]);

  return {
    updatePresence,
    setOffline,
    sessionId: sessionIdRef.current
  };
};

// Hook para obter lista de usuários online (apenas para admins)
export const useOnlineUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserPresenceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchOnlineUsers = useCallback(async (): Promise<UserPresenceData[]> => {
    if (!user) return [];

    setIsLoading(true);
    try {
      // Verificar se o usuário é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        setUsers([]);
        return [];
      }

      // Buscar usuários online
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('is_online', true)
        .order('last_seen', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários online:', error);
        setUsers([]);
        return [];
      }

      // Remover duplicatas baseado no user_id, mantendo o mais recente
      const uniqueUsers = data?.reduce((acc: UserPresenceData[], current) => {
        // Ensure all required properties are present with defaults
        const userPresenceData: UserPresenceData = {
          user_id: current.user_id,
          user_email: current.user_email,
          user_name: current.user_name,
          current_page: current.current_page,
          page_title: (current as any).page_title || getPageTitle(current.current_page),
          is_online: current.is_online,
          last_seen: current.last_seen
        };

        const existingUser = acc.find(user => user.user_id === current.user_id);
        if (!existingUser) {
          acc.push(userPresenceData);
        } else if (new Date(current.last_seen) > new Date(existingUser.last_seen)) {
          // Substituir pelo mais recente
          const index = acc.indexOf(existingUser);
          acc[index] = userPresenceData;
        }
        return acc;
      }, []) || [];
      
      setUsers(uniqueUsers);
      return uniqueUsers;
    } catch (error) {
      console.error('Erro ao verificar usuários online:', error);
      setUsers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Buscar usuários automaticamente quando o hook é inicializado
  useEffect(() => {
    fetchOnlineUsers();
  }, [fetchOnlineUsers]);

  // Subscription em tempo real para atualizações de presença
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('user_presence_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        () => {
          // Recarregar dados quando houver mudanças
          fetchOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchOnlineUsers]);

  return {
    users,
    isLoading,
    fetchOnlineUsers,
    length: users.length
  };
};