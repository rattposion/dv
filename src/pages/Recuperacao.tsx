import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, CheckCircle2, AlertCircle, Trash2, Copy, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseRecuperacoes } from "@/hooks/useSupabaseRecuperacoes";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EquipmentSelector } from "@/components/defeitos/EquipmentSelector";
import { useSupabaseEquipamentos } from "@/hooks/useSupabaseEquipamentos";
import { useSupabaseFuncionarios } from "@/hooks/useSupabaseFuncionarios";
import { useAuth } from "@/contexts/AuthContext";
import { useMacValidation } from "@/hooks/useMacValidation";

export default function Recuperacao() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { equipamentos } = useSupabaseEquipamentos();
  const { funcionarios } = useSupabaseFuncionarios();
  const { 
    recuperacoes, 
    loading, 
    createRecuperacao, 
    updateRecuperacao,
    deleteRecuperacao
  } = useSupabaseRecuperacoes();

  // Estados para recuperação
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [problema, setProblema] = useState("");
  const [solucao, setSolucao] = useState("");
  const [macAtual, setMacAtual] = useState("");
  const [macs, setMacs] = useState<string[]>([]);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState("");

  // Estados para edição
  const [editingRecuperacao, setEditingRecuperacao] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEquipamento, setEditEquipamento] = useState("");
  const [editProblema, setEditProblema] = useState("");
  const [editSolucao, setEditSolucao] = useState("");
  const [editMacs, setEditMacs] = useState<string[]>([]);
  const [editMacAtual, setEditMacAtual] = useState("");
  const [editResponsavel, setEditResponsavel] = useState("");

  const funcionariosAtivos = funcionarios.filter(f => f.status === 'Ativo');

  // Verificar se o usuário é admin (Wesley ou admin role)
  const isAdmin = user?.email === 'wesleyalves.cs@gmail.com' || user?.user_metadata?.role === 'admin';

  // Auto-sync equipment selection
  useEffect(() => {
    if (selectedEquipment) {
      setEquipamentoSelecionado(selectedEquipment.nome);
    }
  }, [selectedEquipment]);

  const { formatMacAddress, validateMacFormat, checkMacExistsWithRecoveryRule } = useMacValidation();

  // Função para abrir modal de edição
  const openEditModal = (recuperacao: any) => {
    setEditingRecuperacao(recuperacao);
    setEditEquipamento(recuperacao.equipamento);
    setEditProblema(recuperacao.problema);
    setEditSolucao(recuperacao.solucao);
    setEditMacs([...recuperacao.macs]);
    setEditResponsavel(recuperacao.responsavel);
    setEditMacAtual("");
    setEditModalOpen(true);
  };

  // Função para fechar modal de edição
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingRecuperacao(null);
    setEditEquipamento("");
    setEditProblema("");
    setEditSolucao("");
    setEditMacs([]);
    setEditResponsavel("");
    setEditMacAtual("");
  };

  // Função para adicionar MAC na edição
  const adicionarMacEdicao = () => {
    if (!editMacAtual.trim()) {
      toast({
        variant: "destructive",
        title: "MAC inválido",
        description: "Digite um endereço MAC válido"
      });
      return;
    }

    const macFormatado = formatMacAddress(editMacAtual);
    
    if (!validateMacFormat(macFormatado)) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "O MAC deve ter o formato XX:XX:XX:XX:XX:XX"
      });
      return;
    }

    if (editMacs.includes(macFormatado)) {
      toast({
        variant: "destructive",
        title: "MAC duplicado",
        description: "Este MAC já foi adicionado"
      });
      return;
    }

    setEditMacs([...editMacs, macFormatado]);
    setEditMacAtual("");
  };

  // Função para remover MAC na edição
  const removerMacEdicao = (macToRemove: string) => {
    setEditMacs(editMacs.filter(mac => mac !== macToRemove));
  };

  // Função para salvar edição
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editEquipamento || !editProblema || !editSolucao || !editResponsavel) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios"
      });
      return;
    }

    if (editMacs.length === 0) {
      toast({
        variant: "destructive",
        title: "MAC obrigatório",
        description: "Adicione pelo menos um endereço MAC"
      });
      return;
    }

    try {
      await updateRecuperacao(editingRecuperacao.id, {
        equipamento: editEquipamento,
        problema: editProblema,
        solucao: editSolucao,
        macs: editMacs,
        responsavel: editResponsavel
      });
      
      closeEditModal();
    } catch (error) {
      console.error('Erro ao atualizar recuperação:', error);
    }
  };

  const adicionarMac = async () => {
    const cleanMac = macAtual.trim();
    
    if (!cleanMac) {
      toast({
        title: "Erro",
        description: "Digite um endereço MAC válido",
        variant: "destructive",
      });
      return;
    }

    if (!validateMacFormat(cleanMac)) {
      toast({
        title: "Formato inválido",
        description: "MAC deve ter 12 caracteres hexadecimais (ex: C85A9FC7B9C0 ou C8:5A:9F:C7:B9:C0)",
        variant: "destructive",
      });
      return;
    }

    const formattedMac = formatMacAddress(cleanMac);

    // Verificar duplicata local
    if (macs.includes(formattedMac)) {
      toast({
        title: "MAC duplicado",
        description: "Este endereço MAC já foi adicionado",
        variant: "destructive",
      });
      return;
    }

    // Verificar duplicata global com regra especial para recuperação
    const exists = await checkMacExistsWithRecoveryRule(formattedMac, 'recuperacao');
    if (exists) {
      return; // O hook já mostra o toast de erro
    }

    setMacs([...macs, formattedMac]);
    setMacAtual("");
    
    toast({
      title: "MAC adicionado",
      description: `Endereço ${formattedMac} adicionado com sucesso`,
    });
  };

  const removerMac = (macToRemove: string) => {
    setMacs(macs.filter(mac => mac !== macToRemove));
  };

  const copiarMac = async (mac: string) => {
    try {
      await navigator.clipboard.writeText(mac);
      toast({
        title: "MAC copiado",
        description: `MAC ${mac} copiado para a área de transferência`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar o MAC"
      });
    }
  };

  const copiarTodosMacs = async (macs: string[]) => {
    try {
      const macsTexto = macs.join('\n');
      await navigator.clipboard.writeText(macsTexto);
      toast({
        title: "MACs copiados",
        description: `${macs.length} MACs copiados para a área de transferência`
      });
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Erro ao copiar",
        description: "Não foi possível copiar os MACs"
      });
    }
  };

  const handleSubmitRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipamentoSelecionado || !problema || !solucao || macs.length === 0 || !responsavelSelecionado) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e adicione pelo menos um MAC."
      });
      return;
    }

    try {
      await createRecuperacao({
        equipamento: equipamentoSelecionado,
        problema,
        solucao,
        macs: [...macs],
        responsavel: responsavelSelecionado,
        data_recuperacao: new Date().toISOString()
      });
      
      // Limpar formulário
      setEquipamentoSelecionado("");
      setSelectedEquipment(null);
      setProblema("");
      setSolucao("");
      setMacs([]);
      setMacAtual("");
      setResponsavelSelecionado("");

    } catch (error) {
      console.error('Erro ao registrar recuperação:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recuperação de Equipamentos</h1>
          <p className="text-muted-foreground">
            Registre equipamentos que foram recuperados e os problemas resolvidos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Formulário de Recuperação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Registrar Recuperação
              </CardTitle>
              <CardDescription>
                Adicione informações sobre equipamentos recuperados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRecuperacao} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <EquipmentSelector
                      onSelect={setSelectedEquipment}
                      selectedEquipment={selectedEquipment}
                    />

                  <div>
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Select value={responsavelSelecionado} onValueChange={setResponsavelSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionariosAtivos.map((func) => (
                          <SelectItem key={func.id} value={func.nome}>
                            {func.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="problema">Problema Identificado</Label>
                  <Textarea
                    id="problema"
                    placeholder="Descreva o problema que foi identificado..."
                    value={problema}
                    onChange={(e) => setProblema(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="solucao">Solução Aplicada</Label>
                  <Textarea
                    id="solucao"
                    placeholder="Descreva como o problema foi resolvido..."
                    value={solucao}
                    onChange={(e) => setSolucao(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="mac">Endereços MAC</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mac"
                      placeholder="Ex: AA:BB:CC:DD:EE:FF"
                      value={macAtual}
                      onChange={(e) => setMacAtual(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          adicionarMac();
                        }
                      }}
                    />
                    <Button type="button" onClick={adicionarMac} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {macs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {macs.map((mac) => (
                        <Badge key={mac} variant="secondary" className="flex items-center gap-1">
                          {mac}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removerMac(mac)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Registrar Recuperação
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Recuperações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <CardTitle>Recuperações Recentes</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  disabled={loading}
                >
                  Recarregar
                </Button>
              </div>
              <CardDescription>
                Histórico de equipamentos recuperados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-muted-foreground text-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    Carregando recuperações...
                  </div>
                ) : recuperacoes.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8 space-y-2">
                    <p>Nenhuma recuperação registrada ainda</p>
                    <p className="text-sm">Registre uma recuperação usando o formulário ao lado</p>
                  </div>
                ) : (
                  recuperacoes.map((recuperacao) => (
                    <div key={recuperacao.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{recuperacao.equipamento}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {recuperacao.macs.length} MAC(s)
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copiarTodosMacs(recuperacao.macs)}
                            className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                            title="Copiar todos os MACs"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(recuperacao)}
                              className="h-8 w-8 p-0 hover:bg-blue-500 hover:text-white"
                              title="Editar recuperação"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRecuperacao(recuperacao.id)}
                              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              title="Deletar recuperação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
                            className="text-xs cursor-pointer hover:bg-secondary/80"
                            onClick={() => copiarMac(mac)}
                            title="Clique para copiar"
                          >
                            {mac}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {new Date(recuperacao.data_recuperacao).toLocaleString('pt-BR')} • {recuperacao.responsavel}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal de Edição */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-500" />
                Editar Recuperação
              </DialogTitle>
              <DialogDescription>
                Edite as informações da recuperação selecionada
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-equipamento">Equipamento</Label>
                  <Input
                    id="edit-equipamento"
                    value={editEquipamento}
                    onChange={(e) => setEditEquipamento(e.target.value)}
                    placeholder="Nome do equipamento"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-responsavel">Responsável</Label>
                  <Select value={editResponsavel} onValueChange={setEditResponsavel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionariosAtivos.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.nome}>
                          {funcionario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-problema">Problema</Label>
                <Textarea
                  id="edit-problema"
                  value={editProblema}
                  onChange={(e) => setEditProblema(e.target.value)}
                  placeholder="Descreva o problema encontrado"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-solucao">Solução</Label>
                <Textarea
                  id="edit-solucao"
                  value={editSolucao}
                  onChange={(e) => setEditSolucao(e.target.value)}
                  placeholder="Descreva a solução aplicada"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-mac">Endereços MAC</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-mac"
                    value={editMacAtual}
                    onChange={(e) => setEditMacAtual(e.target.value)}
                    placeholder="Digite o MAC (ex: 00:11:22:33:44:55)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        adicionarMacEdicao();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={adicionarMacEdicao}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {editMacs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editMacs.map((mac) => (
                      <Badge key={mac} variant="secondary" className="flex items-center gap-1">
                        {mac}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removerMacEdicao(mac)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}