import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar, 
  User, 
  Monitor, 
  Wifi, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Trash2,
  Download,
  Filter
} from 'lucide-react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSupabaseChecklists, ChecklistData, ChecklistFilters } from '@/hooks/useSupabaseChecklists';
import { useToast } from '@/hooks/use-toast';

const ChecklistHistory: React.FC = () => {
  const { 
    checklists, 
    loading, 
    fetchChecklists, 
    deleteChecklist, 
    findChecklistsByMac, 
    findChecklistsByIP,
    getStatistics 
  } = useSupabaseChecklists();
  
  const { toast } = useToast();

  // Estados para filtros
  const [filters, setFilters] = useState<ChecklistFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'nome' | 'mac' | 'ip'>('nome');
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    concluidos: 0,
    emAndamento: 0,
    pendentes: 0,
    progressoMedio: 0,
    taxaConclusao: 0
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    loadStatistics();
  }, []);

  const loadData = async () => {
    await fetchChecklists(filters);
  };

  const loadStatistics = async () => {
    const stats = await getStatistics();
    setStatistics(stats);
  };

  // Buscar com filtros
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await fetchChecklists(filters);
      return;
    }

    let results: ChecklistData[] = [];

    switch (searchType) {
      case 'mac':
        results = await findChecklistsByMac(searchTerm);
        break;
      case 'ip':
        results = await findChecklistsByIP(searchTerm);
        break;
      case 'nome':
        await fetchChecklists({ ...filters, nome_tecnico: searchTerm });
        return;
      default:
        await fetchChecklists(filters);
        return;
    }

    // Para MAC e IP, atualizamos a lista diretamente
    if (searchType === 'mac' || searchType === 'ip') {
      // Como não temos acesso direto ao setChecklists, vamos usar fetchChecklists com filtros
      const newFilters = { ...filters };
      if (searchType === 'mac') {
        newFilters.mac_address = searchTerm;
      } else if (searchType === 'ip') {
        newFilters.endereco_ip = searchTerm;
      }
      await fetchChecklists(newFilters);
    }
  };

  // Aplicar filtros avançados
  const applyFilters = async () => {
    await fetchChecklists(filters);
    setShowFilters(false);
  };

  // Limpar filtros
  const clearFilters = async () => {
    setFilters({});
    setSearchTerm('');
    await fetchChecklists();
  };

  // Excluir checklist
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este checklist?')) {
      const success = await deleteChecklist(id);
      if (success) {
        await loadData();
        await loadStatistics();
      }
    }
  };

  // Visualizar detalhes
  const viewDetails = (checklist: ChecklistData) => {
    setSelectedChecklist(checklist);
  };

  // Exportar dados
  const exportData = () => {
    const csvContent = [
      // Cabeçalho
      [
        'ID',
        'Técnico',
        'Data Atendimento',
        'Equipamento',
        'MAC',
        'IP',
        'Status',
        'Progresso (%)',
        'Wi-Fi',
        'LAN',
        'Login',
        'Sinal',
        'Velocidade'
      ].join(','),
      // Dados
      ...checklists.map(checklist => [
        checklist.id,
        checklist.nome_tecnico,
        checklist.data_atendimento,
        `${checklist.marca} ${checklist.modelo}`,
        checklist.mac_address || '',
        checklist.endereco_ip || '',
        checklist.status_geral,
        checklist.progresso_percentual,
        checklist.wifi_resultado || 'N/A',
        checklist.lan_resultado || 'N/A',
        checklist.login_resultado || 'N/A',
        checklist.medicao_resultado || 'N/A',
        checklist.velocidade_resultado || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `checklists_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-500';
      case 'em_andamento': return 'bg-yellow-500';
      case 'pendente': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Função para obter cor do resultado
  const getResultColor = (resultado: string) => {
    switch (resultado) {
      case 'aprovado': return 'text-green-600';
      case 'reprovado': return 'text-red-600';
      case 'nao_aplicavel': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Histórico de Checklists</h1>
            <p className="text-muted-foreground">Busque e gerencie registros de checklists técnicos</p>
          </div>
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{statistics.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.concluidos}</div>
              <div className="text-sm text-muted-foreground">Concluídos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{statistics.emAndamento}</div>
              <div className="text-sm text-muted-foreground">Em Andamento</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{statistics.pendentes}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{statistics.progressoMedio}%</div>
              <div className="text-sm text-muted-foreground">Progresso Médio</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{statistics.taxaConclusao}%</div>
              <div className="text-sm text-muted-foreground">Taxa Conclusão</div>
            </CardContent>
          </Card>
        </div>

        {/* Busca e Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Buscar Checklists
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Termo de Busca</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o termo de busca..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="w-40">
                <Label htmlFor="searchType">Buscar por</Label>
                <select
                  id="searchType"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'nome' | 'mac' | 'ip')}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="nome">Nome do Técnico</option>
                  <option value="mac">MAC Address</option>
                  <option value="ip">Endereço IP</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avançados
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Limpar
              </Button>
            </div>

            {/* Filtros Avançados */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={filters.data_inicio || ''}
                      onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim">Data Fim</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={filters.data_fim || ''}
                      onChange={(e) => setFilters({ ...filters, data_fim: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="statusGeral">Status</Label>
                    <select
                      id="statusGeral"
                      value={filters.status_geral || ''}
                      onChange={(e) => setFilters({ ...filters, status_geral: e.target.value })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="">Todos</option>
                      <option value="concluido">Concluído</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="pendente">Pendente</option>
                    </select>
                  </div>
                </div>
                <Button onClick={applyFilters}>
                  Aplicar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Checklists */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados ({checklists.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Carregando...</p>
              </div>
            ) : checklists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum checklist encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {checklists.map((checklist) => (
                  <div key={checklist.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span className="font-medium">{checklist.nome_tecnico}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span className="text-sm">{new Date(checklist.data_atendimento).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <Badge className={`${getStatusColor(checklist.status_geral)} text-white`}>
                            {checklist.status_geral.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center">
                            <Monitor className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span>{checklist.marca} {checklist.modelo}</span>
                          </div>
                          {checklist.mac_address && (
                            <div>
                              <span className="text-muted-foreground">MAC:</span> {checklist.mac_address}
                            </div>
                          )}
                          {checklist.endereco_ip && (
                            <div>
                              <span className="text-muted-foreground">IP:</span> {checklist.endereco_ip}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${checklist.progresso_percentual}%` }}
                              ></div>
                            </div>
                            <span>{checklist.progresso_percentual}%</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className={`flex items-center ${getResultColor(checklist.wifi_resultado || '')}`}>
                            <Wifi className="w-3 h-3 mr-1" />
                            Wi-Fi: {checklist.wifi_resultado || 'N/A'}
                          </div>
                          <div className={`flex items-center ${getResultColor(checklist.lan_resultado || '')}`}>
                            <Monitor className="w-3 h-3 mr-1" />
                            LAN: {checklist.lan_resultado || 'N/A'}
                          </div>
                          <div className={`flex items-center ${getResultColor(checklist.login_resultado || '')}`}>
                            <User className="w-3 h-3 mr-1" />
                            Login: {checklist.login_resultado || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => viewDetails(checklist)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete(checklist.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        {selectedChecklist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Detalhes do Checklist</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedChecklist(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Informações do Técnico</h3>
                    <p><strong>Nome:</strong> {selectedChecklist.nome_tecnico}</p>
                    <p><strong>Data:</strong> {new Date(selectedChecklist.data_atendimento).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Hora:</strong> {selectedChecklist.data_hora}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Equipamento</h3>
                    <p><strong>Tipo:</strong> {selectedChecklist.tipo_equipamento}</p>
                    <p><strong>Marca:</strong> {selectedChecklist.marca}</p>
                    <p><strong>Modelo:</strong> {selectedChecklist.modelo}</p>
                    <p><strong>MAC:</strong> {selectedChecklist.mac_address}</p>
                    <p><strong>IP:</strong> {selectedChecklist.endereco_ip}</p>
                    <p><strong>SN GPON:</strong> {selectedChecklist.sn_gpon}</p>
                  </div>
                </div>

                {/* Resultados dos Testes */}
                <div>
                  <h3 className="font-semibold mb-4">Resultados dos Testes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Wi-Fi</h4>
                        <p className={`font-semibold ${getResultColor(selectedChecklist.wifi_resultado || '')}`}>
                          {selectedChecklist.wifi_resultado || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedChecklist.wifi_observacoes}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">LAN</h4>
                        <p className={`font-semibold ${getResultColor(selectedChecklist.lan_resultado || '')}`}>
                          {selectedChecklist.lan_resultado || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedChecklist.lan_observacoes}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Login</h4>
                        <p className={`font-semibold ${getResultColor(selectedChecklist.login_resultado || '')}`}>
                          {selectedChecklist.login_resultado || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedChecklist.login_observacoes}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Sinal</h4>
                        <p className={`font-semibold ${getResultColor(selectedChecklist.medicao_resultado || '')}`}>
                          {selectedChecklist.medicao_resultado || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Frequência: {selectedChecklist.medicao_frequencia_testada}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Potência: {selectedChecklist.medicao_potencia_recebida} dBm
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Velocidade</h4>
                        <p className={`font-semibold ${getResultColor(selectedChecklist.velocidade_resultado || '')}`}>
                          {selectedChecklist.velocidade_resultado || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Down: {selectedChecklist.velocidade_download} Mbps
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Up: {selectedChecklist.velocidade_upload} Mbps
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Status Geral</h4>
                        <Badge className={`${getStatusColor(selectedChecklist.status_geral)} text-white`}>
                          {selectedChecklist.status_geral.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Progresso: {selectedChecklist.progresso_percentual}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Observações Finais */}
                {selectedChecklist.observacoes_finais && (
                  <div>
                    <h3 className="font-semibold mb-2">Observações Finais</h3>
                    <p className="text-sm bg-muted p-3 rounded">
                      {selectedChecklist.observacoes_finais}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChecklistHistory;