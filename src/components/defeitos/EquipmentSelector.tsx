import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Monitor, MapPin, Package } from 'lucide-react';
import { useEquipamento } from '@/contexts/EquipamentoContext';

interface Equipment {
  id: string;
  nome: string;
  modelo: string;
  mac?: string;
  localizacao?: string;
}

interface EquipmentSelectorProps {
  onSelect: (equipment: Equipment) => void;
  selectedEquipment?: Equipment;
}

export function EquipmentSelector({ onSelect, selectedEquipment }: EquipmentSelectorProps) {
  const { equipamentos } = useEquipamento();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEquipments(equipamentos);
      return;
    }

    const filtered = equipamentos.filter(equipment => {
      const searchLower = searchTerm.toLowerCase();
      return (
        equipment.nome.toLowerCase().includes(searchLower) ||
        equipment.modelo.toLowerCase().includes(searchLower) ||
        (equipment.mac && equipment.mac.toLowerCase().includes(searchLower))
      );
    });
    
    setFilteredEquipments(filtered);
  }, [searchTerm, equipamentos]);

  const handleSelect = (equipment: Equipment) => {
    onSelect(equipment);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div>
      <Label>Equipamento *</Label>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {selectedEquipment ? (
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span>{selectedEquipment.nome} - {selectedEquipment.modelo}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Selecionar equipamento...</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Selecionar Equipamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, modelo ou MAC address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {filteredEquipments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum equipamento encontrado
                </div>
              ) : (
                filteredEquipments.map((equipment) => (
                  <div
                    key={equipment.id}
                    onClick={() => handleSelect(equipment)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-primary" />
                          <span className="font-medium">{equipment.nome}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>{equipment.modelo}</span>
                        </div>
                        {equipment.mac && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {equipment.mac}
                            </Badge>
                          </div>
                        )}
                        {equipment.localizacao && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{equipment.localizacao}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}