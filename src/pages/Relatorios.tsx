import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Save, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useHistorico } from "@/contexts/HistoricoContext";
import { useInventario } from "@/contexts/InventarioContext";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";
import { useSupabaseDefeitosRecebimentos } from "@/hooks/useSupabaseDefeitosRecebimentos";
import { useSupabaseRelatorios } from "@/hooks/useSupabaseRelatorios";
import { useSupabaseGarantias } from "@/hooks/useSupabaseGarantias";
import { useSupabaseCaixasInventario } from "@/hooks/useSupabaseCaixasInventario";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRelatorioFilters } from "@/hooks/useRelatorioFilters";
import { useRelatorioScheduler } from "@/hooks/useRelatorioScheduler";
import { RelatorioCards } from "@/components/relatorios/RelatorioCards";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
  const { garantias, loading: loadingGarantias } = useSupabaseGarantias();
  const { caixas: caixasInventario, loading: loadingInventario } = useSupabaseCaixasInventario();
  
  // Hooks para filtros e relatórios automáticos
  const {
    filtroAtual,
    dataPersonalizada,
    setDataPersonalizada,
    filtrosPredefinidos,
    aplicarFiltroPredefinido,
    aplicarFiltroPersonalizado,
    filtrarDadosPorPeriodo,
    gerarTituloRelatorio
  } = useRelatorioFilters();

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

  // Função para gerar dados completos do relatório
  const gerarDadosRelatorio = (tipo: string, periodoInicio?: string, periodoFim?: string) => {
    let dadosFiltrados: any = {};

    // Filtrar dados por período - usar filtro atual se não especificado
    const filtrarPorPeriodo = (items: any[], dataField: string = 'created_at') => {
      if (periodoInicio && periodoFim) {
        return items.filter(item => {
          const itemDate = new Date(item[dataField]);
          const inicio = new Date(periodoInicio);
          const fim = new Date(periodoFim);
          return itemDate >= inicio && itemDate <= fim;
        });
      }
      
      // Usar filtro atual do hook se não especificado
      return filtrarDadosPorPeriodo(items, dataField);
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

      default:
        dadosFiltrados = {
          dados: filtrarPorPeriodo(operacoes, 'data'),
          resumo: { total: operacoes.length }
        };
    }

    return dadosFiltrados;
  };

  // Hook para relatórios automáticos
  const { verificarRelatoriosAutomaticos } = useRelatorioScheduler(gerarDadosRelatorio);

  // Função para salvar relatório
  const handleSalvarRelatorio = async () => {
    if (!novoRelatorio.tipo) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o tipo do relatório",
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
        titulo: novoRelatorio.titulo || gerarTituloRelatorio(novoRelatorio.tipo),
        tipo: novoRelatorio.tipo,
        periodo_inicio: novoRelatorio.periodo_inicio || format(filtroAtual.dataInicio, 'yyyy-MM-dd'),
        periodo_fim: novoRelatorio.periodo_fim || format(filtroAtual.dataFim, 'yyyy-MM-dd'),
        dados: {
          ...dadosRelatorio,
          observacoes: novoRelatorio.observacoes,
          geradoEm: new Date().toISOString(),
          filtroUtilizado: filtroAtual,
          parametros: {
            periodo: {
              inicio: novoRelatorio.periodo_inicio || format(filtroAtual.dataInicio, 'yyyy-MM-dd'),
              fim: novoRelatorio.periodo_fim || format(filtroAtual.dataFim, 'yyyy-MM-dd')
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Histórico completo e geração de relatórios do sistema</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={verificarRelatoriosAutomaticos}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar Automáticos
            </Button>
            
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
                  {/* Filtros de Período */}
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <Label className="text-sm font-medium mb-3 block">Filtro de Período</Label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {Object.entries(filtrosPredefinidos).map(([chave, filtro]) => (
                        <Button
                          key={chave}
                          variant={filtroAtual.titulo === filtro.titulo ? "default" : "outline"}
                          size="sm"
                          onClick={() => aplicarFiltroPredefinido(chave as keyof typeof filtrosPredefinidos)}
                        >
                          {filtro.titulo}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div>
                        <Label className="text-xs">Data Início</Label>
                        <Input
                          type="date"
                          value={dataPersonalizada.inicio}
                          onChange={(e) => setDataPersonalizada(prev => ({ ...prev, inicio: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Data Fim</Label>
                        <Input
                          type="date"
                          value={dataPersonalizada.fim}
                          onChange={(e) => setDataPersonalizada(prev => ({ ...prev, fim: e.target.value }))}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={aplicarFiltroPersonalizado}
                      >
                        Aplicar
                      </Button>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      Período selecionado: <span className="font-medium">{filtroAtual.titulo}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Título do Relatório</Label>
                      <Input
                        value={novoRelatorio.titulo}
                        onChange={(e) => setNovoRelatorio(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder={novoRelatorio.tipo ? gerarTituloRelatorio(novoRelatorio.tipo) : "Título será gerado automaticamente"}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Deixe em branco para gerar automaticamente
                      </p>
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
                      <Label>Período Personalizado - Início (Opcional)</Label>
                      <Input
                        type="date"
                        value={novoRelatorio.periodo_inicio}
                        onChange={(e) => setNovoRelatorio(prev => ({ ...prev, periodo_inicio: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Sobrescreve filtro selecionado</p>
                    </div>
                    
                    <div>
                      <Label>Período Personalizado - Fim (Opcional)</Label>
                      <Input
                        type="date"
                        value={novoRelatorio.periodo_fim}
                        onChange={(e) => setNovoRelatorio(prev => ({ ...prev, periodo_fim: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Sobrescreve filtro selecionado</p>
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
        <RelatorioCards
          filtroAtual={filtroAtual}
          entradas={entradas}
          saidas={saidas}
          lancamentosPorUsuario={lancamentosPorUsuario}
          caixasInventario={caixasInventario}
          equipamentos={equipamentos}
          totalDefeitos={totalDefeitos}
          totalRecebidos={totalRecebidos}
          garantias={garantias}
          estoqueRecebimento={estoqueRecebimento}
          loadingGarantias={loadingGarantias}
          loadingInventario={loadingInventario}
        />

        {/* Navegação por abas */}
        <Tabs defaultValue="salvos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="salvos">Relatórios Salvos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="salvos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Salvos</CardTitle>
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
                            <h3 className="font-semibold text-lg">{relatorio.titulo}</h3>
                            <p className="text-sm text-muted-foreground">
                              Gerado em: {format(new Date(relatorio.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
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
                <CardTitle>Histórico de Operações</CardTitle>
                <CardDescription>
                  Resumo das operações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Entradas: {entradas.length}</h4>
                    <h4 className="font-medium mb-2">Saídas: {saidas.length}</h4>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Usuários Ativos: {Object.keys(lancamentosPorUsuario).length}</h4>
                    <h4 className="font-medium mb-2">Total de Operações: {operacoes.length}</h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}