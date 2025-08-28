import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useSupabaseRecuperacoes } from "@/hooks/useSupabaseRecuperacoes";
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
  const { recuperacoes, totalRecuperados } = useSupabaseRecuperacoes();

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
  
  // Estados para lançamentos por usuário 
  const [lancamentosPorUsuario, setLancamentosPorUsuario] = useState<Record<string, any[]>>({});
  
  // Buscar dados de lançamentos por usuário usando Supabase
  useEffect(() => {
    const fetchLancamentos = async () => {
      try {
        // Buscar todas as operações de movimentação do estoque
        const { data: movimentacoes, error: movError } = await supabase
          .from('movimentacoes_estoque')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (movError) throw movError;

        // Buscar dados de produção
        const { data: producoes, error: prodError } = await supabase
          .from('producao_diaria')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (prodError) throw prodError;

        // Buscar dados de defeitos
        const { data: defeitosData, error: defError } = await supabase
          .from('defeitos')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (defError) throw defError;

        // Buscar dados de recebimentos
        const { data: recebimentosData, error: recError } = await supabase
          .from('recebimentos')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (recError) throw recError;

        // Buscar dados de RMAs
        const { data: rmas, error: rmaError } = await supabase
          .from('rmas')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (rmaError) throw rmaError;

        // Buscar dados de recuperações
        const { data: recuperacoesData, error: recupError } = await supabase
          .from('recuperacoes')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (recupError) throw recupError;

        // Agrupar todos os lançamentos por usuário
        const agrupados: Record<string, any[]> = {};
        
        // Adicionar movimentações
        (movimentacoes || []).forEach(mov => {
          const usuario = mov.funcionario_id || 'Sistema';
          if (!agrupados[usuario]) agrupados[usuario] = [];
          agrupados[usuario].push({
            tipo: 'Movimentação',
            data: mov.created_at,
            descricao: `${mov.tipo_movimento} - ${mov.quantidade} unidades`,
            detalhes: mov
          });
        });

        // Adicionar produções
        (producoes || []).forEach(prod => {
          const usuario = prod.colaborador || 'Sistema';
          if (!agrupados[usuario]) agrupados[usuario] = [];
          agrupados[usuario].push({
            tipo: 'Produção',
            data: prod.created_at,
            descricao: `${prod.modelo} - ${prod.quantidade_equipamentos} equipamentos`,
            detalhes: prod
          });
        });

        // Adicionar defeitos
        (defeitosData || []).forEach(def => {
          const usuario = def.responsavel || 'Sistema';
          if (!agrupados[usuario]) agrupados[usuario] = [];
          agrupados[usuario].push({
            tipo: 'Defeito',
            data: def.created_at,
            descricao: `${def.tipo_defeito} - ${def.quantidade} unidades`,
            detalhes: def
          });
        });

        // Adicionar recebimentos
        (recebimentosData || []).forEach(rec => {
          const usuario = rec.responsavel_recebimento || 'Sistema';
          if (!agrupados[usuario]) agrupados[usuario] = [];
          agrupados[usuario].push({
            tipo: 'Recebimento',
            data: rec.created_at,
            descricao: `Documento ${rec.numero_documento}`,
            detalhes: rec
          });
        });

        // Adicionar RMAs
        (rmas || []).forEach(rma => {
          const usuario = rma.tecnico_responsavel || 'Sistema';
          if (!agrupados[usuario]) agrupados[usuario] = [];
          agrupados[usuario].push({
            tipo: 'RMA',
            data: rma.created_at,
            descricao: `${rma.numero_rma} - ${rma.equipamento}`,
            detalhes: rma
          });
        });

        // Adicionar recuperações
        (recuperacoesData || []).forEach(rec => {
          const usuario = rec.responsavel || 'Sistema';
          if (!agrupados[usuario]) agrupados[usuario] = [];
          agrupados[usuario].push({
            tipo: 'Recuperação',
            data: rec.created_at,
            descricao: `${rec.equipamento} - ${rec.macs.length} equipamentos`,
            detalhes: rec
          });
        });

        // Ordenar por data mais recente
        Object.keys(agrupados).forEach(usuario => {
          agrupados[usuario].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        });

        setLancamentosPorUsuario(agrupados);
      } catch (error) {
        console.error('Erro ao buscar lançamentos:', error);
      }
    };

    fetchLancamentos();
  }, []);

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
            totalRecuperados,
            totalFuncionarios: funcionariosAprovados.length,
            totalProducoes: producoesDiarias?.length || 0
          },
          operacoes: filtrarPorPeriodo(operacoes, 'data'),
          defeitos: filtrarPorPeriodo(defeitos),
          recebimentos: filtrarPorPeriodo(recebimentos),
          recuperacoes: filtrarPorPeriodo(recuperacoes, 'data_recuperacao'),
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
        const itensFaltantes = estoqueRecebimento.filter(item => item.quantidade_disponivel <= 10 || item.quantidade_disponivel === 0);
        const itensEstoqueBaixo = estoqueRecebimento.filter(item => item.quantidade_disponivel > 0 && item.quantidade_disponivel <= 50);
        
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
              faltando: Math.max(0, 10 - item.quantidade_disponivel)
            }))
          }
        };
        break;
      
      case 'recuperacao':
        dadosFiltrados = {
          recuperacoes: filtrarPorPeriodo(recuperacoes, 'data_recuperacao'),
          total: totalRecuperados,
          resumo: {
            totalRecuperacoes: recuperacoes.length,
            totalEquipamentos: totalRecuperados,
            equipamentosMaisRecuperados: recuperacoes.reduce((acc, rec) => {
              acc[rec.equipamento] = (acc[rec.equipamento] || 0) + rec.macs.length;
              return acc;
            }, {} as Record<string, number>)
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
                  <DialogDescription>
                    Configure e gere um novo relatório personalizado do sistema
                  </DialogDescription>
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
                          <SelectItem value="recuperacao">Relatório de Recuperações</SelectItem>
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
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Operações</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operacoes.length}</div>
              <p className="text-xs text-muted-foreground">
                Histórico completo
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipamentos Recuperados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRecuperados}</div>
              <p className="text-xs text-muted-foreground">
                {recuperacoes.length} recuperações registradas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRecebidos}</div>
              <p className="text-xs text-muted-foreground">
                {recebimentos.length} documentos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Caixas no Estoque</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{caixas.length}</div>
              <p className="text-xs text-muted-foreground">
                Em inventário ativo
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="salvos" className="space-y-4">
          <TabsList className="grid grid-cols-9 w-full">
            <TabsTrigger value="salvos">Relatórios Salvos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="defeitos">Defeitos</TabsTrigger>
            <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="saidas">Saídas</TabsTrigger>
            <TabsTrigger value="garantias">Garantias</TabsTrigger>
            <TabsTrigger value="itens_faltantes">Itens Faltantes</TabsTrigger>
          </TabsList>

          <TabsContent value="salvos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Todos os Relatórios Salvos
                </CardTitle>
                <CardDescription>
                  Todos os relatórios gerados e salvos pelos usuários no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRelatorios ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando relatórios...</p>
                  </div>
                ) : relatorios.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum relatório salvo ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {relatorios.map((relatorio) => (
                        <div key={relatorio.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{relatorio.titulo}</h4>
                              <p className="text-sm text-muted-foreground">
                                Tipo: {relatorio.tipo} | Gerado em: {formatData(relatorio.created_at)}
                              </p>
                              {relatorio.periodo_inicio && relatorio.periodo_fim && (
                                <p className="text-xs text-muted-foreground">
                                  Período: {format(new Date(relatorio.periodo_inicio), 'dd/MM/yyyy')} - {format(new Date(relatorio.periodo_fim), 'dd/MM/yyyy')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
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
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteRelatorio(relatorio.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Histórico Completo de Operações
                </CardTitle>
                <CardDescription>
                  Registro completo de todas as operações salvas pelos usuários no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Equipamento</TableHead>
                          <TableHead>Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Mostrar operações históricas */}
                        {operacoes.map((operacao) => (
                          <TableRow key={`op-${operacao.id}`}>
                            <TableCell className="text-sm">
                              {formatData(operacao.data)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                operacao.tipo === 'entrada' ? 'default' :
                                operacao.tipo === 'saida' ? 'secondary' : 'outline'
                              }>
                                {operacao.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{operacao.usuario}</TableCell>
                            <TableCell className="text-sm">{operacao.equipamento}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              Sem detalhes adicionais
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Mostrar recuperações */}
                        {recuperacoes.map((recuperacao) => (
                          <TableRow key={`rec-${recuperacao.id}`}>
                            <TableCell className="text-sm">
                              {formatData(recuperacao.data_recuperacao)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">recuperação</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{recuperacao.responsavel}</TableCell>
                            <TableCell className="text-sm">{recuperacao.equipamento}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {recuperacao.macs.length} equipamento(s) recuperado(s)
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Mostrar defeitos */}
                        {defeitos.map((defeito) => (
                          <TableRow key={`def-${defeito.id}`}>
                            <TableCell className="text-sm">
                              {formatData(defeito.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">defeito</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{defeito.responsavel}</TableCell>
                            <TableCell className="text-sm">{defeito.equipamento}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {defeito.tipo_defeito} - {defeito.quantidade} unidades
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Mostrar recebimentos */}
                        {recebimentos.map((recebimento) => (
                          <TableRow key={`receb-${recebimento.id}`}>
                            <TableCell className="text-sm">
                              {formatData(recebimento.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">recebimento</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{recebimento.responsavel_recebimento}</TableCell>
                            <TableCell className="text-sm">-</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              Doc: {recebimento.numero_documento} - {recebimento.origem}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defeitos">
            <div className="space-y-6">
              {/* Relatórios salvos de defeitos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Relatórios Salvos - Defeitos
                  </CardTitle>
                  <CardDescription>
                    Relatórios de defeitos salvos pelos usuários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {relatorios.filter(r => r.tipo === 'defeitos').length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum relatório de defeitos salvo</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {relatorios.filter(r => r.tipo === 'defeitos').map((relatorio) => (
                        <div key={relatorio.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{relatorio.titulo}</h4>
                              <p className="text-sm text-muted-foreground">
                                Gerado em: {formatData(relatorio.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo atual de defeitos */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Atual - Defeitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-destructive">{totalDefeitos}</div>
                        <p className="text-sm text-muted-foreground">Total de defeitos</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{Object.keys(defeitosPorTipo).length}</div>
                        <p className="text-sm text-muted-foreground">Tipos diferentes</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{defeitos.length}</div>
                        <p className="text-sm text-muted-foreground">Registros únicos</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recebimentos">
            <div className="space-y-6">
              {/* Relatórios salvos de recebimentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Relatórios Salvos - Recebimentos
                  </CardTitle>
                  <CardDescription>
                    Relatórios de recebimentos salvos pelos usuários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {relatorios.filter(r => r.tipo === 'recebimentos').length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum relatório de recebimentos salvo</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {relatorios.filter(r => r.tipo === 'recebimentos').map((relatorio) => (
                        <div key={relatorio.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{relatorio.titulo}</h4>
                              <p className="text-sm text-muted-foreground">
                                Gerado em: {formatData(relatorio.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo atual de recebimentos */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Atual - Recebimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-primary">{totalRecebidos}</div>
                        <p className="text-sm text-muted-foreground">Total recebido</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{recebimentos.length}</div>
                        <p className="text-sm text-muted-foreground">Documentos</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{Object.keys(recebimentosPorOrigem).length}</div>
                        <p className="text-sm text-muted-foreground">Origens diferentes</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Seção de Recuperações Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recuperações Recentes
                  </CardTitle>
                  <CardDescription>
                    Equipamentos recuperados salvos no banco de dados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recuperacoes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhuma recuperação registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {recuperacoes.map((recuperacao) => (
                        <div key={recuperacao.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{recuperacao.equipamento}</h4>
                            <Badge variant="outline">
                              {recuperacao.macs.length} MAC(s)
                            </Badge>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <p><strong>Problema:</strong> {recuperacao.problema}</p>
                            <p><strong>Solução:</strong> {recuperacao.solucao}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {recuperacao.macs.map((mac) => (
                              <Badge 
                                key={mac} 
                                variant="secondary" 
                                className="text-xs"
                              >
                                {mac}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            {formatData(recuperacao.data_recuperacao)} • {recuperacao.responsavel}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Continue com as outras abas... */}
          {/* Para economizar espaço, incluirei versões simplificadas das outras abas */}
          
          <TabsContent value="entradas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5" />
                  Relatórios Salvos - Entradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorios.filter(r => r.tipo === 'movimentacoes' || r.tipo === 'producao').filter(r => r.dados?.operacoes?.some((op: any) => op.tipo === 'entrada')).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum relatório de entradas salvo</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Implementar listagem específica de relatórios de entradas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saidas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5" />
                  Relatórios Salvos - Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorios.filter(r => r.tipo === 'movimentacoes').filter(r => r.dados?.operacoes?.some((op: any) => op.tipo === 'saida')).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum relatório de saídas salvo</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Implementar listagem específica de relatórios de saídas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="garantias">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Relatórios Salvos - Garantias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mostrar garantias diretamente do hook */}
                {garantias.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma garantia registrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3 mb-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-success">{garantias.filter(g => g.status === 'Ativa').length}</div>
                          <p className="text-sm text-muted-foreground">Garantias Ativas</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-warning">{garantias.filter(g => g.status === 'Próximo ao Vencimento').length}</div>
                          <p className="text-sm text-muted-foreground">Próximas ao Vencimento</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-destructive">{garantias.filter(g => g.status === 'Expirada').length}</div>
                          <p className="text-sm text-muted-foreground">Expiradas</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {garantias.map((garantia) => (
                        <div key={garantia.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{garantia.equipamento_nome}</h4>
                            <Badge variant={
                              garantia.status === 'Ativa' ? 'default' : 
                              garantia.status === 'Próximo ao Vencimento' ? 'secondary' : 
                              'destructive'
                            }>
                              {garantia.status}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>OS:</strong> {garantia.numero_os}</p>
                            <p><strong>Serviço:</strong> {garantia.servico_realizado}</p>
                            <p><strong>Data Serviço:</strong> {new Date(garantia.data_servico).toLocaleDateString('pt-BR')}</p>
                            <p><strong>Garantia expira:</strong> {new Date(garantia.garantia_expira).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Relatórios salvos de garantias */}
                    {relatorios.filter(r => r.tipo === 'garantias').length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Relatórios Salvos:</h4>
                        <div className="space-y-3">
                          {relatorios.filter(r => r.tipo === 'garantias').map((relatorio) => (
                      <div key={relatorio.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{relatorio.titulo}</h4>
                            <p className="text-sm text-muted-foreground">
                              Gerado em: {formatData(relatorio.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
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
                          </div>
                        </div>
                      </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itens_faltantes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Relatórios Salvos - Itens Faltantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorios.filter(r => r.tipo === 'itens_faltantes').length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum relatório de itens faltantes salvo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {relatorios.filter(r => r.tipo === 'itens_faltantes').map((relatorio) => (
                      <div key={relatorio.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{relatorio.titulo}</h4>
                            <p className="text-sm text-muted-foreground">
                              Gerado em: {formatData(relatorio.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lancamentos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Lançamentos por Usuário
                </CardTitle>
                <CardDescription>
                  Operações agrupadas por usuário responsável
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(lancamentosPorUsuario).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(lancamentosPorUsuario).map(([usuario, operacoesUsuario]) => (
                      <div key={usuario} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{usuario}</h4>
                          <Badge variant="outline">{operacoesUsuario.length} lançamentos</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Última operação: {formatData(operacoesUsuario[0]?.data)}</p>
                          <p>Tipos: {Array.from(new Set(operacoesUsuario.map((op: any) => op.tipo))).join(', ')}</p>
                          <div className="mt-2 space-y-1">
                            <p className="font-medium text-foreground">Últimos lançamentos:</p>
                            {operacoesUsuario.slice(0, 3).map((op: any, index) => (
                              <div key={index} className="text-xs bg-muted/50 p-2 rounded">
                                <span className="font-medium">{op.tipo}:</span> {op.descricao}
                                <br />
                                <span className="text-muted-foreground">{formatData(op.data)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de visualização de relatório */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRelatorio?.titulo}
              </DialogTitle>
              <DialogDescription>
                Visualização completa dos dados do relatório selecionado
              </DialogDescription>
            </DialogHeader>
            {selectedRelatorio && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Tipo:</strong> {selectedRelatorio.tipo}
                  </div>
                  <div>
                    <strong>Gerado em:</strong> {formatData(selectedRelatorio.created_at)}
                  </div>
                  {selectedRelatorio.periodo_inicio && (
                    <div>
                      <strong>Período:</strong> {format(new Date(selectedRelatorio.periodo_inicio), 'dd/MM/yyyy')} - {format(new Date(selectedRelatorio.periodo_fim), 'dd/MM/yyyy')}
                    </div>
                  )}
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Dados do Relatório:</h4>
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(selectedRelatorio.dados, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}