import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useSupabaseRecuperacoes, type Recuperacao } from "@/hooks/useSupabaseRecuperacoes";
import { useSupabaseFuncionarios } from "@/hooks/useSupabaseFuncionarios";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Recuperacao() {
  const { recuperacoes, loading, createRecuperacao } = useSupabaseRecuperacoes();
  const { funcionarios } = useSupabaseFuncionarios();
  const { toast } = useToast();
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState("");
  const [responsavelSelecionado, setResponsavelSelecionado] = useState("");
  const [problema, setProblema] = useState("");
  const [solucao, setSolucao] = useState("");
  const [macAtual, setMacAtual] = useState("");
  const [macs, setMacs] = useState<string[]>([]);
  const [tiposEquipamentos, setTiposEquipamentos] = useState<string[]>([]);
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<any[]>([]);
  const [filtroEquipamento, setFiltroEquipamento] = useState("");

  // Buscar equipamentos cadastrados
  useEffect(() => {
    const fetchEquipamentos = async () => {
      try {
        const { data, error } = await supabase
          .from('equipamentos')
          .select('id, nome, tipo, marca, modelo')
          .eq('status', 'ativo')
          .order('nome');

        if (error) throw error;

        setEquipamentosDisponiveis(data || []);
        
        // Também manter os tipos únicos se necessário
        const tipos = Array.from(new Set(data?.map(item => item.tipo))).filter(Boolean);
        setTiposEquipamentos(tipos);
      } catch (error) {
        console.error('Erro ao buscar equipamentos:', error);
      }
    };

    fetchEquipamentos();
  }, []);

  // Filtrar equipamentos com base na pesquisa
  const equipamentosFiltrados = equipamentosDisponiveis.filter(equipamento => {
    if (!filtroEquipamento) return true;
    const termosPesquisa = filtroEquipamento.toLowerCase();
    return (
      equipamento.nome?.toLowerCase().includes(termosPesquisa) ||
      equipamento.tipo?.toLowerCase().includes(termosPesquisa) ||
      equipamento.marca?.toLowerCase().includes(termosPesquisa) ||
      equipamento.modelo?.toLowerCase().includes(termosPesquisa)
    );
  });

  const adicionarMac = () => {
    if (macAtual.trim() && !macs.includes(macAtual.trim())) {
      setMacs([...macs, macAtual.trim()]);
      setMacAtual("");
    }
  };

  const removerMac = (macToRemove: string) => {
    setMacs(macs.filter(mac => mac !== macToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipamentoSelecionado || !responsavelSelecionado || !problema || !solucao || macs.length === 0) {
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
        data_recuperacao: new Date().toISOString(),
        responsavel: responsavelSelecionado
      });
      
      // Limpar formulário
      setEquipamentoSelecionado("");
      setResponsavelSelecionado("");
      setProblema("");
      setSolucao("");
      setMacs([]);
      setMacAtual("");
    } catch (error) {
      // Erro já tratado no hook
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
          {/* Formulário de Registro */}
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="equipamento">Equipamento</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Pesquisar equipamento..."
                      value={filtroEquipamento}
                      onChange={(e) => setFiltroEquipamento(e.target.value)}
                      className="mb-2"
                    />
                    <Select value={equipamentoSelecionado} onValueChange={setEquipamentoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o equipamento cadastrado" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {equipamentosFiltrados.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            {filtroEquipamento ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento disponível'}
                          </div>
                        ) : (
                          equipamentosFiltrados.map((equipamento) => (
                            <SelectItem key={equipamento.id} value={`${equipamento.nome} - ${equipamento.tipo} ${equipamento.marca || ''} ${equipamento.modelo || ''}`.trim()}>
                              <div className="flex flex-col">
                                <span className="font-medium">{equipamento.nome}</span>
                                <span className="text-xs text-muted-foreground">
                                  {equipamento.tipo} {equipamento.marca && `- ${equipamento.marca}`} {equipamento.modelo && `${equipamento.modelo}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
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
                       {funcionarios.filter(f => f.status === 'Ativo').map((funcionario) => (
                         <SelectItem key={funcionario.id} value={funcionario.nome}>
                           {funcionario.nome}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
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

                <Button type="submit" className="w-full">
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
                {recuperacoes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma recuperação registrada ainda
                  </p>
                ) : (
                  recuperacoes.map((recuperacao) => (
                    <div key={recuperacao.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{recuperacao.equipamento}</h4>
                        <Badge variant="outline">
                          {recuperacao.macs.length} MAC(s)
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p><strong>Problema:</strong> {recuperacao.problema}</p>
                        <p><strong>Solução:</strong> {recuperacao.solucao}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {recuperacao.macs.map((mac) => (
                          <Badge key={mac} variant="secondary" className="text-xs">
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