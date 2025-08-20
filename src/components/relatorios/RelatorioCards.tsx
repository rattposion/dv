import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Package, User, Wrench, AlertTriangle, Truck, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface RelatorioCardsProps {
  filtroAtual: {
    titulo: string;
    dataInicio: Date;
    dataFim: Date;
  };
  entradas: any[];
  saidas: any[];
  lancamentosPorUsuario: Record<string, any[]>;
  caixasInventario: any[];
  equipamentos: any[];
  totalDefeitos: number;
  totalRecebidos: number;
  garantias: any[];
  estoqueRecebimento: any[];
  loadingGarantias: boolean;
  loadingInventario: boolean;
}

export const RelatorioCards = ({
  filtroAtual,
  entradas,
  saidas,
  lancamentosPorUsuario,
  caixasInventario,
  equipamentos,
  totalDefeitos,
  totalRecebidos,
  garantias,
  estoqueRecebimento,
  loadingGarantias,
  loadingInventario
}: RelatorioCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {/* Card do Período Ativo */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Período Ativo</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="font-semibold text-primary">{filtroAtual.titulo}</div>
          <p className="text-xs text-muted-foreground">
            {format(filtroAtual.dataInicio, 'dd/MM')} - {format(filtroAtual.dataFim, 'dd/MM/yyyy')}
          </p>
        </CardContent>
      </Card>
      
      {/* Card de Entradas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
          <ArrowUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{entradas.length}</div>
          <p className="text-xs text-muted-foreground">operações registradas</p>
        </CardContent>
      </Card>

      {/* Card de Saídas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
          <ArrowDown className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{saidas.length}</div>
          <p className="text-xs text-muted-foreground">operações registradas</p>
        </CardContent>
      </Card>

      {/* Card de Usuários Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
          <User className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{Object.keys(lancamentosPorUsuario).length}</div>
          <p className="text-xs text-muted-foreground">usuários com operações</p>
        </CardContent>
      </Card>

      {/* Card de Caixas no Inventário */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Caixas no Inventário</CardTitle>
          <Package className="h-4 w-4 text-info" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-info">
            {loadingInventario ? "..." : caixasInventario.length}
          </div>
          <p className="text-xs text-muted-foreground">caixas registradas</p>
        </CardContent>
      </Card>

      {/* Card de Equipamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Equipamentos Cadastrados</CardTitle>
          <Wrench className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{equipamentos.length}</div>
          <p className="text-xs text-muted-foreground">equipamentos no sistema</p>
        </CardContent>
      </Card>

      {/* Card de Defeitos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Defeitos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{totalDefeitos}</div>
          <p className="text-xs text-muted-foreground">equipamentos com defeito</p>
        </CardContent>
      </Card>

      {/* Card de Recebimentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Recebidos</CardTitle>
          <Truck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{totalRecebidos}</div>
          <p className="text-xs text-muted-foreground">equipamentos recebidos</p>
        </CardContent>
      </Card>

      {/* Card de Garantias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Garantias Ativas</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {loadingGarantias ? "..." : garantias.filter(g => g.status === 'Ativa').length}
          </div>
          <p className="text-xs text-muted-foreground">equipamentos cobertos</p>
        </CardContent>
      </Card>

      {/* Card de Itens Faltantes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Itens Faltantes</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {estoqueRecebimento.filter(item => item.quantidade_disponivel <= item.quantidade_minima).length}
          </div>
          <p className="text-xs text-muted-foreground">modelos em falta</p>
        </CardContent>
      </Card>
    </div>
  );
};