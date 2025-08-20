import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Calendar, User, Search, FileWarning, Camera, ExternalLink, Package, X, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileUploadDefeitos } from "@/components/defeitos/FileUploadDefeitos";
import { useSupabaseRecebimentos } from "@/hooks/useSupabaseRecebimentos";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EquipmentSelector } from "@/components/defeitos/EquipmentSelector";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";

interface Defeito {
  id: string;
  equipamento: string;
  modelo: string;
  quantidade: number;
  tipo_defeito: string;
  responsavel: string;
  data_registro: string;
  observacoes?: string;
  origem?: string;
  created_at: string;
  foto_url?: string;
  destino?: string;
  descricao_defeito?: string;
  macs?: string[];
}

const TIPOS_DEFEITO = [
  { value: "queimado", label: "Queimado", color: "destructive" },
  { value: "defeito_fabrica", label: "Defeito de Fábrica", color: "destructive" },
  { value: "dano_transporte", label: "Dano no Transporte", color: "secondary" },
  { value: "defeito_funcionamento", label: "Defeito de Funcionamento", color: "secondary" },
  { value: "dano_manuseio", label: "Dano no Manuseio", color: "outline" },
  { value: "obsolescencia", label: "Obsolescência", color: "outline" },
  { value: "outros", label: "Outros", color: "outline" },
];

const DESTINOS = [
  { value: "descartado", label: "Descartado" },
  { value: "garantia", label: "Enviado para Garantia" },
  { value: "reparo", label: "Enviado para Reparo" },
  { value: "reciclagem", label: "Reciclagem" },
  { value: "doacao", label: "Doação" },
  { value: "outros", label: "Outros" },
];

export default function Defeitos() {
  const [defeitos, setDefeitos] = useState<Defeito[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("");
  const [modeloSelecionado, setModeloSelecionado] = useState("");
  const [estoqueRecebimento, setEstoqueRecebimento] = useState<{[modelo: string]: number}>({});
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const { toast } = useToast();
  const { diminuirEstoqueRecebimento, getEstoqueDisponivel } = useSupabaseRecebimentos();
  const { funcionariosAprovados } = useFuncionario();
  const { equipamentos } = useEquipamento();

  const [novoDefeito, setNovoDefeito] = useState({
    equipamento: "",
    modelo: "",
    quantidade: 0,
    tipo_defeito: "",
    responsavel: "",
    data_registro: new Date().toISOString().split('T')[0],
    observacoes: "",
    origem: "",
    foto_url: "",
    destino: "",
    descricao_defeito: "",
    macs: [] as string[]
  });

  // Auto-calculate quantity based on selected equipment's MACs
  useEffect(() => {
    if (selectedEquipment) {
      const equipmentData = equipamentos.find(eq => eq.id === selectedEquipment.id);
      const macCount = equipmentData?.mac ? 1 : 0; // For now, assuming 1 MAC per equipment
      setNovoDefeito(prev => ({
        ...prev,
        equipamento: selectedEquipment.nome,
        modelo: selectedEquipment.modelo,
        quantidade: macCount || 1,
        macs: equipmentData?.mac ? [equipmentData.mac] : []
      }));
    }
  }, [selectedEquipment, equipamentos]);

  useEffect(() => {
    fetchDefeitos();
    fetchEstoqueRecebimento();
  }, []);

  const fetchEstoqueRecebimento = async () => {
    try {
      const { data, error } = await supabase
        .from('estoque_recebimento')
        .select('*')
        .order('modelo');

      if (error) throw error;
      
      const estoque: {[modelo: string]: number} = {};
      (data || []).forEach(item => {
        estoque[item.modelo] = item.quantidade_disponivel;
      });
      
      setEstoqueRecebimento(estoque);
    } catch (error) {
      console.error('Erro ao buscar estoque de recebimento:', error);
    }
  };

  const fetchDefeitos = async () => {
    try {
      const { data, error } = await supabase
        .from('defeitos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDefeitos(data || []);
    } catch (error) {
      console.error('Erro ao buscar defeitos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar registros de defeitos",
        variant: "destructive",
      });
    }
  };

  const salvarDefeito = async () => {
    if (!novoDefeito.equipamento || !novoDefeito.modelo || !novoDefeito.tipo_defeito || 
        !novoDefeito.responsavel || novoDefeito.quantidade <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Verificar estoque de recebimento disponível
    const estoqueDisponivel = getEstoqueDisponivel(novoDefeito.modelo);
    if (estoqueDisponivel < novoDefeito.quantidade) {
      toast({
        title: "Estoque Insuficiente",
        description: `Apenas ${estoqueDisponivel} unidades disponíveis no estoque de recebimento para o modelo ${novoDefeito.modelo}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Inserir defeito
      const { error } = await supabase
        .from('defeitos')
        .insert([novoDefeito]);

      if (error) throw error;

      // Diminuir estoque de recebimento
      const estoqueReduzido = await diminuirEstoqueRecebimento(novoDefeito.modelo, novoDefeito.quantidade);
      
      if (!estoqueReduzido) {
        throw new Error('Falha ao reduzir estoque de recebimento');
      }

      toast({
        title: "Sucesso",
        description: `Defeito registrado e ${novoDefeito.quantidade} unidades removidas do estoque de recebimento`,
      });

      // Reset form
      setNovoDefeito({
        equipamento: "",
        modelo: "",
        quantidade: 0,
        tipo_defeito: "",
        responsavel: "",
        data_registro: new Date().toISOString().split('T')[0],
        observacoes: "",
        origem: "",
        foto_url: "",
        destino: "",
        descricao_defeito: "",
        macs: []
      });
      setSelectedEquipment(null);

      setIsDialogOpen(false);
      fetchDefeitos();
      fetchEstoqueRecebimento();
    } catch (error) {
      console.error('Erro ao salvar defeito:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar defeito",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const defeitosFiltrados = defeitos.filter(defeito => {
    const matchTipo = !filtroTipo || filtroTipo === "todos" || defeito.tipo_defeito === filtroTipo;
    const matchData = !filtroData || defeito.data_registro.includes(filtroData);
    const matchModelo = !filtroModelo || defeito.modelo.toLowerCase().includes(filtroModelo.toLowerCase());
    
    return matchTipo && matchData && matchModelo;
  });

  const getTotalPorTipo = (tipo: string) => {
    return defeitos
      .filter(d => d.tipo_defeito === tipo)
      .reduce((total, d) => total + d.quantidade, 0);
  };

  const getCorBadge = (tipo: string) => {
    const tipoDefeito = TIPOS_DEFEITO.find(t => t.value === tipo);
    return tipoDefeito?.color || "secondary";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Queimados/Defeitos</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Registro de equipamentos com problemas</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Defeito
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Registrar Novo Defeito</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <EquipmentSelector
                    onSelect={setSelectedEquipment}
                    selectedEquipment={selectedEquipment}
                  />
                </div>
                
                <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 space-y-4 sm:space-y-0">
                  <div>
                  <Label htmlFor="quantidade">Quantidade (Auto-calculado)</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    value={novoDefeito.quantidade}
                    disabled
                    className="bg-muted"
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculado automaticamente baseado nos MACs do equipamento
                  </p>
                  </div>
                
                  <div>
                  <Label htmlFor="tipo_defeito">Tipo de Defeito *</Label>
                  <Select 
                    value={novoDefeito.tipo_defeito} 
                    onValueChange={(value) => setNovoDefeito(prev => ({ ...prev, tipo_defeito: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DEFEITO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                </div>
                
                <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 space-y-4 sm:space-y-0">
                  <div>
                  <Label htmlFor="responsavel">Responsável *</Label>
                  <Select 
                    value={novoDefeito.responsavel} 
                    onValueChange={(value) => setNovoDefeito(prev => ({ ...prev, responsavel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionariosAprovados.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.nome}>
                          {funcionario.nome} - {funcionario.funcao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                
                  <div>
                  <Label htmlFor="data_registro">Data do Registro</Label>
                  <Input
                    id="data_registro"
                    type="date"
                    value={novoDefeito.data_registro}
                    onChange={(e) => setNovoDefeito(prev => ({ ...prev, data_registro: e.target.value }))}
                  />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="descricao_defeito">Descrição do Defeito *</Label>
                <Textarea
                  id="descricao_defeito"
                  value={novoDefeito.descricao_defeito}
                  onChange={(e) => setNovoDefeito(prev => ({ ...prev, descricao_defeito: e.target.value }))}
                  placeholder="Descreva detalhadamente o defeito encontrado..."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="destino">Destino do Item</Label>
                <Select 
                  value={novoDefeito.destino} 
                  onValueChange={(value) => setNovoDefeito(prev => ({ ...prev, destino: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINOS.map((destino) => (
                      <SelectItem key={destino.value} value={destino.value}>
                        {destino.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="origem">Origem</Label>
                <Input
                  id="origem"
                  value={novoDefeito.origem}
                  onChange={(e) => setNovoDefeito(prev => ({ ...prev, origem: e.target.value }))}
                  placeholder="De onde veio o equipamento defeituoso"
                />
              </div>

              {/* MAC Addresses */}
              <div>
                <Label htmlFor="macs">MAC Addresses dos Equipamentos</Label>
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="new-mac"
                      placeholder="Digite o MAC address (ex: 00:11:22:33:44:55)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const mac = input.value.trim();
                          if (mac && !novoDefeito.macs.includes(mac)) {
                            setNovoDefeito(prev => ({ 
                              ...prev, 
                              macs: [...prev.macs, mac] 
                            }));
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        const input = document.getElementById('new-mac') as HTMLInputElement;
                        const mac = input.value.trim();
                        if (mac && !novoDefeito.macs.includes(mac)) {
                          setNovoDefeito(prev => ({ 
                            ...prev, 
                            macs: [...prev.macs, mac] 
                          }));
                          input.value = '';
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Lista de MACs adicionados */}
                  {novoDefeito.macs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {novoDefeito.macs.map((mac, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          <span className="font-mono text-xs">{mac}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => {
                              setNovoDefeito(prev => ({
                                ...prev,
                                macs: prev.macs.filter((_, i) => i !== index)
                              }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Digite um MAC address e pressione Enter ou clique no botão + para adicionar
                  </p>
                </div>
              </div>

              <FileUploadDefeitos
                onFileUploaded={(url) => setNovoDefeito(prev => ({ ...prev, foto_url: url }))}
                currentFile={novoDefeito.foto_url}
                onRemove={() => setNovoDefeito(prev => ({ ...prev, foto_url: "" }))}
              />
              
              <div>
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={novoDefeito.observacoes}
                  onChange={(e) => setNovoDefeito(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações complementares..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={salvarDefeito} disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Salvando..." : "Salvar Defeito"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estoque por Modelo */}
      <Card className="bg-gradient-subtle border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Estoque de Recebimento por Modelo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Object.entries(estoqueRecebimento).map(([modelo, quantidade]) => (
              <div key={modelo} className="bg-card p-3 sm:p-4 rounded-lg border">
                <div className="text-xs sm:text-sm font-medium truncate" title={modelo}>{modelo}</div>
                <div className="text-xl sm:text-2xl font-bold text-primary">{quantidade}</div>
                <div className="text-xs text-muted-foreground">unidades disponíveis</div>
              </div>
            ))}
            {Object.keys(estoqueRecebimento).length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                Nenhum modelo no estoque de recebimento
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TIPOS_DEFEITO.map((tipo) => (
          <Card key={tipo.value} className="bg-gradient-subtle border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  {tipo.label}
                </span>
                <Badge variant={getCorBadge(tipo.value) as any}>
                  {getTotalPorTipo(tipo.value)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {getTotalPorTipo(tipo.value)} unidades
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filtro_tipo">Tipo de Defeito</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {TIPOS_DEFEITO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filtro_data">Data</Label>
              <Input
                id="filtro_data"
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filtro_modelo">Modelo</Label>
              <Input
                id="filtro_modelo"
                value={filtroModelo}
                onChange={(e) => setFiltroModelo(e.target.value)}
                placeholder="Buscar por modelo..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Defeitos */}
      <div className="grid gap-4">
        {defeitosFiltrados.map((defeito) => (
          <Card key={defeito.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileWarning className="h-5 w-5" />
                    {defeito.equipamento} - {defeito.modelo}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(defeito.data_registro), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {defeito.responsavel}
                    </span>
                    <span>Quantidade: {defeito.quantidade}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getCorBadge(defeito.tipo_defeito) as any}>
                    {TIPOS_DEFEITO.find(t => t.value === defeito.tipo_defeito)?.label}
                  </Badge>
                  {defeito.origem && (
                    <Badge variant="outline">{defeito.origem}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {defeito.descricao_defeito && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Descrição do Defeito:</h4>
                  <p className="text-muted-foreground text-xs sm:text-sm break-words">{defeito.descricao_defeito}</p>
                </div>
              )}
              
              {defeito.destino && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Destino:</h4>
                  <Badge variant="outline">
                    {DESTINOS.find(d => d.value === defeito.destino)?.label || defeito.destino}
                  </Badge>
                </div>
              )}
              
              {defeito.foto_url && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Foto do Defeito:</h4>
                  <a 
                    href={defeito.foto_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Camera className="h-4 w-4" />
                    Ver imagem
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              {defeito.macs && defeito.macs.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-xs sm:text-sm mb-2">MAC Addresses:</h4>
                  <div className="flex flex-wrap gap-1">
                    {defeito.macs.map((mac, index) => (
                      <Badge key={index} variant="outline" className="font-mono text-xs break-all">
                        <Monitor className="h-3 w-3 mr-1 flex-shrink-0" />
                        {mac}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {defeito.observacoes && (
                <div>
                  <h4 className="font-medium text-xs sm:text-sm mb-2">Observações Adicionais:</h4>
                  <p className="text-muted-foreground text-xs sm:text-sm break-words">{defeito.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {defeitosFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum defeito encontrado</p>
            </CardContent>
          </Card>
       )}
     </div>
   </div>
   </DashboardLayout>
 );
}