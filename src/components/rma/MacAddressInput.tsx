import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMacValidation } from "@/hooks/useMacValidation";

interface MacAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  currentPage?: 'recuperacao' | 'producao' | 'other';
}

export function MacAddressInput({ 
  value, 
  onChange, 
  label = "Endereços MAC",
  placeholder = "Ex: AA:BB:CC:DD:EE:FF",
  currentPage = 'other'
}: MacAddressInputProps) {
  const [currentInput, setCurrentInput] = useState("");
  const [macAddresses, setMacAddresses] = useState<string[]>(
    value ? value.split(" | ").filter(Boolean) : []
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { formatMacAddress, validateMacFormat, checkMacExists, checkMacExistsWithRecoveryRule } = useMacValidation();

  const addMacAddress = async (mac: string) => {
    if (mac) {
      const macUpper = mac.toUpperCase();
      
      // Verificar se já está na lista local
      if (macAddresses.includes(macUpper)) {
        toast({
          title: "MAC já incluído",
          description: "Este MAC address já foi adicionado à lista",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se já existe no sistema com regra especial
      const exists = currentPage === 'other' 
        ? await checkMacExists(mac)
        : await checkMacExistsWithRecoveryRule(mac, currentPage);
      if (exists) {
        return; // O hook já mostra o toast de erro
      }
      
      const newMacAddresses = [...macAddresses, macUpper];
      setMacAddresses(newMacAddresses);
      updateParentValue(newMacAddresses);
      setCurrentInput("");
    }
  };

  const removeMacAddress = (index: number) => {
    const newMacAddresses = macAddresses.filter((_, i) => i !== index);
    setMacAddresses(newMacAddresses);
    updateParentValue(newMacAddresses);
  };

  const updateParentValue = (addresses: string[]) => {
    onChange(addresses.join(" | "));
  };

  // Processar múltiplos MACs colados
  const processBulkMacs = (text: string) => {
    // Separar por quebras de linha, vírgulas, espaços múltiplos ou pipes
    const potentialMacs = text.split(/[\n\r,|]+|\s{2,}/)
      .map(mac => mac.trim())
      .filter(mac => mac.length > 0);

    const validMacs: string[] = [];
    const invalidMacs: string[] = [];

    potentialMacs.forEach(mac => {
      // Tentar formatar o MAC (tanto com quanto sem separadores)
      let formattedMac = formatMacAddress(mac);
      
      // Se não tem separadores e tem 12 caracteres hex, é um MAC válido
      if (mac.length === 12 && /^[0-9A-Fa-f]{12}$/.test(mac)) {
        formattedMac = mac.match(/.{1,2}/g)?.join(':') || mac;
      }
      
      if (validateMacFormat(formattedMac)) {
        validMacs.push(formattedMac);
      } else if (mac.length > 0) {
        invalidMacs.push(mac);
      }
    });

    // Adicionar MACs válidos (verificando duplicatas globais)
    const processMacs = async () => {
      let addedCount = 0;
      const uniqueValidMacs = validMacs.filter(mac => !macAddresses.includes(mac.toUpperCase()));
      
      for (const mac of uniqueValidMacs) {
        const exists = await checkMacExists(mac);
        if (!exists) {
          addedCount++;
        }
      }
      
      if (addedCount > 0) {
        const macsToAdd = [];
        for (const mac of uniqueValidMacs) {
          const exists = await checkMacExists(mac);
          if (!exists) {
            macsToAdd.push(mac.toUpperCase());
          }
        }
        
        const newMacAddresses = [...macAddresses, ...macsToAdd];
        setMacAddresses(newMacAddresses);
        updateParentValue(newMacAddresses);

        toast({
          title: "MACs adicionados",
          description: `${addedCount} MAC${addedCount !== 1 ? 's' : ''} adicionado${addedCount !== 1 ? 's' : ''} com sucesso`,
        });
      }
    };
    
    processMacs();

    if (invalidMacs.length > 0) {
      toast({
        title: "MACs inválidos encontrados",
        description: `${invalidMacs.length} MAC${invalidMacs.length !== 1 ? 's' : ''} com formato inválido: ${invalidMacs.slice(0, 3).join(', ')}${invalidMacs.length > 3 ? '...' : ''}`,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Verificar se há múltiplos MACs (colagem)
    if (input.includes('\n') || input.includes(',') || /\s{2,}/.test(input) || 
        (input.length > 20 && /^[0-9A-Fa-f\s:,-|]+$/.test(input))) {
      processBulkMacs(input);
      setCurrentInput("");
      return;
    }
    
    // Verificar se contém pipe
    if (input.includes("|")) {
      const parts = input.split("|");
      const macToAdd = formatMacAddress(parts[0].trim());
      
      if (macToAdd && validateMacFormat(macToAdd)) {
        addMacAddress(macToAdd);
      }
      
      // Manter o resto do input após o pipe
      setCurrentInput(formatMacAddress(parts.slice(1).join("|").trim()));
    } else {
      setCurrentInput(formatMacAddress(input));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (currentInput && validateMacFormat(currentInput)) {
        addMacAddress(currentInput);
      }
    }
    
    // Permitir backspace quando input vazio para remover último MAC
    if (e.key === "Backspace" && !currentInput && macAddresses.length > 0) {
      removeMacAddress(macAddresses.length - 1);
    }
  };

  const handleAddClick = () => {
    if (currentInput && validateMacFormat(currentInput)) {
      addMacAddress(currentInput);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Lista de MACs adicionados */}
      {macAddresses.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
          {macAddresses.map((mac, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-3 py-1 text-sm flex items-center gap-2 bg-primary/10 text-primary border-primary/20"
            >
              <span className="font-mono">{mac}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive"
                onClick={() => removeMacAddress(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input para adicionar novo MAC */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="font-mono"
          />
          
          {/* Indicador visual de formatação */}
          {currentInput && !validateMacFormat(currentInput) && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" 
                   title="Formato incompleto - continue digitando ou use | para adicionar" />
            </div>
          )}
          
          {currentInput && validateMacFormat(currentInput) && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-2 h-2 rounded-full bg-success" 
                   title="Formato válido - pressione Enter, Tab ou | para adicionar" />
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={!currentInput || !validateMacFormat(currentInput)}
          className="px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Contador de MACs e dicas */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            MACs cadastrados: <span className="text-primary">{macAddresses.length}</span>
          </span>
        </div>
        <p>💡 <strong>Dicas:</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-4">
          <li>Digite o MAC e use <code className="bg-muted px-1 rounded">|</code> para adicionar automaticamente</li>
          <li>Pressione <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Enter</kbd> ou <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Tab</kbd> para adicionar</li>
          <li><strong>Cole múltiplos MACs:</strong> Separados por linha, vírgula ou espaços duplos</li>
          <li>Formatos aceitos: <code className="bg-muted px-1 rounded">AA:BB:CC:DD:EE:FF</code> ou <code className="bg-muted px-1 rounded">AABBCCDDEEFF</code></li>
          <li><span className="text-warning">⚠️ O número de MACs deve corresponder à quantidade de equipamentos</span></li>
        </ul>
      </div>
    </div>
  );
}