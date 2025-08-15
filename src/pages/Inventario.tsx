import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Package, Wifi, CheckCircle, AlertTriangle, ArrowDownUp, Copy, User, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useInventario } from "@/contexts/InventarioContext";
import { useHistorico } from "@/contexts/HistoricoContext";
import { useToast } from "@/hooks/use-toast";
import { useInventarioEstoqueSync } from "@/hooks/useInventarioEstoqueSync";

export default function Inventario() {
  // Sincroniza inventário com estoque automaticamente
  useInventarioEstoqueSync();
  const [selectedCaixa, setSelectedCaixa] = useState<any>(null);
  const { toast } = useToast();
  const { caixas } = useInventario();

  // Função para gerar lista copiável de MACs sem dois pontos
  const generateMacList = (macs: string[]) => {
    return macs.map(mac => mac.replace(/:/g, '')).join(',');
  };

  const copyMacList = async (macs: string[]) => {
    const macList = generateMacList(macs);
    try {
      await navigator.clipboard.writeText(macList);
      toast({
        title: "Lista copiada",
        description: "Lista de MACs copiada para a área de transferência",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a lista",
        variant: "destructive",
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal": return "default";
      case "Alerta": return "secondary";
      case "Baixo": return "destructive";
      case "Crítico": return "destructive";
      default: return "outline";
    }
  };

  const getProgressValue = (quantidade: number, minimo: number) => {
    return Math.min((quantidade / (minimo * 2)) * 100, 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventário</h1>
            <p className="text-muted-foreground">Gestão de caixas de equipamentos</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar caixa..." className="pl-10" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {caixas.map((caixa) => (
            <Dialog key={caixa.id}>
              <DialogTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{caixa.id}</CardTitle>
                          <CardDescription>{caixa.equipamento}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={caixa.status === "Disponível" ? "default" : caixa.status === "Em Uso" ? "secondary" : "destructive"}>
                        {caixa.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{caixa.quantidade}</div>
                          <div className="text-xs text-muted-foreground">Equipamentos</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="text-sm font-medium truncate">{caixa.responsavel}</div>
                          <div className="text-xs text-muted-foreground">Responsável</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Equipamento:</div>
                        <div className="text-sm font-medium">{caixa.equipamento}</div>
                      </div>

                      <div className="p-2 bg-muted/20 rounded text-xs">
                        <div className="font-medium mb-1 text-muted-foreground">Clique para ver detalhes e MACs</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Detalhes da Caixa {caixa.id}
                  </DialogTitle>
                  <DialogDescription>
                    Informações completas sobre a caixa de equipamentos
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Informações básicas */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Equipamento</Label>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-medium">{caixa.equipamento}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <Badge variant={caixa.status === "Disponível" ? "default" : caixa.status === "Em Uso" ? "secondary" : "destructive"}>
                          {caixa.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Criador e quantidade */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Quem criou a caixa
                      </Label>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-medium">{caixa.responsavel}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Quantidade de equipamentos</Label>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-bold text-2xl">{caixa.quantidade}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de MACs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Lista de MACs (sem dois pontos)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyMacList(caixa.macs)}
                        className="h-8 gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar Lista
                      </Button>
                    </div>
                    
                    <div className="bg-background border rounded-lg p-4 font-mono text-sm select-all">
                      {generateMacList(caixa.macs)}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">MACs individuais:</Label>
                      <div className="grid gap-2 max-h-40 overflow-y-auto">
                        {caixa.macs.map((mac, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2">
                            <span className="text-sm font-mono">{mac}</span>
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}