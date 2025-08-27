import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSupabaseManutencoes } from "@/hooks/useSupabaseManutencoes";
import { useSupabaseRMA } from "@/hooks/useSupabaseRMA";
import { useSupabaseRecuperacoes } from "@/hooks/useSupabaseRecuperacoes";
import { Clock, CheckCircle, AlertTriangle, Settings, Wrench, RefreshCw } from "lucide-react";

export default function Status() {
  const { manutencoes, loading: loadingManutencoes } = useSupabaseManutencoes();
  const { rmas, loading: loadingRMAs } = useSupabaseRMA();
  const { recuperacoes, loading: loadingRecuperacoes } = useSupabaseRecuperacoes();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aberta':
      case 'aberto':
        return 'bg-blue-500';
      case 'em_andamento':
      case 'em análise':
        return 'bg-yellow-500';
      case 'aguardando_pecas':
        return 'bg-orange-500';
      case 'concluida':
      case 'concluído':
      case 'aprovado':
        return 'bg-green-500';
      case 'sem_reparo':
        return 'bg-purple-500';
      case 'cancelada':
      case 'rejeitado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Filtrar apenas registros em andamento
  const manutencoesEmAndamento = manutencoes.filter(m => 
    m.status === 'aberta' || m.status === 'em_andamento'
  );
  
  const rmasEmAndamento = rmas.filter(r => 
    r.status === 'Aberto' || r.status === 'Em Análise'
  );

  // Recuperações recentes (últimos 7 dias)
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  
  const recuperacoesRecentes = recuperacoes.filter(r => 
    new Date(r.created_at) >= seteDiasAtras
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Status do Sistema</h1>
          <p className="text-muted-foreground">
            Acompanhe o andamento das OS, RMAs e recuperações em tempo real
          </p>
        </div>

        {/* Cards de Status Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OS em Andamento</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{manutencoesEmAndamento.length}</div>
              <p className="text-xs text-muted-foreground">
                Ordens de serviço ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RMAs Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rmasEmAndamento.length}</div>
              <p className="text-xs text-muted-foreground">
                RMAs aguardando resolução
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recuperações (7 dias)</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recuperacoesRecentes.reduce((total, r) => total + r.macs.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Equipamentos recuperados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Andamento das OS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Andamento das OS
            </CardTitle>
            <CardDescription>
              Ordens de serviço em aberto e em andamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingManutencoes ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : manutencoesEmAndamento.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OS</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Defeito</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Abertura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manutencoesEmAndamento.map((manutencao) => (
                    <TableRow key={manutencao.id}>
                      <TableCell className="font-medium">
                        {manutencao.numeroTarefa}
                      </TableCell>
                      <TableCell>
                        {manutencao.origemEquipamento}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {manutencao.defeitoEquipamento}
                      </TableCell>
                      <TableCell>
                        {manutencao.tecnicoResponsavel || 'Não atribuído'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStatusColor(manutencao.status)}`}>
                          {manutencao.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(manutencao.dataAbertura).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Nenhuma OS em andamento</p>
                <p className="text-sm">Todas as ordens de serviço estão concluídas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RMAs Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              RMAs Pendentes
            </CardTitle>
            <CardDescription>
              RMAs aguardando análise ou resolução
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRMAs ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : rmasEmAndamento.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RMA</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Defeito</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Abertura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rmasEmAndamento.map((rma) => (
                    <TableRow key={rma.id}>
                      <TableCell className="font-medium">
                        {rma.numero_rma}
                      </TableCell>
                      <TableCell>
                        {rma.equipamento}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {rma.defeito_relatado}
                      </TableCell>
                      <TableCell>
                        {rma.tecnico_responsavel || 'Não atribuído'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStatusColor(rma.status)}`}>
                          {rma.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(rma.data_abertura).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Nenhuma RMA pendente</p>
                <p className="text-sm">Todas as RMAs estão resolvidas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recuperações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Recuperações Recentes
            </CardTitle>
            <CardDescription>
              Equipamentos recuperados nos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecuperacoes ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recuperacoesRecentes.length > 0 ? (
              <div className="space-y-4">
                {recuperacoesRecentes.map((recuperacao) => (
                  <div key={recuperacao.id} className="border rounded-lg p-4 bg-success/5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{recuperacao.equipamento}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-success/20 text-success-foreground">
                          {recuperacao.macs.length} equipamento(s)
                        </Badge>
                        <Badge variant="outline">
                          {new Date(recuperacao.data_recuperacao).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Problema:</strong> {recuperacao.problema}</p>
                      <p><strong>Solução:</strong> {recuperacao.solucao}</p>
                      <p><strong>Responsável:</strong> {recuperacao.responsavel}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhuma recuperação nos últimos 7 dias</p>
                <p className="text-sm">As recuperações aparecerão aqui quando realizadas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}