import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseRecuperacoes } from "@/hooks/useSupabaseRecuperacoes";
import { useSupabaseEquipamentos } from "@/hooks/useSupabaseEquipamentos";
import { useSupabaseFuncionarios } from "@/hooks/useSupabaseFuncionarios";
import { useAuth } from "@/contexts/AuthContext";

export default function Recuperacao() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { equipamentos } = useSupabaseEquipamentos();
  const { funcionarios } = useSupabaseFuncionarios();
  const { 
    recuperacoes, 
    loading, 
    createRecuperacao
  } = useSupabaseRecuperacoes();

  // Estados para recuperação
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState("");
  const [problema, setProblema] = useState("");
  const [solucao, setSolucao] = useState("");
  const [macAtual, setMacAtual] = useState("");
  const [macs, setMacs] = useState<string[]>([]);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState("");
  
  // Estados para filtros do formulário
  const [filtroEquipamento, setFiltroEquipamento] = useState("");

  const funcionariosAtivos = funcionarios.filter(f => f.aprovado);
  
  // Filtrar equipamentos para o select
  const equipamentosFiltrados = equipamentos.filter(eq => 
    eq.modelo.toLowerCase().includes(filtroEquipamento.toLowerCase())
  );

  const adicionarMac = () => {
    if (macAtual.trim() && !macs.includes(macAtual.trim())) {
      setMacs([...macs, macAtual.trim()]);
      setMacAtual("");
    }
  };

  const removerMac = (macToRemove: string) => {
    setMacs(macs.filter(mac => mac !== macToRemove));
  };

  const copiarMac = async (mac: string) => {
    try {
      await navigator.clipboard.writeText(mac);
      toast({
        title: "MAC copiado",
        description: `MAC ${mac} copiado para a área de transferência`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar o MAC"
      });
    }
  };

  const copiarTodosMacs = async (macs: string[]) => {
    try {
      const macsTexto = macs.join('\n');
      await navigator.clipboard.writeText(macsTexto);
      toast({
        title: "MACs copiados",
        description: `${macs.length} MACs copiados para a área de transferência`
      });
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Erro ao copiar",
        description: "Não foi possível copiar os MACs"
      });
    }
  };

  const handleSubmitRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipamentoSelecionado || !problema || !solucao || macs.length === 0 || !responsavelSelecionado) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e adicione pelo menos um MAC."
      });
      return;
    }

    try {
      await createRecuperacao({
        equipamento: equipamentoSelecionado,
        problema,
        solucao,
        macs: [...macs],
        responsavel: responsavelSelecionado,
        data_recuperacao: new Date().toISOString()
      });
      
      // Limpar formulário
      setEquipamentoSelecionado("");
      setProblema("");
      setSolucao("");
      setMacs([]);
      setMacAtual("");
      setResponsavelSelecionado("");
      setFiltroEquipamento(""); // Limpar também o filtro

    } catch (error) {
      console.error('Erro ao registrar recuperação:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recuperação de Equipamentos</h1>
          <p className="text-muted-foreground">
            Registre equipamentos que foram recuperados e os problemas resolvidos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Formulário de Recuperação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Registrar Recuperação
              </CardTitle>
              <CardDescription>
                Adicione informações sobre equipamentos recuperados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRecuperacao} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipamento">Equipamento</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Filtrar equipamentos..."
                        value={filtroEquipamento}
                        onChange={(e) => setFiltroEquipamento(e.target.value)}
                        className="mb-2"
                      />
                      <Select value={equipamentoSelecionado} onValueChange={setEquipamentoSelecionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipamentosFiltrados.map((eq) => (
                            <SelectItem key={eq.id} value={eq.modelo}>
                              {eq.modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Select value={responsavelSelecionado} onValueChange={setResponsavelSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionariosAtivos.map((func) => (
                          <SelectItem key={func.id} value={func.nome}>
                            {func.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="problema">Problema Identificado</Label>
                  <Textarea
                    id="problema"
                    placeholder="Descreva o problema que foi identificado..."
                    value={problema}
                    onChange={(e) => setProblema(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="solucao">Solução Aplicada</Label>
                  <Textarea
                    id="solucao"
                    placeholder="Descreva como o problema foi resolvido..."
                    value={solucao}
                    onChange={(e) => setSolucao(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="mac">Endereços MAC</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mac"
                      placeholder="Ex: AA:BB:CC:DD:EE:FF"
                      value={macAtual}
                      onChange={(e) => setMacAtual(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          adicionarMac();
                        }
                      }}
                    />
                    <Button type="button" onClick={adicionarMac} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {macs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {macs.map((mac) => (
                        <Badge key={mac} variant="secondary" className="flex items-center gap-1">
                          {mac}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removerMac(mac)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Registrar Recuperação
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Recuperações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Recuperações Recentes
              </CardTitle>
              <CardDescription>
                Histórico de equipamentos recuperados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">
                    Carregando recuperações...
                  </p>
                ) : recuperacoes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma recuperação registrada ainda
                  </p>
                ) : (
                  recuperacoes.map((recuperacao) => (
                    <div key={recuperacao.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{recuperacao.equipamento}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {recuperacao.macs.length} MAC(s)
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copiarTodosMacs(recuperacao.macs)}
                            className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                            title="Copiar todos os MACs"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p><strong>Problema:</strong> {recuperacao.problema}</p>
                        <p><strong>Solução:</strong> {recuperacao.solucao}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {recuperacao.macs.map((mac) => (
                          <Badge 
                            key={mac} 
                            variant="secondary" 
                            className="text-xs cursor-pointer hover:bg-secondary/80"
                            onClick={() => copiarMac(mac)}
                            title="Clique para copiar"
                          >
                            {mac}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {new Date(recuperacao.data_recuperacao).toLocaleString('pt-BR')} • {recuperacao.responsavel}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}