import { Bell, Search, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { MacSearch } from "./MacSearch";

export function Header() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: "Ocorreu um erro ao sair da conta."
      });
    }
  };

  return (
    <header className="glass-card border-b border-border/50 px-6 py-4 shadow-card backdrop-blur-xl">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gradient-primary glow-primary">
            Dashboard Principal
          </h1>
        </div>

        {/* Center section - MAC Search */}
        <div className="flex-1 max-w-md mx-8">
          <MacSearch />
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative hover:bg-primary/10 transition-smooth">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm" className="hover:bg-primary/10 transition-smooth">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-primary/10 transition-smooth">
                <User className="h-5 w-5" />
                <span className="hidden md:inline">{user?.email?.split('@')[0] || 'Usuário'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card border-border/50">
              <DropdownMenuLabel className="text-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}