import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Package, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useEquipamento } from '@/contexts/EquipamentoContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface MacSearchResult {
  id: string;
  nome: string;
  modelo: string;
  macAddress: string;
  localizacao: string;
  fonte: 'equipamentos' | 'inventario' | 'defeitos' | 'recuperacao' | 'rma';
  detalhes?: any;
}

export function MacSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<MacSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const { equipamentos } = useEquipamento();
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Função para normalizar MAC (remove caracteres especiais)
  const normalizeMac = (mac: string) => {
    return mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
  };

  // Buscar MAC em todas as tabelas
  const searchMacInAllTables = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    const searchNormalized = normalizeMac(searchTerm);
    const allResults: MacSearchResult[] = [];

    try {
      // 1. Buscar em equipamentos (contexto local)
      const equipamentosResults = equipamentos
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
          localizacao: eq.localizacao || 'Não informado',
          fonte: 'equipamentos' as const,
          detalhes: eq
        }));

      allResults.push(...equipamentosResults);

      // 2. Buscar em caixas_inventario
      const { data: caixasInventario } = await supabase
        .from('caixas_inventario')
        .select('*')
        .or(`macs.cs.{${searchTerm.toUpperCase()}}`)
        .limit(10);

      if (caixasInventario) {
        const inventarioResults = caixasInventario
          .filter(caixa => {
            return caixa.macs?.some((mac: string) => 
              normalizeMac(mac).includes(searchNormalized)
            );
          })
          .map(caixa => ({
            id: caixa.id,
            nome: `Caixa ${caixa.numero_caixa}`,
            modelo: caixa.modelo || 'N/A',
            macAddress: caixa.macs?.find((mac: string) => 
              normalizeMac(mac).includes(searchNormalized)
            ) || '',
            localizacao: 'Inventário',
            fonte: 'inventario' as const,
            detalhes: caixa
          }));

        allResults.push(...inventarioResults);
      }

      // 3. Buscar em defeitos
      const { data: defeitos } = await supabase
        .from('defeitos')
        .select('*')
        .or(`macs.cs.{${searchTerm.toUpperCase()}}`)
        .limit(10);

      if (defeitos) {
        const defeitosResults = defeitos
          .filter(defeito => {
            return defeito.macs?.some((mac: string) => 
              normalizeMac(mac).includes(searchNormalized)
            );
          })
          .map(defeito => ({
            id: defeito.id,
            nome: defeito.equipamento,
            modelo: defeito.modelo || 'N/A',
            macAddress: defeito.macs?.find((mac: string) => 
              normalizeMac(mac).includes(searchNormalized)
            ) || '',
            localizacao: 'Defeitos',
            fonte: 'defeitos' as const,
            detalhes: defeito
          }));

        allResults.push(...defeitosResults);
      }

      // 4. Buscar em recuperacoes
      const { data: recuperacoes } = await supabase
        .from('recuperacoes')
        .select('*')
        .or(`macs.cs.{${searchTerm.toUpperCase()}}`)
        .limit(10);

      if (recuperacoes) {
        const recuperacoesResults = recuperacoes
          .filter(recuperacao => {
            return recuperacao.macs?.some((mac: string) => 
              normalizeMac(mac).includes(searchNormalized)
            );
          })
          .map(recuperacao => ({
            id: recuperacao.id,
            nome: recuperacao.equipamento,
            modelo: 'Recuperado',
            macAddress: recuperacao.macs?.find((mac: string) => 
              normalizeMac(mac).includes(searchNormalized)
            ) || '',
            localizacao: 'Recuperação',
            fonte: 'recuperacao' as const,
            detalhes: recuperacao
          }));

        allResults.push(...recuperacoesResults);
      }

      // 5. Buscar em RMA
      const { data: rmas } = await supabase
        .from('rmas')
        .select('*')
        .ilike('mac_address', `%${searchTerm}%`)
        .limit(10);

      if (rmas) {
        const rmaResults = rmas
          .filter(rma => {
            if (!rma.mac_address) return false;
            const macs = rma.mac_address.split(/[,|]/).map((mac: string) => mac.trim());
            return macs.some(mac => normalizeMac(mac).includes(searchNormalized));
          })
          .map(rma => ({
            id: rma.id,
            nome: rma.equipamento,
            modelo: rma.modelo || 'N/A',
            macAddress: rma.mac_address?.split(/[,|]/).find((mac: string) => 
              normalizeMac(mac.trim()).includes(searchNormalized)
            )?.trim() || '',
            localizacao: 'RMA',
            fonte: 'rma' as const,
            detalhes: rma
          }));

        allResults.push(...rmaResults);
      }

      setResults(allResults);
      setShowResults(true);
    } catch (error) {
      console.error('Erro ao buscar MAC:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar o MAC address. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Pesquisar por MAC com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMacInAllTables(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, equipamentos]);

  // Função para lidar com clique no resultado
  const handleResultClick = (result: MacSearchResult) => {
    setShowResults(false);
    setSearchTerm('');

    // Redirecionar baseado na fonte
    switch (result.fonte) {
      case 'equipamentos':
        navigate('/equipamentos');
        toast({
          title: "MAC encontrado!",
          description: `MAC ${result.macAddress} encontrado no equipamento: ${result.nome}`,
        });
        break;
      case 'inventario':
        navigate('/inventario');
        toast({
          title: "MAC encontrado!",
          description: `MAC ${result.macAddress} encontrado no inventário: ${result.nome}`,
        });
        break;
      case 'defeitos':
        navigate('/defeitos');
        toast({
          title: "MAC encontrado!",
          description: `MAC ${result.macAddress} encontrado em defeitos: ${result.nome}`,
        });
        break;
      case 'recuperacao':
        navigate('/recuperacao');
        toast({
          title: "MAC encontrado!",
          description: `MAC ${result.macAddress} encontrado em recuperação: ${result.nome}`,
        });
        break;
      case 'rma':
        navigate('/rma');
        toast({
          title: "MAC encontrado!",
          description: `MAC ${result.macAddress} encontrado em RMA: ${result.nome}`,
        });
        break;
      default:
        toast({
          title: "MAC encontrado!",
          description: `MAC ${result.macAddress} encontrado em: ${result.nome}`,
        });
    }
  };

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
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Buscando MAC addresses...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum MAC address encontrado</p>
                <p className="text-xs mt-1">Digite pelo menos 2 caracteres do MAC</p>
              </div>
            ) : (
              <div className="divide-y">
                {results.map((result) => (
                  <div
                    key={`${result.fonte}-${result.id}`}
                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{result.nome}</span>
                          <Badge variant="outline" className="text-xs">
                            {result.modelo}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {result.fonte}
                          </Badge>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
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
