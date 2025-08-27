import { Package, TruckIcon as Truck, RotateCcw, Activity, AlertTriangle, TrendingUp, Factory, Database, CheckCircle, Calendar, User, Settings, Wrench } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import industrialHeader from "@/assets/industrial-header.jpg";
import { useInventario } from "@/contexts/InventarioContext";
import { useHistorico } from "@/contexts/HistoricoContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";
import { useSupabaseDashboard } from "@/hooks/useSupabaseDashboard";
import { useSupabaseResets } from "@/hooks/useSupabaseResets";
import { useSupabaseCaixasInventario } from "@/hooks/useSupabaseCaixasInventario";

export function OverviewSection() {
  const { caixas } = useInventario();
  const { operacoes, getOperacoesPorTipo } = useHistorico();
  const { equipamentos } = useEquipamento();
  const { stats, loading } = useSupabaseDashboard();
  const { getTotalResets } = useSupabaseResets();
  const { caixas: caixasSupabase } = useSupabaseCaixasInventario();
  
  // Calcular total de equipamentos que saíram (usando dados locais por enquanto)
  const saidas = getOperacoesPorTipo('saida');
  const totalEquipamentosSaida = saidas.reduce((acc, saida) => acc + saida.quantidade, 0);
  
  // Calcular total de resets do Supabase
  const totalResets = getTotalResets();

  return (
    <div className="space-y-6">
      {/* Estatísticas principais com dados do Supabase */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatsCard
          title="Total Recebidos"
          value={loading ? "..." : stats.totalRecebidos.toString()}
          subtitle="Equipamentos recebidos total"
          icon={Database}
        />
        <StatsCard
          title="Estoque Disponível"
          value={loading ? "..." : stats.estoqueDisponivel.toString()}
          subtitle="Equipamentos em estoque"
          icon={Package}
        />
        <StatsCard
          title="Com Problemas"
          value={loading ? "..." : stats.equipamentosComProblemas.toString()}
          subtitle="Equipamentos defeituosos"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Recuperados"
          value={loading ? "..." : stats.equipamentosRecuperados.toString()}
          subtitle="Equipamentos recuperados"
          icon={Settings}
        />
        <StatsCard
          title="Equipamentos Cadastrados"
          value={loading ? "..." : equipamentos.length.toString()}
          subtitle="Total no sistema"
          icon={CheckCircle}
        />
      </div>

      {/* Cards de Estoque por Modelo */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque Recebido por Modelo
            </CardTitle>
            <CardDescription>
              Equipamentos recebidos disponíveis por modelo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.estoquesPorModelo).map(([modelo, quantidade]) => (
                  <div key={modelo} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{modelo}</span>
                    <Badge variant={quantidade > 0 ? "default" : "secondary"}>
                      {quantidade} unidades
                    </Badge>
                  </div>
                ))}
                {Object.keys(stats.estoquesPorModelo).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum modelo em estoque recebido
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque Disponível por Modelo
            </CardTitle>
            <CardDescription>
              Equipamentos disponíveis no inventário por modelo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.estoqueDisponivelPorModelo).map(([modelo, quantidade]) => (
                  <div key={modelo} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{modelo}</span>
                    <Badge variant={quantidade > 0 ? "default" : "secondary"}>
                      {quantidade} unidades
                    </Badge>
                  </div>
                ))}
                {Object.keys(stats.estoqueDisponivelPorModelo).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum modelo disponível no inventário
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo Total da Produção do Dia */}
      <Card className="bg-gradient-subtle border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Resumo Total da Produção - {new Date().toLocaleDateString('pt-BR')}
          </CardTitle>
          <CardDescription>
            Total produzido hoje por todos os funcionários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-8 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (stats.producaoDiaria.length > 0 || stats.recuperacoesDiarias.length > 0) ? (
            <div className="space-y-4">
              {/* Total por modelo - Produção */}
              {stats.producaoDiaria.length > 0 && (
                <div className="grid gap-3">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    Produção por Modelo:
                  </h4>
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
                    <div key={modelo} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <span className="font-medium">{modelo}</span>
                      <div className="flex gap-3 text-sm">
                        <Badge variant="outline">{totais.caixas} caixas</Badge>
                        <Badge variant="default">{totais.equipamentos} equipamentos</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total por modelo - Recuperação */}
              {stats.recuperacoesDiarias.length > 0 && (
                <div className="grid gap-3">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Recuperação por Modelo:
                  </h4>
                  {Object.entries(
                    stats.recuperacoesDiarias.reduce((acc, recuperacao) => {
                      if (!acc[recuperacao.modelo]) {
                        acc[recuperacao.modelo] = 0;
                      }
                      acc[recuperacao.modelo] += recuperacao.quantidade;
                      return acc;
                    }, {} as { [modelo: string]: number })
                  ).map(([modelo, quantidade]) => (
                    <div key={`recuperacao-${modelo}`} className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                      <span className="font-medium">{modelo}</span>
                      <Badge variant="secondary" className="bg-success/20 text-success-foreground">
                        {quantidade} recuperados
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Geral */}
              <div className="border-t pt-4 space-y-3">
                {stats.producaoDiaria.length > 0 && (
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <Factory className="h-4 w-4" />
                        Produção Total do Dia:
                      </h4>
                      <div className="flex gap-3">
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {stats.producaoDiaria.reduce((total, p) => total + p.quantidade_caixas, 0)} caixas
                        </Badge>
                        <Badge variant="default" className="text-lg px-3 py-1">
                          {stats.producaoDiaria.reduce((total, p) => total + p.quantidade_equipamentos, 0)} equipamentos
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {stats.recuperacoesDiarias.length > 0 && (
                  <div className="bg-success/10 rounded-lg p-4 border border-success/20">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-success flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Recuperação Total do Dia:
                      </h4>
                      <Badge variant="secondary" className="text-lg px-3 py-1 bg-success/20 text-success-foreground">
                        {stats.recuperacoesDiarias.reduce((total, r) => total + r.quantidade, 0)} equipamentos
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Factory className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>Nenhuma produção ou recuperação registrada hoje</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produção Diária por Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Produção Diária - {new Date().toLocaleDateString('pt-BR')}
          </CardTitle>
          <CardDescription>
            Produção e recuperação de cada colaborador no dia de hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : stats.producaoDiaria.length > 0 || stats.recuperacoesDiarias.length > 0 ? (
            <div className="space-y-4">
              {/* Combinar colaboradores de produção e recuperação */}
              {(() => {
                const colaboradores = new Set([
                  ...stats.producaoDiaria.map(p => p.colaborador),
                  ...stats.recuperacoesDiarias.map(r => r.colaborador)
                ]);

                return Array.from(colaboradores).map(colaborador => {
                  const producoes = stats.producaoDiaria.filter(p => p.colaborador === colaborador);
                  const recuperacoes = stats.recuperacoesDiarias.filter(r => r.colaborador === colaborador);
                  
                  const totalCaixas = producoes.reduce((total, p) => total + p.quantidade_caixas, 0);
                  const totalEquipamentos = producoes.reduce((total, p) => total + p.quantidade_equipamentos, 0);
                  const totalRecuperados = recuperacoes.reduce((total, r) => total + r.quantidade, 0);
                  
                  return (
                    <div key={colaborador} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-semibold capitalize">{colaborador}</span>
                        </div>
                        <div className="flex gap-2">
                          {producoes.length > 0 && (
                            <>
                              <Badge variant="outline">{totalCaixas} caixas</Badge>
                              <Badge variant="default">{totalEquipamentos} equipamentos</Badge>
                            </>
                          )}
                          {recuperacoes.length > 0 && (
                            <Badge variant="secondary" className="bg-success/20 text-success-foreground">
                              {totalRecuperados} recuperados
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Produção */}
                        {producoes.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Factory className="h-3 w-3" />
                              Produção:
                            </h5>
                            {producoes.map((producao, index) => (
                              <div key={index} className="flex items-center justify-between text-sm pl-4">
                                <span className="font-medium">{producao.modelo}</span>
                                <div className="flex gap-2 text-muted-foreground">
                                  <span>{producao.quantidade_caixas} caixa{producao.quantidade_caixas !== 1 ? 's' : ''}</span>
                                  <span>•</span>
                                  <span>{producao.quantidade_equipamentos} equipamentos</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Recuperação */}
                        {recuperacoes.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              Recuperação:
                            </h5>
                            {recuperacoes.map((recuperacao, index) => (
                              <div key={index} className="flex items-center justify-between text-sm pl-4">
                                <span className="font-medium">{recuperacao.modelo}</span>
                                <span className="text-success text-sm">{recuperacao.quantidade} equipamentos</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Factory className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Nenhuma produção registrada hoje</p>
              <p className="text-xs">A produção aparecerá aqui quando caixas forem criadas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions adicionais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{equipamentos.length}</span>
              <span className="text-sm text-muted-foreground">Equipamentos</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">{totalEquipamentosSaida}</span>
              <span className="text-sm text-muted-foreground">Saídas</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">{totalResets}</span>
              <span className="text-sm text-muted-foreground">Resets</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Factory className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">{caixasSupabase.length}</span>
              <span className="text-sm text-muted-foreground">Caixas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-modern group cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-smooth">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Eficiência</h3>
              <p className="text-sm text-muted-foreground">
                {stats.estoqueDisponivel > 0 ? "Com estoque" : "Estoque vazio"}
              </p>
            </div>
          </div>
        </div>

        <div className="card-modern group cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-warning/20 rounded-xl flex items-center justify-center group-hover:bg-warning/30 transition-smooth">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Alertas</h3>
              <p className="text-sm text-muted-foreground">
                {stats.equipamentosComProblemas} defeituosos
              </p>
            </div>
          </div>
        </div>

        <div className="card-modern group cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-success/20 rounded-xl flex items-center justify-center group-hover:bg-success/30 transition-smooth">
              <Activity className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Status</h3>
              <p className="text-sm text-muted-foreground">Sistema operacional</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
