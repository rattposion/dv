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
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sessão encerrada",
        description: "Você saiu do sistema com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Não foi possível sair do sistema."
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <MobileMenu />
          <h1 className="text-xl font-semibold text-gray-800">
            Sistema de Gestão Industrial
          </h1>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <MacSearch />
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="relative text-gray-600 hover:text-gray-800 hover:bg-gray-100">
            <Bell className="h-4 w-4" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
              2
            </Badge>
          </Button>

          <Button variant="ghost" size="sm" className="hidden sm:flex text-gray-600 hover:text-gray-800 hover:bg-gray-100">
            <Settings className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="hidden lg:inline text-sm font-medium">{user?.email?.split('@')[0] || 'Usuário'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-gray-700">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-gray-600 hover:text-gray-800">Perfil</DropdownMenuItem>
              <DropdownMenuItem className="text-gray-600 hover:text-gray-800">Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:text-red-700">
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