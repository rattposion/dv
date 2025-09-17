import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, User, TrendingUp, AlertTriangle, RotateCcw, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface FuncionarioStats {
  nome: string;
  producao_total: number;
  defeitos_total: number;
  recuperacao_total: number;
}

export function FuncionarioStatsCard() {
  const [funcionarioStats, setFuncionarioStats] = useState<FuncionarioStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Verificar se o usuário tem permissão para ver este componente
  const hasAccess = user?.email === 'wesleyalves.cs@gmail.com';

  // Se não tem acesso, mostrar mensagem de acesso negado
  if (!hasAccess) {
    return (
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Produção por Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Acesso Restrito
            </h3>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para visualizar este relatório.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Carregar dados sem filtro de data inicialmente
  useEffect(() => {
    fetchFuncionarioStats('', '');
  }, []);

  const fetchFuncionarioStats = async (inicio?: string, fim?: string) => {
    setLoading(true);
    try {
      const dataInicioFilter = inicio !== undefined ? inicio : dataInicio;
      const dataFimFilter = fim !== undefined ? fim : dataFim;
      
      // Se não há filtros de data, buscar todos os dados
      const usarFiltroData = dataInicioFilter && dataFimFilter;

      // 1. Buscar produção por funcionário
      let producaoQuery = supabase
        .from('producao_diaria')
        .select('colaborador, quantidade_equipamentos');
      
      if (usarFiltroData) {
        producaoQuery = producaoQuery
          .gte('data_producao', dataInicioFilter)
          .lte('data_producao', dataFimFilter);
      }
      
      const { data: producaoData, error: producaoError } = await producaoQuery;

      if (producaoError) throw producaoError;

      // 2. Buscar defeitos por funcionário
      let defeitosQuery = supabase
        .from('defeitos')
        .select('responsavel, quantidade');
      
      if (usarFiltroData) {
        defeitosQuery = defeitosQuery
          .gte('created_at', `${dataInicioFilter} 00:00:00`)
          .lte('created_at', `${dataFimFilter} 23:59:59`);
      }
      
      const { data: defeitosData, error: defeitosError } = await defeitosQuery;

      if (defeitosError) throw defeitosError;

      // 3. Buscar recuperações por funcionário
      let recuperacoesQuery = supabase
        .from('recuperacoes')
        .select('responsavel, macs');
      
      if (usarFiltroData) {
        recuperacoesQuery = recuperacoesQuery
          .gte('data_recuperacao', `${dataInicioFilter} 00:00:00`)
          .lte('data_recuperacao', `${dataFimFilter} 23:59:59`);
      }
      
      const { data: recuperacoesData, error: recuperacoesError } = await recuperacoesQuery;

      if (recuperacoesError) throw recuperacoesError;

      // Processar dados por funcionário
      const funcionariosMap = new Map<string, FuncionarioStats>();

      // Processar produção
      (producaoData || []).forEach(item => {
        const nome = item.colaborador;
        if (!funcionariosMap.has(nome)) {
          funcionariosMap.set(nome, {
            nome,
            producao_total: 0,
            defeitos_total: 0,
            recuperacao_total: 0
          });
        }
        const stats = funcionariosMap.get(nome)!;
        stats.producao_total += item.quantidade_equipamentos || 0;
      });

      // Processar defeitos
      (defeitosData || []).forEach(item => {
        const nome = item.responsavel;
        if (!funcionariosMap.has(nome)) {
          funcionariosMap.set(nome, {
            nome,
            producao_total: 0,
            defeitos_total: 0,
            recuperacao_total: 0
          });
        }
        const stats = funcionariosMap.get(nome)!;
        stats.defeitos_total += item.quantidade || 0;
      });

      // Processar recuperações
      (recuperacoesData || []).forEach(item => {
        const nome = item.responsavel;
        if (!funcionariosMap.has(nome)) {
          funcionariosMap.set(nome, {
            nome,
            producao_total: 0,
            defeitos_total: 0,
            recuperacao_total: 0
          });
        }
        const stats = funcionariosMap.get(nome)!;
        stats.recuperacao_total += item.macs?.length || 0;
      });

      // Ordenar por produção total (maior para menor)
      const funcionariosList = Array.from(funcionariosMap.values());
      funcionariosList.sort((a, b) => b.producao_total - a.producao_total);

      setFuncionarioStats(funcionariosList);
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos funcionários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas dos funcionários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Remover useEffect que dependia das datas

  const handleFiltrar = () => {
    fetchFuncionarioStats();
  };

  const formatarPeriodo = () => {
    if (!dataInicio || !dataFim) return '';
    const inicio = new Date(dataInicio).toLocaleDateString('pt-BR');
    const fim = new Date(dataFim).toLocaleDateString('pt-BR');
    return `${inicio} - ${fim}`;
  };

  // Calcular totais gerais
  const totaisGerais = funcionarioStats.reduce(
    (acc, funcionario) => ({
      producao: acc.producao + funcionario.producao_total,
      defeitos: acc.defeitos + funcionario.defeitos_total,
      recuperacao: acc.recuperacao + funcionario.recuperacao_total
    }),
    { producao: 0, defeitos: 0, recuperacao: 0 }
  );

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Produção por Funcionário
            </CardTitle>
            <CardDescription>
              Estatísticas de produção, defeitos e recuperação por funcionário
              {formatarPeriodo() && ` - Período: ${formatarPeriodo()}`}
              {funcionarioStats.length > 0 && (
                <div className="mt-2 flex gap-4 text-sm">
                   <span className="text-green-600">Total Produção: {totaisGerais.producao}</span>
                   <span className="text-red-600">Total Defeitos: {totaisGerais.defeitos}</span>
                   <span className="text-blue-600">Total Recuperação: {totaisGerais.recuperacao}</span>
                 </div>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <div>
                <Label htmlFor="dataInicio" className="text-xs">De:</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-32"
                />
              </div>
              <div>
                <Label htmlFor="dataFim" className="text-xs">Até:</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button onClick={handleFiltrar} size="sm" className="mt-4">
                Filtrar
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : funcionarioStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado encontrado para o período selecionado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Produção
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Defeitos
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <RotateCcw className="h-4 w-4" />
                    Recuperação
                  </div>
                </TableHead>

              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarioStats.map((funcionario, index) => (
                <TableRow key={funcionario.nome}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      {funcionario.nome}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {funcionario.producao_total}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {funcionario.defeitos_total}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {funcionario.recuperacao_total}
                    </Badge>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}