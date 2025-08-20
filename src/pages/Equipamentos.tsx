import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Wrench, Wifi, Trash2, Calendar, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useEquipamento, type Equipamento } from "@/contexts/EquipamentoContext";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { useSupabaseGarantias } from "@/hooks/useSupabaseGarantias";

export default function Equipamentos() {
  const { equipamentos, addEquipamento, removeEquipamento } = useEquipamento();
  const { toast } = useToast();
  const { garantias, loading: loadingGarantias, addGarantia } = useSupabaseGarantias();
  const [nomeEquipamento, setNomeEquipamento] = useState("");
  const [modeloEquipamento, setModeloEquipamento] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [equipamentoToDelete, setEquipamentoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para o formulário de garantia
  const [numeroOS, setNumeroOS] = useState("");
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState("");
  const [servicoRealizado, setServicoRealizado] = useState("");
  const [dataServico, setDataServico] = useState("");
  const [garantiaExpira, setGarantiaExpira] = useState("");


  const handleDeleteClick = (equipamentoId: string) => {
    setEquipamentoToDelete(equipamentoId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!equipamentoToDelete) return;
    
    setIsDeleting(true);
    try {
      await removeEquipamento(equipamentoToDelete);
      toast({
        title: "Equipamento excluído",
        description: "Equipamento removido com sucesso!",
      });
      setDeleteModalOpen(false);
      setEquipamentoToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir equipamento",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCadastrarEquipamento = async () => {
    if (!nomeEquipamento.trim() || !modeloEquipamento.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const novoEquipamento = {
        nome: nomeEquipamento,
        modelo: modeloEquipamento,
        numeroSerie: `${modeloEquipamento}${String(Date.now()).slice(-6)}`,
        mac: `00:1A:2B:3C:4D:${String(equipamentos.length + 1).padStart(2, '0')}`,
        responsavel: "Sistema",
        status: "Ativo" as const,
        localizacao: "A definir",
        observacoes: "Equipamento cadastrado via sistema"
      };

      await addEquipamento(novoEquipamento);
      setNomeEquipamento("");
      setModeloEquipamento("");
      
      toast({
        title: "Sucesso",
        description: "Equipamento cadastrado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao cadastrar equipamento",
        variant: "destructive",
      });
    }
  };

  const handleCadastrarGarantia = async () => {
    if (!numeroOS.trim() || !equipamentoSelecionado || !servicoRealizado.trim() || !dataServico || !garantiaExpira) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await addGarantia({
        numero_os: numeroOS,
        equipamento_nome: equipamentoSelecionado,
        servico_realizado: servicoRealizado,
        data_servico: dataServico,
        garantia_expira: garantiaExpira
      });

      // Limpar campos após sucesso
      setNumeroOS("");
      setEquipamentoSelecionado("");
      setServicoRealizado("");
      setDataServico("");
      setGarantiaExpira("");
    } catch (error) {
      // O erro já foi tratado no hook
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Equipamentos</h1>
            <p className="text-muted-foreground">Controle e monitoramento de máquinas</p>
          </div>
        </div>

        <Tabs defaultValue="equipamentos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="equipamentos" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Equipamentos
            </TabsTrigger>
            <TabsTrigger value="garantia" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Garantia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipamentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Novo Equipamento</CardTitle>
                <CardDescription>Cadastrar novo equipamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome do Equipamento *</label>
                    <Input 
                      placeholder="Ex: Prensa Hidráulica" 
                      value={nomeEquipamento}
                      onChange={(e) => setNomeEquipamento(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Modelo *</label>
                    <Input 
                      placeholder="Ex: PH-2024" 
                      value={modeloEquipamento}
                      onChange={(e) => setModeloEquipamento(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={handleCadastrarEquipamento}>
                  <Plus className="h-4 w-4" />
                  Cadastrar Equipamento
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou MAC..." className="pl-10" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {equipamentos.map((equipamento) => (
                <Card key={equipamento.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{equipamento.nome}</CardTitle>
                          <CardDescription>ID: {equipamento.id}</CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant={equipamento.status === "Ativo" ? "default" : 
                                equipamento.status === "Em Operação" ? "secondary" : "destructive"}
                      >
                        {equipamento.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Modelo:</span>
                          <span className="font-medium">{equipamento.modelo}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Nº Série:</span>
                          <span className="font-medium">{equipamento.numeroSerie}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Responsável:</span>
                          <span className="font-medium">{equipamento.responsavel}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Localização:</span>
                          <span className="font-medium">{equipamento.localizacao || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-muted-foreground">MAC:</span>
                          <div className="flex items-center gap-1">
                            <Wifi className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-xs">{equipamento.mac}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botão de Excluir */}
                      <div className="mt-4 pt-3 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(equipamento.id)}
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-smooth"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Equipamento
                        </Button>
                      </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="garantia" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Novo Registro de Garantia</CardTitle>
                <CardDescription>Adicionar novo registro de serviço e garantia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Número OS/TAREFA *</label>
                    <Input 
                      placeholder="Ex: OS-2024-001 ou TAREFA-2024-001" 
                      value={numeroOS}
                      onChange={(e) => setNumeroOS(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Equipamento *</label>
                    <Select value={equipamentoSelecionado} onValueChange={setEquipamentoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um equipamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipamentos.map((equipamento) => (
                          <SelectItem key={equipamento.id} value={equipamento.nome}>
                            {equipamento.nome} - {equipamento.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data do Serviço *</label>
                    <Input 
                      type="date"
                      value={dataServico}
                      onChange={(e) => setDataServico(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Garantia Expira *</label>
                    <Input 
                      type="date"
                      value={garantiaExpira}
                      onChange={(e) => setGarantiaExpira(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Serviço Realizado *</label>
                  <Textarea 
                    placeholder="Descreva o serviço que foi realizado no equipamento..."
                    value={servicoRealizado}
                    onChange={(e) => setServicoRealizado(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button className="w-full gap-2" onClick={handleCadastrarGarantia}>
                  <Plus className="h-4 w-4" />
                  Cadastrar Registro de Garantia
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Controle de Garantia
                </CardTitle>
                <CardDescription>
                  Acompanhe os serviços realizados e o status das garantias dos equipamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
{loadingGarantias ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando registros de garantia...</p>
                  </div>
                ) : garantias.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum registro de garantia encontrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>OS/TAREFA</TableHead>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Serviço Realizado</TableHead>
                        <TableHead>Data do Serviço</TableHead>
                        <TableHead>Garantia Expira</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {garantias.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.numero_os}</TableCell>
                          <TableCell>{item.equipamento_nome}</TableCell>
                          <TableCell className="max-w-xs truncate" title={item.servico_realizado}>
                            {item.servico_realizado}
                          </TableCell>
                          <TableCell>
                            {new Date(item.data_servico).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {new Date(item.garantia_expira).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                item.status === 'Ativa' ? 'default' : 
                                item.status === 'Próximo ao Vencimento' ? 'secondary' : 'destructive'
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Confirmação de Exclusão */}
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          title="Excluir Equipamento"
          description="Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita."
          isDeleting={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}