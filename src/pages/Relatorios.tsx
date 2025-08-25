import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileDown, BarChart3, TrendingUp, Calendar, Filter, ArrowUp, ArrowDown, Package, User, MapPin, Clock, Wrench, AlertTriangle, Truck, FileText, Save, Trash2, Download, Eye, Paperclip, ExternalLink, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useHistorico } from "@/contexts/HistoricoContext";
import { useInventario } from "@/contexts/InventarioContext";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";
import { useSupabaseDefeitosRecebimentos } from "@/hooks/useSupabaseDefeitosRecebimentos";
import { useSupabaseRelatorios } from "@/hooks/useSupabaseRelatorios";
import { useSupabaseProducao } from "@/hooks/useSupabaseProducao";
import { useSupabaseGarantias } from "@/hooks/useSupabaseGarantias";
import { useSupabaseCaixasInventario } from "@/hooks/useSupabaseCaixasInventario";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Relatorios() {
  const { operacoes, getOperacoesPorTipo } = useHistorico();
  const { caixas } = useInventario();
  const { funcionariosAprovados } = useFuncionario();
  const { equipamentos } = useEquipamento();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    defeitos, 
    recebimentos, 
    loading: loadingData, 
    totalDefeitos, 
    totalRecebidos, 
    defeitosPorTipo, 
    recebimentosPorOrigem 
  } = useSupabaseDefeitosRecebimentos();

  const { relatorios, createRelatorio, deleteRelatorio, loading: loadingRelatorios } = useSupabaseRelatorios();
  const { loading: loadingProducao } = useSupabaseProducao();
  const { garantias, loading: loadingGarantias } = useSupabaseGarantias();
  const { caixas: caixasInventario, loading: loadingInventario } = useSupabaseCaixasInventario();

  // Estados para buscar dados de produção e estoque
  const [producoesDiarias, setProducoesDiarias] = useState<any[]>([]);
  const [estoqueRecebimento, setEstoqueRecebimento] = useState<any[]>([]);

  // Estados para geração de relatórios
  const [novoRelatorio, setNovoRelatorio] = useState({
    titulo: "",
    tipo: "",
    periodo_inicio: "",
    periodo_fim: "",
    observacoes: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRelatorio, setSelectedRelatorio] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Buscar dados de produção usando useEffect
  useEffect(() => {
    const fetchProducoes = async () => {
      try {
        const { data, error } = await supabase
          .from('producao_diaria')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setProducoesDiarias(data || []);
      } catch (error) {
        console.error('Erro ao buscar produções:', error);
      }
    };
    
    const fetchEstoque = async () => {
      try {
        const { data, error } = await supabase
          .from('estoque_recebimento')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setEstoqueRecebimento(data || []);
      } catch (error) {
        console.error('Erro ao buscar estoque:', error);
      }
    };
    
    fetchProducoes();
    fetchEstoque();
  }, []);
  
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

  const formatData = (data: Date | string) => {
    const dateObj = typeof data === 'string' ? new Date(data) : data;
    return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Função para gerar dados completos do relatório
  const gerarDadosRelatorio = (tipo: string, periodoInicio?: string, periodoFim?: string) => {
    const agora = new Date();
    
    let dadosFiltrados: any = {};

    // Filtrar dados por período se especificado
    const filtrarPorPeriodo = (items: any[], dataField: string = 'created_at') => {
      if (!periodoInicio && !periodoFim) return items;
      
      return items.filter(item => {
        const itemDate = new Date(item[dataField]);
        const inicio = periodoInicio ? new Date(periodoInicio) : new Date('1900-01-01');
        const fim = periodoFim ? new Date(periodoFim) : agora;
        
        return itemDate >= inicio && itemDate <= fim;
      });
    };

    switch (tipo) {
      case 'completo':
        dadosFiltrados = {
          resumo: {
            totalOperacoes: operacoes.length,
            totalEntradas: entradas.length,
            totalSaidas: saidas.length,
            totalCaixas: caixas.length,
            totalEquipamentos: equipamentos.length,
            totalDefeitos,
            totalRecebidos,
            totalFuncionarios: funcionariosAprovados.length,
            totalProducoes: producoesDiarias?.length || 0
          },
          operacoes: filtrarPorPeriodo(operacoes, 'data'),
          defeitos: filtrarPorPeriodo(defeitos),
          recebimentos: filtrarPorPeriodo(recebimentos),
          equipamentos: equipamentos,
          funcionarios: funcionariosAprovados,
          caixas: caixas,
          producoes: filtrarPorPeriodo(producoesDiarias || [], 'data_producao'),
          defeitosPorTipo,
          recebimentosPorOrigem,
          lancamentosPorUsuario
        };
        break;
      
      case 'defeitos':
        dadosFiltrados = {
          defeitos: filtrarPorPeriodo(defeitos),
          totalDefeitos,
          defeitosPorTipo,
          resumo: {
            totalRegistros: defeitos.length,
            tiposMaisComuns: Object.entries(defeitosPorTipo)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
          }
        };
        break;
      
      case 'producao':
        dadosFiltrados = {
          producoes: filtrarPorPeriodo(producoesDiarias || [], 'data_producao'),
          operacoesProducao: filtrarPorPeriodo(operacoes.filter(op => op.tipo === 'entrada'), 'data'),
          resumo: {
            totalProducoes: producoesDiarias?.length || 0,
            totalCaixasProduzidas: caixas.length,
            equipamentosMaisProduzidos: caixas.reduce((acc, caixa) => {
              acc[caixa.equipamento] = (acc[caixa.equipamento] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          }
        };
        break;
      
      case 'recebimentos':
        dadosFiltrados = {
          recebimentos: filtrarPorPeriodo(recebimentos),
          totalRecebidos,
          recebimentosPorOrigem,
          resumo: {
            totalDocumentos: recebimentos.length,
            origemMaisComum: Object.entries(recebimentosPorOrigem)
              .sort(([,a], [,b]) => b - a)[0]
          }
        };
        break;
      
      case 'garantias':
        const garantiasAtivas = garantias.filter(g => g.status === 'Ativa');
        const garantiasProximoVenc = garantias.filter(g => g.status === 'Próximo ao Vencimento');
        const garantiasExpiradas = garantias.filter(g => g.status === 'Expirada');
        
        dadosFiltrados = {
          garantias: filtrarPorPeriodo(garantias),
          garantiasAtivas,
          garantiasProximoVenc,
          garantiasExpiradas,
          resumo: {
            totalGarantias: garantias.length,
            ativas: garantiasAtivas.length,
            proximoVencimento: garantiasProximoVenc.length,
            expiradas: garantiasExpiradas.length,
            equipamentosMaisFrequentes: garantias.reduce((acc, garantia) => {
              acc[garantia.equipamento_nome] = (acc[garantia.equipamento_nome] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          }
        };
        break;
      
      case 'itens_faltantes':
        // Calcular itens faltantes comparando estoque com demanda
        const itensFaltantes = estoqueRecebimento.filter(item => item.quantidade_disponivel <= item.quantidade_minima || item.quantidade_disponivel === 0);
        const itensEstoqueBaixo = estoqueRecebimento.filter(item => item.quantidade_disponivel > 0 && item.quantidade_disponivel <= (item.quantidade_minima * 1.5));
        
        dadosFiltrados = {
          itensFaltantes,
          itensEstoqueBaixo,
          estoqueCompleto: estoqueRecebimento,
          caixasInventario: caixasInventario,
          resumo: {
            totalItens: estoqueRecebimento.length,
            itensFaltando: itensFaltantes.length,
            itensEstoqueBaixo: itensEstoqueBaixo.length,
            totalCaixasInventario: caixasInventario.length,
            modelosMaisCriticos: itensFaltantes.slice(0, 5).map(item => ({
              modelo: item.modelo,
              faltando: Math.max(0, item.quantidade_minima - item.quantidade_disponivel)
            }))
          }
        };
        break;
    }

    return dadosFiltrados;
  };

  // Função para salvar relatório
  const handleSalvarRelatorio = async () => {
    if (!novoRelatorio.titulo || !novoRelatorio.tipo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e tipo do relatório",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não identificado",
        variant: "destructive"
      });
      return;
    }

    try {
      const dadosRelatorio = gerarDadosRelatorio(
        novoRelatorio.tipo, 
        novoRelatorio.periodo_inicio, 
        novoRelatorio.periodo_fim
      );

      const relatorioCompleto = {
        titulo: novoRelatorio.titulo,
        tipo: novoRelatorio.tipo,
        periodo_inicio: novoRelatorio.periodo_inicio || null,
        periodo_fim: novoRelatorio.periodo_fim || null,
        dados: {
          ...dadosRelatorio,
          observacoes: novoRelatorio.observacoes,
          geradoEm: new Date().toISOString(),
          parametros: {
            periodo: {
              inicio: novoRelatorio.periodo_inicio,
              fim: novoRelatorio.periodo_fim
            }
          }
        },
        gerado_por: user.id
      };

      await createRelatorio(relatorioCompleto);

      toast({
        title: "Relatório salvo",
        description: "Relatório gerado e salvo com sucesso"
      });

      // Limpar formulário
      setNovoRelatorio({
        titulo: "",
        tipo: "",
        periodo_inicio: "",
        periodo_fim: "",
        observacoes: ""
      });
      setIsDialogOpen(false);

    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
    }
  };

  // Função para exportar dados como JSON
  const exportarRelatorio = (relatorio: any) => {
    const dadosExport = {
      ...relatorio,
      exportadoEm: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dadosExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${relatorio.tipo}_${format(new Date(relatorio.created_at), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Relatório exportado",
      description: "Arquivo JSON baixado com sucesso"
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Histórico completo e geração de relatórios do sistema</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Gerar Relatório
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Gerar Novo Relatório</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Título do Relatório *</Label>
                      <Input
                        value={novoRelatorio.titulo}
                        onChange={(e) => setNovoRelatorio(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Ex: Relatório Mensal de Defeitos"
                      />
                    </div>
                    
                    <div>
                      <Label>Tipo de Relatório *</Label>
                      <Select
                        value={novoRelatorio.tipo}
                        onValueChange={(value) => setNovoRelatorio(prev => ({ ...prev, tipo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completo">Relatório Completo</SelectItem>
                          <SelectItem value="defeitos">Relatório de Defeitos</SelectItem>
                          <SelectItem value="producao">Relatório de Produção</SelectItem>
                          <SelectItem value="recebimentos">Relatório de Recebimentos</SelectItem>
                          <SelectItem value="movimentacoes">Relatório de Movimentações</SelectItem>
                          <SelectItem value="garantias">Relatório de Garantias</SelectItem>
                          <SelectItem value="itens_faltantes">Itens Faltantes no Estoque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Período - Início</Label>
                      <Input
                        type="date"
                        value={novoRelatorio.periodo_inicio}
                        onChange={(e) => setNovoRelatorio(prev => ({ ...prev, periodo_inicio: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Período - Fim</Label>
                      <Input
                        type="date"
                        value={novoRelatorio.periodo_fim}
                        onChange={(e) => setNovoRelatorio(prev => ({ ...prev, periodo_fim: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={novoRelatorio.observacoes}
                      onChange={(e) => setNovoRelatorio(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Observações sobre este relatório..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSalvarRelatorio}>
                      <Save className="h-4 w-4 mr-2" />
                      Gerar e Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {loadingData && (
              <div className="text-sm text-muted-foreground">Carregando dados...</div>
            )}
          </div>
        </div>

        {/* Resumo geral de operações */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

        {/* Navegação por abas */}
        <Tabs defaultValue="salvos" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
            <TabsTrigger value="salvos">Relatórios Salvos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="usuarios">Lançamentos</TabsTrigger>
            <TabsTrigger value="defeitos">Defeitos</TabsTrigger>
            <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="saidas">Saídas</TabsTrigger>
            <TabsTrigger value="garantias">Garantias</TabsTrigger>
            <TabsTrigger value="faltantes">Itens Faltantes</TabsTrigger>
          </TabsList>

          <TabsContent value="salvos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatórios Salvos
                </CardTitle>
                <CardDescription>
                  Relatórios gerados e armazenados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRelatorios ? (
                  <div className="text-center py-8">Carregando relatórios...</div>
                ) : relatorios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum relatório salvo ainda. Clique em "Gerar Relatório" para criar o primeiro.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {relatorios.map((relatorio) => (
                      <div key={relatorio.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{relatorio.titulo}</h3>
                              <Badge variant="outline">{relatorio.tipo}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Gerado em: {formatData(relatorio.created_at)}
                            </p>
                            {relatorio.periodo_inicio && relatorio.periodo_fim && (
                              <p className="text-sm text-muted-foreground">
                                Período: {format(new Date(relatorio.periodo_inicio), 'dd/MM/yyyy')} até {format(new Date(relatorio.periodo_fim), 'dd/MM/yyyy')}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRelatorio(relatorio);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportarRelatorio(relatorio)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja deletar este relatório?')) {
                                  deleteRelatorio(relatorio.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                      <TableHead>Anexos</TableHead>
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
                        <TableCell>
                          {saida.anexos && saida.anexos.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                    {saida.anexos.length} arquivo{saida.anexos.length > 1 ? 's' : ''}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Anexos da Saída</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-2">
                                    {saida.anexos.map((anexoId: string, index: number) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4" />
                                          <span className="text-sm">Arquivo {index + 1}</span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const { data } = supabase.storage
                                              .from('rma-anexos')
                                              .getPublicUrl(anexoId);
                                            window.open(data.publicUrl, '_blank');
                                          }}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="garantias" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Garantias por Status
                  </CardTitle>
                  <CardDescription>
                    Distribuição das garantias por situação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                      <span className="font-medium text-success">Ativas</span>
                      <Badge variant="default" className="bg-success text-white">
                        {garantias.filter(g => g.status === 'Ativa').length} garantias
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <span className="font-medium text-warning">Próximo ao Vencimento</span>
                      <Badge variant="secondary" className="bg-warning text-white">
                        {garantias.filter(g => g.status === 'Próximo ao Vencimento').length} garantias
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <span className="font-medium text-destructive">Expiradas</span>
                      <Badge variant="destructive">
                        {garantias.filter(g => g.status === 'Expirada').length} garantias
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximos Vencimentos
                  </CardTitle>
                  <CardDescription>
                    Garantias que vencem nos próximos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {garantias.filter(g => g.status === 'Próximo ao Vencimento').slice(0, 5).map((garantia) => (
                      <div key={garantia.id} className="p-2 bg-muted/30 rounded border border-warning/30">
                        <div className="font-medium text-sm">{garantia.equipamento_nome}</div>
                        <div className="text-xs text-muted-foreground">
                          Vence em: {format(new Date(garantia.garantia_expira), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    ))}
                    {garantias.filter(g => g.status === 'Próximo ao Vencimento').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma garantia próxima ao vencimento
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Equipamentos Mais Frequentes
                  </CardTitle>
                  <CardDescription>
                    Equipamentos com mais registros de garantia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      garantias.reduce((acc, garantia) => {
                        acc[garantia.equipamento_nome] = (acc[garantia.equipamento_nome] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort(([,a], [,b]) => b - a).slice(0, 5).map(([equipamento, count]) => (
                      <div key={equipamento} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <span className="text-sm font-medium">{equipamento}</span>
                        <Badge variant="outline">{count} registros</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Todas as Garantias
                </CardTitle>
                <CardDescription>
                  Lista completa de garantias registradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº OS</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Data Serviço</TableHead>
                      <TableHead>Garantia Expira</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {garantias.map((garantia) => (
                      <TableRow key={garantia.id}>
                        <TableCell className="font-medium">{garantia.numero_os}</TableCell>
                        <TableCell>{garantia.equipamento_nome}</TableCell>
                        <TableCell className="text-sm">{garantia.servico_realizado}</TableCell>
                        <TableCell className="text-sm">{format(new Date(garantia.data_servico), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-sm">{format(new Date(garantia.garantia_expira), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={
                            garantia.status === 'Ativa' ? 'default' :
                            garantia.status === 'Próximo ao Vencimento' ? 'secondary' :
                            'destructive'
                          }>
                            {garantia.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faltantes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Itens em Falta
                  </CardTitle>
                  <CardDescription>
                    Modelos com estoque zerado ou abaixo do mínimo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {estoqueRecebimento.filter(item => item.quantidade_disponivel <= item.quantidade_minima).map((item) => (
                      <div key={item.id} className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{item.modelo}</div>
                            <div className="text-sm text-muted-foreground">
                              Disponível: {item.quantidade_disponivel} | Mínimo: {item.quantidade_minima}
                            </div>
                          </div>
                          <Badge variant="destructive">
                            {item.quantidade_disponivel === 0 ? 'Zerado' : 'Baixo'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {estoqueRecebimento.filter(item => item.quantidade_disponivel <= item.quantidade_minima).length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                        <p>Todos os itens estão com estoque adequado</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Inventário vs Estoque
                  </CardTitle>
                  <CardDescription>
                    Comparativo entre caixas no inventário e estoque de recebimento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{caixasInventario.length}</div>
                        <div className="text-sm text-muted-foreground">Caixas no Inventário</div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-info">
                          {caixasInventario.reduce((total, caixa) => total + caixa.quantidade, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total de Equipamentos</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Modelos por Quantidade:</h4>
                      {Object.entries(
                        caixasInventario.reduce((acc, caixa) => {
                          acc[caixa.modelo] = (acc[caixa.modelo] || 0) + caixa.quantidade;
                          return acc;
                        }, {} as Record<string, number>)
                      ).sort(([,a], [,b]) => b - a).map(([modelo, quantidade]) => (
                        <div key={modelo} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm font-medium">{modelo}</span>
                          <Badge variant="outline">{quantidade} equipamentos</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Análise de Demanda
                </CardTitle>
                <CardDescription>
                  Sugestões para reposição de estoque baseado em movimentação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {estoqueRecebimento.map((item) => {
                    const movimentacaoModelo = operacoes.filter(op => op.modelo === item.modelo).length;
                    const criticidade = item.quantidade_disponivel <= item.quantidade_minima ? 'alta' : 
                                      item.quantidade_disponivel <= (item.quantidade_minima * 1.5) ? 'média' : 'baixa';
                    
                    return (
                      <div key={item.id} className={`p-3 rounded-lg border ${
                        criticidade === 'alta' ? 'bg-destructive/10 border-destructive/20' :
                        criticidade === 'média' ? 'bg-warning/10 border-warning/20' :
                        'bg-muted/30 border-border'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{item.modelo}</div>
                            <div className="text-sm text-muted-foreground">
                              Movimentação: {movimentacaoModelo} operações
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {item.quantidade_disponivel} / {item.quantidade_minima}
                            </div>
                            <Badge variant={
                              criticidade === 'alta' ? 'destructive' :
                              criticidade === 'média' ? 'secondary' :
                              'outline'
                            }>
                              {criticidade === 'alta' ? 'Crítico' :
                               criticidade === 'média' ? 'Atenção' :
                               'Normal'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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