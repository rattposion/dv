import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { EquipmentSelector } from '@/components/defeitos/EquipmentSelector';
import { MacAddressInput } from '@/components/rma/MacAddressInput';

export interface EquipmentWithMacs {
  id: string;
  equipment: any;
  macAddresses: string;
}

interface MultipleEquipmentSelectorProps {
  equipments: EquipmentWithMacs[];
  onChange: (equipments: EquipmentWithMacs[]) => void;
}

export function MultipleEquipmentSelector({ equipments, onChange }: MultipleEquipmentSelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);

  const addEquipment = () => {
    if (!selectedEquipment) return;

    const newEquipment: EquipmentWithMacs = {
      id: Date.now().toString(),
      equipment: selectedEquipment,
      macAddresses: ''
    };

    onChange([...equipments, newEquipment]);
    setSelectedEquipment(null);
    setShowAddForm(false);
  };

  const removeEquipment = (id: string) => {
    onChange(equipments.filter(eq => eq.id !== id));
  };

  const updateMacAddresses = (id: string, macAddresses: string) => {
    onChange(equipments.map(eq => 
      eq.id === id ? { ...eq, macAddresses } : eq
    ));
  };

  // Calcular totais
  const totalEquipments = equipments.length;
  const allMacs = equipments
    .flatMap(eq => eq.macAddresses.split('|').map(mac => mac.trim()).filter(mac => mac.length > 0))
    .filter(mac => mac.length > 0);
  const totalMacs = allMacs.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Equipamentos</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Equipamento
        </Button>
      </div>

      {/* Formulário para adicionar novo equipamento */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar Novo Equipamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EquipmentSelector
              onSelect={setSelectedEquipment}
              selectedEquipment={selectedEquipment}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={addEquipment}
                disabled={!selectedEquipment}
                size="sm"
              >
                Adicionar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedEquipment(null);
                }}
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de equipamentos adicionados */}
      {equipments.length > 0 && (
        <div className="space-y-4">
          {equipments.map((equipmentItem) => (
            <Card key={equipmentItem.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {equipmentItem.equipment.nome}
                    </CardTitle>
                    {equipmentItem.equipment.modelo && (
                      <Badge variant="secondary">
                        {equipmentItem.equipment.modelo}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEquipment(equipmentItem.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <MacAddressInput
                  value={equipmentItem.macAddresses}
                  onChange={(value) => updateMacAddresses(equipmentItem.id, value)}
                  label="Endereços MAC para este equipamento"
                  placeholder="Digite os MACs para este equipamento"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resumo dos totais */}
      {equipments.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              📊 Resumo Total
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="text-2xl font-bold text-primary">{totalEquipments}</div>
                <div className="text-sm text-muted-foreground">
                  Equipamento{totalEquipments !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="text-2xl font-bold text-primary">{totalMacs}</div>
                <div className="text-sm text-muted-foreground">
                  MAC{totalMacs !== 1 ? 's' : ''} Total
                </div>
              </div>
            </div>
            
            {allMacs.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Todos os MACs:</div>
                <div className="max-h-32 overflow-y-auto p-2 bg-background rounded border">
                  <div className="text-xs font-mono space-y-1">
                    {allMacs.map((mac, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{mac}</span>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {equipments.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <p>Nenhum equipamento adicionado</p>
          <p className="text-sm">Clique em "Adicionar Equipamento" para começar</p>
        </div>
      )}
    </div>
  );
}