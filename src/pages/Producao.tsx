import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Factory, Package, Plus, X, Copy, RotateCcw, FileText, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEstoque } from "@/contexts/EstoqueContext";
import { useReset } from "@/contexts/ResetContext";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";
import { useSupabaseProducao } from "@/hooks/useSupabaseProducao";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { EquipmentSelector } from "@/components/defeitos/EquipmentSelector";

export default function Producao() {
  const [macs, setMacs] = useState<string[]>([]);
  const [currentMac, setCurrentMac] = useState("");
  const [estoqueRecebimentoDisponivel, setEstoqueRecebimentoDisponivel] = useState<{[modelo: string]: number}>({});
  const { toast } = useToast();
  const { estoque } = useEstoque();
  const { addReset, resets } = useReset();
  const { funcionarios } = useFuncionario();
  const { equipamentos } = useEquipamento();
  const { registrarProducao, verificarEstoqueRecebimento, loading: loadingProducao } = useSupabaseProducao();
  
  // Estados para o formulário de produção
  const [numeroCaixa, setNumeroCaixa] = useState("");
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState("");
  const [selectedEquipmentProducao, setSelectedEquipmentProducao] = useState<any>(null);
  
  // Estados para o modal de reset
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedEquipamento, setSelectedEquipamento] = useState("");
  const [selectedEquipmentReset, setSelectedEquipmentReset] = useState<any>(null);
  const [resetQuantidade, setResetQuantidade] = useState("");
  const [resetResponsavel, setResetResponsavel] = useState("");
  const [resetObservacao, setResetObservacao] = useState("");
  const [showResetReport, setShowResetReport] = useState(false);
  const [lastResetData, setLastResetData] = useState<any>(null);

  // Auto-sync equipment selection for production
  useEffect(() => {
    if (selectedEquipmentProducao) {
      setEquipamentoSelecionado(selectedEquipmentProducao.nome);
    }
  }, [selectedEquipmentProducao]);

  // Auto-sync equipment selection for reset
  useEffect(() => {
    if (selectedEquipmentReset) {
      setSelectedEquipamento(selectedEquipmentReset.nome);
    }
  }, [selectedEquipmentReset]);

  // Carregar estoque de recebimento quando equipamento mudar
  useEffect(() => {
    if (equipamentoSelecionado) {
      verificarEstoqueRecebimento(equipamentoSelecionado).then(quantidade => {
        setEstoqueRecebimentoDisponivel(prev => ({
          ...prev,
          [equipamentoSelecionado]: quantidade
        }));
      });
    }
  }, [equipamentoSelecionado, verificarEstoqueRecebimento]);

  // Função para validar formato MAC
  const isValidMacFormat = (mac: string) => {
    // Aceita tanto com : quanto sem
    const macWithoutColons = mac.replace(/:/g, '');
    const macPattern = /^[0-9A-Fa-f]{12}$/;
    return macPattern.test(macWithoutColons);
  };

  // Função para formatar MAC address
  const formatMac = (mac: string) => {
    const cleanMac = mac.replace(/:/g, '').toUpperCase();
    return cleanMac.replace(/(.{2})/g, '$1:').slice(0, -1);
  };


  const addMacAddress = (macInput: string) => {
    const cleanMac = macInput.trim();
    
    if (!cleanMac) {
      toast({
        title: "Erro",
        description: "Digite um endereço MAC válido",
        variant: "destructive",
      });
      return;
    }

    if (!isValidMacFormat(cleanMac)) {
      toast({
        title: "Formato inválido",
        description: "MAC deve ter 12 caracteres hexadecimais (ex: C85A9FC7B9C0 ou C8:5A:9F:C7:B9:C0)",
        variant: "destructive",
      });
      return;
    }

    const formattedMac = formatMac(cleanMac);

    if (macs.includes(formattedMac)) {
      toast({
        title: "MAC duplicado",
        description: "Este endereço MAC já foi adicionado",
        variant: "destructive",
      });
      return;
    }

    setMacs(prev => [...prev, formattedMac]);
    setCurrentMac("");
    
    toast({
      title: "MAC adicionado",
      description: `Endereço ${formattedMac} adicionado com sucesso`,
    });
  };

  const removeMac = (macToRemove: string) => {
    setMacs(prev => prev.filter(mac => mac !== macToRemove));
    toast({
      title: "MAC removido",
      description: `Endereço ${macToRemove} removido`,
    });
  };

  const handleAddButtonClick = () => {
    addMacAddress(currentMac);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addMacAddress(currentMac);
    }
  };

  // Função para gerar lista copiável de MACs
  const generateMacList = () => {
    return macs.map(mac => mac.replace(/:/g, '')).join(',');
  };

  const copyMacList = async () => {
    const macList = generateMacList();
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

  // Função para registrar reset
  const handleRegistrarReset = () => {
    if (!selectedEquipamento || !resetQuantidade || !resetResponsavel) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha equipamento, quantidade e responsável",
        variant: "destructive",
      });
      return;
    }

    const quantidade = parseInt(resetQuantidade);
    if (quantidade <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    // Registrar o reset
    const resetData = {
      equipamento: selectedEquipamento,
      modelo: selectedEquipamento, // Assumindo que equipamento e modelo são iguais
      quantidade,
      responsavel: resetResponsavel,
      observacao: resetObservacao
    };

    addReset(resetData);

    // Salvar dados para o relatório
    setLastResetData({
      ...resetData,
      id: `RST${String(resets.length + 1).padStart(3, '0')}`,
      data: new Date()
    });

    // Fechar modal e mostrar relatório
    setIsResetDialogOpen(false);
    setShowResetReport(true);

    // Limpar campos
    setSelectedEquipamento("");
    setSelectedEquipmentReset(null);
    setResetQuantidade("");
    setResetResponsavel("");
    setResetObservacao("");

    toast({
      title: "Reset registrado",
      description: `Reset de ${quantidade} equipamentos registrado com sucesso`,
    });
  };

  const closeResetReport = () => {
    setShowResetReport(false);
    setLastResetData(null);
  };

  // Função para criar caixa de produção com integração dos estoques
  const handleCriarCaixaProducao = async () => {
    if (!numeroCaixa.trim()) {
      toast({
        title: "Erro",
        description: "Digite o número da caixa",
        variant: "destructive",
      });
      return;
    }

    if (!funcionarioSelecionado) {
      toast({
        title: "Erro", 
        description: "Selecione um funcionário",
        variant: "destructive",
      });
      return;
    }

    if (!equipamentoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um equipamento", 
        variant: "destructive",
      });
      return;
    }

    if (macs.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um endereço MAC",
        variant: "destructive",
      });
      return;
    }

    // Registrar produção no Supabase (irá consumir estoque de recebimento e criar produtos)
    const sucesso = await registrarProducao({
      numeroCaixa,
      equipamento: equipamentoSelecionado,
      modelo: equipamentoSelecionado,
      quantidade: macs.length,
      responsavel: funcionarioSelecionado,
      macs
    });

    if (!sucesso) {
      return; // O hook já mostrou o toast de erro
    }

    // Limpar formulário
    setNumeroCaixa("");
    setFuncionarioSelecionado("");
    setEquipamentoSelecionado("");
    setSelectedEquipmentProducao(null);
    setMacs([]);

    // Atualizar estoque disponível
    setEstoqueRecebimentoDisponivel(prev => ({
      ...prev,
      [equipamentoSelecionado]: (prev[equipamentoSelecionado] || 0) - macs.length
    }));
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produção</h1>
            <p className="text-muted-foreground">Controle e monitoramento da produção</p>
          </div>
        </div>

        <Tabs defaultValue="registro" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registro">Registrar Produção</TabsTrigger>
            <TabsTrigger value="reset">Registrar Reset</TabsTrigger>
          </TabsList>

          <TabsContent value="registro" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5" />
                    Nova Produção
                  </CardTitle>
                  <CardDescription>
                    Configure uma nova sessão de produção
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Número da Caixa</Label>
                    <Input 
                      placeholder="Ex: CAIXA001" 
                      value={numeroCaixa}
                      onChange={(e) => setNumeroCaixa(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Funcionário</Label>
                    <Select value={funcionarioSelecionado} onValueChange={setFuncionarioSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.nome}>
                            {funcionario.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <EquipmentSelector
                    onSelect={setSelectedEquipmentProducao}
                    selectedEquipment={selectedEquipmentProducao}
                  />
                  {equipamentoSelecionado && (
                    <div className="flex items-center gap-2 mt-1">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">
                        Estoque de recebimento disponível: {estoqueRecebimentoDisponivel[equipamentoSelecionado] || 0} unidades
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>MACs dos Equipamentos</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input 
                          value={currentMac}
                          onChange={(e) => setCurrentMac(e.target.value)}
                          onKeyPress={handleInputKeyPress}
                          placeholder="Digite o MAC: C85A9FC7B9C0 ou C8:5A:9F:C7:B9:C0" 
                        />
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline"
                          onClick={handleAddButtonClick}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="border rounded-lg p-3 min-h-[80px] bg-muted/30">
                        {macs.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            MACs adicionados: 0 - Digite os endereços MAC manualmente
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">
                                Lista de MACs ({macs.length}):
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={copyMacList}
                                className="h-7 gap-1"
                              >
                                <Copy className="h-3 w-3" />
                                Copiar
                              </Button>
                            </div>
                            
                            <div className="bg-background rounded border p-3 font-mono text-sm select-all">
                              {generateMacList()}
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">MACs individuais:</p>
                              {macs.map((mac, index) => (
                                <div key={index} className="flex items-center justify-between bg-background rounded px-2 py-1">
                                  <span className="text-sm font-mono">{mac}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMac(mac)}
                                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade de Equipamentos</Label>
                    <Input type="number" value={macs.length.toString()} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">
                      Quantidade calculada automaticamente pelos MACs adicionados
                    </p>
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    onClick={handleCriarCaixaProducao}
                    disabled={loadingProducao || (equipamentoSelecionado && (estoqueRecebimentoDisponivel[equipamentoSelecionado] || 0) < macs.length)}
                  >
                    <Package className="h-4 w-4" />
                    {loadingProducao ? "Processando..." : "Criar Caixa de Produção"}
                  </Button>
                  {equipamentoSelecionado && (estoqueRecebimentoDisponivel[equipamentoSelecionado] || 0) < macs.length && (
                    <p className="text-sm text-destructive mt-2">
                      ⚠️ Estoque insuficiente! Disponível: {estoqueRecebimentoDisponivel[equipamentoSelecionado] || 0}, Necessário: {macs.length}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Nova aba para Reset */}
          <TabsContent value="reset" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Registrar Reset
                  </CardTitle>
                  <CardDescription>
                    Registre resets de equipamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EquipmentSelector
                    onSelect={setSelectedEquipmentReset}
                    selectedEquipment={selectedEquipmentReset}
                  />

                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      value={resetQuantidade}
                      onChange={(e) => setResetQuantidade(e.target.value)}
                      placeholder="Quantos equipamentos foram resetados"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Responsável *</Label>
                    <Select value={resetResponsavel} onValueChange={setResetResponsavel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.nome}>
                            {funcionario.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <Textarea
                      value={resetObservacao}
                      onChange={(e) => setResetObservacao(e.target.value)}
                      placeholder="Observações sobre o reset (opcional)"
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleRegistrarReset}
                    className="w-full gap-2"
                    disabled={!selectedEquipamento || !resetQuantidade || !resetResponsavel}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Registrar Reset
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Histórico de Resets
                  </CardTitle>
                  <CardDescription>
                    Últimos resets registrados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {resets.slice(0, 10).map((reset) => (
                      <div key={reset.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{reset.id}</span>
                          <Badge variant="outline">
                            {reset.quantidade} {reset.quantidade === 1 ? 'equipamento' : 'equipamentos'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Modelo: {reset.modelo}</div>
                          <div>Responsável: {reset.responsavel}</div>
                          <div>Data: {reset.data.toLocaleString('pt-BR')}</div>
                          {reset.observacao && (
                            <div>Obs: {reset.observacao}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {resets.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        Nenhum reset registrado ainda
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>

        {/* Modal de Relatório de Reset */}
        <Dialog open={showResetReport} onOpenChange={setShowResetReport}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório de Reset
              </DialogTitle>
              <DialogDescription>
                Reset registrado com sucesso
              </DialogDescription>
            </DialogHeader>
            {lastResetData && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">ID:</span>
                    <span>{lastResetData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Equipamento:</span>
                    <span>{lastResetData.equipamento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Quantidade:</span>
                    <span>{lastResetData.quantidade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Responsável:</span>
                    <span>{lastResetData.responsavel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Data:</span>
                    <span>{lastResetData.data.toLocaleString('pt-BR')}</span>
                  </div>
                  {lastResetData.observacao && (
                    <div className="flex justify-between">
                      <span className="font-medium">Observação:</span>
                      <span>{lastResetData.observacao}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={closeResetReport}>
                Fechar Relatório
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}