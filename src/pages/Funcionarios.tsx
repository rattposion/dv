import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, User, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { AddFuncionarioModal } from "@/components/funcionarios/AddFuncionarioModal";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { useToast } from "@/hooks/use-toast";

export default function Funcionarios() {
  const { funcionarios, removeFuncionario } = useFuncionario();
  const { toast } = useToast();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (funcionarioId: string) => {
    setFuncionarioToDelete(funcionarioId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!funcionarioToDelete) return;
    
    setIsDeleting(true);
    try {
      await removeFuncionario(funcionarioToDelete);
      toast({
        title: "Funcionário excluído",
        description: "Funcionário removido com sucesso!",
      });
      setDeleteModalOpen(false);
      setFuncionarioToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir funcionário",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
            <p className="text-muted-foreground">Gerencie colaboradores e suas funções</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar funcionário..." className="pl-10" />
          </div>
          <AddFuncionarioModal />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {funcionarios.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
              <p className="text-sm text-muted-foreground">Clique em "Novo Funcionário" para começar</p>
            </div>
          ) : (
            funcionarios.map((funcionario) => (
            <Card key={funcionario.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{funcionario.nome}</CardTitle>
                      <CardDescription>ID: {funcionario.id}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={funcionario.status === "Ativo" ? "default" : 
                            funcionario.status === "Em Produção" ? "secondary" : "outline"}
                  >
                    {funcionario.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Função:</span>
                    <span className="font-medium">{funcionario.funcao}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Turno:</span>
                    <span className="font-medium">{funcionario.turno}</span>
                  </div>
                </div>
                
                {/* Botão de Excluir */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(funcionario.id)}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-smooth"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Funcionário
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          title="Excluir Funcionário"
          description="Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita."
          isDeleting={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}