import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { useToast } from "@/components/ui/use-toast";

export function AddFuncionarioModal() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [turno, setTurno] = useState("");
  const { addFuncionario } = useFuncionario();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !funcao || !turno) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios"
      });
      return;
    }

    try {
      await addFuncionario({
        nome,
        funcao,
        turno,
        status: "Ativo",
        aprovado: true
      });

      toast({
        title: "Sucesso",
        description: "Funcionário cadastrado com sucesso"
      });

      setNome("");
      setFuncao("");
      setTurno("");
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cadastrar funcionário"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Funcionário</DialogTitle>
          <DialogDescription>
            Adicione um novo funcionário ao sistema
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="funcao">Função *</Label>
            <Select value={funcao} onValueChange={setFuncao} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operador">Operador</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Gerente">Gerente</SelectItem>
                <SelectItem value="Técnico">Técnico</SelectItem>
                <SelectItem value="Auxiliar">Auxiliar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="turno">Turno *</Label>
            <Select value={turno} onValueChange={setTurno} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Diurno">Diurno</SelectItem>
                <SelectItem value="Noturno">Noturno</SelectItem>
                <SelectItem value="Integral">Integral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}