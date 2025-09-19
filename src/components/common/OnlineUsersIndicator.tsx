import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineUsers } from '@/hooks/useUserPresence';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Users, Eye, Clock, MapPin, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { performFullPresenceCleanup } from '@/utils/presenceCleanup';

interface UserPresenceData {
  user_id: string;
  user_email: string;
  user_name: string;
  current_page: string;
  page_title: string;
  is_online: boolean;
  last_seen: string;
}

export const OnlineUsersIndicator: React.FC = () => {
  const { user } = useAuth();
  const { users: onlineUsers, isLoading, fetchOnlineUsers } = useOnlineUsers();
  const { toast } = useToast();
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Usar os dados diretamente do hook
  const presenceData = onlineUsers;

  // Função para formatar tempo relativo
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  // Função para limpar registros duplicados
  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true);
    try {
      const result = await performFullPresenceCleanup();
      
      if (result.success) {
        toast({
          title: "Limpeza concluída",
          description: `Removidos ${result.duplicatesRemoved} duplicatas e ${result.oldRecordsRemoved} registros antigos.`,
        });
        // Recarregar dados após limpeza
        fetchOnlineUsers();
      } else {
        toast({
          title: "Erro na limpeza",
          description: result.errors.join(', '),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na limpeza",
        description: "Erro inesperado ao limpar registros duplicados.",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Função para obter cor do badge baseado na página
  const getPageBadgeColor = (page: string) => {
    const pageColors: Record<string, string> = {
      'dashboard': 'bg-blue-100 text-blue-800',
      'equipamentos': 'bg-green-100 text-green-800',
      'funcionarios': 'bg-purple-100 text-purple-800',
      'manutencoes': 'bg-orange-100 text-orange-800',
      'defeitos': 'bg-red-100 text-red-800',
      'recebimentos': 'bg-cyan-100 text-cyan-800',
      'producao': 'bg-yellow-100 text-yellow-800',
      'rma': 'bg-pink-100 text-pink-800',
      'relatorios': 'bg-indigo-100 text-indigo-800',
      'inventario': 'bg-teal-100 text-teal-800',
      'saida': 'bg-gray-100 text-gray-800',
    };
    
    return pageColors[page.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (!user) return null;

  const onlineCount = onlineUsers.length;
  const currentUserData = presenceData.find(p => p.user_id === user.id);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative flex items-center gap-2 hover:bg-accent"
        >
          <div className="flex items-center gap-1">
            {onlineCount > 0 ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400" />
            )}
            <Users className="h-4 w-4" />
          </div>
          <Badge 
            variant={onlineCount > 0 ? "default" : "secondary"}
            className={`min-w-[20px] h-5 text-xs ${
              onlineCount > 0 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-400'
            }`}
          >
            {onlineCount}
          </Badge>
          {onlineCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários Online ({onlineCount})
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : presenceData.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhum usuário online no momento
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-1 p-2">
                  {presenceData.map((userData, index) => (
                    <div key={userData.user_id} className="space-y-2">
                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="relative">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {userData.user_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium truncate">
                              {userData.user_name || 'Usuário'}
                            </span>
                            {userData.user_id === user.id && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                Você
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground truncate mb-1">
                            {userData.user_email}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <Badge 
                              variant="secondary" 
                              className={`text-xs px-2 py-0 ${getPageBadgeColor(userData.current_page)}`}
                            >
                              {userData.page_title || userData.current_page}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(userData.last_seen)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {index < presenceData.length - 1 && (
                        <Separator className="mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            <div className="border-t p-3 bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>Atualização em tempo real</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchOnlineUsers}
                  disabled={isLoading}
                  className="h-6 px-2 text-xs"
                >
                  Atualizar
                </Button>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanupDuplicates}
                  disabled={isCleaningUp || isLoading}
                  className="h-6 px-2 text-xs flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  {isCleaningUp ? 'Limpando...' : 'Limpar Duplicatas'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};