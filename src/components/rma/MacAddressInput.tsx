import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MacAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function MacAddressInput({ 
  value, 
  onChange, 
  label = "Endereços MAC",
  placeholder = "Ex: AA:BB:CC:DD:EE:FF"
}: MacAddressInputProps) {
  const [currentInput, setCurrentInput] = useState("");
  const [macAddresses, setMacAddresses] = useState<string[]>(
    value ? value.split(" | ").filter(Boolean) : []
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Formatar MAC address automaticamente
  const formatMacAddress = (input: string) => {
    // Remove caracteres não hexadecimais
    const clean = input.replace(/[^0-9A-Fa-f]/g, '');
    
    // Adiciona dois pontos a cada 2 caracteres
    const formatted = clean.match(/.{1,2}/g)?.join(':') || clean;
    
    // Limita a 17 caracteres (formato AA:BB:CC:DD:EE:FF)
    return formatted.substring(0, 17);
  };

  const validateMacAddress = (mac: string) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  const addMacAddress = (mac: string) => {
    if (mac) {
      if (!macAddresses.includes(mac.toUpperCase())) {
        const newMacAddresses = [...macAddresses, mac.toUpperCase()];
        setMacAddresses(newMacAddresses);
        updateParentValue(newMacAddresses);
        setCurrentInput("");
      } else {
        toast({
          title: "MAC já incluído",
          description: "Este MAC address já foi adicionado à lista",
          variant: "destructive",
        });
      }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Verificar se contém pipe
    if (input.includes("|")) {
      const parts = input.split("|");
      const macToAdd = formatMacAddress(parts[0].trim());
      
      if (macToAdd && validateMacAddress(macToAdd)) {
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
      if (currentInput && validateMacAddress(currentInput)) {
        addMacAddress(currentInput);
      }
    }
    
    // Permitir backspace quando input vazio para remover último MAC
    if (e.key === "Backspace" && !currentInput && macAddresses.length > 0) {
      removeMacAddress(macAddresses.length - 1);
    }
  };

  const handleAddClick = () => {
    if (currentInput && validateMacAddress(currentInput)) {
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
          {currentInput && !validateMacAddress(currentInput) && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" 
                   title="Formato incompleto - continue digitando ou use | para adicionar" />
            </div>
          )}
          
          {currentInput && validateMacAddress(currentInput) && (
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
          disabled={!currentInput || !validateMacAddress(currentInput)}
          className="px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Dicas de uso */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 <strong>Dicas:</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-4">
          <li>Digite o MAC e use <code className="bg-muted px-1 rounded">|</code> para adicionar automaticamente</li>
          <li>Pressione <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Enter</kbd> ou <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Tab</kbd> para adicionar</li>
          <li>Backspace no campo vazio remove o último MAC</li>
          <li>Formato aceito: AA:BB:CC:DD:EE:FF (formatação automática)</li>
        </ul>
      </div>
    </div>
  );
}