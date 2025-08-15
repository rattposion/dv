import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useManutencao } from "@/contexts/ManutencaoContext";
import { useEquipamento } from "@/contexts/EquipamentoContext";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";
import type { Manutencao } from "@/contexts/ManutencaoContext";

interface ViewManutencaoModalProps {
  manutencao: Manutencao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewManutencaoModal({ manutencao, open, onOpenChange }: ViewManutencaoModalProps) {
  const { updateManutencao } = useManutencao();
  const { equipamentos } = useEquipamento();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    destinoEnvio: '',
    laudoTecnico: '',
    vezesFaturado: 0,
    houveReparo: false,
    dataFechamento: '',
    tecnicoResponsavel: '',
    valorServico: '',
    observacoes: '',
    anexosIds: [] as string[]
  });

  useEffect(() => {
    if (manutencao) {
      setFormData({
        status: manutencao.status || '',
        destinoEnvio: manutencao.destinoEnvio || '',
        laudoTecnico: manutencao.laudoTecnico || '',
        vezesFaturado: manutencao.vezesFaturado || 0,
        houveReparo: manutencao.houveReparo || false,
        dataFechamento: manutencao.dataFechamento || '',
        tecnicoResponsavel: manutencao.tecnicoResponsavel || '',
        valorServico: manutencao.valorServico?.toString() || '',
        observacoes: manutencao.observacoes || '',
        anexosIds: manutencao.anexosIds || []
      });
      setIsEditing(false);
    }
  }, [manutencao]);

  const getEquipamentoNome = (equipamentoId?: string) => {
    if (!equipamentoId) return 'N/A';
    const equipamento = equipamentos.find(eq => eq.id === equipamentoId);
    return equipamento ? `${equipamento.nome} - ${equipamento.modelo}` : 'Equipamento não encontrado';
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
      case 'cancelada':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manutencao) return;

    setLoading(true);
    try {
      await updateManutencao(manutencao.id, {
        status: formData.status,
        destinoEnvio: formData.destinoEnvio,
        laudoTecnico: formData.laudoTecnico,
        vezesFaturado: formData.vezesFaturado,
        houveReparo: formData.houveReparo,
        dataFechamento: formData.dataFechamento || undefined,
        tecnicoResponsavel: formData.tecnicoResponsavel,
        valorServico: formData.valorServico ? parseFloat(formData.valorServico) : undefined,
        observacoes: formData.observacoes,
        anexosIds: formData.anexosIds
      });
      
      toast.success("Ordem de serviço atualizada com sucesso!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Erro ao atualizar ordem de serviço");
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!manutencao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            OS: {manutencao.numeroTarefa}
            <Badge className={`text-white ${getStatusColor(manutencao.status)}`}>
              {manutencao.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detalhes da ordem de serviço #{manutencao.numeroTarefa}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Equipamento:</Label>
                <p className="font-medium">{getEquipamentoNome(manutencao.equipamentoId)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data de Abertura:</Label>
                <p className="font-medium">
                  {new Date(manutencao.dataAbertura).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Origem do Equipamento:</Label>
                <p className="font-medium">{manutencao.origemEquipamento}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Defeito:</Label>
                <p className="font-medium">{manutencao.defeitoEquipamento}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Formulário de Edição */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Andamento da OS</h3>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Editar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberta">Aberta</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFechamento">Data de Fechamento</Label>
                <Input
                  id="dataFechamento"
                  type="date"
                  value={formData.dataFechamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataFechamento: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinoEnvio">Para onde foi enviado</Label>
              <Input
                id="destinoEnvio"
                value={formData.destinoEnvio}
                onChange={(e) => setFormData(prev => ({ ...prev, destinoEnvio: e.target.value }))}
                placeholder="Ex: Assistência técnica, Oficina externa..."
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="laudoTecnico">Laudo Técnico da Assistência</Label>
              <Textarea
                id="laudoTecnico"
                value={formData.laudoTecnico}
                onChange={(e) => setFormData(prev => ({ ...prev, laudoTecnico: e.target.value }))}
                placeholder="Descreva o diagnóstico e procedimentos realizados..."
                disabled={!isEditing}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vezesFaturado">Vezes Faturado</Label>
                <Input
                  id="vezesFaturado"
                  type="number"
                  min="0"
                  value={formData.vezesFaturado}
                  onChange={(e) => setFormData(prev => ({ ...prev, vezesFaturado: parseInt(e.target.value) || 0 }))}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorServico">Valor do Serviço (R$)</Label>
                <Input
                  id="valorServico"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorServico}
                  onChange={(e) => setFormData(prev => ({ ...prev, valorServico: e.target.value }))}
                  placeholder="0,00"
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tecnicoResponsavel">Técnico Responsável</Label>
                <Input
                  id="tecnicoResponsavel"
                  value={formData.tecnicoResponsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, tecnicoResponsavel: e.target.value }))}
                  placeholder="Nome do técnico"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="houveReparo"
                checked={formData.houveReparo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, houveReparo: checked }))}
                disabled={!isEditing}
              />
              <Label htmlFor="houveReparo">Houve reparo</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
                disabled={!isEditing}
                rows={3}
              />
            </div>

            {/* Upload de Arquivos */}
            {isEditing && (
              <FileUpload
                manutencaoId={manutencao.id}
                anexosIds={formData.anexosIds}
                onAnexosChange={(anexosIds) => setFormData(prev => ({ ...prev, anexosIds }))}
                maxFiles={5}
              />
            )}

            {isEditing && (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}