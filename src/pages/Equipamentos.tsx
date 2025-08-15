import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Wrench, Wifi, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useEquipamento, type Equipamento } from "@/contexts/EquipamentoContext";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";

export default function Equipamentos() {
  const { equipamentos, addEquipamento, removeEquipamento } = useEquipamento();
  const { toast } = useToast();
  const [nomeEquipamento, setNomeEquipamento] = useState("");
  const [modeloEquipamento, setModeloEquipamento] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [equipamentoToDelete, setEquipamentoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Equipamentos</h1>
            <p className="text-muted-foreground">Controle e monitoramento de máquinas</p>
          </div>
        </div>

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