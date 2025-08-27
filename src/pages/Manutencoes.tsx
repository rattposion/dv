import { useState } from "react";
import { Wrench, Plus, Search, Edit, Eye, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useManutencao } from "@/contexts/ManutencaoContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";
import { AddManutencaoModal } from "@/components/manutencoes/AddManutencaoModal";
import { ViewManutencaoModal } from "@/components/manutencoes/ViewManutencaoModal";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { useToast } from "@/hooks/use-toast";

export default function Manutencoes() {
  const { manutencoes, loading, updateManutencao } = useManutencao();
  const { equipamentos } = useEquipamento();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipamento, setSelectedEquipamento] = useState<string>("todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [selectedManutencao, setSelectedManutencao] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [manutencaoToDelete, setManutencaoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (manutencaoId: string) => {
    setManutencaoToDelete(manutencaoId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!manutencaoToDelete) return;
    
    setIsDeleting(true);
    try {
      // Como não temos delete no hook, vamos marcar como cancelada
      await updateManutencao(manutencaoToDelete, { status: 'cancelada' });
      toast({
        title: "OS cancelada",
        description: "Ordem de serviço foi cancelada com sucesso!",
      });
      setDeleteModalOpen(false);
      setManutencaoToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao cancelar OS",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getEquipamentoNome = (equipamentoId?: string) => {
    if (!equipamentoId) return 'N/A';
    const equipamento = equipamentos.find(eq => eq.id === equipamentoId);
    return equipamento?.nome || 'Equipamento não encontrado';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aberta':
        return 'bg-red-500';
      case 'em_andamento':
        return 'bg-yellow-500';
      case 'aguardando_pecas':
        return 'bg-orange-500';
      case 'concluida':
        return 'bg-green-500';
      case 'sem_reparo':
        return 'bg-purple-500';
      case 'cancelada':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusOrder = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aberta':
        return 1;
      case 'em_andamento':
        return 2;
      case 'aguardando_pecas':
        return 3;
      case 'concluida':
        return 4;
      case 'sem_reparo':
        return 5;
      case 'cancelada':
        return 6;
      default:
        return 7;
    }
  };

  const filteredManutencoes = manutencoes
    .filter(manutencao => {
      const matchesSearch = manutencao.numeroTarefa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manutencao.origemEquipamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manutencao.defeitoEquipamento.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEquipamento = selectedEquipamento === "todos" || 
        getEquipamentoNome(manutencao.equipamentoId) === selectedEquipamento;
      
      const matchesStatus = selectedStatus === "todos" || 
        manutencao.status === selectedStatus;
      
      return matchesSearch && matchesEquipamento && matchesStatus;
    })
    .sort((a, b) => getStatusOrder(a.status) - getStatusOrder(b.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando manutenções...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            Manutenções
          </h1>
          <p className="text-muted-foreground">
            Gerencie ordens de serviço e manutenções dos equipamentos
          </p>
        </div>
        
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova OS
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por número, origem ou defeito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedEquipamento} onValueChange={setSelectedEquipamento}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Equipamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Equipamentos</SelectItem>
              {Array.from(new Set(equipamentos.map(eq => eq.nome))).map(nome => (
                <SelectItem key={nome} value={nome}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="aberta">Aberta</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="sem_reparo">Sem Reparo</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de OS</p>
              <p className="text-2xl font-bold text-foreground">{manutencoes.length}</p>
            </div>
            <Wrench className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Abertas</p>
              <p className="text-2xl font-bold text-red-500">
                {manutencoes.filter(m => m.status === 'aberta').length}
              </p>
            </div>
            <Badge className="bg-red-500">Abertas</Badge>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold text-yellow-500">
                {manutencoes.filter(m => m.status === 'em_andamento').length}
              </p>
            </div>
            <Badge className="bg-yellow-500">Em Andamento</Badge>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold text-green-500">
                {manutencoes.filter(m => m.status === 'concluida').length}
              </p>
            </div>
            <Badge className="bg-green-500">Concluídas</Badge>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº OS</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Defeito</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Abertura</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredManutencoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? 'Nenhuma manutenção encontrada' : 'Nenhuma manutenção cadastrada'}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredManutencoes.map((manutencao) => (
                <TableRow key={manutencao.id}>
                  <TableCell className="font-medium">
                    {manutencao.numeroTarefa}
                  </TableCell>
                  <TableCell>
                    {getEquipamentoNome(manutencao.equipamentoId)}
                  </TableCell>
                  <TableCell>{manutencao.origemEquipamento}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {manutencao.defeitoEquipamento}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-white ${getStatusColor(manutencao.status)}`}>
                      {manutencao.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(manutencao.dataAbertura).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedManutencao(manutencao);
                          setIsViewModalOpen(true);
                        }}
                        className="hover:bg-primary/10 transition-smooth"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(manutencao.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-smooth"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <AddManutencaoModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen}
      />
      
      <ViewManutencaoModal
        manutencao={selectedManutencao}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Cancelar OS"
        description="Tem certeza que deseja cancelar esta ordem de serviço? O status será alterado para 'Cancelada'."
        isDeleting={isDeleting}
      />
      </div>
    </DashboardLayout>
  );
}