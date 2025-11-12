import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useManutencao } from "@/contexts/ManutencaoContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";
import { toast } from "sonner";

interface AddManutencaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddManutencaoModal({ open, onOpenChange }: AddManutencaoModalProps) {
  const { addManutencao } = useManutencao();
  const { equipamentos } = useEquipamento();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numeroTarefa: '',
    equipamentoId: '',
    origemEquipamento: '',
    defeitoEquipamento: '',
    status: 'aberta',
    dataAbertura: new Date().toLocaleDateString('en-CA')
  });

  const generateNumeroTarefa = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `OS${year}${month}${day}${hour}${minute}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numeroTarefa || !formData.origemEquipamento || !formData.defeitoEquipamento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await addManutencao({
        numeroTarefa: formData.numeroTarefa,
        equipamentoId: formData.equipamentoId || undefined,
        origemEquipamento: formData.origemEquipamento,
        defeitoEquipamento: formData.defeitoEquipamento,
        status: formData.status,
        dataAbertura: formData.dataAbertura,
        vezesFaturado: 0,
        houveReparo: false
      });
      
      toast.success("Ordem de serviço criada com sucesso!");
      onOpenChange(false);
      setFormData({
        numeroTarefa: '',
        equipamentoId: '',
        origemEquipamento: '',
        defeitoEquipamento: '',
        status: 'aberta',
        dataAbertura: new Date().toLocaleDateString('en-CA')
      });
    } catch (error) {
      toast.error("Erro ao criar ordem de serviço");
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !formData.numeroTarefa) {
      setFormData(prev => ({
        ...prev,
        numeroTarefa: generateNumeroTarefa()
      }));
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Crie uma nova ordem de serviço para manutenção de equipamento.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroTarefa">Número da OS *</Label>
              <Input
                id="numeroTarefa"
                value={formData.numeroTarefa}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroTarefa: e.target.value }))}
                placeholder="Ex: OS20241201001"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataAbertura">Data de Abertura *</Label>
              <Input
                id="dataAbertura"
                type="date"
                value={formData.dataAbertura}
                onChange={(e) => setFormData(prev => ({ ...prev, dataAbertura: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipamento">Equipamento</Label>
            <Select
              value={formData.equipamentoId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, equipamentoId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um equipamento (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {equipamentos.map((equipamento) => (
                  <SelectItem key={equipamento.id} value={equipamento.id}>
                    {equipamento.nome} - {equipamento.modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="origemEquipamento">Origem do Equipamento *</Label>
            <Input
              id="origemEquipamento"
              value={formData.origemEquipamento}
              onChange={(e) => setFormData(prev => ({ ...prev, origemEquipamento: e.target.value }))}
              placeholder="Ex: Setor de Produção, Linha 1, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defeitoEquipamento">Defeito do Equipamento *</Label>
            <Textarea
              id="defeitoEquipamento"
              value={formData.defeitoEquipamento}
              onChange={(e) => setFormData(prev => ({ ...prev, defeitoEquipamento: e.target.value }))}
              placeholder="Descreva o defeito ou problema identificado..."
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Inicial</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar OS"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
