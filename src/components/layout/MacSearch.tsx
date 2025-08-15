import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useEquipamento } from '@/contexts/EquipamentoContext';

interface MacSearchResult {
  id: string;
  nome: string;
  modelo: string;
  macAddress: string;
  localizacao: string;
}

export function MacSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<MacSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { equipamentos } = useEquipamento();
  const searchRef = useRef<HTMLDivElement>(null);

  // Função para normalizar MAC (remove caracteres especiais)
  const normalizeMac = (mac: string) => {
    return mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
  };

  // Pesquisar por MAC
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const searchNormalized = normalizeMac(searchTerm);
      
      const filteredResults = equipamentos
        .filter(eq => {
          if (!eq.mac) return false;
          const macNormalized = normalizeMac(eq.mac);
          return macNormalized.includes(searchNormalized);
        })
        .map(eq => ({
          id: eq.id,
          nome: eq.nome,
          modelo: eq.modelo || 'N/A',
          macAddress: eq.mac || '',
          localizacao: eq.localizacao || 'Não informado'
        }));

      setResults(filteredResults);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [searchTerm, equipamentos]);

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por MAC address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          className="pl-10"
        />
      </div>

      {/* Resultados da pesquisa */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border">
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum equipamento encontrado</p>
                <p className="text-xs mt-1">Digite pelo menos 2 caracteres do MAC</p>
              </div>
            ) : (
              <div className="divide-y">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setShowResults(false);
                      setSearchTerm('');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{result.nome}</span>
                          <Badge variant="outline" className="text-xs">
                            {result.modelo}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-mono bg-muted px-1 rounded">
                              {result.macAddress}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{result.localizacao}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}