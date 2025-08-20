import { Package, TruckIcon as Truck, RotateCcw, Activity, AlertTriangle, TrendingUp, Factory, Database, CheckCircle, Calendar, User, Clock, BarChart3 } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInventario } from "@/contexts/InventarioContext";
import { useHistorico } from "@/contexts/HistoricoContext";
import { useEstoque } from "@/contexts/EstoqueContext";
import { useReset } from "@/contexts/ResetContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";
import { useSupabaseDashboard } from "@/hooks/useSupabaseDashboard";

export function OverviewSection() {
  const { caixas } = useInventario();
  const { operacoes, getOperacoesPorTipo } = useHistorico();
  const { estoque } = useEstoque();
  const { getTotalResets } = useReset();
  const { equipamentos } = useEquipamento();
  const { stats, loading } = useSupabaseDashboard();
  
  // Calcular total de equipamentos disponíveis somando todos os modelos do estoque
  const equipamentosDisponiveis = estoque.reduce((acc, modelo) => acc + modelo.disponivel, 0);
  
  // Calcular total de equipamentos que saíram
  const saidas = getOperacoesPorTipo('saida');
  const totalEquipamentosSaida = saidas.reduce((acc, saida) => acc + saida.quantidade, 0);
  
  // Calcular total de resets
  const totalResets = getTotalResets();

  // Função para obter saudação baseada na hora
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="space-y-6">
      {/* Saudação e resumo do dia */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {getSaudacao()}, bem-vindo ao sistema!
          </h2>
        </div>
        <p className="text-gray-600">
          Hoje é {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}. Aqui está um resumo do que está acontecendo:
        </p>
      </div>

      {/* Estatísticas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Equipamentos Recebidos"
          value={loading ? "..." : stats.totalRecebidos.toString()}
          subtitle="Total no sistema"
          icon={Database}
        />
        <StatsCard
          title="Em Estoque"
          value={loading ? "..." : stats.estoqueDisponivel.toString()}
          subtitle="Disponíveis para uso"
          icon={Package}
        />
        <StatsCard
          title="Com Problemas"
          value={loading ? "..." : stats.equipamentosComProblemas.toString()}
          subtitle="Precisam de atenção"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Cadastrados"
          value={equipamentos.length.toString()}
          subtitle="No sistema"
          icon={CheckCircle}
        />
      </div>

      {/* Resumo do estoque */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-natural">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Estoque por Modelo
            </CardTitle>
            <CardDescription>
              Equipamentos disponíveis para uso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted/30 animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.estoquesPorModelo).map(([modelo, quantidade]) => (
                  <div key={modelo} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                    <span className="font-medium text-gray-700">{modelo}</span>
                    <Badge variant={quantidade > 0 ? "default" : "secondary"} className="text-sm">
                      {quantidade} {quantidade === 1 ? 'unidade' : 'unidades'}
                    </Badge>
                  </div>
                ))}
                {Object.keys(stats.estoquesPorModelo).length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum equipamento em estoque no momento</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-natural">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Equipamentos com Problemas
            </CardTitle>
            <CardDescription>
              Categorias de defeitos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted/30 animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.defeitosPorTipo).map(([tipo, quantidade]) => (
                  <div key={tipo} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="font-medium text-gray-700 capitalize">
                      {tipo.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="destructive" className="text-sm">
                      {quantidade} {quantidade === 1 ? 'unidade' : 'unidades'}
                    </Badge>
                  </div>
                ))}
                {Object.keys(stats.defeitosPorTipo).length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-300" />
                    <p>Nenhum problema registrado</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produção de hoje */}
      <Card className="card-natural">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Factory className="h-5 w-5" />
            Produção de Hoje
          </CardTitle>
          <CardDescription>
            Resumo da produção do dia {new Date().toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 animate-pulse rounded" />
              ))}
            </div>
          ) : stats.producaoDiaria.length > 0 ? (
            <div className="space-y-4">
              {/* Total por modelo */}
              <div className="grid gap-3">
                <h4 className="font-medium text-gray-700">Total produzido por modelo:</h4>
                {Object.entries(
                  stats.producaoDiaria.reduce((acc, producao) => {
                    if (!acc[producao.modelo]) {
                      acc[producao.modelo] = {
                        caixas: 0,
                        equipamentos: 0
                      };
                    }
                    acc[producao.modelo].caixas += producao.quantidade_caixas;
                    acc[producao.modelo].equipamentos += producao.quantidade_equipamentos;
                    return acc;
                  }, {} as { [modelo: string]: { caixas: number; equipamentos: number } })
                ).map(([modelo, totais]) => (
                  <div key={modelo} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                    <span className="font-medium text-gray-700">{modelo}</span>
                    <div className="flex gap-3 text-sm">
                      <Badge variant="outline">{totais.caixas} caixas</Badge>
                      <Badge variant="default">{totais.equipamentos} equipamentos</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Geral */}
              <div className="border-t pt-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-blue-800">Total do dia:</h4>
                    <div className="flex gap-3">
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {stats.producaoDiaria.reduce((total, p) => total + p.quantidade_caixas, 0)} caixas
                      </Badge>
                      <Badge variant="default" className="text-base px-3 py-1">
                        {stats.producaoDiaria.reduce((total, p) => total + p.quantidade_equipamentos, 0)} equipamentos
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma produção registrada hoje</p>
              <p className="text-sm mt-1">Os dados aparecerão aqui quando houver produção</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produção por colaborador */}
      <Card className="card-natural">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Produção por Colaborador
          </CardTitle>
          <CardDescription>
            Como cada pessoa contribuiu hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 animate-pulse rounded" />
              ))}
            </div>
          ) : stats.producaoDiaria.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(
                stats.producaoDiaria.reduce((acc, producao) => {
                  if (!acc[producao.colaborador]) {
                    acc[producao.colaborador] = [];
                  }
                  acc[producao.colaborador].push(producao);
                  return acc;
                }, {} as { [colaborador: string]: typeof stats.producaoDiaria })
              ).map(([colaborador, producoes]) => {
                const totalCaixas = producoes.reduce((total, p) => total + p.quantidade_caixas, 0);
                const totalEquipamentos = producoes.reduce((total, p) => total + p.quantidade_equipamentos, 0);
                
                return (
                  <div key={colaborador} className="border rounded-lg p-4 bg-muted/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-700 capitalize">{colaborador}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{totalCaixas} caixas</Badge>
                        <Badge variant="default">{totalEquipamentos} equipamentos</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {producoes.map((producao, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-gray-600">
                          <span className="font-medium">{producao.modelo}</span>
                          <div className="flex gap-2">
                            <span>{producao.quantidade_caixas} caixa{producao.quantidade_caixas !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>{producao.quantidade_equipamentos} equipamentos</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma produção registrada hoje</p>
              <p className="text-sm mt-1">Os dados aparecerão aqui quando houver produção</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo rápido */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-natural">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{equipamentos.length}</p>
                <p className="text-xs text-gray-500">Equipamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-natural">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{totalEquipamentosSaida}</p>
                <p className="text-xs text-gray-500">Saídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-natural">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{totalResets}</p>
                <p className="text-xs text-gray-500">Resets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-natural">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{caixas.length}</p>
                <p className="text-xs text-gray-500">Caixas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}