import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileDown, BarChart3, TrendingUp, Calendar, Filter, ArrowUp, ArrowDown, Package, User, MapPin, Clock, Wrench, AlertTriangle, Truck, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHistorico } from "@/contexts/HistoricoContext";
import { useInventario } from "@/contexts/InventarioContext";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";
import { useSupabaseDefeitosRecebimentos } from "@/hooks/useSupabaseDefeitosRecebimentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Relatorios() {
  const { operacoes, getOperacoesPorTipo } = useHistorico();
  const { caixas } = useInventario();
  const { funcionariosAprovados } = useFuncionario();
  const { equipamentos } = useEquipamento();
  const { 
    defeitos, 
    recebimentos, 
    loading: loadingData, 
    totalDefeitos, 
    totalRecebidos, 
    defeitosPorTipo, 
    recebimentosPorOrigem 
  } = useSupabaseDefeitosRecebimentos();
  
  const entradas = getOperacoesPorTipo('entrada');
  const saidas = getOperacoesPorTipo('saida');
  
  // Agrupar operações por usuário para a tabela de lançamentos
  const lancamentosPorUsuario = operacoes.reduce((acc, operacao) => {
    if (!acc[operacao.usuario]) {
      acc[operacao.usuario] = [];
    }
    acc[operacao.usuario].push(operacao);
    return acc;
  }, {} as Record<string, typeof operacoes>);

  const formatData = (data: Date) => {
    return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Histórico completo de operações, defeitos e recebimentos</p>
          </div>
          {loadingData && (
            <div className="text-sm text-muted-foreground">Carregando dados...</div>
          )}
        </div>

        {/* Resumo geral de operações */}
        <div className="grid gap-4 md:grid-cols-7">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Caixas no Inventário</CardTitle>
              <Package className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{caixas.length}</div>
              <p className="text-xs text-muted-foreground">caixas registradas</p>
            </CardContent>
          </Card>

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
        </div>

        {/* Navegação por abas */}
        <Tabs defaultValue="historico" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="usuarios">Lançamentos</TabsTrigger>
            <TabsTrigger value="defeitos">Defeitos</TabsTrigger>
            <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="saidas">Saídas</TabsTrigger>
          </TabsList>

          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Histórico Completo de Operações
                </CardTitle>
                <CardDescription>
                  Todas as operações de entrada e saída registradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Caixa</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operacoes.map((operacao) => (
                      <TableRow key={operacao.id}>
                        <TableCell>
                          <Badge 
                            variant={operacao.tipo === 'entrada' ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                          >
                            {operacao.tipo === 'entrada' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {operacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{operacao.usuario}</TableCell>
                        <TableCell>{operacao.caixaId}</TableCell>
                        <TableCell>{operacao.equipamento}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            {operacao.quantidade}
                          </div>
                        </TableCell>
                        <TableCell>
                          {operacao.destino ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {operacao.destino}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{formatData(operacao.data)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Lançamentos por Usuário
                </CardTitle>
                <CardDescription>
                  Resumo de todas as operações agrupadas por usuário responsável
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(lancamentosPorUsuario).map(([usuario, operacoesUsuario]) => {
                    const totalEntradas = operacoesUsuario.filter(op => op.tipo === 'entrada').length;
                    const totalSaidas = operacoesUsuario.filter(op => op.tipo === 'saida').length;
                    const totalQuantidade = operacoesUsuario.reduce((sum, op) => sum + op.quantidade, 0);
                    
                    return (
                      <div key={usuario} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{usuario}</h4>
                              <p className="text-sm text-muted-foreground">
                                {operacoesUsuario.length} operações realizadas
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="default" className="flex items-center gap-1">
                              <ArrowUp className="h-3 w-3" />
                              {totalEntradas} Entradas
                            </Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <ArrowDown className="h-3 w-3" />
                              {totalSaidas} Saídas
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {totalQuantidade} Total
                            </Badge>
                          </div>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Caixa</TableHead>
                              <TableHead>Equipamento</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>Destino</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Observação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {operacoesUsuario.map((operacao) => (
                              <TableRow key={operacao.id}>
                                <TableCell>
                                  <Badge 
                                    variant={operacao.tipo === 'entrada' ? 'default' : 'secondary'}
                                    className="flex items-center gap-1 w-fit"
                                  >
                                    {operacao.tipo === 'entrada' ? (
                                      <ArrowUp className="h-3 w-3" />
                                    ) : (
                                      <ArrowDown className="h-3 w-3" />
                                    )}
                                    {operacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{operacao.caixaId}</TableCell>
                                <TableCell>{operacao.equipamento}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Package className="h-3 w-3 text-muted-foreground" />
                                    {operacao.quantidade}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {operacao.destino ? (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-muted-foreground" />
                                      {operacao.destino}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">{formatData(operacao.data)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                  {operacao.observacao || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defeitos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Defeitos por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(defeitosPorTipo).map(([tipo, quantidade]) => (
                      <div key={tipo} className="flex justify-between items-center">
                        <span className="text-sm">{tipo}</span>
                        <Badge variant="destructive">{quantidade}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo de Defeitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total de Registros:</span>
                      <span className="font-bold">{defeitos.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de Equipamentos:</span>
                      <span className="font-bold text-destructive">{totalDefeitos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tipos Diferentes:</span>
                      <span className="font-bold">{Object.keys(defeitosPorTipo).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Detalhamento de Defeitos
                </CardTitle>
                <CardDescription>
                  Todos os defeitos registrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Tipo Defeito</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defeitos.map((defeito) => (
                      <TableRow key={defeito.id}>
                        <TableCell className="text-sm">
                          {format(new Date(defeito.data_registro), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{defeito.equipamento}</TableCell>
                        <TableCell>{defeito.modelo}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{defeito.tipo_defeito}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                            <span className="font-medium">{defeito.quantidade}</span>
                          </div>
                        </TableCell>
                        <TableCell>{defeito.responsavel}</TableCell>
                        <TableCell>{defeito.origem || '-'}</TableCell>
                        <TableCell>{defeito.destino || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {defeito.observacoes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recebimentos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    Recebimentos por Origem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(recebimentosPorOrigem).map(([origem, quantidade]) => (
                      <div key={origem} className="flex justify-between items-center">
                        <span className="text-sm">{origem}</span>
                        <Badge variant="outline">{quantidade}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo de Recebimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total de Notas:</span>
                      <span className="font-bold">{recebimentos.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de Equipamentos:</span>
                      <span className="font-bold text-green-600">{totalRecebidos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Origens Diferentes:</span>
                      <span className="font-bold">{Object.keys(recebimentosPorOrigem).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  Detalhamento de Recebimentos
                </CardTitle>
                <CardDescription>
                  Todos os recebimentos registrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recebimentos.map((recebimento) => (
                    <div key={recebimento.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Documento: {recebimento.numero_documento}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(recebimento.data_recebimento), "dd/MM/yyyy", { locale: ptBR })} - 
                            Origem: {recebimento.origem} - 
                            Responsável: {recebimento.responsavel_recebimento}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {recebimento.itens.reduce((sum, item) => sum + item.quantidade, 0)} itens
                        </Badge>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recebimento.itens.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.produto_nome}</TableCell>
                              <TableCell>{item.modelo}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3 text-green-600" />
                                  <span className="font-medium">{item.quantidade}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {item.observacoes || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {recebimento.observacoes && (
                        <div className="mt-3 p-2 bg-muted rounded text-sm">
                          <span className="font-medium">Observações: </span>
                          {recebimento.observacoes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entradas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5 text-success" />
                  Histórico de Entradas
                </CardTitle>
                <CardDescription>
                  Todas as entradas de equipamentos registradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário Responsável</TableHead>
                      <TableHead>Caixa</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entradas.map((entrada) => (
                      <TableRow key={entrada.id}>
                        <TableCell className="font-medium">{entrada.usuario}</TableCell>
                        <TableCell>{entrada.caixaId}</TableCell>
                        <TableCell>{entrada.equipamento}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-success" />
                            <span className="font-medium">{entrada.quantidade}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatData(entrada.data)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entrada.observacao || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saidas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-warning" />
                  Histórico de Saídas
                </CardTitle>
                <CardDescription>
                  Todas as saídas de equipamentos registradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário Responsável</TableHead>
                      <TableHead>Caixa</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saidas.map((saida) => (
                      <TableRow key={saida.id}>
                        <TableCell className="font-medium">{saida.usuario}</TableCell>
                        <TableCell>{saida.caixaId}</TableCell>
                        <TableCell>{saida.equipamento}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-warning" />
                            <span className="font-medium">{saida.quantidade}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {saida.destino}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatData(saida.data)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {saida.observacao || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resumo de Funcionários Aprovados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Funcionários Aprovados
            </CardTitle>
            <CardDescription>
              Lista de funcionários registrados e aprovados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {funcionariosAprovados.map((funcionario) => (
                <div key={funcionario.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{funcionario.nome}</h4>
                    <Badge 
                      variant={funcionario.status === "Ativo" ? "default" : 
                              funcionario.status === "Em Produção" ? "secondary" : "outline"}
                    >
                      {funcionario.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium">Função:</span> {funcionario.funcao}</p>
                    <p><span className="font-medium">Turno:</span> {funcionario.turno}</p>
                    <p><span className="font-medium">ID:</span> {funcionario.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equipamentos do Inventário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Equipamentos Registrados no Inventário
            </CardTitle>
            <CardDescription>
              Todos os equipamentos disponíveis no sistema de inventário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {caixas.map((caixa) => (
                <div key={caixa.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{caixa.equipamento}</h4>
                        <p className="text-sm text-muted-foreground">ID: {caixa.id}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={caixa.status === "Disponível" ? "default" : 
                              caixa.status === "Em Uso" ? "secondary" : "outline"}
                    >
                      {caixa.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Modelo:</span>
                      <p className="font-medium">{caixa.modelo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantidade:</span>
                      <p className="font-medium">{caixa.quantidade}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Responsável:</span>
                      <p className="font-medium">{caixa.responsavel}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">MACs:</span>
                      <p className="font-medium">{caixa.macs.length} endereços</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equipamentos Cadastrados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Equipamentos Cadastrados
            </CardTitle>
            <CardDescription>
              Todos os equipamentos cadastrados no sistema (separados do inventário)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {equipamentos.map((equipamento) => (
                <div key={equipamento.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{equipamento.nome}</h4>
                        <p className="text-sm text-muted-foreground">ID: {equipamento.id}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={equipamento.status === "Ativo" ? "default" : 
                              equipamento.status === "Em Operação" ? "secondary" : 
                              equipamento.status === "Manutenção" ? "destructive" : "outline"}
                    >
                      {equipamento.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Modelo:</span>
                      <p className="font-medium">{equipamento.modelo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nº Série:</span>
                      <p className="font-medium">{equipamento.numeroSerie}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Responsável:</span>
                      <p className="font-medium">{equipamento.responsavel}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Localização:</span>
                      <p className="font-medium">{equipamento.localizacao || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de lançamentos por usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Lançamentos por Usuário
            </CardTitle>
            <CardDescription>
              Resumo das operações realizadas por cada usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(lancamentosPorUsuario).map(([usuario, operacoesUsuario]) => (
                <div key={usuario} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{usuario}</h3>
                    <Badge variant="outline">
                      {operacoesUsuario.length} operações
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {operacoesUsuario.slice(0, 3).map((op) => (
                      <div key={op.id} className="text-sm bg-muted/30 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          {op.tipo === 'entrada' ? (
                            <ArrowUp className="h-3 w-3 text-success" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-warning" />
                          )}
                          <span className="font-medium">
                            {op.tipo === 'entrada' ? 'Criou' : 'Registrou saída da'} caixa {op.caixaId}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          Equipamento: {op.equipamento} • Quantidade: {op.quantidade}
                          {op.destino && ` • Destino: ${op.destino}`}
                          {' • '}{formatData(op.data)}
                        </p>
                      </div>
                    ))}
                    
                    {operacoesUsuario.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        + {operacoesUsuario.length - 3} operações anteriores
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}