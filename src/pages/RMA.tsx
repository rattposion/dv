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
import { EquipmentSelector } from "@/components/defeitos/EquipmentSelector";
import { MacAddressInput } from "@/components/rma/MacAddressInput";
import { FileUploadRMA } from "@/components/rma/FileUploadRMA";
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
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const { funcionariosAprovados } = useFuncionario();
  const { rmas, loading, createRMA } = useSupabaseRMA();

  const [novoRMA, setNovoRMA] = useState({
    equipamento: "",
    modelo: "",
    mac_address: "",
    origem_equipamento: "",
    destino_envio: "",
    defeito_relatado: "",
    status: "Aberto" as const,
    data_abertura: new Date().toISOString().split('T')[0],
    tecnico_responsavel: "",
    diagnostico: "",
    solucao: "",
    observacoes: "",
    nota_fiscal: "",
    anexos_ids: [] as string[]
  });

  // Auto-sync equipment selection
  const handleEquipmentSelect = (equipment: any) => {
    setSelectedEquipment(equipment);
    if (equipment) {
      setNovoRMA(prev => ({
        ...prev,
        equipamento: equipment.nome,
        modelo: equipment.modelo || ""
      }));
    }
  };


  const salvarRMA = async () => {
    // Validar campos obrigatórios
    if (!novoRMA.equipamento || !novoRMA.defeito_relatado || 
        !novoRMA.origem_equipamento || !novoRMA.destino_envio) {
      return;
    }

    try {
      await createRMA({
        ...novoRMA,
        modelo: novoRMA.modelo || undefined,
        mac_address: novoRMA.mac_address || undefined,
        tecnico_responsavel: novoRMA.tecnico_responsavel || undefined,
        diagnostico: novoRMA.diagnostico || undefined,
        solucao: novoRMA.solucao || undefined,
        observacoes: novoRMA.observacoes || undefined,
        nota_fiscal: novoRMA.nota_fiscal || undefined,
        anexos_ids: novoRMA.anexos_ids.length > 0 ? novoRMA.anexos_ids : undefined
      });

      // Reset form
      setNovoRMA({
        equipamento: "",
        modelo: "",
        mac_address: "",
        origem_equipamento: "",
        destino_envio: "",
        defeito_relatado: "",
        status: "Aberto",
        data_abertura: new Date().toISOString().split('T')[0],
        tecnico_responsavel: "",
        diagnostico: "",
        solucao: "",
        observacoes: "",
        nota_fiscal: "",
        anexos_ids: []
      });
      setSelectedEquipment(null);
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <EquipmentSelector
                        onSelect={handleEquipmentSelect}
                        selectedEquipment={selectedEquipment}
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <MacAddressInput
                        value={novoRMA.mac_address}
                        onChange={(value) => setNovoRMA(prev => ({ ...prev, mac_address: value }))}
                        label="Endereços MAC"
                        placeholder="Digite o MAC (ex: AA:BB:CC:DD:EE:FF) e use | para adicionar"
                      />
                    </div>
                    
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
                      value={novoRMA.tecnico_responsavel}
                      onValueChange={(value) => setNovoRMA(prev => ({ ...prev, tecnico_responsavel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o técnico" />
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
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Abertura</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rmasFiltrados.map((rma) => (
                      <TableRow key={rma.id}>
                        <TableCell className="font-medium">{rma.numero_rma}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rma.equipamento}</div>
                            <div className="text-sm text-muted-foreground">{rma.modelo}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rma.origem_equipamento}</div>
                            {rma.mac_address && (
                              <div className="text-sm text-muted-foreground">{rma.mac_address}</div>
                            )}
                          </div>
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
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}