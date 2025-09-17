import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Monitor, ExternalLink, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface MacConflict {
  mac: string;
  table: string;
  id: string;
  equipamento?: string;
  modelo?: string;
  numero_caixa?: string;
  nome?: string;
  data_registro?: string;
  created_at?: string;
}

interface MacConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflictingMac: string;
  onMacRemoved?: (mac: string) => void;
}

export function MacConflictDialog({ 
  isOpen, 
  onClose, 
  conflictingMac, 
  onMacRemoved 
}: MacConflictDialogProps) {
  const [conflicts, setConflicts] = useState<MacConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Verificar se o usuário é admin
  const isAdmin = user?.email === 'wesleyalves.cs@gmail.com';

  useEffect(() => {
    if (isOpen && conflictingMac) {
      findMacConflicts();
    }
  }, [isOpen, conflictingMac]);

  const findMacConflicts = async () => {
    setLoading(true);
    try {
      const macUpper = conflictingMac.toUpperCase();
      const foundConflicts: MacConflict[] = [];

      // Buscar em equipamentos
      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('id, nome, modelo, mac_address, created_at')
        .eq('mac_address', macUpper);

      if (equipamentos) {
        equipamentos.forEach(eq => {
          foundConflicts.push({
            mac: eq.mac_address,
            table: 'equipamentos',
            id: eq.id,
            nome: eq.nome,
            modelo: eq.modelo,
            created_at: eq.created_at
          });
        });
      }

      // Buscar em caixas_inventario
      const { data: caixas } = await supabase
        .from('caixas_inventario')
        .select('id, numero_caixa, equipamento, modelo, macs, created_at')
        .contains('macs', [macUpper]);

      if (caixas) {
        caixas.forEach(caixa => {
          foundConflicts.push({
            mac: macUpper,
            table: 'caixas_inventario',
            id: caixa.id,
            numero_caixa: caixa.numero_caixa,
            equipamento: caixa.equipamento,
            modelo: caixa.modelo,
            created_at: caixa.created_at
          });
        });
      }

      // Buscar em defeitos
      const { data: defeitos } = await supabase
        .from('defeitos')
        .select('id, equipamento, modelo, macs, data_registro, created_at')
        .contains('macs', [macUpper]);

      if (defeitos) {
        defeitos.forEach(defeito => {
          foundConflicts.push({
            mac: macUpper,
            table: 'defeitos',
            id: defeito.id,
            equipamento: defeito.equipamento,
            modelo: defeito.modelo,
            data_registro: defeito.data_registro,
            created_at: defeito.created_at
          });
        });
      }

      setConflicts(foundConflicts);
    } catch (error) {
      console.error('Erro ao buscar conflitos de MAC:', error);
      toast({
        title: "Erro",
        description: "Falha ao buscar conflitos de MAC",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMacFromRecord = async (conflict: MacConflict) => {
    try {
      if (conflict.table === 'defeitos') {
        // Para defeitos, remover o MAC do array
        const { data: currentRecord } = await supabase
          .from('defeitos')
          .select('macs')
          .eq('id', conflict.id)
          .single();

        if (currentRecord) {
          const updatedMacs = currentRecord.macs.filter(
            (mac: string) => mac.toUpperCase() !== conflictingMac.toUpperCase()
          );

          const { error } = await supabase
            .from('defeitos')
            .update({ 
              macs: updatedMacs,
              quantidade: updatedMacs.length
            })
            .eq('id', conflict.id);

          if (error) throw error;

          toast({
            title: "Sucesso",
            description: `MAC removido do registro de defeito`,
          });

          // Atualizar a lista de conflitos
          setConflicts(prev => prev.filter(c => 
            !(c.id === conflict.id && c.table === conflict.table)
          ));

          // Notificar o componente pai
          if (onMacRemoved) {
            onMacRemoved(conflictingMac);
          }
        }
      } else if (conflict.table === 'caixas_inventario') {
        // Para caixas de inventário, remover o MAC do array
        const { data: currentRecord } = await supabase
          .from('caixas_inventario')
          .select('macs')
          .eq('id', conflict.id)
          .single();

        if (currentRecord) {
          const updatedMacs = currentRecord.macs.filter(
            (mac: string) => mac.toUpperCase() !== conflictingMac.toUpperCase()
          );

          const { error } = await supabase
            .from('caixas_inventario')
            .update({ macs: updatedMacs })
            .eq('id', conflict.id);

          if (error) throw error;

          toast({
            title: "Sucesso",
            description: `MAC removido da caixa de inventário`,
          });

          // Atualizar a lista de conflitos
          setConflicts(prev => prev.filter(c => 
            !(c.id === conflict.id && c.table === conflict.table)
          ));

          if (onMacRemoved) {
            onMacRemoved(conflictingMac);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao remover MAC:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover MAC do registro",
        variant: "destructive",
      });
    }
  };

  const editRecord = async (conflict: MacConflict) => {
    try {
      if (conflict.table === 'equipamentos') {
        // Navegar para a página de equipamentos com foco no item específico
        window.open(`/equipamentos?edit=${conflict.id}`, '_blank');
      } else if (conflict.table === 'defeitos') {
        // Navegar para a página de defeitos com foco no item específico
        window.open(`/defeitos?edit=${conflict.id}`, '_blank');
      } else if (conflict.table === 'caixas_inventario') {
        // Navegar para a página de inventário com foco no item específico
        window.open(`/inventario?edit=${conflict.id}`, '_blank');
      }
      
      toast({
        title: "Redirecionando",
        description: `Abrindo editor para ${getTableDisplayName(conflict.table)}`,
      });
    } catch (error) {
      console.error('Erro ao abrir editor:', error);
      toast({
        title: "Erro",
        description: "Falha ao abrir o editor",
        variant: "destructive",
      });
    }
  };

  const deleteRecord = async (conflict: MacConflict) => {
    if (!confirm(`Tem certeza que deseja deletar este registro de ${getTableDisplayName(conflict.table)}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from(conflict.table as 'defeitos' | 'caixas_inventario' | 'equipamentos')
        .delete()
        .eq('id', conflict.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Registro deletado de ${getTableDisplayName(conflict.table)}`,
      });

      // Atualizar a lista de conflitos
      setConflicts(prev => prev.filter(c => 
        !(c.id === conflict.id && c.table === conflict.table)
      ));

      // Notificar o componente pai
      if (onMacRemoved) {
        onMacRemoved(conflictingMac);
      }
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
      toast({
        title: "Erro",
        description: "Falha ao deletar o registro",
        variant: "destructive",
      });
    }
  };

  const getTableDisplayName = (table: string) => {
    switch (table) {
      case 'equipamentos': return 'Equipamentos';
      case 'caixas_inventario': return 'Caixas de Inventário';
      case 'defeitos': return 'Registros de Defeitos';
      default: return table;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Conflito de MAC Address
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="h-4 w-4 text-destructive" />
              <span className="font-semibold text-destructive">MAC Conflitante:</span>
              <Badge variant="destructive" className="font-mono">{conflictingMac}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Este MAC address já está registrado no sistema. Cada MAC deve ser único.
              Você pode remover o MAC dos registros existentes ou usar um MAC diferente.
            </p>
            {isAdmin && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>Modo Admin:</strong> Você tem acesso aos botões de Editar e Deletar registros completos.
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Buscando conflitos...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Registros encontrados com este MAC:</h3>
              
              {conflicts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum conflito encontrado. O MAC pode ter sido removido recentemente.
                </p>
              ) : (
                <div className="grid gap-4">
                  {conflicts.map((conflict, index) => (
                    <Card key={`${conflict.table}-${conflict.id}-${index}`} className="border-l-4 border-l-destructive">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getTableDisplayName(conflict.table)}</Badge>
                            <span className="font-mono text-xs text-muted-foreground">
                              ID: {conflict.id.substring(0, 8)}...
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Botões para admin */}
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editRecord(conflict)}
                                  className="h-8"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteRecord(conflict)}
                                  className="h-8"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Deletar
                                </Button>
                              </>
                            )}
                            {/* Botão padrão para remover MAC (disponível para todos) */}
                            {(conflict.table === 'defeitos' || conflict.table === 'caixas_inventario') && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => removeMacFromRecord(conflict)}
                                className="h-8"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remover MAC
                              </Button>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {conflict.nome && (
                            <div>
                              <span className="font-medium">Nome:</span> {conflict.nome}
                            </div>
                          )}
                          {conflict.equipamento && (
                            <div>
                              <span className="font-medium">Equipamento:</span> {conflict.equipamento}
                            </div>
                          )}
                          {conflict.modelo && (
                            <div>
                              <span className="font-medium">Modelo:</span> {conflict.modelo}
                            </div>
                          )}
                          {conflict.numero_caixa && (
                            <div>
                              <span className="font-medium">Caixa:</span> {conflict.numero_caixa}
                            </div>
                          )}
                          {conflict.data_registro && (
                            <div>
                              <span className="font-medium">Data Registro:</span> {conflict.data_registro}
                            </div>
                          )}
                          {conflict.created_at && (
                            <div>
                              <span className="font-medium">Criado em:</span> {formatDate(conflict.created_at)}
                            </div>
                          )}
                        </div>
                        
                        {conflict.table === 'equipamentos' && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <strong>Atenção:</strong> Este MAC está em um equipamento individual. 
                            Para resolver o conflito, você precisará editar o equipamento manualmente.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}