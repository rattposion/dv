import { 
  Users, 
  Wrench, 
  Package, 
  TruckIcon as Truck, 
  Factory, 
  BarChart3,
  Home,
  Settings,
  PackageOpen,
  AlertTriangle,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="sm:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left">
              <div>
                <h2 className="text-lg font-bold text-foreground">Sistema de Gestão</h2>
                <p className="text-sm text-muted-foreground">Produção Industrial</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          
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
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Link to={item.path}>
                    <Icon className="h-5 w-5 mr-3" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <p>Sistema v1.0</p>
              <p>Gestão Industrial</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}