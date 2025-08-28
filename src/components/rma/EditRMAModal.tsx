import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RMA } from "@/hooks/useSupabaseRMA";
import { useFuncionario } from "@/contexts/FuncionarioContext";

interface EditRMAModalProps {
  rma: RMA | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<RMA>) => Promise<void>;
  loading: boolean;
}

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

export function EditRMAModal({ rma, open, onOpenChange, onSave, loading }: EditRMAModalProps) {
  const { funcionariosAprovados } = useFuncionario();
  const [formData, setFormData] = useState({
    status: "",
    tecnico_responsavel: "",
    diagnostico: "",
    solucao: "",
    observacoes: "",
    data_conclusao: "",
  });

  useEffect(() => {
    if (rma) {
      setFormData({
        status: rma.status,
        tecnico_responsavel: rma.tecnico_responsavel || "sem_tecnico",
        diagnostico: rma.diagnostico || "",
        solucao: rma.solucao || "",
        observacoes: rma.observacoes || "",
        data_conclusao: rma.data_conclusao ? rma.data_conclusao.split('T')[0] : "",
      });
    }
  }, [rma]);

  const handleSave = async () => {
    if (!rma) return;

    const updates: Partial<RMA> = {
      status: formData.status as RMA['status'],
      tecnico_responsavel: (formData.tecnico_responsavel === "sem_tecnico" || !formData.tecnico_responsavel) ? undefined : formData.tecnico_responsavel,
      diagnostico: formData.diagnostico || undefined,
      solucao: formData.solucao || undefined,
      observacoes: formData.observacoes || undefined,
    };

    // Se o status é "Concluído" e não há data de conclusão, adicionar a data atual
    if (formData.status === "Concluído" && !rma.data_conclusao) {
      updates.data_conclusao = new Date().toISOString();
    } else if (formData.data_conclusao) {
      updates.data_conclusao = new Date(formData.data_conclusao).toISOString();
    }

    try {
      await onSave(rma.id, updates);
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent component
    }
  };

  if (!rma) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar RMA {rma.numero_rma}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
          {/* Informações básicas (read-only) */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Informações do Equipamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Equipamento:</span>
                <p className="font-medium">{rma.equipamento}</p>
              </div>
              {rma.modelo && (
                <div>
                  <span className="text-muted-foreground">Modelo:</span>
                  <p className="font-medium">{rma.modelo}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Origem:</span>
                <p className="font-medium">{rma.origem_equipamento}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Destino:</span>
                <p className="font-medium">{rma.destino_envio}</p>
              </div>
            </div>
          </div>

          {/* Campos editáveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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
            
            <div>
              <Label htmlFor="tecnico_responsavel">Técnico Responsável</Label>
              <Select
                value={formData.tecnico_responsavel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tecnico_responsavel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_tecnico">Nenhum técnico</SelectItem>
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

            {(formData.status === "Concluído" || rma.data_conclusao) && (
              <div>
                <Label htmlFor="data_conclusao">Data de Conclusão</Label>
                <Input
                  id="data_conclusao"
                  type="date"
                  value={formData.data_conclusao}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_conclusao: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="diagnostico">Diagnóstico</Label>
            <Textarea
              id="diagnostico"
              value={formData.diagnostico}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnostico: e.target.value }))}
              placeholder="Diagnóstico técnico do problema..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="solucao">Solução</Label>
            <Textarea
              id="solucao"
              value={formData.solucao}
              onChange={(e) => setFormData(prev => ({ ...prev, solucao: e.target.value }))}
              placeholder="Solução aplicada ou proposta..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}