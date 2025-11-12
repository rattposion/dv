import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw, Plus, Search, User, Eye, Edit } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MultipleEquipmentSelector, type EquipmentWithMacs } from "@/components/rma/MultipleEquipmentSelector";
import { FileUploadRMA } from "@/components/rma/FileUploadRMA";
import { ViewRMAModal } from "@/components/rma/ViewRMAModal";
import { EditRMAModal } from "@/components/rma/EditRMAModal";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { useSupabaseRMA, type RMA } from "@/hooks/useSupabaseRMA";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


const STATUS_OPTIONS = [
  { value: "Aberto", label: "Aberto", color: "default" },
  { value: "Em Análise", label: "Em Análise", color: "secondary" },
  { value: "Aprovado", label: "Aprovado", color: "success" },
  { value: "Rejeitado", label: "Rejeitado", color: "destructive" },
  { value: "Concluído", label: "Concluído", color: "outline" },
  { value: "Retornou para origem", label: "Retornou para origem", color: "secondary" },
  { value: "Transformado em saldo", label: "Transformado em saldo", color: "default" },
  { value: "Reparado", label: "Reparado", color: "success" },
  { value: "Substituído", label: "Substituído", color: "outline" },
];

export default function RMA() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [equipments, setEquipments] = useState<EquipmentWithMacs[]>([]);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroData, setFiltroData] = useState("");
  const [selectedRMA, setSelectedRMA] = useState<RMA | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { funcionariosAprovados } = useFuncionario();
  const { rmas, loading, createRMA, updateRMA } = useSupabaseRMA();

  const [novoRMA, setNovoRMA] = useState({
    origem_equipamento: "",
    destino_envio: "",
    defeito_relatado: "",
    status: "Aberto" as const,
    data_abertura: new Date().toLocaleDateString('en-CA'),
    tecnico_responsavel: "",
    diagnostico: "",
    solucao: "",
    observacoes: "",
    nota_fiscal: "",
    anexos_ids: [] as string[]
  });


  const salvarRMA = async () => {
    // Validar campos obrigatórios
    if (equipments.length === 0 || !novoRMA.defeito_relatado || 
        !novoRMA.origem_equipamento || !novoRMA.destino_envio) {
      return;
    }

    try {
      // Consolidar todos os equipamentos em strings
      const equipamentosNomes = equipments.map(eq => eq.equipment.nome).join(', ');
      const modelos = equipments.map(eq => eq.equipment.modelo).filter(Boolean).join(', ');
      const allMacs = equipments
        .flatMap(eq => eq.macAddresses.split('|').map(mac => mac.trim()).filter(mac => mac.length > 0))
        .join(', ');

      // Criar um único RMA com todos os equipamentos
      await createRMA({
        equipamento: equipamentosNomes,
        modelo: modelos || undefined,
        mac_address: allMacs || undefined,
        origem_equipamento: novoRMA.origem_equipamento,
        destino_envio: novoRMA.destino_envio,
        defeito_relatado: novoRMA.defeito_relatado,
        status: novoRMA.status,
        data_abertura: novoRMA.data_abertura,
        tecnico_responsavel: novoRMA.tecnico_responsavel || undefined,
        diagnostico: novoRMA.diagnostico || undefined,
        solucao: novoRMA.solucao || undefined,
        observacoes: novoRMA.observacoes || undefined,
        nota_fiscal: novoRMA.nota_fiscal || undefined,
        anexos_ids: novoRMA.anexos_ids.length > 0 ? novoRMA.anexos_ids : undefined
      });

      // Reset form
      setNovoRMA({
        origem_equipamento: "",
        destino_envio: "",
        defeito_relatado: "",
        status: "Aberto",
        data_abertura: new Date().toLocaleDateString('en-CA'),
        tecnico_responsavel: "",
        diagnostico: "",
        solucao: "",
        observacoes: "",
        nota_fiscal: "",
        anexos_ids: []
      });
      setEquipments([]);
      setIsDialogOpen(false);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const rmasFiltrados = rmas.filter(rma => {
    const matchStatus = !filtroStatus || filtroStatus === "todos" || rma.status === filtroStatus;
    const matchData = !filtroData || rma.data_abertura.includes(filtroData);
    
    return matchStatus && matchData;
  });

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption?.color || "default";
  };

  const formatData = (data: string) => {
    return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleViewRMA = (rma: RMA) => {
    setSelectedRMA(rma);
    setIsViewModalOpen(true);
  };

  const handleEditRMA = (rma: RMA) => {
    setSelectedRMA(rma);
    setIsEditModalOpen(true);
  };

  const handleSaveRMA = async (id: string, updates: Partial<RMA>) => {
    await updateRMA(id, updates);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">RMA (Return Material Authorization)</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gestão de autorizações de retorno de material</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-gradient-primary/90 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Novo RMA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Criar Novo RMA</DialogTitle>
              </DialogHeader>
              
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  <MultipleEquipmentSelector
                    equipments={equipments}
                    onChange={setEquipments}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div>
                      <Label htmlFor="origem_equipamento">Origem do Equipamento *</Label>
                      <Input
                        id="origem_equipamento"
                        value={novoRMA.origem_equipamento}
                        onChange={(e) => setNovoRMA(prev => ({ ...prev, origem_equipamento: e.target.value }))}
                        placeholder="Quem enviou o equipamento"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="destino_envio">Destino do Envio *</Label>
                      <Input
                        id="destino_envio"
                        value={novoRMA.destino_envio}
                        onChange={(e) => setNovoRMA(prev => ({ ...prev, destino_envio: e.target.value }))}
                        placeholder="Para onde enviar"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={novoRMA.status}
                        onValueChange={(value: any) => setNovoRMA(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                
                <div>
                  <Label htmlFor="defeito_relatado">Defeito Relatado *</Label>
                  <Textarea
                    id="defeito_relatado"
                    value={novoRMA.defeito_relatado}
                    onChange={(e) => setNovoRMA(prev => ({ ...prev, defeito_relatado: e.target.value }))}
                    placeholder="Descreva o defeito relatado pelo cliente..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_abertura">Data de Abertura</Label>
                    <Input
                      id="data_abertura"
                      type="date"
                      value={novoRMA.data_abertura}
                      onChange={(e) => setNovoRMA(prev => ({ ...prev, data_abertura: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tecnico_responsavel">Técnico Responsável</Label>
                    <Select
                      value={novoRMA.tecnico_responsavel || ""}
                      onValueChange={(value) => setNovoRMA(prev => ({ ...prev, tecnico_responsavel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o técnico" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionariosAprovados
                          .filter(funcionario => funcionario.nome && funcionario.nome.trim().length > 0)
                          .map((funcionario) => (
                            <SelectItem key={funcionario.id} value={funcionario.nome}>
                              {funcionario.nome} - {funcionario.funcao}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
                    <Input
                      id="nota_fiscal"
                      value={novoRMA.nota_fiscal}
                      onChange={(e) => setNovoRMA(prev => ({ ...prev, nota_fiscal: e.target.value }))}
                      placeholder="Número da nota fiscal"
                    />
                  </div>
                </div>

                <FileUploadRMA
                  onFilesChange={(fileIds) => setNovoRMA(prev => ({ ...prev, anexos_ids: fileIds }))}
                  existingFiles={novoRMA.anexos_ids}
                />
                
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={novoRMA.observacoes}
                    onChange={(e) => setNovoRMA(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarRMA} disabled={loading}>
                  {loading ? "Salvando..." : "Criar RMA"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de RMAs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              RMAs Registrados ({rmasFiltrados.length})
            </CardTitle>
            <CardDescription>
              Lista de todas as autorizações de retorno de material
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando RMAs...</div>
            ) : rmasFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum RMA encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número RMA</TableHead>
                      <TableHead>Equipamento/Modelo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Abertura</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rmasFiltrados.map((rma) => {
                      // Conta MACs separados por vírgula ou pipe, removendo espaços vazios
                      const macCount = rma.mac_address ? 
                        rma.mac_address.split(/[,|]/).map(mac => mac.trim()).filter(mac => mac.length > 0).length : 
                        1;
                      return (
                        <TableRow key={rma.id}>
                          <TableCell className="font-medium">{rma.numero_rma}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rma.equipamento}</div>
                              {rma.modelo && (
                                <div className="text-sm text-muted-foreground">{rma.modelo}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{macCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{rma.origem_equipamento}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{rma.destino_envio}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(rma.status) as any}>
                              {rma.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatData(rma.data_abertura)}</TableCell>
                          <TableCell>
                            {rma.tecnico_responsavel ? (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {rma.tecnico_responsavel}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleViewRMA(rma)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEditRMA(rma)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <ViewRMAModal
          rma={selectedRMA}
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
        />
        
        <EditRMAModal
          rma={selectedRMA}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={handleSaveRMA}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
}
