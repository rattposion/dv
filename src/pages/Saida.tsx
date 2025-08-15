import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Package, TruckIcon as Truck, AlertTriangle, Calendar, User, Split } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useInventario } from "@/contexts/InventarioContext";
import { useEstoque } from "@/contexts/EstoqueContext";
import { useHistorico } from "@/contexts/HistoricoContext";
import { useInventarioEstoqueSync } from "@/hooks/useInventarioEstoqueSync";

export default function Saida() {
  const [selectedCaixa, setSelectedCaixa] = useState("");
  const [selectedCaixaSeparacao, setSelectedCaixaSeparacao] = useState("");
  const [tipoSelecaoMac, setTipoSelecaoMac] = useState("caixa"); // "caixa" ou "manual"
  const [responsavelSaida, setResponsavelSaida] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [macsParaVerificar, setMacsParaVerificar] = useState("");
  const [dadosEquipamentos, setDadosEquipamentos] = useState("");
  const [resultadoProcessamento, setResultadoProcessamento] = useState<{
    grupos: { [key: string]: string[] };
    naoEncontrados: string[];
  }>({ grupos: {}, naoEncontrados: [] });
  const { toast } = useToast();
  const { caixas: caixasDisponiveis, removeCaixa } = useInventario();
  const { diminuirEstoque, getEstoquePorModelo } = useEstoque();
  const { addOperacao } = useHistorico();
  
  // Sincroniza inventário com estoque automaticamente
  useInventarioEstoqueSync();

  const filteredCaixas = caixasDisponiveis.filter(caixa =>
    caixa.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caixa.equipamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegistrarSaida = () => {
    if (!selectedCaixa || !responsavelSaida || !destino) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios (motivo é opcional)",
        variant: "destructive",
      });
      return;
    }

    const caixa = caixasDisponiveis.find(c => c.id === selectedCaixa);
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

    // Registrar a operação no histórico
    addOperacao({
      tipo: "saida",
      usuario: responsavelSaida,
      caixaId: selectedCaixa,
      equipamento: caixa.equipamento,
      modelo: caixa.modelo,
      quantidade: caixa.quantidade,
      destino,
      observacao: motivo
    });

    // Remove a caixa do inventário
    removeCaixa(selectedCaixa);

    const novoEstoque = getEstoquePorModelo(caixa.modelo);
    toast({
      title: "Saída registrada",
      description: `Saída da caixa ${selectedCaixa} registrada. Estoque ${caixa.modelo}: ${novoEstoque}`,
    });

    // Limpar formulário
    setSelectedCaixa("");
    setResponsavelSaida("");
    setDestino("");
    setMotivo("");
  };

  const caixaSelecionada = caixasDisponiveis.find(caixa => caixa.id === selectedCaixa);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Saídas</h1>
            <p className="text-muted-foreground">Registre a saída de caixas e faça separações</p>
          </div>
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
                    <Label htmlFor="caixa">Caixa *</Label>
                    <Select value={selectedCaixa} onValueChange={setSelectedCaixa}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {caixasDisponiveis.map((caixa) => (
                          <SelectItem key={caixa.id} value={caixa.id}>
                            {caixa.id} - {caixa.equipamento}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Input
                      id="responsavel"
                      value={responsavelSaida}
                      onChange={(e) => setResponsavelSaida(e.target.value)}
                      placeholder="Nome do responsável"
                    />
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

                  <Button 
                    onClick={handleRegistrarSaida}
                    className="w-full"
                    disabled={!selectedCaixa || !responsavelSaida || !destino}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Registrar Saída
                  </Button>
                </CardContent>
              </Card>

              {/* Informações da Caixa Selecionada */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Detalhes da Caixa
                  </CardTitle>
                  <CardDescription>
                    Informações da caixa selecionada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {caixaSelecionada ? (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-semibold">{caixaSelecionada.id}</p>
                            <p className="text-sm text-muted-foreground">{caixaSelecionada.equipamento}</p>
                          </div>
                          <Badge variant={caixaSelecionada.status === "Disponível" ? "default" : caixaSelecionada.status === "Em Uso" ? "secondary" : "destructive"}>
                            {caixaSelecionada.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold text-primary">{caixaSelecionada.quantidade}</div>
                            <div className="text-xs text-muted-foreground">Equipamentos</div>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="text-sm font-medium">{caixaSelecionada.responsavel}</div>
                            <div className="text-xs text-muted-foreground">Responsável</div>
                          </div>
                        </div>

                        {/* Lista de MACs */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">MACs dos Equipamentos:</h4>
                          <div className="space-y-1">
                            {caixaSelecionada.macs.map((mac, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                                <span className="text-sm font-mono">{mac}</span>
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {caixaSelecionada.status !== "Disponível" && (
                          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-sm text-destructive">
                              Esta caixa não está disponível para saída
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione uma caixa para ver os detalhes</p>
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
                          selectedCaixa === caixa.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedCaixa(caixa.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{caixa.id}</p>
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
                            {caixa.id} - {caixa.equipamento} ({caixa.quantidade} MACs)
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
      </div>
    </DashboardLayout>
  );
}