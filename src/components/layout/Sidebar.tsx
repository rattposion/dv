import { 
  Users, 
  Wrench, 
  Package, 
  TruckIcon as Truck, 
  Factory, 
  BarChart3,
  Home,
  ChevronLeft,
  ChevronRight,
  Settings,
  PackageOpen,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Users, label: "Funcionários", path: "/funcionarios" },
  { icon: Wrench, label: "Equipamentos", path: "/equipamentos" },
  { icon: Package, label: "Inventário", path: "/inventario" },
  { icon: PackageOpen, label: "Recebimentos", path: "/recebimentos" },
  { icon: AlertTriangle, label: "Queimados/Defeitos", path: "/defeitos" },
  { icon: Truck, label: "Registrar Saída", path: "/saida" },
  { icon: Factory, label: "Produção", path: "/producao" },
  { icon: Settings, label: "Manutenções", path: "/manutencoes" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div 
      className={cn(
        "bg-card border-r border-border transition-all duration-300 h-full flex flex-col shadow-card",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-foreground">Sistema de Gestão</h2>
              <p className="text-sm text-muted-foreground">Produção Industrial</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant="ghost"
              asChild
              className={cn(
                "w-full justify-start transition-smooth",
                isCollapsed ? "px-2" : "px-3",
                isActive 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Link to={item.path}>
                <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            <p>Sistema v1.0</p>
            <p>Gestão Industrial</p>
          </div>
        )}
      </div>
    </div>
  );
}