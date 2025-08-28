import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Calendar, User, FileText, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSupabaseRecebimentos } from "@/hooks/useSupabaseRecebimentos";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EquipmentSelector } from "@/components/defeitos/EquipmentSelector";


interface ItemRecebimento {
  id?: string;
  produto_nome: string;
  modelo: string;
  quantidade: number;
  observacoes?: string;
}

interface Recebimento {
  id: string;
  numero_documento: string;
  origem: string;
  responsavel_recebimento: string;
  data_recebimento: string;
  observacoes?: string;
  created_at: string;
  itens?: ItemRecebimento[];
}

export default function Recebimentos() {
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [estoqueRecebimento, setEstoqueRecebimento] = useState<{[modelo: string]: number}>({});
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filtroData, setFiltroData] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("");
  const [selectedEquipmentItem, setSelectedEquipmentItem] = useState<any>(null);
  const { toast } = useToast();

  const [novoRecebimento, setNovoRecebimento] = useState({
    origem: "",
    responsavel_recebimento: "",
    data_recebimento: new Date().toISOString().split('T')[0],
    observacoes: "",
    itens: [] as ItemRecebimento[]
  });

  const [novoItem, setNovoItem] = useState<ItemRecebimento>({
    produto_nome: "",
    modelo: "",
    quantidade: 0,
    observacoes: ""
  });

  // Auto-sync equipment selection
  useEffect(() => {
    if (selectedEquipmentItem) {
      setNovoItem(prev => ({
        ...prev,
        produto_nome: selectedEquipmentItem.nome,
        modelo: selectedEquipmentItem.modelo
      }));
    }
  }, [selectedEquipmentItem]);

  useEffect(() => {
    fetchRecebimentos();
    fetchEstoqueRecebimento();
    fetchEquipamentos();
    fetchFuncionarios();
  }, []);

  const fetchEquipamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, nome, modelo, marca')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setEquipamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    }
  };

  const fetchFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, cargo, departamento')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
    }
  };

  const fetchRecebimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('recebimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar itens para cada recebimento
      const recebimentosComItens = await Promise.all(
        (data || []).map(async (recebimento) => {
          const { data: itens, error: itensError } = await supabase
            .from('itens_recebimento')
            .select('*')
            .eq('recebimento_id', recebimento.id);

          if (itensError) throw itensError;
          
          return { ...recebimento, itens: itens || [] };
        })
      );

      setRecebimentos(recebimentosComItens);
    } catch (error) {
      console.error('Erro ao buscar recebimentos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar recebimentos",
        variant: "destructive",
      });
    }
  };

  const fetchEstoqueRecebimento = async () => {
    try {
      const { data, error } = await supabase
        .from('estoque_recebimento')
        .select('*');

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

  const adicionarItem = () => {
    if (!novoItem.produto_nome || !novoItem.modelo || novoItem.quantidade <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios do item",
        variant: "destructive",
      });
      return;
    }

    setNovoRecebimento(prev => ({
      ...prev,
      itens: [...prev.itens, { ...novoItem }]
    }));

    setNovoItem({
      produto_nome: "",
      modelo: "",
      quantidade: 0,
      observacoes: ""
    });
    setSelectedEquipmentItem(null);
  };

  const removerItem = (index: number) => {
    setNovoRecebimento(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const salvarRecebimento = async () => {
    if (!novoRecebimento.origem || 
        !novoRecebimento.responsavel_recebimento || novoRecebimento.itens.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e adicione pelo menos um item",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Inserir recebimento
      const { data: recebimentoData, error: recebimentoError } = await supabase
        .from('recebimentos')
        .insert([{
          numero_documento: `REC-${Date.now()}`, // Auto-generate document number
          origem: novoRecebimento.origem,
          responsavel_recebimento: novoRecebimento.responsavel_recebimento,
          data_recebimento: novoRecebimento.data_recebimento,
          observacoes: novoRecebimento.observacoes
        }])
        .select()
        .single();

      if (recebimentoError) throw recebimentoError;

      // Inserir itens do recebimento
      const itensParaInserir = novoRecebimento.itens.map(item => ({
        recebimento_id: recebimentoData.id,
        produto_nome: item.produto_nome,
        modelo: item.modelo,
        quantidade: item.quantidade,
        observacoes: item.observacoes
      }));

      const { error: itensError } = await supabase
        .from('itens_recebimento')
        .insert(itensParaInserir);

      if (itensError) throw itensError;

      // Atualizar estoque de recebimento
      for (const item of novoRecebimento.itens) {
        const { data: estoqueExistente, error: estoqueError } = await supabase
          .from('estoque_recebimento')
          .select('*')
          .eq('modelo', item.modelo)
          .maybeSingle();

        if (estoqueError) throw estoqueError;

        if (estoqueExistente) {
          // Atualizar quantidade existente
          const { error: updateError } = await supabase
            .from('estoque_recebimento')
            .update({ 
              quantidade_disponivel: estoqueExistente.quantidade_disponivel + item.quantidade 
            })
            .eq('modelo', item.modelo);

          if (updateError) throw updateError;
        } else {
          // Criar novo registro de estoque
          const { error: insertError } = await supabase
            .from('estoque_recebimento')
            .insert([{
              modelo: item.modelo,
              quantidade_disponivel: item.quantidade
            }]);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Recebimento registrado com sucesso",
      });

      // Reset form
      setNovoRecebimento({
        origem: "",
        responsavel_recebimento: "",
        data_recebimento: new Date().toISOString().split('T')[0],
        observacoes: "",
        itens: []
      });

      setIsDialogOpen(false);
      fetchRecebimentos();
      fetchEstoqueRecebimento();
    } catch (error) {
      console.error('Erro ao salvar recebimento:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar recebimento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const recebimentosFiltrados = recebimentos.filter(recebimento => {
    const matchData = !filtroData || recebimento.data_recebimento.includes(filtroData);
    const matchOrigem = !filtroOrigem || recebimento.origem.toLowerCase().includes(filtroOrigem.toLowerCase());
    const matchModelo = !filtroModelo || (recebimento.itens || []).some(item => 
      item.modelo.toLowerCase().includes(filtroModelo.toLowerCase())
    );
    
    return matchData && matchOrigem && matchModelo;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recebimentos</h1>
            <p className="text-muted-foreground">Gestão de entrada de produtos no estoque</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-gradient-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Recebimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Novo Recebimento</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Dados do Recebimento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origem">Origem *</Label>
                    <Input
                      id="origem"
                      value={novoRecebimento.origem}
                      onChange={(e) => setNovoRecebimento(prev => ({ ...prev, origem: e.target.value }))}
                      placeholder="Ex: Fornecedor ABC"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="responsavel">Responsável *</Label>
                    <Select
                      value={novoRecebimento.responsavel_recebimento}
                      onValueChange={(value) => setNovoRecebimento(prev => ({ ...prev, responsavel_recebimento: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.nome}>
                            {funcionario.nome} {funcionario.cargo && `- ${funcionario.cargo}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="data_recebimento">Data do Recebimento</Label>
                    <Input
                      id="data_recebimento"
                      type="date"
                      value={novoRecebimento.data_recebimento}
                      onChange={(e) => setNovoRecebimento(prev => ({ ...prev, data_recebimento: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={novoRecebimento.observacoes}
                    onChange={(e) => setNovoRecebimento(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais..."
                  />
                </div>

                <Separator />

                {/* Adicionar Itens */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Itens do Recebimento</h3>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <EquipmentSelector
                        onSelect={setSelectedEquipmentItem}
                        selectedEquipment={selectedEquipmentItem}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="modelo">Modelo *</Label>
                      <Input
                        id="modelo"
                        value={novoItem.modelo}
                        onChange={(e) => setNovoItem(prev => ({ ...prev, modelo: e.target.value }))}
                        placeholder="Modelo (preenchido automaticamente)"
                        disabled={!!novoItem.produto_nome}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {novoItem.produto_nome ? 
                          "Modelo preenchido automaticamente com base no equipamento selecionado" :
                          "Selecione um equipamento para preencher automaticamente"
                        }
                        {novoItem.modelo && estoqueRecebimento[novoItem.modelo] && (
                          <span> • Estoque atual: {estoqueRecebimento[novoItem.modelo]} unidades</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="quantidade">Quantidade *</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={novoItem.quantidade}
                        onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button onClick={adicionarItem} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="observacoes_item">Observações do Item</Label>
                    <Input
                      id="observacoes_item"
                      value={novoItem.observacoes}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Observações específicas do item..."
                    />
                  </div>

                  {/* Lista de Itens Adicionados */}
                  {novoRecebimento.itens.length > 0 && (
                    <div className="border rounded-lg p-4 space-y-2">
                      <h4 className="font-medium">Itens Adicionados:</h4>
                      {novoRecebimento.itens.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                          <span>{item.produto_nome} - {item.modelo} (Qtd: {item.quantidade})</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={salvarRecebimento} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar Recebimento"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs removidas - agora apenas uma seção */}
        <div className="space-y-6">
          <Card className="bg-gradient-subtle border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Estoque de Recebimento por Modelo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Quantidade total de equipamentos recebidos por modelo
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(estoqueRecebimento).map(([modelo, quantidade]) => (
                  <div key={modelo} className="bg-card p-4 rounded-lg border hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-foreground">{modelo}</div>
                      <Badge variant={quantidade > 0 ? "default" : "secondary"}>
                        {quantidade > 0 ? "Disponível" : "Vazio"}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-primary">{quantidade}</div>
                    <div className="text-xs text-muted-foreground">unidades recebidas</div>
                  </div>
                ))}
                {Object.keys(estoqueRecebimento).length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Nenhum modelo no estoque de recebimento</p>
                    <p className="text-xs">Registre um recebimento para ver os modelos aqui</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label htmlFor="filtro_origem">Origem</Label>
                  <Input
                    id="filtro_origem"
                    value={filtroOrigem}
                    onChange={(e) => setFiltroOrigem(e.target.value)}
                    placeholder="Buscar por origem..."
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

          {/* Lista de Recebimentos */}
          <div className="grid gap-4">
            {recebimentosFiltrados.map((recebimento) => (
              <Card key={recebimento.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {recebimento.numero_documento}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(recebimento.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {recebimento.responsavel_recebimento}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary">{recebimento.origem}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {recebimento.observacoes && (
                    <p className="text-muted-foreground mb-4">{recebimento.observacoes}</p>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Itens Recebidos:</h4>
                    <div className="grid gap-2">
                      {(recebimento.itens || []).map((item, index) => (
                        <div key={index} className="bg-muted p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{item.produto_nome}</div>
                              <div className="text-sm text-muted-foreground">
                                Modelo: {item.modelo} | Quantidade: {item.quantidade}
                              </div>
                              {item.observacoes && (
                                <div className="text-xs text-muted-foreground mt-1">{item.observacoes}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {recebimentosFiltrados.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum recebimento encontrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}