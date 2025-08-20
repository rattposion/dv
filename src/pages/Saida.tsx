import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Package, TruckIcon as Truck, AlertTriangle, Calendar, User, Split, Plus, X, Info, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useEstoque } from "@/contexts/EstoqueContext";
import { useHistorico } from "@/contexts/HistoricoContext";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { FileUploadSaida } from "@/components/saida/FileUploadSaida";
import { useSupabaseRMA } from "@/hooks/useSupabaseRMA";
import { useSupabaseCaixasInventario } from "@/hooks/useSupabaseCaixasInventario";
import { EquipmentSelector } from "@/components/defeitos/EquipmentSelector";
import { FileUploadRMA } from "@/components/rma/FileUploadRMA";

export default function Saida() {
  const [selectedCaixa, setSelectedCaixa] = useState("");
  const [selectedCaixas, setSelectedCaixas] = useState<string[]>([]);
  const [selectedCaixaSeparacao, setSelectedCaixaSeparacao] = useState("");
  const [tipoSelecaoMac, setTipoSelecaoMac] = useState("caixa"); // "caixa" ou "manual"
  const [responsavelSaida, setResponsavelSaida] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [macsParaVerificar, setMacsParaVerificar] = useState("");
  const [dadosEquipamentos, setDadosEquipamentos] = useState("");
  const [anexosSaida, setAnexosSaida] = useState<string[]>([]);
  const [resultadoProcessamento, setResultadoProcessamento] = useState<{
    grupos: { [key: string]: string[] };
    naoEncontrados: string[];
  }>({ grupos: {}, naoEncontrados: [] });

  // Estados para RMA
  const [showRMADialog, setShowRMADialog] = useState(false);
  const [selectedEquipmentRMA, setSelectedEquipmentRMA] = useState<any>(null);
  const [rmaData, setRmaData] = useState({
    equipamento: "",
    modelo: "",
    mac_address: "",
    origem_equipamento: "",
    destino_envio: "",
    defeito_relatado: "",
    tecnico_responsavel: "",
    observacoes: "",
    nota_fiscal: "",
  });
  const [macsRMA, setMacsRMA] = useState<string[]>([]);
  const [currentMacRMA, setCurrentMacRMA] = useState("");
  const [anexosRMA, setAnexosRMA] = useState<string[]>([]);
  const { toast } = useToast();
  const { caixas: caixasDisponiveis, removeCaixa, loading: loadingCaixas } = useSupabaseCaixasInventario();
  const { diminuirEstoque, getEstoquePorModelo } = useEstoque();
  const { addOperacao } = useHistorico();
  const { funcionariosAprovados } = useFuncionario();
  const { createRMA, loading: rmaLoading } = useSupabaseRMA();

  const caixasSelecionadasData = caixasDisponiveis.filter(c => selectedCaixas.includes(c.id));
  const totalQuantidadeSelecionada = caixasSelecionadasData.reduce((total, caixa) => total + caixa.quantidade, 0);

  const filteredCaixas = caixasDisponiveis.filter(caixa =>
    caixa.numero_caixa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caixa.equipamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegistrarSaida = () => {
    // Verificar se há pelo menos uma caixa selecionada (qualquer dos métodos)
    const caixaSelecionadaId = selectedCaixa || (selectedCaixas.length > 0 ? selectedCaixas[0] : null);
    
    if (!caixaSelecionadaId || !responsavelSaida || !destino) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma caixa e preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const caixa = caixasDisponiveis.find(c => c.id === caixaSelecionadaId);
    if (!caixa) {
      toast({
        title: "Erro",
        description: "Caixa não encontrada",
        variant: "destructive",
      });
      return;
    }

    // Verificar se há estoque suficiente
    const estoqueAtual = getEstoquePorModelo(caixa.modelo);
    if (estoqueAtual < caixa.quantidade) {
      toast({
        title: "Estoque insuficiente",
        description: `Estoque disponível: ${estoqueAtual} (necessário: ${caixa.quantidade})`,
        variant: "destructive",
      });
      return;
    }

    // Diminuir o estoque automaticamente
    const estoqueReduzido = diminuirEstoque(caixa.modelo, caixa.quantidade);
    
    if (!estoqueReduzido) {
      toast({
        title: "Erro no estoque",
        description: "Não foi possível reduzir o estoque",
        variant: "destructive",
      });
      return;
    }

    // Registrar a operação no histórico com anexos
    addOperacao({
      tipo: "saida",
      usuario: responsavelSaida,
      caixaId: caixaSelecionadaId,
      equipamento: caixa.equipamento,
      modelo: caixa.modelo,
      quantidade: caixa.quantidade,
      destino,
      observacao: motivo,
      anexos: anexosSaida.length > 0 ? anexosSaida : undefined
    });

    // Remove a caixa do inventário
    removeCaixa(caixaSelecionadaId);

    const novoEstoque = getEstoquePorModelo(caixa.modelo);
    toast({
      title: "Saída registrada",
      description: `Saída da caixa ${caixaSelecionadaId} registrada. Estoque ${caixa.modelo}: ${novoEstoque}`,
    });

    // Limpar formulário
    setSelectedCaixa("");
    setSelectedCaixas([]);
    setResponsavelSaida("");
    setDestino("");
    setMotivo("");
    setAnexosSaida([]);
  };

  const caixaSelecionada = caixasDisponiveis.find(caixa => caixa.id === selectedCaixa || selectedCaixas.includes(caixa.id));
  const caixaSeparacaoSelecionada = caixasDisponiveis.find(caixa => caixa.id === selectedCaixaSeparacao);

  // Lista única de equipamentos
  const equipamentosUnicos = Array.from(new Set(caixasDisponiveis.map(caixa => caixa.equipamento)));
  const equipamentosFormatados = equipamentosUnicos.map((eq, index) => 
    index === equipamentosUnicos.length - 1 ? eq : `${eq},`
  ).join(' ');

  // Funções para a separação
  const limparMacs = () => {
    setMacsParaVerificar("");
  };

  const processarComparacao = () => {
    if (!macsParaVerificar.trim() || !dadosEquipamentos.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a lista de MACs e os dados dos equipamentos",
        variant: "destructive",
      });
      return;
    }

    console.log("=== INICIANDO PROCESSAMENTO ===");
    
    // Função para normalizar MAC (remove : e converte para minúsculo)
    const normalizarMac = (mac: string) => mac.replace(/:/g, '').toLowerCase().trim();
    
    // Função para adicionar dois pontos ao MAC (formato AA:BB:CC:DD:EE:FF)
    const formatarMacComDoisPontos = (mac: string) => {
      const macLimpo = mac.replace(/:/g, '').toUpperCase();
      if (macLimpo.length === 12) {
        return macLimpo.match(/.{2}/g)?.join(':') || mac;
      }
      return mac;
    };

    // Pega a lista de MACs do campo de texto
    const macsLista = macsParaVerificar.split('\n').map(mac => mac.trim()).filter(mac => mac);
    console.log("MACs da lista:", macsLista);
    console.log("Quantidade de MACs:", macsLista.length);
    
    // Normaliza os MACs da lista para comparação
    const macsNormalizados = macsLista.map(normalizarMac);
    console.log("MACs normalizados:", macsNormalizados);
    
    // Normaliza o texto dos dados dos equipamentos para busca
    const dadosNormalizados = dadosEquipamentos.toLowerCase();
    console.log("Tamanho dos dados:", dadosNormalizados.length);
    
    const grupos: { [key: string]: string[] } = {};
    const naoEncontrados: string[] = [];


    // Para cada MAC da lista, verifica se está nos dados dos equipamentos
    macsLista.forEach((macOriginal, index) => {
      const macNormalizado = macsNormalizados[index];
      const macComDoisPontos = formatarMacComDoisPontos(macOriginal);
      console.log(`\n--- Verificando MAC ${index + 1}/${macsLista.length}: ${macOriginal} ---`);
      console.log(`MAC normalizado: ${macNormalizado}`);
      console.log(`MAC com dois pontos: ${macComDoisPontos}`);
      
      // Verifica se o MAC existe nos dados dos equipamentos em múltiplos formatos
      const macEncontrado = dadosNormalizados.includes(macNormalizado) || 
                           dadosNormalizados.includes(macOriginal.toLowerCase()) ||
                           dadosNormalizados.includes(macOriginal.toUpperCase()) ||
                           dadosNormalizados.includes(macComDoisPontos.toLowerCase()) ||
                           dadosEquipamentos.includes(macOriginal) ||
                           dadosEquipamentos.includes(macOriginal.toUpperCase()) ||
                           dadosEquipamentos.includes(macComDoisPontos) ||
                           dadosEquipamentos.includes(macComDoisPontos.toUpperCase()) ||
                           dadosEquipamentos.includes(macComDoisPontos.toLowerCase());
      console.log(`MAC encontrado nos dados: ${macEncontrado}`);
      
      if (macEncontrado) {
        console.log("✅ MAC ENCONTRADO - processando localização...");
        
        // Extrair informações do local/grupo dos dados
        const lines = dadosEquipamentos.split('\n');
        let equipamentoInfo = '';
        let localEstoque = '';
        
        // Buscar o MAC nos dados e extrair o contexto do equipamento
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          
          // Se a linha contém o MAC (normalizado, original ou formatado com dois pontos)
          if (line.includes(macNormalizado) || line.includes(macOriginal.toLowerCase()) || line.includes(macComDoisPontos.toLowerCase())) {
            console.log(`MAC encontrado na linha ${i}: ${lines[i]}`);
            
            // Buscar informações do equipamento nas linhas próximas
            for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 4); j++) {
              const checkLine = lines[j];
              
              // Extrair nome/ID do equipamento se a linha começar com parênteses
              if (checkLine.match(/^\s*\([^)]+\)/)) {
                const match = checkLine.match(/^\s*\(([^)]+)\)\s*(.+?)(?:\s+-\s+ID Próprio:|$)/);
                if (match) {
                  equipamentoInfo = `(${match[1]}) ${match[2].trim()}`;
                  console.log(`Equipamento extraído: ${equipamentoInfo}`);
                }
              }
              
              // Extrair LOCAL ESTOQUE
              if (checkLine.includes('LOCAL ESTOQUE:')) {
                const localMatch = checkLine.match(/LOCAL ESTOQUE:\s*([^-\n\t]+?)(?:\s+-\s+|\s+NÚMERO|\s+EPI)/);
                if (localMatch) {
                  localEstoque = localMatch[1].trim();
                  console.log(`Local extraído: ${localEstoque}`);
                }
              }
            }
            break;
          }
        }
        
        // Define a chave do grupo baseado apenas na localização
        let chaveGrupo = '';
        if (localEstoque) {
          chaveGrupo = localEstoque;
        } else {
          chaveGrupo = 'Local não identificado';
        }
        
        console.log(`Grupo definido: ${chaveGrupo}`);
        
        if (!grupos[chaveGrupo]) {
          grupos[chaveGrupo] = [];
        }
        grupos[chaveGrupo].push(macOriginal);
        
      } else {
        // MAC não foi encontrado nos dados dos equipamentos
        console.log(`❌ MAC NÃO ENCONTRADO: ${macOriginal}`);
        naoEncontrados.push(macOriginal);
      }
    });

    console.log("=== RESULTADO FINAL ===");
    console.log("Grupos encontrados:", Object.keys(grupos).length);
    console.log("Grupos:", grupos);
    console.log("MACs não encontrados:", naoEncontrados.length);
    console.log("Lista não encontrados:", naoEncontrados);

    setResultadoProcessamento({ grupos, naoEncontrados });
    
    const totalEncontrados = Object.values(grupos).reduce((acc, arr) => acc + arr.length, 0);
    const statusMsg = tipoSelecaoMac === "caixa" && caixaSeparacaoSelecionada
      ? `${totalEncontrados} de ${macsLista.length} MACs encontrados (da caixa ${caixaSeparacaoSelecionada.id})`
      : `${totalEncontrados} de ${macsLista.length} MACs encontrados`;
      
    toast({
      title: "Processamento concluído",
      description: statusMsg,
    });
  };

  // Funções para RMA
  const isValidMacFormat = (mac: string) => {
    const macWithoutColons = mac.replace(/:/g, '');
    const macPattern = /^[0-9A-Fa-f]{12}$/;
    return macPattern.test(macWithoutColons);
  };

  const formatMac = (mac: string) => {
    const cleanMac = mac.replace(/:/g, '').toUpperCase();
    return cleanMac.replace(/(.{2})/g, '$1:').slice(0, -1);
  };

  const addMacAddressRMA = (macInput: string) => {
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

    if (macsRMA.includes(formattedMac)) {
      toast({
        title: "MAC duplicado",
        description: "Este endereço MAC já foi adicionado",
        variant: "destructive",
      });
      return;
    }

    setMacsRMA(prev => [...prev, formattedMac]);
    setCurrentMacRMA("");
    
    toast({
      title: "MAC adicionado",
      description: `Endereço ${formattedMac} adicionado com sucesso`,
    });
  };

  const removeMacRMA = (macToRemove: string) => {
    setMacsRMA(prev => prev.filter(mac => mac !== macToRemove));
    toast({
      title: "MAC removido",
      description: `Endereço ${macToRemove} removido`,
    });
  };

  const handleEquipmentSelectRMA = (equipment: any) => {
    setSelectedEquipmentRMA(equipment);
    setRmaData(prev => ({
      ...prev,
      equipamento: equipment.nome,
      modelo: equipment.modelo || "",
    }));
  };

  const handleCreateRMA = async () => {
    if (!rmaData.equipamento || !rmaData.defeito_relatado || !rmaData.origem_equipamento || !rmaData.destino_envio) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRMA({
        equipamento: rmaData.equipamento,
        modelo: rmaData.modelo,
        mac_address: macsRMA.join(", "),
        origem_equipamento: rmaData.origem_equipamento,
        destino_envio: rmaData.destino_envio,
        defeito_relatado: rmaData.defeito_relatado,
        status: "Aberto",
        data_abertura: new Date().toISOString().split('T')[0],
        tecnico_responsavel: rmaData.tecnico_responsavel,
        observacoes: rmaData.observacoes,
        nota_fiscal: rmaData.nota_fiscal,
        anexos_ids: anexosRMA,
      });

      // Reset form
      setRmaData({
        equipamento: "",
        modelo: "",
        mac_address: "",
        origem_equipamento: "",
        destino_envio: "",
        defeito_relatado: "",
        tecnico_responsavel: "",
        observacoes: "",
        nota_fiscal: "",
      });
      setMacsRMA([]);
      setAnexosRMA([]);
      setSelectedEquipmentRMA(null);
      setShowRMADialog(false);
    } catch (error) {
      console.error("Erro ao criar RMA:", error);
    }
  };

  const handleMultipleBoxSelection = (caixaId: string) => {
    console.log("Selecionando caixa múltipla:", caixaId);
    // Limpar seleção simples quando usar seleção múltipla
    setSelectedCaixa("");
    
    setSelectedCaixas(prev => {
      const newSelection = prev.includes(caixaId) 
        ? prev.filter(id => id !== caixaId)
        : [...prev, caixaId];
      
      console.log("Nova seleção múltipla:", newSelection);
      return newSelection;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Saídas</h1>
            <p className="text-muted-foreground">Registre a saída de caixas e faça separações</p>
          </div>
          <Button 
            onClick={() => setShowRMADialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Novo RMA
          </Button>
        </div>

        <Tabs defaultValue="saida" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saida" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Registrar Saída
            </TabsTrigger>
            <TabsTrigger value="separacao" className="flex items-center gap-2">
              <Split className="h-4 w-4" />
              Separação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saida" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulário de Saída */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Dados da Saída
                  </CardTitle>
                  <CardDescription>
                    Preencha as informações para registrar a saída
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="caixa">
                      Caixas para Saída * 
                      {selectedCaixas.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedCaixas.length} selecionada{selectedCaixas.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </Label>
                    <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                      {loadingCaixas ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Carregando caixas...
                        </div>
                      ) : caixasDisponiveis.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhuma caixa encontrada no inventário
                        </div>
                      ) : (
                        caixasDisponiveis.map((caixa) => (
                          <div 
                            key={caixa.id}
                           className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                               selectedCaixas.includes(caixa.id) 
                                 ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" 
                                 : "border-border hover:border-primary/50 hover:bg-muted/30"
                             }`}
                            onClick={() => handleMultipleBoxSelection(caixa.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{caixa.numero_caixa}</div>
                                <div className="text-sm text-muted-foreground">
                                  {caixa.equipamento} - {caixa.modelo}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{caixa.quantidade}</div>
                                <div className="text-xs text-muted-foreground">equipamentos</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Informações da caixa selecionada no formulário */}
                  {caixaSelecionada && (
                    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Equipamento:</span>
                        <span className="text-sm">{caixaSelecionada.equipamento}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Modelo:</span>
                        <span className="text-sm">{caixaSelecionada.modelo}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Quantidade:</span>
                        <span className="text-sm">{caixaSelecionada.quantidade} equipamentos</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estoque disponível:</span>
                        <span className="text-sm">{getEstoquePorModelo(caixaSelecionada.modelo)} unidades</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="responsavel">Responsável pela Saída *</Label>
                    <Select value={responsavelSaida} onValueChange={setResponsavelSaida}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg">
                        {funcionariosAprovados.map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.nome}>
                            {funcionario.nome} - {funcionario.funcao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destino">Destino *</Label>
                    <Input
                      id="destino"
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      placeholder="Para onde vai a caixa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo da Saída</Label>
                    <Textarea
                      id="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Descreva o motivo da saída..."
                      rows={3}
                    />
                  </div>

                  <FileUploadSaida
                    onFilesChange={setAnexosSaida}
                    existingFiles={anexosSaida}
                    maxFiles={3}
                  />

                  <Button
                    onClick={handleRegistrarSaida}
                    className="w-full"
                    disabled={!selectedCaixa && selectedCaixas.length === 0 || !responsavelSaida || !destino}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Registrar Saída
                  </Button>
                </CardContent>
              </Card>

              {/* Informações das Caixas Selecionadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Detalhes das Caixas
                  </CardTitle>
                  <CardDescription>
                    Informações das caixas selecionadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCaixas.length > 0 ? (
                    <div className="space-y-4">
                      {/* Resumo Total */}
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-primary">{selectedCaixas.length}</div>
                            <div className="text-xs text-muted-foreground">Caixas Selecionadas</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-primary">{totalQuantidadeSelecionada}</div>
                            <div className="text-xs text-muted-foreground">Total de Equipamentos</div>
                          </div>
                        </div>
                      </div>

                      {/* Detalhes de cada caixa */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Caixas selecionadas:</h4>
                        {caixasSelecionadasData.map((caixa) => (
                          <div key={caixa.id} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold">{caixa.numero_caixa}</p>
                                <p className="text-sm text-muted-foreground">{caixa.equipamento}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-primary">{caixa.quantidade}</div>
                                <div className="text-xs text-muted-foreground">equipamentos</div>
                              </div>
                            </div>
                            <Badge variant={caixa.status === "Disponível" ? "default" : caixa.status === "Em Uso" ? "secondary" : "destructive"}>
                              {caixa.status}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      {/* Lista consolidada de MACs */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Todos os MACs das caixas selecionadas:</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const todosMacs = caixasSelecionadasData
                                .flatMap(caixa => caixa.macs)
                                .map(mac => mac.replace(/:/g, ''))
                                .join(',');
                              navigator.clipboard.writeText(todosMacs);
                              toast({
                                title: "Lista copiada",
                                description: "Lista de todos os MACs copiada para a área de transferência",
                              });
                            }}
                            className="h-8 gap-2"
                          >
                            <Copy className="h-3 w-3" />
                            Copiar Todos
                          </Button>
                        </div>
                        
                        <div className="bg-background border rounded-lg p-4 max-h-48 overflow-y-auto">
                          <div className="font-mono text-sm select-all break-all">
                            {caixasSelecionadasData
                              .flatMap(caixa => caixa.macs)
                              .map(mac => mac.replace(/:/g, ''))
                              .join(',')}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Total de MACs: {caixasSelecionadasData.reduce((total, caixa) => total + caixa.macs.length, 0)}
                        </div>
                      </div>

                      {/* Alertas se alguma caixa não está disponível */}
                      {caixasSelecionadasData.some(caixa => caixa.status !== "Disponível") && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">
                            Algumas caixas selecionadas não estão disponíveis para saída
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione caixas para ver os detalhes</p>
                      <p className="text-sm">Clique nas caixas ao lado para selecioná-las</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Lista de Caixas Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle>Caixas Disponíveis</CardTitle>
                <CardDescription>
                  Lista de todas as caixas cadastradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar caixa..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    {filteredCaixas.map((caixa) => (
                      <div 
                        key={caixa.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedCaixa === caixa.id ? 'border-primary bg-primary/10 shadow-md' : ''
                        }`}
                        onClick={() => {
                          console.log("Selecionando caixa simples:", caixa.id);
                          // Limpar seleção múltipla quando usar seleção simples
                          setSelectedCaixas([]);
                          setSelectedCaixa(caixa.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{caixa.numero_caixa}</p>
                            <p className="text-sm text-muted-foreground">{caixa.equipamento}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{caixa.quantidade} eq.</span>
                          <Badge variant={caixa.status === "Disponível" ? "default" : caixa.status === "Em Uso" ? "secondary" : "destructive"}>
                            {caixa.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saida-multipla" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Seleção Múltipla de Caixas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Selecionar Caixas
                  </CardTitle>
                  <CardDescription>
                    Selecione múltiplas caixas para saída em lote
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {caixasDisponiveis.map((caixa) => (
                      <div 
                        key={caixa.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCaixas.includes(caixa.id) 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => handleMultipleBoxSelection(caixa.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{caixa.numero_caixa}</div>
                            <div className="text-sm text-muted-foreground">
                              {caixa.equipamento} - {caixa.modelo}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{caixa.quantidade}</div>
                            <div className="text-xs text-muted-foreground">equipamentos</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detalhes das Caixas Selecionadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Detalhes da Caixa
                  </CardTitle>
                  <CardDescription>
                    Informações das caixas selecionadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {caixasSelecionadasData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {caixasSelecionadasData.map((caixa) => (
                          <div key={caixa.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div>
                              <div className="font-medium">{caixa.numero_caixa}</div>
                              <div className="text-sm text-muted-foreground">{caixa.equipamento}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{caixa.quantidade}</div>
                              <div className="text-xs text-muted-foreground">equipamentos</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                        <span className="font-medium">Total de Equipamentos:</span>
                        <span className="text-lg font-bold text-primary">{totalQuantidadeSelecionada}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Caixas selecionadas:</span>
                          <span className="text-sm">{caixasSelecionadasData.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Responsável:</span>
                          <span className="text-sm">{caixasSelecionadasData[0]?.responsavel || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma caixa selecionada</p>
                      <p className="text-sm">Selecione caixas na lista ao lado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="separacao" className="space-y-6">
            {/* Passo 1: Lista de MACs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Passo 1: Selecionar Caixa e MACs</CardTitle>
                <CardDescription>
                  Selecione uma caixa para carregar automaticamente os MACs ou cole manualmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Escolha do tipo de seleção */}
                <div className="space-y-3">
                  <Label>Como deseja inserir os MACs?</Label>
                  <RadioGroup 
                    value={tipoSelecaoMac} 
                    onValueChange={(value) => {
                      setTipoSelecaoMac(value);
                      if (value === "manual") {
                        setSelectedCaixaSeparacao("");
                        setMacsParaVerificar("");
                      }
                    }}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="caixa" id="tipoCaixa" />
                      <Label htmlFor="tipoCaixa" className="cursor-pointer">Selecionar Caixa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="tipoManual" />
                      <Label htmlFor="tipoManual" className="cursor-pointer">Inserir MACs Manualmente</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Seleção de caixa (só aparece quando tipo = "caixa") */}
                {tipoSelecaoMac === "caixa" && (
                  <div className="space-y-2">
                    <Label htmlFor="caixaSeparacao">Selecionar Caixa:</Label>
                    <Select value={selectedCaixaSeparacao} onValueChange={(value) => {
                      setSelectedCaixaSeparacao(value);
                      const caixa = caixasDisponiveis.find(c => c.id === value);
                      if (caixa) {
                        setMacsParaVerificar(caixa.macs.join('\n'));
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma caixa para carregar os MACs" />
                      </SelectTrigger>
                      <SelectContent>
                        {caixasDisponiveis.map((caixa) => (
                          <SelectItem key={caixa.id} value={caixa.id}>
                            {caixa.numero_caixa} - {caixa.equipamento} ({caixa.quantidade} MACs)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Informações da caixa selecionada (só aparece quando uma caixa está selecionada) */}
                {tipoSelecaoMac === "caixa" && caixaSeparacaoSelecionada && (
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Equipamento:</span>
                      <span className="text-sm">{caixaSeparacaoSelecionada.equipamento}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quantidade:</span>
                      <span className="text-sm">{caixaSeparacaoSelecionada.quantidade} equipamentos</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={caixaSeparacaoSelecionada.status === "Disponível" ? "default" : caixaSeparacaoSelecionada.status === "Em Uso" ? "secondary" : "destructive"}>
                        {caixaSeparacaoSelecionada.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Campo de MACs (sempre visível) */}
                <div className="space-y-2">
                  <Label htmlFor="macsVerificar">
                    {tipoSelecaoMac === "caixa" ? "MACs da Caixa Selecionada:" : "MACs para Verificar:"}
                  </Label>
                  <Textarea
                    id="macsVerificar"
                    value={macsParaVerificar}
                    onChange={(e) => setMacsParaVerificar(e.target.value)}
                    placeholder={tipoSelecaoMac === "caixa" 
                      ? "Selecione uma caixa acima para carregar os MACs automaticamente..."
                      : "Cole aqui os MACs..."
                    }
                    rows={6}
                    className="font-mono text-sm"
                    disabled={tipoSelecaoMac === "caixa" && !selectedCaixaSeparacao}
                  />
                </div>

                {/* Lista de MACs Carregados */}
                {macsParaVerificar.trim() && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-primary">
                        📝 Lista de MACs Carregados:
                      </h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const macsList = macsParaVerificar.split('\n').filter(mac => mac.trim()).join(',');
                          navigator.clipboard.writeText(macsList);
                          toast({
                            title: "Lista copiada",
                            description: "Lista de MACs copiada para a área de transferência",
                          });
                        }}
                      >
                        Copiar Lista
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {macsParaVerificar.split('\n').filter(mac => mac.trim()).length} MAC(s)
                    </div>
                    <div className="text-xs font-mono text-foreground bg-background/50 p-2 rounded border max-h-20 overflow-y-auto">
                      {macsParaVerificar.split('\n').filter(mac => mac.trim()).join(',,')}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={limparMacs}>
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Passo 2: Dados dos Equipamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-success">Passo 2: Dados dos Equipamentos</CardTitle>
                <CardDescription>
                  Cole aqui os dados dos equipamentos no formato do sistema (aceita MAC com ou sem :)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dadosEquipamentos">Dados dos Equipamentos:</Label>
                  <Textarea
                    id="dadosEquipamentos"
                    value={dadosEquipamentos}
                    onChange={(e) => setDadosEquipamentos(e.target.value)}
                    placeholder="Cole aqui os dados dos equipamentos..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Processamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Processamento</CardTitle>
                <CardDescription>
                  Clique no botão abaixo para verificar quais MACs da lista foram encontrados nos dados dos equipamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={processarComparacao}
                  className="w-full"
                  disabled={!macsParaVerificar.trim() || !dadosEquipamentos.trim()}
                >
                  <Split className="h-4 w-4 mr-2" />
                  Verificar MACs
                </Button>

                {/* Resultado do Processamento */}
                {(Object.keys(resultadoProcessamento.grupos).length > 0 || resultadoProcessamento.naoEncontrados.length > 0) && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 border rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        📋 Lista Organizada por Localização:
                      </h3>
                      
                      {/* Grupos por localização */}
                      {Object.entries(resultadoProcessamento.grupos).map(([local, macs]) => (
                        <div key={local} className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-blue-800">{local}</h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 border-blue-300 hover:bg-blue-100"
                              onClick={() => {
                                const macsList = macs.join(',');
                                navigator.clipboard.writeText(macsList);
                                toast({
                                  title: "Lista copiada",
                                  description: `Lista de ${local} copiada para a área de transferência`,
                                });
                              }}
                            >
                              Copiar
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-xs font-mono text-blue-700 bg-blue-100/50 p-2 rounded break-all">
                              {macs.join(',')}
                            </div>
                            <div className="text-sm text-blue-600">
                              {macs.length} MAC(s)
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Equipamentos não encontrados */}
                      {resultadoProcessamento.naoEncontrados.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-red-800 flex items-center gap-2">
                              ❌ Equipamentos Não Encontrados
                            </h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-100"
                              onClick={() => {
                                const macsList = resultadoProcessamento.naoEncontrados.join(',');
                                navigator.clipboard.writeText(macsList);
                                toast({
                                  title: "Lista copiada",
                                  description: "MACs não encontrados copiados para a área de transferência",
                                });
                              }}
                            >
                              Copiar MACs Não Encontrados
                            </Button>
                          </div>
                          <div className="text-xs font-mono text-red-700 bg-red-100/50 p-2 rounded mb-2">
                            {resultadoProcessamento.naoEncontrados.map((mac, index) => (
                              <span key={mac}>
                                {mac}{index < resultadoProcessamento.naoEncontrados.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                          <div className="text-sm text-red-600">
                            {resultadoProcessamento.naoEncontrados.length} MAC(S)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para Criar RMA */}
        <Dialog open={showRMADialog} onOpenChange={setShowRMADialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo RMA</DialogTitle>
              <DialogDescription>
                Preencha as informações para criar uma solicitação de RMA
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Equipamento *</Label>
                  <EquipmentSelector
                    onSelect={handleEquipmentSelectRMA}
                    selectedEquipment={selectedEquipmentRMA}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={rmaData.modelo}
                    onChange={(e) => setRmaData(prev => ({ ...prev, modelo: e.target.value }))}
                    placeholder="Modelo do equipamento"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereços MAC</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentMacRMA}
                    onChange={(e) => setCurrentMacRMA(e.target.value)}
                    placeholder="Ex: C85A9FC7B9C0 ou C8:5A:9F:C7:B9:C0"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addMacAddressRMA(currentMacRMA);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={() => addMacAddressRMA(currentMacRMA)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {macsRMA.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm font-medium">MACs adicionados:</div>
                    <div className="flex flex-wrap gap-1">
                      {macsRMA.map((mac, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="flex items-center gap-1"
                        >
                          {mac}
                          <button
                            onClick={() => removeMacRMA(mac)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origem">Origem do Equipamento *</Label>
                  <Input
                    id="origem"
                    value={rmaData.origem_equipamento}
                    onChange={(e) => setRmaData(prev => ({ ...prev, origem_equipamento: e.target.value }))}
                    placeholder="Ex: Estoque, Cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destino">Destino de Envio *</Label>
                  <Input
                    id="destino"
                    value={rmaData.destino_envio}
                    onChange={(e) => setRmaData(prev => ({ ...prev, destino_envio: e.target.value }))}
                    placeholder="Ex: Laboratório, Fornecedor"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defeito">Defeito Relatado *</Label>
                <Textarea
                  id="defeito"
                  value={rmaData.defeito_relatado}
                  onChange={(e) => setRmaData(prev => ({ ...prev, defeito_relatado: e.target.value }))}
                  placeholder="Descreva o defeito relatado"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tecnico">Técnico Responsável</Label>
                  <Select value={rmaData.tecnico_responsavel} onValueChange={(value) => setRmaData(prev => ({ ...prev, tecnico_responsavel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o técnico" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg">
                      {funcionariosAprovados.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.nome}>
                          {funcionario.nome} - {funcionario.funcao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nota-fiscal">Nota Fiscal</Label>
                  <Input
                    id="nota-fiscal"
                    value={rmaData.nota_fiscal}
                    onChange={(e) => setRmaData(prev => ({ ...prev, nota_fiscal: e.target.value }))}
                    placeholder="Número da nota fiscal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={rmaData.observacoes}
                  onChange={(e) => setRmaData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Anexos</Label>
                <FileUploadRMA onFilesChange={setAnexosRMA} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRMADialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRMA} disabled={rmaLoading}>
                {rmaLoading ? "Criando..." : "Criar RMA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}