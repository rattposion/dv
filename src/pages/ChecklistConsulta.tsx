import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseChecklists, ChecklistData, ChecklistFilters } from '@/hooks/useSupabaseChecklists';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Calendar, 
  User, 
  BarChart3,
  Shield,
  TrendingUp,
  Activity,
  Zap,
  Star,
  Sparkles,
  Database,
  Globe,
  Wifi,
  Router,
  Signal,
  Gauge,
  Radio,
  LogOut,
  RotateCcw,
  X
} from 'lucide-react';

// Senha fixa para acesso ao subsistema
const SUBSYSTEM_PASSWORD = 'checklist2025';

interface ChecklistConsultaProps {}

const ChecklistConsulta: React.FC<ChecklistConsultaProps> = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para consulta de checklists
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [filteredChecklists, setFilteredChecklists] = useState<ChecklistData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistData | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState<ChecklistFilters>({});
  
  const { fetchChecklists, loading } = useSupabaseChecklists();
  const { toast } = useToast();

  // Verificar se já está autenticado (localStorage)
  useEffect(() => {
    const authStatus = localStorage.getItem('checklist_subsystem_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Carregar checklists quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadChecklists();
    }
  }, [isAuthenticated]);

  // Filtrar checklists baseado na busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredChecklists(checklists);
      return;
    }

    const filtered = checklists.filter(checklist => 
      checklist.nome_tecnico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (checklist.mac_address && checklist.mac_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      checklist.status_geral.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredChecklists(filtered);
  }, [searchTerm, checklists]);

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    
    // Simular um pequeno delay para mostrar a animação
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (password === SUBSYSTEM_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('checklist_subsystem_auth', 'true');
      setLoginError('');
      toast({
        title: "🎉 Acesso autorizado",
        description: "Bem-vindo ao subsistema de consulta de checklists",
      });
    } else {
      setLoginError('Senha incorreta');
      toast({
        title: "🚫 Erro de autenticação",
        description: "Senha incorreta. Tente novamente.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('checklist_subsystem_auth');
    setPassword('');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do subsistema",
    });
  };

  const loadChecklists = async () => {
    try {
      const data = await fetchChecklists(filters);
      setChecklists(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar checklists",
        variant: "destructive",
      });
    }
  };

  const applyFilters = async () => {
    await loadChecklists();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    loadChecklists();
  };

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
      ...filteredChecklists.map(checklist => [
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
    link.setAttribute('download', `checklists_consulta_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
      case 'pendente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultColor = (resultado: string) => {
    switch (resultado?.toLowerCase()) {
      case 'aprovado':
      case 'ok':
      case 'sucesso':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'reprovado':
      case 'falha':
      case 'erro':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pendente':
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTestStats = (checklist: ChecklistData) => {
    const tests = [
      { name: 'Wi-Fi', realizado: checklist.wifi_teste_realizado, resultado: checklist.wifi_resultado },
      { name: 'LAN', realizado: checklist.lan_teste_realizado, resultado: checklist.lan_resultado },
      { name: 'Login', realizado: checklist.login_teste_realizado, resultado: checklist.login_resultado },
      { name: 'Medição', realizado: checklist.medicao_teste_realizado, resultado: checklist.medicao_resultado },
      { name: 'Velocidade', realizado: checklist.velocidade_teste_realizado, resultado: checklist.velocidade_resultado },
      { name: 'Dados', realizado: checklist.dados_teste_realizado, resultado: checklist.dados_resultado }
    ];

    const realizados = tests.filter(test => test.realizado).length;
    const aprovados = tests.filter(test => 
      test.realizado && ['aprovado', 'ok', 'sucesso'].includes(test.resultado?.toLowerCase() || '')
    ).length;
    const reprovados = tests.filter(test => 
      test.realizado && ['reprovado', 'falha', 'erro'].includes(test.resultado?.toLowerCase() || '')
    ).length;
    const naoRealizados = tests.filter(test => !test.realizado).length;

    return { total: tests.length, realizados, aprovados, reprovados, naoRealizados };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido': return <CheckCircle className="h-4 w-4" />;
      case 'em_andamento': return <Clock className="h-4 w-4" />;
      case 'pendente': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Tela de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>
        
        <Card className="w-full max-w-md backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl relative z-10 animate-in fade-in-0 zoom-in-95 duration-500">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-fit shadow-lg animate-in zoom-in-50 duration-700 delay-200">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-700 delay-300">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Subsistema de Consulta
              </CardTitle>
              <p className="text-gray-300 text-lg">
                Acesso seguro ao histórico de checklists
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                <span className="text-sm text-gray-400">Sistema Protegido</span>
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-500">
            <div className="space-y-3">
              <Label htmlFor="password" className="text-gray-200 font-medium">Senha de Acesso</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Digite a senha de acesso"
                  className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-blue-400 transition-all duration-300 pr-12 ${
                    loginError ? "border-red-400 focus:border-red-400" : ""
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {loginError && (
                <div className="flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-left-2 duration-300">
                  <AlertTriangle className="h-4 w-4" />
                  {loginError}
                </div>
              )}
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={!password.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Acessar Subsistema
                </>
              )}
            </Button>
            
            <div className="text-center pt-4">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Database className="h-3 w-3" />
                <span>Conectado ao banco de dados</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Consulta de Checklists
                </h1>
                <p className="text-gray-700 flex items-center gap-2 mt-1 font-medium">
                  <Activity className="h-4 w-4 text-green-600" />
                  Histórico e análise de checklists técnicos
                </p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="bg-white/50 hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700 transition-all duration-300">
              <Lock className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>



        {/* Controles de busca e filtros */}
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl animate-in slide-in-from-bottom-4 duration-500 delay-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Filtros e Busca Avançada
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Buscar por técnico, equipamento, MAC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-blue-400 focus:bg-white transition-all duration-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`bg-white/50 hover:bg-blue-50 border-gray-200 text-gray-700 hover:text-blue-700 transition-all duration-300 ${showFilters ? 'bg-blue-50 text-blue-700 border-blue-300' : ''}`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {showFilters && <span className="ml-1 text-xs">✓</span>}
                </Button>
                <Button
                  variant="outline"
                  onClick={exportData}
                  disabled={filteredChecklists.length === 0}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200 text-green-700 hover:text-green-800 transition-all duration-300 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button 
                  onClick={loadChecklists} 
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Filtros avançados */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tecnico" className="text-gray-700 font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      Técnico
                    </Label>
                    <Input
                      id="tecnico"
                      placeholder="Nome do técnico"
                      value={filters.nome_tecnico || ''}
                      onChange={(e) => setFilters({...filters, nome_tecnico: e.target.value})}
                      className="bg-white/50 border-gray-200 focus:border-blue-400 focus:bg-white transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataInicio" className="text-gray-700 font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      Data Início
                    </Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={filters.data_inicio || ''}
                      onChange={(e) => setFilters({...filters, data_inicio: e.target.value})}
                      className="bg-white/50 border-gray-200 focus:border-blue-400 focus:bg-white transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataFim" className="text-gray-700 font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      Data Fim
                    </Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={filters.data_fim || ''}
                      onChange={(e) => setFilters({...filters, data_fim: e.target.value})}
                      className="bg-white/50 border-gray-200 focus:border-blue-400 focus:bg-white transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button 
                    onClick={applyFilters} 
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Filter className="h-4 w-4 mr-2" />
                    )}
                    Aplicar Filtros
                  </Button>
                  <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="bg-white/50 hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900 transition-all duration-300"
                >
                  Limpar
                </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de checklists */}
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl animate-in slide-in-from-bottom-4 duration-500 delay-600">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Histórico de Checklists
                </span>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium">
                  {filteredChecklists.length}
                </span>
              </div>
              {filteredChecklists.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span>Dados atualizados</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                </div>
                <p className="mt-4 text-gray-800 animate-pulse font-medium">Carregando checklists...</p>
              </div>
            ) : filteredChecklists.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-12 w-12 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum checklist encontrado</h3>
                <p className="text-gray-700 font-medium">Tente ajustar os filtros ou termos de busca</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredChecklists.map((checklist, index) => (
                  <div
                    key={checklist.id}
                    className="group relative bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] animate-in slide-in-from-left-4 duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => setSelectedChecklist(checklist)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-lg text-gray-900">{checklist.nome_tecnico}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                checklist.status_geral === 'concluido' 
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                                  : checklist.status_geral === 'em_andamento'
                                  ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                              }`}>
                                {checklist.status_geral === 'concluido' ? '✅ Concluído' :
                                 checklist.status_geral === 'em_andamento' ? '⏳ Em Andamento' : '⏸️ Pendente'}
                              </span>
                              <span className="text-xs text-gray-700 flex items-center gap-1 font-medium">
                                <Calendar className="h-3 w-3" />
                                {new Date(checklist.data_atendimento).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-sm text-gray-800 font-semibold">Equipamento</p>
                            <p className="font-semibold text-gray-900">{checklist.marca} {checklist.modelo}</p>
                          </div>
                          {checklist.mac_address && (
                            <div className="flex items-center gap-2 text-gray-800">
                              <Wifi className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold">MAC:</span>
                              <span className="font-mono bg-gray-200 px-2 py-1 rounded font-semibold text-gray-900">{checklist.mac_address}</span>
                            </div>
                          )}
                          {checklist.sn_gpon && (
                            <div className="flex items-center gap-2 text-gray-800">
                              <Globe className="h-4 w-4 text-green-600" />
                              <span className="font-semibold">SN GPON:</span>
                              <span className="font-mono bg-gray-200 px-2 py-1 rounded font-semibold text-gray-900">{checklist.sn_gpon}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300 ml-6">
                        <Eye className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                    
                    {/* Indicador de hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de detalhes */}
        {selectedChecklist && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-300">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
              {/* Header do Modal */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Detalhes do Checklist</h2>
                        <p className="text-blue-100 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Técnico: {selectedChecklist.nome_tecnico}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedChecklist.status_geral === 'concluido' 
                          ? 'bg-green-500/30 text-green-50 border border-green-300/50 shadow-sm'
                          : selectedChecklist.status_geral === 'em_andamento'
                          ? 'bg-yellow-500/30 text-yellow-50 border border-yellow-300/50 shadow-sm'
                          : 'bg-red-500/30 text-red-50 border border-red-300/50 shadow-sm'
                      }`}>
                        {selectedChecklist.status_geral === 'concluido' ? '✅ Concluído' :
                         selectedChecklist.status_geral === 'em_andamento' ? '⏳ Em Andamento' : '⏸️ Pendente'}
                      </span>
                      <span className="text-blue-50 text-sm flex items-center gap-1 font-medium">
                        <Calendar className="h-4 w-4" />
                        {new Date(selectedChecklist.data_atendimento).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedChecklist(null)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-300"
                  >
                    ✕
                  </Button>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="p-6 space-y-8">


                  {/* Informações em Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Informações Gerais */}
                    <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <Clock className="h-5 w-5" />
                          Informações Gerais
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-gray-800">Técnico:</span>
                          <span className="text-gray-900 font-medium">{selectedChecklist.nome_tecnico}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-gray-800">Data:</span>
                          <span className="text-gray-900 font-medium">{new Date(selectedChecklist.data_atendimento).toLocaleDateString('pt-BR')}</span>
                        </div>


                      </CardContent>
                    </Card>
                    
                    {/* Informações do Equipamento */}
                    <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <Router className="h-5 w-5" />
                          Equipamento
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Router className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-gray-800">Modelo:</span>
                          <span className="text-gray-900 font-medium">{selectedChecklist.modelo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-gray-800">MAC:</span>
                          <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded text-gray-900 font-semibold">
                            {selectedChecklist.mac_address || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-gray-800">SN GPON:</span>
                          <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded text-gray-900 font-semibold">
                            {selectedChecklist.sn_gpon || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Signal className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-gray-800">SN GPON:</span>
                          <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded text-gray-900 font-semibold">
                            {selectedChecklist.sn_gpon || 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Resultados dos testes */}
                  <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 text-purple-800">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-purple-700" />
                          </div>
                          <span className="text-xl font-bold">Resultados dos Testes</span>
                        </CardTitle>
                        
                        {/* Resumo das estatísticas */}
                        <div className="flex items-center gap-4">
                          {(() => {
                            const stats = getTestStats(selectedChecklist);
                            return (
                              <>
                                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-semibold text-green-800">{stats.aprovados} Aprovados</span>
                                </div>
                                <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                  <X className="h-4 w-4 text-red-600" />
                                  <span className="text-sm font-semibold text-red-800">{stats.reprovados} Reprovados</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                  <Clock className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm font-semibold text-gray-800">{stats.naoRealizados} Não Realizados</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                        {/* Wi-Fi */}
                        <div className={`relative bg-gradient-to-br from-blue-50 to-blue-100 border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                          selectedChecklist.wifi_teste_realizado 
                            ? selectedChecklist.wifi_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.wifi_resultado?.toLowerCase() === 'ok' || selectedChecklist.wifi_resultado?.toLowerCase() === 'sucesso'
                              ? 'border-green-300 shadow-green-100' 
                              : 'border-red-300 shadow-red-100'
                            : 'border-gray-300 shadow-gray-100'
                        }`}>
                          {/* Indicador de status no canto superior direito */}
                          <div className="absolute top-3 right-3">
                            {selectedChecklist.wifi_teste_realizado ? (
                              selectedChecklist.wifi_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.wifi_resultado?.toLowerCase() === 'ok' || selectedChecklist.wifi_resultado?.toLowerCase() === 'sucesso' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-600" />
                              )
                            ) : (
                              <Clock className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <h4 className="font-bold mb-4 flex items-center gap-3 text-blue-900 pr-8">
                            <div className="p-2 bg-blue-200 rounded-lg">
                              <Wifi className="h-5 w-5 text-blue-700" />
                            </div>
                            <span className="text-lg">Wi-Fi</span>
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                              <div className={`w-3 h-3 rounded-full ${selectedChecklist.wifi_teste_realizado ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-gray-800 font-semibold">
                                Status: {selectedChecklist.wifi_teste_realizado ? 'Realizado' : 'Não Realizado'}
                              </span>
                            </div>
                            
                            {selectedChecklist.wifi_resultado && (
                              <div className="bg-white/60 p-3 rounded-lg">
                                <span className="text-gray-800 font-semibold">Resultado: </span>
                                <Badge className={`ml-2 font-bold text-sm ${getResultColor(selectedChecklist.wifi_resultado)}`}>
                                  {selectedChecklist.wifi_resultado}
                                </Badge>
                              </div>
                            )}
                            
                            {selectedChecklist.wifi_observacoes && (
                              <div className="bg-white/80 p-3 rounded-lg border-l-4 border-blue-400">
                                <p className="text-sm text-gray-700 font-medium">
                                  <span className="font-semibold text-blue-800">Observações:</span><br />
                                  {selectedChecklist.wifi_observacoes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* LAN */}
                        <div className={`relative bg-gradient-to-br from-green-50 to-green-100 border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                          selectedChecklist.lan_teste_realizado 
                            ? selectedChecklist.lan_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.lan_resultado?.toLowerCase() === 'ok' || selectedChecklist.lan_resultado?.toLowerCase() === 'sucesso'
                              ? 'border-green-300 shadow-green-100' 
                              : 'border-red-300 shadow-red-100'
                            : 'border-gray-300 shadow-gray-100'
                        }`}>
                          {/* Indicador de status no canto superior direito */}
                          <div className="absolute top-3 right-3">
                            {selectedChecklist.lan_teste_realizado ? (
                              selectedChecklist.lan_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.lan_resultado?.toLowerCase() === 'ok' || selectedChecklist.lan_resultado?.toLowerCase() === 'sucesso' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-600" />
                              )
                            ) : (
                              <Clock className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <h4 className="font-bold mb-4 flex items-center gap-3 text-green-900 pr-8">
                            <div className="p-2 bg-green-200 rounded-lg">
                              <Router className="h-5 w-5 text-green-700" />
                            </div>
                            <span className="text-lg">LAN</span>
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                              <div className={`w-3 h-3 rounded-full ${selectedChecklist.lan_teste_realizado ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-gray-800 font-semibold">
                                Status: {selectedChecklist.lan_teste_realizado ? 'Realizado' : 'Não Realizado'}
                              </span>
                            </div>
                            
                            {selectedChecklist.lan_resultado && (
                              <div className="bg-white/60 p-3 rounded-lg">
                                <span className="text-gray-800 font-semibold">Resultado: </span>
                                <Badge className={`ml-2 font-bold text-sm ${getResultColor(selectedChecklist.lan_resultado)}`}>
                                  {selectedChecklist.lan_resultado}
                                </Badge>
                              </div>
                            )}
                            
                            {selectedChecklist.lan_observacoes && (
                              <div className="bg-white/80 p-3 rounded-lg border-l-4 border-green-400">
                                <p className="text-sm text-gray-700 font-medium">
                                  <span className="font-semibold text-green-800">Observações:</span><br />
                                  {selectedChecklist.lan_observacoes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Login */}
                        <div className={`relative bg-gradient-to-br from-purple-50 to-purple-100 border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                          selectedChecklist.login_teste_realizado 
                            ? selectedChecklist.login_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.login_resultado?.toLowerCase() === 'ok' || selectedChecklist.login_resultado?.toLowerCase() === 'sucesso'
                              ? 'border-green-300 shadow-green-100' 
                              : 'border-red-300 shadow-red-100'
                            : 'border-gray-300 shadow-gray-100'
                        }`}>
                          {/* Indicador de status no canto superior direito */}
                          <div className="absolute top-3 right-3">
                            {selectedChecklist.login_teste_realizado ? (
                              selectedChecklist.login_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.login_resultado?.toLowerCase() === 'ok' || selectedChecklist.login_resultado?.toLowerCase() === 'sucesso' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-600" />
                              )
                            ) : (
                              <Clock className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <h4 className="font-bold mb-4 flex items-center gap-3 text-purple-900 pr-8">
                            <div className="p-2 bg-purple-200 rounded-lg">
                              <Shield className="h-5 w-5 text-purple-700" />
                            </div>
                            <span className="text-lg">Login</span>
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                              <div className={`w-3 h-3 rounded-full ${selectedChecklist.login_teste_realizado ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-gray-800 font-semibold">
                                Status: {selectedChecklist.login_teste_realizado ? 'Realizado' : 'Não Realizado'}
                              </span>
                            </div>
                            
                            {selectedChecklist.login_resultado && (
                              <div className="bg-white/60 p-3 rounded-lg">
                                <span className="text-gray-800 font-semibold">Resultado: </span>
                                <Badge className={`ml-2 font-bold text-sm ${getResultColor(selectedChecklist.login_resultado)}`}>
                                  {selectedChecklist.login_resultado}
                                </Badge>
                              </div>
                            )}
                            
                            {selectedChecklist.login_observacoes && (
                              <div className="bg-white/80 p-3 rounded-lg border-l-4 border-purple-400">
                                <p className="text-sm text-gray-700 font-medium">
                                  <span className="font-semibold text-purple-800">Observações:</span><br />
                                  {selectedChecklist.login_observacoes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Medição */}
                        <div className={`relative bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                          selectedChecklist.medicao_teste_realizado 
                            ? selectedChecklist.medicao_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.medicao_resultado?.toLowerCase() === 'ok' || selectedChecklist.medicao_resultado?.toLowerCase() === 'sucesso'
                              ? 'border-green-300 shadow-green-100' 
                              : 'border-red-300 shadow-red-100'
                            : 'border-gray-300 shadow-gray-100'
                        }`}>
                          {/* Indicador de status no canto superior direito */}
                          <div className="absolute top-3 right-3">
                            {selectedChecklist.medicao_teste_realizado ? (
                              selectedChecklist.medicao_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.medicao_resultado?.toLowerCase() === 'ok' || selectedChecklist.medicao_resultado?.toLowerCase() === 'sucesso' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-600" />
                              )
                            ) : (
                              <Clock className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <h4 className="font-bold mb-4 flex items-center gap-3 text-yellow-900 pr-8">
                            <div className="p-2 bg-yellow-200 rounded-lg">
                              <Signal className="h-5 w-5 text-yellow-700" />
                            </div>
                            <span className="text-lg">Medição de Sinal</span>
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                              <div className={`w-3 h-3 rounded-full ${selectedChecklist.medicao_teste_realizado ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-gray-800 font-semibold">
                                Status: {selectedChecklist.medicao_teste_realizado ? 'Realizado' : 'Não Realizado'}
                              </span>
                            </div>
                            
                            {selectedChecklist.medicao_resultado && (
                              <div className="bg-white/60 p-3 rounded-lg">
                                <span className="text-gray-800 font-semibold">Resultado: </span>
                                <Badge className={`ml-2 font-bold text-sm ${getResultColor(selectedChecklist.medicao_resultado)}`}>
                                  {selectedChecklist.medicao_resultado}
                                </Badge>
                              </div>
                            )}
                            
                            {(selectedChecklist.medicao_frequencia_testada || selectedChecklist.medicao_potencia_recebida) && (
                              <div className="bg-white/60 p-3 rounded-lg space-y-2">
                                {selectedChecklist.medicao_frequencia_testada && (
                                  <div className="flex items-center gap-2">
                                    <Radio className="h-4 w-4 text-yellow-700" />
                                    <span className="text-gray-800 font-semibold">Frequência: {selectedChecklist.medicao_frequencia_testada}</span>
                                  </div>
                                )}
                                {selectedChecklist.medicao_potencia_recebida && (
                                  <div className="flex items-center gap-2">
                                    <Gauge className="h-4 w-4 text-yellow-700" />
                                    <span className="text-gray-800 font-semibold">Potência: {selectedChecklist.medicao_potencia_recebida} dBm</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {selectedChecklist.medicao_observacoes && (
                              <div className="bg-white/80 p-3 rounded-lg border-l-4 border-yellow-400">
                                <p className="text-sm text-gray-700 font-medium">
                                  <span className="font-semibold text-yellow-800">Observações:</span><br />
                                  {selectedChecklist.medicao_observacoes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Velocidade */}
                        <div className={`relative bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                          selectedChecklist.velocidade_teste_realizado 
                            ? selectedChecklist.velocidade_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.velocidade_resultado?.toLowerCase() === 'ok' || selectedChecklist.velocidade_resultado?.toLowerCase() === 'sucesso'
                              ? 'border-green-300 shadow-green-100' 
                              : 'border-red-300 shadow-red-100'
                            : 'border-gray-300 shadow-gray-100'
                        }`}>
                          {/* Indicador de status no canto superior direito */}
                          <div className="absolute top-3 right-3">
                            {selectedChecklist.velocidade_teste_realizado ? (
                              selectedChecklist.velocidade_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.velocidade_resultado?.toLowerCase() === 'ok' || selectedChecklist.velocidade_resultado?.toLowerCase() === 'sucesso' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-600" />
                              )
                            ) : (
                              <Clock className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <h4 className="font-bold mb-4 flex items-center gap-3 text-indigo-900 pr-8">
                            <div className="p-2 bg-indigo-200 rounded-lg">
                              <Zap className="h-5 w-5 text-indigo-700" />
                            </div>
                            <span className="text-lg">Velocidade</span>
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                              <div className={`w-3 h-3 rounded-full ${selectedChecklist.velocidade_teste_realizado ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-gray-800 font-semibold">
                                Status: {selectedChecklist.velocidade_teste_realizado ? 'Realizado' : 'Não Realizado'}
                              </span>
                            </div>
                            
                            {selectedChecklist.velocidade_resultado && (
                              <div className="bg-white/60 p-3 rounded-lg">
                                <span className="text-gray-800 font-semibold">Resultado: </span>
                                <Badge className={`ml-2 font-bold text-sm ${getResultColor(selectedChecklist.velocidade_resultado)}`}>
                                  {selectedChecklist.velocidade_resultado}
                                </Badge>
                              </div>
                            )}
                            
                            {(selectedChecklist.velocidade_download || selectedChecklist.velocidade_upload) && (
                              <div className="bg-white/60 p-3 rounded-lg space-y-2">
                                {selectedChecklist.velocidade_download && (
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-700" />
                                    <span className="text-gray-800 font-semibold">Download: {selectedChecklist.velocidade_download} Mbps</span>
                                  </div>
                                )}
                                {selectedChecklist.velocidade_upload && (
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-700" />
                                    <span className="text-gray-800 font-semibold">Upload: {selectedChecklist.velocidade_upload} Mbps</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {selectedChecklist.velocidade_observacoes && (
                              <div className="bg-white/80 p-3 rounded-lg border-l-4 border-indigo-400">
                                <p className="text-sm text-gray-700 font-medium">
                                  <span className="font-semibold text-indigo-800">Observações:</span><br />
                                  {selectedChecklist.velocidade_observacoes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dados */}
                        <div className={`relative bg-gradient-to-br from-pink-50 to-pink-100 border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                          selectedChecklist.dados_teste_realizado 
                            ? selectedChecklist.dados_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.dados_resultado?.toLowerCase() === 'ok' || selectedChecklist.dados_resultado?.toLowerCase() === 'sucesso'
                              ? 'border-green-300 shadow-green-100' 
                              : 'border-red-300 shadow-red-100'
                            : 'border-gray-300 shadow-gray-100'
                        }`}>
                          {/* Indicador de status no canto superior direito */}
                          <div className="absolute top-3 right-3">
                            {selectedChecklist.dados_teste_realizado ? (
                              selectedChecklist.dados_resultado?.toLowerCase() === 'aprovado' || selectedChecklist.dados_resultado?.toLowerCase() === 'ok' || selectedChecklist.dados_resultado?.toLowerCase() === 'sucesso' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-600" />
                              )
                            ) : (
                              <Clock className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <h4 className="font-bold mb-4 flex items-center gap-3 text-pink-900 pr-8">
                            <div className="p-2 bg-pink-200 rounded-lg">
                              <Database className="h-5 w-5 text-pink-700" />
                            </div>
                            <span className="text-lg">Dados</span>
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                              <div className={`w-3 h-3 rounded-full ${selectedChecklist.dados_teste_realizado ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-gray-800 font-semibold">
                                Status: {selectedChecklist.dados_teste_realizado ? 'Realizado' : 'Não Realizado'}
                              </span>
                            </div>
                            
                            {selectedChecklist.dados_resultado && (
                              <div className="bg-white/60 p-3 rounded-lg">
                                <span className="text-gray-800 font-semibold">Resultado: </span>
                                <Badge className={`ml-2 font-bold text-sm ${getResultColor(selectedChecklist.dados_resultado)}`}>
                                  {selectedChecklist.dados_resultado}
                                </Badge>
                              </div>
                            )}
                            
                            {selectedChecklist.dados_observacoes && (
                              <div className="bg-white/80 p-3 rounded-lg border-l-4 border-pink-400">
                                <p className="text-sm text-gray-700 font-medium">
                                  <span className="font-semibold text-pink-800">Observações:</span><br />
                                  {selectedChecklist.dados_observacoes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Observações finais */}
                  {selectedChecklist.observacoes_finais && (
                    <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                          <FileText className="h-5 w-5" />
                          Observações Finais
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-sm border border-gray-200 text-gray-900 font-medium">
                          {selectedChecklist.observacoes_finais}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistConsulta;