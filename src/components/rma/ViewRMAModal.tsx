import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RMA } from "@/hooks/useSupabaseRMA";

interface ViewRMAModalProps {
  rma: RMA | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ViewRMAModal({ rma, open, onOpenChange }: ViewRMAModalProps) {
  if (!rma) return null;

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption?.color || "default";
  };

  const formatData = (data: string) => {
    return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatMacs = (macs: string) => {
    if (!macs) return [];
    return macs.split(',').map(mac => mac.trim()).filter(mac => mac.length > 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>RMA {rma.numero_rma}</span>
            <Badge variant={getStatusColor(rma.status) as any}>
              {rma.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Equipamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Equipamento(s)</h4>
                  <p className="font-medium">{rma.equipamento}</p>
                </div>
                {rma.modelo && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Modelo(s)</h4>
                    <p className="font-medium">{rma.modelo}</p>
                  </div>
                )}
              </div>
              
              {rma.mac_address && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Endereços MAC</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {formatMacs(rma.mac_address).map((mac, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm font-mono">
                        {mac}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do RMA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes do RMA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Origem do Equipamento</h4>
                  <p className="font-medium">{rma.origem_equipamento}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Destino do Envio</h4>
                  <p className="font-medium">{rma.destino_envio}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Data de Abertura</h4>
                  <p className="font-medium">{formatData(rma.data_abertura)}</p>
                </div>
                {rma.data_conclusao && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Data de Conclusão</h4>
                    <p className="font-medium">{formatData(rma.data_conclusao)}</p>
                  </div>
                )}
                {rma.tecnico_responsavel && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Técnico Responsável</h4>
                    <p className="font-medium">{rma.tecnico_responsavel}</p>
                  </div>
                )}
                {rma.nota_fiscal && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Nota Fiscal</h4>
                    <p className="font-medium">{rma.nota_fiscal}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Defeito Relatado</h4>
                <p className="text-sm bg-muted p-3 rounded">{rma.defeito_relatado}</p>
              </div>

              {rma.diagnostico && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Diagnóstico</h4>
                  <p className="text-sm bg-muted p-3 rounded">{rma.diagnostico}</p>
                </div>
              )}

              {rma.solucao && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Solução</h4>
                  <p className="text-sm bg-muted p-3 rounded">{rma.solucao}</p>
                </div>
              )}

              {rma.observacoes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Observações</h4>
                  <p className="text-sm bg-muted p-3 rounded">{rma.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-muted-foreground">Criado em</h4>
                  <p>{formatData(rma.created_at)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground">Última atualização</h4>
                  <p>{formatData(rma.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}