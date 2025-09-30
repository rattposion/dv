import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Package, TruckIcon as Truck, AlertTriangle, Calendar, User, Split, Plus, X, Info, Copy, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useHistorico } from "@/contexts/HistoricoContext";
import { useFuncionario } from "@/contexts/FuncionarioContext";
import { useEstoque } from "@/contexts/EstoqueContext";
import { useInventario } from "@/contexts/InventarioContext";
import { FileUploadSaida } from "@/components/saida/FileUploadSaida";
import { useSupabaseRMA } from "@/hooks/useSupabaseRMA";
import { useSupabaseCaixasInventario } from "@/hooks/useSupabaseCaixasInventario";
import { useSupabaseMovimentacoes } from "@/hooks/useSupabaseMovimentacoes";
import { EquipmentSelector } from "@/components/defeitos/EquipmentSelector";
import { FileUploadRMA } from "@/components/rma/FileUploadRMA";
import { useMacValidation } from "@/hooks/useMacValidation";

export default function Saida() {
  const [selectedCaixa, setSelectedCaixa] = useState("");
  const [selectedCaixas, setSelectedCaixas] = useState<string[]>([]);
  const [selectedCaixaSeparacao, setSelectedCaixaSeparacao] = useState("");
  const [tipoSelecaoMac, setTipoSelecaoMac] = useState("caixa"); // "caixa" ou "manual"
  const [responsavelSaida, setResponsavelSaida] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [macsParaVerificar, setMacsParaVerificar] = useState("");
  const [dadosEquipamentos, setDadosEquipamentos] = useState("");
  const [anexosSaida, setAnexosSaida] = useState<string[]>([]);
  const [resultadoProcessamento, setResultadoProcessamento] = useState<{
    grupos: { [key: string]: string[] };
    naoEncontrados: string[];
  }>({ grupos: {}, naoEncontrados: [] });

  // Estados para RMA
  const [showRMADialog, setShowRMADialog] = useState(false);
  const [selectedEquipmentRMA, setSelectedEquipmentRMA] = useState<any>(null);
  const [rmaData, setRmaData] = useState({
    equipamento: "",
    modelo: "",
    mac_address: "",
    origem_equipamento: "",
    destino_envio: "",
    defeito_relatado: "",
    tecnico_responsavel: "",
    observacoes: "",
    nota_fiscal: "",
  });
  const [macsRMA, setMacsRMA] = useState<string[]>([]);
  const [currentMacRMA, setCurrentMacRMA] = useState("");
  const [anexosRMA, setAnexosRMA] = useState<string[]>([]);
  const { toast } = useToast();
  const { caixas: supabaseCaixas, removeCaixa, loading: loadingCaixas } = useSupabaseCaixasInventario();
  const { addOperacao } = useHistorico();
  const { funcionariosAprovados } = useFuncionario();
  const { createRMA, loading: rmaLoading } = useSupabaseRMA();
  const { diminuirEstoque } = useEstoque();
  const { caixas: caixasDisponiveis, removeCaixa: removeInventarioCaixa, syncWithSupabase } = useInventario();
  const { addOperacao: addOperacaoSupabase } = useSupabaseMovimentacoes();
  const { formatMacAddress, validateMacFormat, checkMacExists, handleDatabaseError } = useMacValidation();
  
  // Sincronizar dados do Supabase com o contexto local apenas na inicialização
  useEffect(() => {
    console.log('useEffect Saida executado:');
    console.log('- supabaseCaixas.length:', supabaseCaixas?.length || 0);
    console.log('- caixasDisponiveis.length:', caixasDisponiveis.length);
    console.log('- Condição atendida:', supabaseCaixas && supabaseCaixas.length > 0 && caixasDisponiveis.length === 0);
    
    if (supabaseCaixas && supabaseCaixas.length > 0 && caixasDisponiveis.length === 0) {
      console.log('Sincronizando caixas do Supabase com contexto local:', supabaseCaixas.length);
      syncWithSupabase(supabaseCaixas);
    }
  }, [supabaseCaixas.length, syncWithSupabase, caixasDisponiveis.length]);

  const caixasSelecionadasData = caixasDisponiveis.filter(c => selectedCaixas.includes(c.id));
  const totalQuantidadeSelecionada = caixasSelecionadasData.reduce((total, caixa) => total + caixa.quantidade, 0);

  const filteredCaixas = caixasDisponiveis.filter(caixa =>
    caixa.numero_caixa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caixa.equipamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegistrarSaida = async () => {
    // Determinar quais caixas processar
    const caixasParaProcessar = selectedCaixas.length > 0 ? selectedCaixas : (selectedCaixa ? [selectedCaixa] : []);
    
    if (caixasParaProcessar.length === 0 || !responsavelSaida || !destino) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma caixa e preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      
      // Processar cada caixa selecionada
      console.log('Iniciando processamento de', caixasParaProcessar.length, 'caixas');
      console.log('Caixas disponíveis antes:', caixasDisponiveis.length);
      
      for (const caixaId of caixasParaProcessar) {
        const caixa = caixasDisponiveis.find(c => c.id === caixaId);
        if (!caixa) {
          console.log('Caixa não encontrada:', caixaId);
          continue;
        }

        console.log('Processando caixa:', caixa.numero_caixa, 'ID:', caixaId);

        // Registrar a operação no histórico local
        addOperacao({
          tipo: "saida",
          usuario: responsavelSaida,
          caixaId: caixaId,
          equipamento: caixa.equipamento,
          modelo: caixa.modelo,
          quantidade: caixa.quantidade,
          destino,
          observacao: motivo,
          anexos: anexosSaida.length > 0 ? anexosSaida : undefined
        });

        // Registrar a operação no Supabase para relatórios
        await addOperacaoSupabase({
          tipo: "saida",
          usuario: responsavelSaida,
          caixaId: caixaId,
          equipamento: caixa.equipamento,
          modelo: caixa.modelo,
          quantidade: caixa.quantidade,
          destino,
          observacao: motivo
        });

        // Remove a caixa do inventário (Supabase)
        console.log('Removendo do Supabase...');
        await removeCaixa(caixaId);
        console.log('Removido do Supabase com sucesso');
        
        // Remove a caixa do inventário local (Context)
        console.log('Removendo do contexto local...');
        removeInventarioCaixa(caixaId);
        console.log('Removido do contexto local com sucesso');
        
        // Diminui o estoque disponível
        console.log('Diminuindo estoque...');
        const estoqueReduzido = diminuirEstoque(caixa.modelo, caixa.quantidade);
        console.log('Estoque reduzido:', estoqueReduzido);
        
        console.log('Caixa processada com sucesso:', caixa.numero_caixa);
      }
      
      console.log('Processamento concluído');
      console.log('Caixas disponíveis após processamento:', caixasDisponiveis.length);

      toast({
        title: "Saída registrada",
        description: `Saída de ${caixasParaProcessar.length} caixa${caixasParaProcessar.length > 1 ? 's' : ''} registrada com sucesso`,
      });

      // Limpar formulário
      setSelectedCaixa("");
      setSelectedCaixas([]);
      setResponsavelSaida("");
      setDestino("");
      setMotivo("");
      setAnexosSaida([]);
      
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      toast({
        title: "Erro ao registrar saída",
        description: "Não foi possível registrar a saída. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const caixaSelecionada = caixasDisponiveis.find(caixa => caixa.id === selectedCaixa || selectedCaixas.includes(caixa.id));
  const caixaSeparacaoSelecionada = caixasDisponiveis.find(caixa => caixa.id === selectedCaixaSeparacao);

  // Lista única de equipamentos
  const equipamentosUnicos = Array.from(new Set(caixasDisponiveis.map(caixa => caixa.equipamento)));
  const equipamentosFormatados = equipamentosUnicos.map((eq, index) => 
    index === equipamentosUnicos.length - 1 ? eq : `${eq},`
  ).join(' ');

  // Funções para a separação
  const limparMacs = () => {
    setMacsParaVerificar("");
  };

  const processarComparacao = () => {
    // Sistema de logs detalhados com níveis e timestamps
    const logger = {
      debug: (message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        console.log(`[DEBUG ${timestamp}] ${message}`, data || '');
      },
      info: (message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        console.info(`[INFO ${timestamp}] ${message}`, data || '');
      },
      warn: (message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        console.warn(`[WARN ${timestamp}] ${message}`, data || '');
      },
      error: (message: string, error?: any) => {
        const timestamp = new Date().toISOString();
        console.error(`[ERROR ${timestamp}] ${message}`, error || '');
      }
    };

    try {
      logger.info("=== INICIANDO PROCESSAMENTO DE SEPARAÇÃO ===");
      
      // Validação robusta de entrada
      const validarEntrada = () => {
        const errors: string[] = [];
        
        if (!macsParaVerificar || typeof macsParaVerificar !== 'string') {
          errors.push("Lista de MACs é obrigatória e deve ser uma string válida");
        } else if (!macsParaVerificar.trim()) {
          errors.push("Lista de MACs não pode estar vazia");
        }
        
        if (!dadosEquipamentos || typeof dadosEquipamentos !== 'string') {
          errors.push("Dados dos equipamentos são obrigatórios e devem ser uma string válida");
        } else if (!dadosEquipamentos.trim()) {
          errors.push("Dados dos equipamentos não podem estar vazios");
        } else if (dadosEquipamentos.length < 100) {
          logger.warn("Dados dos equipamentos parecem muito pequenos", { tamanho: dadosEquipamentos.length });
        }
        
        return errors;
      };

      const errosValidacao = validarEntrada();
      if (errosValidacao.length > 0) {
        logger.error("Falha na validação de entrada", errosValidacao);
        toast({
          title: "Erro de validação",
          description: errosValidacao.join('. '),
          variant: "destructive",
        });
        return;
      }

      logger.info("Validação de entrada concluída com sucesso");
      
      // Função para normalizar MAC (remove caracteres especiais e converte para minúsculo)
      const normalizarMac = (mac: string): string => {
        try {
          if (!mac || typeof mac !== 'string') {
            throw new Error(`MAC inválido: ${mac}`);
          }
          return mac.replace(/[:\-\s]/g, '').toLowerCase().trim();
        } catch (error) {
          logger.error("Erro ao normalizar MAC", { mac, error });
          return '';
        }
      };
      
      // Função para formatar MAC com dois pontos (formato AA:BB:CC:DD:EE:FF)
      const formatarMacComDoisPontos = (mac: string): string => {
        try {
          const macLimpo = mac.replace(/[:\-\s]/g, '').toUpperCase();
          if (macLimpo.length === 12 && /^[0-9A-F]{12}$/.test(macLimpo)) {
            return macLimpo.match(/.{2}/g)?.join(':') || mac;
          }
          return mac;
        } catch (error) {
          logger.error("Erro ao formatar MAC", { mac, error });
          return mac;
        }
      };

      // Função para validar formato MAC com validações robustas
      const isValidMac = (mac: string): boolean => {
        try {
          if (!mac || typeof mac !== 'string') return false;
          
          const macLimpo = mac.replace(/[:\-\s]/g, '');
          
          // Verificações básicas
          if (macLimpo.length !== 12) return false;
          if (!/^[0-9A-Fa-f]{12}$/.test(macLimpo)) return false;
          
          // Verificações de edge cases
          const macUpper = macLimpo.toUpperCase();
          if (macUpper === '000000000000') return false; // MAC nulo
          if (macUpper === 'FFFFFFFFFFFF') return false; // MAC broadcast
          if (/^(.)\1{11}$/.test(macUpper)) return false; // Todos os dígitos iguais
          
          return true;
        } catch (error) {
          logger.error("Erro na validação de MAC", { mac, error });
          return false;
        }
      };

      // Processamento otimizado da lista de MACs
      logger.info("Iniciando processamento da lista de MACs");
      
      let macsListaRaw: string[] = [];
      try {
        // Suporte a múltiplos separadores e limpeza robusta
        macsListaRaw = macsParaVerificar
          .split(/[\n,;|\t]/)
          .map(mac => mac.trim())
          .filter(mac => mac && mac.length > 0);
        
        logger.info(`MACs extraídos da entrada: ${macsListaRaw.length}`);
      } catch (error) {
        logger.error("Erro ao processar lista de MACs", error);
        throw new Error("Falha ao processar a lista de MACs");
      }
      
      // Validação e filtro de MACs inválidos com recovery
      const macsInvalidos: string[] = [];
      const macsValidos: string[] = [];
      
      macsListaRaw.forEach((mac, index) => {
        try {
          if (isValidMac(mac)) {
            macsValidos.push(mac);
          } else {
            macsInvalidos.push(mac);
            logger.warn(`MAC inválido encontrado na posição ${index}`, { mac });
          }
        } catch (error) {
          logger.error(`Erro ao validar MAC na posição ${index}`, { mac, error });
          macsInvalidos.push(mac);
        }
      });

      if (macsInvalidos.length > 0) {
        logger.warn(`${macsInvalidos.length} MACs inválidos encontrados`, macsInvalidos.slice(0, 5));
        toast({
          title: "MACs inválidos encontrados",
          description: `${macsInvalidos.length} MAC(s) com formato inválido foram ignorados: ${macsInvalidos.slice(0, 3).join(', ')}${macsInvalidos.length > 3 ? '...' : ''}`,
          variant: "destructive",
        });
      }

      if (macsValidos.length === 0) {
        logger.error("Nenhum MAC válido encontrado na lista");
        toast({
          title: "Erro",
          description: "Nenhum MAC válido foi encontrado na lista fornecida",
          variant: "destructive",
        });
        return;
      }

      // Otimização: Remoção de duplicatas com indexação eficiente
      logger.info("Removendo MACs duplicados");
      const macsUnicos: string[] = [];
      const macsDuplicados: string[] = [];
      const macsNormalizadosMap = new Map<string, string>(); // normalizado -> original

      macsValidos.forEach(mac => {
        try {
          const macNormalizado = normalizarMac(mac);
          if (macsNormalizadosMap.has(macNormalizado)) {
            macsDuplicados.push(mac);
            logger.debug(`MAC duplicado encontrado: ${mac} (normalizado: ${macNormalizado})`);
          } else {
            macsNormalizadosMap.set(macNormalizado, mac);
            macsUnicos.push(mac);
          }
        } catch (error) {
          logger.error("Erro ao processar duplicatas", { mac, error });
          macsDuplicados.push(mac);
        }
      });

      if (macsDuplicados.length > 0) {
        logger.warn(`${macsDuplicados.length} MACs duplicados removidos`, macsDuplicados.slice(0, 5));
        toast({
          title: "MACs duplicados removidos",
          description: `${macsDuplicados.length} MAC(s) duplicado(s) foram removidos da lista`,
          variant: "destructive",
        });
      }

      logger.info(`Processamento de MACs concluído: ${macsUnicos.length} únicos de ${macsListaRaw.length} originais`);
      
      // Otimização: Preparação eficiente dos dados dos equipamentos
      logger.info("Preparando dados dos equipamentos para busca otimizada");
      let linhasDados: string[] = [];
      let indiceLinhas: Map<string, number[]> = new Map(); // MAC normalizado -> array de índices de linhas
      
      try {
        linhasDados = dadosEquipamentos.split('\n');
        logger.info(`Total de linhas nos dados: ${linhasDados.length}`);
        
        // Criar índice para busca otimizada (apenas para grandes volumes)
        if (linhasDados.length > 1000 && macsUnicos.length > 50) {
          logger.info("Criando índice de busca para otimização de performance");
          
          linhasDados.forEach((linha, index) => {
            const linhaLower = linha.toLowerCase();
            // Buscar possíveis MACs na linha usando regex
            const macMatches = linhaLower.match(/[0-9a-f]{12}|[0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}[:\-][0-9a-f]{2}/g);
            
            if (macMatches) {
              macMatches.forEach(match => {
                const macNormalizado = match.replace(/[:\-]/g, '');
                if (!indiceLinhas.has(macNormalizado)) {
                  indiceLinhas.set(macNormalizado, []);
                }
                indiceLinhas.get(macNormalizado)!.push(index);
              });
            }
          });
          
          logger.info(`Índice criado com ${indiceLinhas.size} entradas`);
        }
      } catch (error) {
        logger.error("Erro ao preparar dados dos equipamentos", error);
        throw new Error("Falha ao processar dados dos equipamentos");
      }
      
      const grupos: { [key: string]: string[] } = {};
      const naoEncontrados: string[] = [];
      const tempoInicio = performance.now();

      // Processamento otimizado de cada MAC
      logger.info("Iniciando busca de MACs nos dados dos equipamentos");
      
      for (let index = 0; index < macsUnicos.length; index++) {
        const macOriginal = macsUnicos[index];
        
        try {
          const macNormalizado = normalizarMac(macOriginal);
          const macComDoisPontos = formatarMacComDoisPontos(macOriginal);
          
          logger.debug(`Processando MAC ${index + 1}/${macsUnicos.length}: ${macOriginal}`);
          
          // Busca otimizada usando índice quando disponível
          let linhasParaBuscar: number[] = [];
          
          if (indiceLinhas.size > 0) {
            // Usar índice para busca rápida
            const linhasIndexadas = indiceLinhas.get(macNormalizado) || [];
            linhasParaBuscar = linhasIndexadas;
            logger.debug(`Usando índice: ${linhasIndexadas.length} linhas para verificar`);
          } else {
            // Busca sequencial para volumes menores
            linhasParaBuscar = Array.from({ length: linhasDados.length }, (_, i) => i);
          }
          
          let linhaEncontrada = -1;
          let melhorMatch = '';
          
          // Buscar nas linhas selecionadas
          for (const i of linhasParaBuscar) {
            if (i >= linhasDados.length) continue;
            
            const linha = linhasDados[i];
            const linhaLower = linha.toLowerCase();
            
            // Verificação otimizada de múltiplos formatos
            const contemMac = linhaLower.includes(macNormalizado) || 
                             linhaLower.includes(macOriginal.toLowerCase()) ||
                             linhaLower.includes(macComDoisPontos.toLowerCase()) ||
                             linha.includes(macOriginal) ||
                             linha.includes(macOriginal.toUpperCase()) ||
                             linha.includes(macComDoisPontos);
            
            if (contemMac) {
              linhaEncontrada = i;
              melhorMatch = linha;
              logger.debug(`MAC encontrado na linha ${i}: ${linha.substring(0, 100)}...`);
              break;
            }
          }
          
          if (linhaEncontrada !== -1) {
            // Processamento da localização com tratamento de erros
            let localEstoque = '';
            let statusEquipamento = '';
            
            try {
              // Range otimizado para busca de contexto
              const inicioRange = Math.max(0, linhaEncontrada - 5);
              const fimRange = Math.min(linhasDados.length, linhaEncontrada + 3);
              
              for (let j = inicioRange; j < fimRange; j++) {
                const checkLine = linhasDados[j];
                const checkLineLower = checkLine.toLowerCase();
                
                // Extração robusta do LOCAL ESTOQUE
                if (checkLineLower.includes('local estoque:')) {
                  const localMatch = checkLine.match(/local\s+estoque:\s*([^\t\n\r]+?)(?:\s+(?:número|epi|id próprio)|\t|$)/i);
                  if (localMatch && localMatch[1]) {
                    localEstoque = localMatch[1].trim();
                    logger.debug(`Local extraído: ${localEstoque}`);
                  }
                }
                
                // Verificação robusta do status
                const linhaTrimmed = checkLine.trim();
                if (linhaTrimmed === 'Estoque' || linhaTrimmed === 'Comodato') {
                  statusEquipamento = linhaTrimmed;
                  logger.debug(`Status encontrado: ${statusEquipamento}`);
                }
              }
            } catch (error) {
              logger.error("Erro ao extrair informações do equipamento", { macOriginal, error });
            }
            
            // Agrupamento com validação robusta
            if (statusEquipamento === 'Estoque') {
              try {
                let chaveGrupo = localEstoque || 'Local não identificado';
                chaveGrupo = chaveGrupo.replace(/\s+/g, ' ').trim();
                
                if (!grupos[chaveGrupo]) {
                  grupos[chaveGrupo] = [];
                }
                
                // Prevenção de duplicatas no grupo
                if (!grupos[chaveGrupo].includes(macOriginal)) {
                  grupos[chaveGrupo].push(macOriginal);
                  logger.debug(`MAC adicionado ao grupo "${chaveGrupo}"`);
                } else {
                  logger.warn(`MAC duplicado no grupo ignorado: ${macOriginal} em ${chaveGrupo}`);
                }
              } catch (error) {
                logger.error("Erro ao agrupar MAC", { macOriginal, error });
                naoEncontrados.push(macOriginal);
              }
            } else {
              logger.debug(`MAC não está em estoque (status: ${statusEquipamento}): ${macOriginal}`);
              naoEncontrados.push(macOriginal);
            }
            
          } else {
            logger.debug(`MAC não encontrado nos dados: ${macOriginal}`);
            naoEncontrados.push(macOriginal);
          }
          
          // Log de progresso para grandes volumes
          if (macsUnicos.length > 100 && (index + 1) % 50 === 0) {
            logger.info(`Progresso: ${index + 1}/${macsUnicos.length} MACs processados`);
          }
          
        } catch (error) {
          logger.error(`Erro ao processar MAC: ${macOriginal}`, error);
          naoEncontrados.push(macOriginal);
        }
      }

      const tempoFinal = performance.now();
      const tempoProcessamento = Math.round(tempoFinal - tempoInicio);
      
      logger.info("=== RESULTADO FINAL ===");
      logger.info(`Tempo de processamento: ${tempoProcessamento}ms`);
      logger.info(`Grupos encontrados: ${Object.keys(grupos).length}`);
      logger.info(`MACs em estoque: ${Object.values(grupos).reduce((acc, arr) => acc + arr.length, 0)}`);
      logger.info(`MACs não encontrados: ${naoEncontrados.length}`);
      
      // Performance metrics para otimização futura
      if (tempoProcessamento > 5000) {
        logger.warn("Processamento demorado detectado", {
          tempo: tempoProcessamento,
          totalMACs: macsUnicos.length,
          totalLinhas: linhasDados.length
        });
      }

      setResultadoProcessamento({ grupos, naoEncontrados });
      
      const totalEncontrados = Object.values(grupos).reduce((acc, arr) => acc + arr.length, 0);
      const totalProcessados = macsUnicos.length;
      const statusMsg = tipoSelecaoMac === "caixa" && caixaSeparacaoSelecionada
        ? `${totalEncontrados} de ${totalProcessados} MACs encontrados em estoque (da caixa ${caixaSeparacaoSelecionada.id}) - ${tempoProcessamento}ms`
        : `${totalEncontrados} de ${totalProcessados} MACs encontrados em estoque - ${tempoProcessamento}ms`;
        
      toast({
        title: "Processamento concluído",
        description: statusMsg,
      });
      
      logger.info("Processamento de separação concluído com sucesso");
      
    } catch (error) {
      logger.error("Erro crítico no processamento", error);
      
      // Recovery automático - tentar salvar o que foi processado
      try {
        if (typeof error === 'object' && error !== null && 'message' in error) {
          toast({
            title: "Erro no processamento",
            description: `Falha durante o processamento: ${(error as Error).message}. Verifique os dados e tente novamente.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no processamento",
            description: "Ocorreu um erro inesperado. Verifique os dados de entrada e tente novamente.",
            variant: "destructive",
          });
        }
      } catch (recoveryError) {
        logger.error("Falha no recovery automático", recoveryError);
        console.error("Erro crítico sem recovery possível:", error);
      }
    }
  };

  // Função para gerar CSV dos equipamentos não encontrados
  const gerarCSVEquipamentosNaoEncontrados = () => {
    if (resultadoProcessamento.naoEncontrados.length === 0) {
      toast({
        title: "Nenhum equipamento",
        description: "Não há equipamentos não encontrados para gerar o CSV",
        variant: "destructive",
      });
      return;
    }

    // Solicitar o id_produto e número inicial do codigo_item
    const idProduto = prompt("Digite o ID do produto:");
    if (!idProduto) {
      toast({
        title: "Cancelado",
        description: "Geração de CSV cancelada",
        variant: "destructive",
      });
      return;
    }

    const numeroInicial = prompt("Digite o número inicial para o codigo_item:");
    if (!numeroInicial || isNaN(Number(numeroInicial))) {
      toast({
        title: "Número inválido",
        description: "Digite um número válido para o codigo_item inicial",
        variant: "destructive",
      });
      return;
    }

    const numeroInicialInt = parseInt(numeroInicial);

    // Criar cabeçalho do CSV
    const csvHeader = "id_produto,codigo_item,mac_address\n";
    
    // Função para formatar MAC com dois pontos
    const formatMacForCSV = (mac: string): string => {
      // Remove todos os caracteres que não são hexadecimais
      const cleanMac = mac.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
      
      // Se tem 12 caracteres, formata com dois pontos
      if (cleanMac.length === 12) {
        return cleanMac.replace(/(.{2})/g, '$1:').slice(0, -1);
      }
      
      // Se tem 11 caracteres, adiciona um zero no início e formata
      if (cleanMac.length === 11) {
        const paddedMac = '0' + cleanMac;
        return paddedMac.replace(/(.{2})/g, '$1:').slice(0, -1);
      }
      
      // Se já está no formato correto, retorna como está
      return mac;
    };

    // Criar linhas do CSV
    const csvLines = resultadoProcessamento.naoEncontrados.map((mac, index) => {
      const codigoItem = numeroInicialInt + index;
      const formattedMac = formatMacForCSV(mac);
      return `"${idProduto}","${codigoItem}","${formattedMac}"`;
    }).join('\n');

    // Combinar cabeçalho e linhas
    const csvContent = csvHeader + csvLines;

    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `equipamentos_nao_encontrados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV gerado",
      description: `Arquivo CSV gerado com ${resultadoProcessamento.naoEncontrados.length} equipamentos`,
    });
  };

  // Funções para RMA
  const isValidMacFormat = (mac: string) => {
    // Remove dois pontos e valida
    const cleanMac = mac.replace(/:/g, '');
    if (cleanMac.length === 12 && /^[0-9A-Fa-f]{12}$/.test(cleanMac)) {
      return true;
    }
    // Ou valida formato com dois pontos
    return validateMacFormat(mac);
  };

  const formatMac = (mac: string) => {
    // Se já tem dois pontos, usa formatMacAddress do hook
    if (mac.includes(':')) {
      return formatMacAddress(mac).toUpperCase();
    }
    // Se não tem, formata manualmente
    const cleanMac = mac.replace(/:/g, '').toUpperCase();
    return cleanMac.replace(/(.{2})/g, '$1:').slice(0, -1);
  };

  const addMacAddressRMA = async (macInput: string) => {
    const cleanMac = macInput.trim();
    
    if (!cleanMac) {
      toast({
        title: "Erro",
        description: "Digite um endereço MAC válido",
        variant: "destructive",
      });
      return;
    }

    if (!isValidMacFormat(cleanMac)) {
      toast({
        title: "Formato inválido",
        description: "MAC deve ter 12 caracteres hexadecimais (ex: C85A9FC7B9C0 ou C8:5A:9F:C7:B9:C0)",
        variant: "destructive",
      });
      return;
    }

    const formattedMac = formatMac(cleanMac);

    // Verificar duplicata local
    if (macsRMA.includes(formattedMac)) {
      toast({
        title: "MAC duplicado",
        description: "Este endereço MAC já foi adicionado",
        variant: "destructive",
      });
      return;
    }

    // Verificar duplicata global
    const exists = await checkMacExists(formattedMac);
    if (exists) {
      return; // O hook já mostra o toast de erro
    }

    setMacsRMA(prev => [...prev, formattedMac]);
    setCurrentMacRMA("");
    
    toast({
      title: "MAC adicionado",
      description: `Endereço ${formattedMac} adicionado com sucesso`,
    });
  };

  const removeMacRMA = (macToRemove: string) => {
    setMacsRMA(prev => prev.filter(mac => mac !== macToRemove));
    toast({
      title: "MAC removido",
      description: `Endereço ${macToRemove} removido`,
    });
  };

  const handleEquipmentSelectRMA = (equipment: any) => {
    setSelectedEquipmentRMA(equipment);
    setRmaData(prev => ({
      ...prev,
      equipamento: equipment.nome,
      modelo: equipment.modelo || "",
    }));
  };

  const handleCreateRMA = async () => {
    if (!rmaData.equipamento || !rmaData.defeito_relatado || !rmaData.origem_equipamento || !rmaData.destino_envio) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRMA({
        equipamento: rmaData.equipamento,
        modelo: rmaData.modelo,
        mac_address: macsRMA.join(", "),
        origem_equipamento: rmaData.origem_equipamento,
        destino_envio: rmaData.destino_envio,
        defeito_relatado: rmaData.defeito_relatado,
        status: "Aberto",
        data_abertura: new Date().toISOString().split('T')[0],
        tecnico_responsavel: rmaData.tecnico_responsavel,
        observacoes: rmaData.observacoes,
        nota_fiscal: rmaData.nota_fiscal,
        anexos_ids: anexosRMA,
      });

      // Reset form
      setRmaData({
        equipamento: "",
        modelo: "",
        mac_address: "",
        origem_equipamento: "",
        destino_envio: "",
        defeito_relatado: "",
        tecnico_responsavel: "",
        observacoes: "",
        nota_fiscal: "",
      });
      setMacsRMA([]);
      setAnexosRMA([]);
      setSelectedEquipmentRMA(null);
      setShowRMADialog(false);
    } catch (error) {
      console.error("Erro ao criar RMA:", error);
    }
  };

  const handleMultipleBoxSelection = (caixaId: string) => {
    console.log("Selecionando caixa múltipla:", caixaId);
    // Limpar seleção simples quando usar seleção múltipla
    setSelectedCaixa("");
    
    setSelectedCaixas(prev => {
      const newSelection = prev.includes(caixaId) 
        ? prev.filter(id => id !== caixaId)
        : [...prev, caixaId];
      
      console.log("Nova seleção múltipla:", newSelection);
      return newSelection;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Saídas</h1>
            <p className="text-muted-foreground">Registre a saída de caixas e faça separações</p>
          </div>
          <Button 
            onClick={() => setShowRMADialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Novo RMA
          </Button>
        </div>

        <Tabs defaultValue="saida" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saida" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Registrar Saída
            </TabsTrigger>
            <TabsTrigger value="separacao" className="flex items-center gap-2">
              <Split className="h-4 w-4" />
              Separação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saida" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulário de Saída */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Dados da Saída
                  </CardTitle>
                  <CardDescription>
                    Preencha as informações para registrar a saída
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="caixa">
                      Caixas para Saída * 
                      {selectedCaixas.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedCaixas.length} selecionada{selectedCaixas.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </Label>
                    <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                      {loadingCaixas ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Carregando caixas...
                        </div>
                      ) : caixasDisponiveis.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhuma caixa encontrada no inventário
                        </div>
                      ) : (
                        caixasDisponiveis.map((caixa) => (
                          <div 
                            key={caixa.id}
                           className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                               selectedCaixas.includes(caixa.id) 
                                 ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" 
                                 : "border-border hover:border-primary/50 hover:bg-muted/30"
                             }`}
                            onClick={() => handleMultipleBoxSelection(caixa.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{caixa.numero_caixa}</div>
                                <div className="text-sm text-muted-foreground">
                                  {caixa.equipamento} - {caixa.modelo}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{caixa.quantidade}</div>
                                <div className="text-xs text-muted-foreground">equipamentos</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Informações da caixa selecionada no formulário */}
                  {caixaSelecionada && (
                    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Equipamento:</span>
                        <span className="text-sm">{caixaSelecionada.equipamento}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Modelo:</span>
                        <span className="text-sm">{caixaSelecionada.modelo}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Quantidade:</span>
                        <span className="text-sm">{caixaSelecionada.quantidade} equipamentos</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="responsavel">Responsável pela Saída *</Label>
                    <Select value={responsavelSaida} onValueChange={setResponsavelSaida}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg">
                        {funcionariosAprovados.map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.nome}>
                            {funcionario.nome} - {funcionario.funcao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destino">Destino *</Label>
                    <Input
                      id="destino"
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      placeholder="Para onde vai a caixa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo da Saída</Label>
                    <Textarea
                      id="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Descreva o motivo da saída..."
                      rows={3}
                    />
                  </div>

                  <FileUploadSaida
                    onFilesChange={setAnexosSaida}
                    existingFiles={anexosSaida}
                    maxFiles={3}
                  />

                  <Button
                    onClick={handleRegistrarSaida}
                    className="w-full"
                    disabled={!selectedCaixa && selectedCaixas.length === 0 || !responsavelSaida || !destino}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Registrar Saída
                  </Button>
                </CardContent>
              </Card>

              {/* Informações das Caixas Selecionadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Detalhes das Caixas
                  </CardTitle>
                  <CardDescription>
                    Informações das caixas selecionadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCaixas.length > 0 ? (
                    <div className="space-y-4">
                      {/* Resumo Total */}
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-primary">{selectedCaixas.length}</div>
                            <div className="text-xs text-muted-foreground">Caixas Selecionadas</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-primary">{totalQuantidadeSelecionada}</div>
                            <div className="text-xs text-muted-foreground">Total de Equipamentos</div>
                          </div>
                        </div>
                      </div>

                      {/* Detalhes de cada caixa */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Caixas selecionadas:</h4>
                        {caixasSelecionadasData.map((caixa) => (
                          <div key={caixa.id} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold">{caixa.numero_caixa}</p>
                                <p className="text-sm text-muted-foreground">{caixa.equipamento}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-primary">{caixa.quantidade}</div>
                                <div className="text-xs text-muted-foreground">equipamentos</div>
                              </div>
                            </div>
                            <Badge variant={caixa.status === "Disponível" ? "default" : caixa.status === "Em Uso" ? "secondary" : "destructive"}>
                              {caixa.status}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      {/* Lista consolidada de MACs */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Todos os MACs das caixas selecionadas:</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const todosMacs = caixasSelecionadasData
                                .flatMap(caixa => caixa.macs)
                                .map(mac => mac.replace(/:/g, ''))
                                .join(',');
                              navigator.clipboard.writeText(todosMacs);
                              toast({
                                title: "Lista copiada",
                                description: "Lista de todos os MACs copiada para a área de transferência",
                              });
                            }}
                            className="h-8 gap-2"
                          >
                            <Copy className="h-3 w-3" />
                            Copiar Todos
                          </Button>
                        </div>
                        
                        <div className="bg-background border rounded-lg p-4 max-h-48 overflow-y-auto">
                          <div className="font-mono text-sm select-all break-all">
                            {caixasSelecionadasData
                              .flatMap(caixa => caixa.macs)
                              .map(mac => mac.replace(/:/g, ''))
                              .join(',')}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Total de MACs: {caixasSelecionadasData.reduce((total, caixa) => total + caixa.macs.length, 0)}
                        </div>
                      </div>

                      {/* Alertas se alguma caixa não está disponível */}
                      {caixasSelecionadasData.some(caixa => caixa.status !== "Disponível") && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">
                            Algumas caixas selecionadas não estão disponíveis para saída
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione caixas para ver os detalhes</p>
                      <p className="text-sm">Clique nas caixas ao lado para selecioná-las</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Lista de Caixas Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle>Caixas Disponíveis</CardTitle>
                <CardDescription>
                  Lista de todas as caixas cadastradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar caixa..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    {filteredCaixas.map((caixa) => (
                      <div 
                        key={caixa.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedCaixa === caixa.id ? 'border-primary bg-primary/10 shadow-md' : ''
                        }`}
                        onClick={() => {
                          console.log("Selecionando caixa simples:", caixa.id);
                          // Limpar seleção múltipla quando usar seleção simples
                          setSelectedCaixas([]);
                          setSelectedCaixa(caixa.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{caixa.numero_caixa}</p>
                            <p className="text-sm text-muted-foreground">{caixa.equipamento}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{caixa.quantidade} eq.</span>
                          <Badge variant={caixa.status === "Disponível" ? "default" : caixa.status === "Em Uso" ? "secondary" : "destructive"}>
                            {caixa.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="separacao" className="space-y-6">
            {/* Passo 1: Lista de MACs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Passo 1: Selecionar Caixa e MACs</CardTitle>
                <CardDescription>
                  Selecione uma caixa para carregar automaticamente os MACs ou cole manualmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Escolha do tipo de seleção */}
                <div className="space-y-3">
                  <Label>Como deseja inserir os MACs?</Label>
                  <RadioGroup 
                    value={tipoSelecaoMac} 
                    onValueChange={(value) => {
                      setTipoSelecaoMac(value);
                      if (value === "manual") {
                        setSelectedCaixaSeparacao("");
                        setMacsParaVerificar("");
                      }
                    }}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="caixa" id="tipoCaixa" />
                      <Label htmlFor="tipoCaixa" className="cursor-pointer">Selecionar Caixa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="tipoManual" />
                      <Label htmlFor="tipoManual" className="cursor-pointer">Inserir MACs Manualmente</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Seleção de caixa (só aparece quando tipo = "caixa") */}
                {tipoSelecaoMac === "caixa" && (
                  <div className="space-y-2">
                    <Label htmlFor="caixaSeparacao">Selecionar Caixa:</Label>
                    <Select value={selectedCaixaSeparacao} onValueChange={(value) => {
                      setSelectedCaixaSeparacao(value);
                      const caixa = caixasDisponiveis.find(c => c.id === value);
                      if (caixa) {
                        setMacsParaVerificar(caixa.macs.join('\n'));
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma caixa para carregar os MACs" />
                      </SelectTrigger>
                      <SelectContent>
                        {caixasDisponiveis.map((caixa) => (
                          <SelectItem key={caixa.id} value={caixa.id}>
                            {caixa.numero_caixa} - {caixa.equipamento} ({caixa.quantidade} MACs)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Informações da caixa selecionada (só aparece quando uma caixa está selecionada) */}
                {tipoSelecaoMac === "caixa" && caixaSeparacaoSelecionada && (
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Equipamento:</span>
                      <span className="text-sm">{caixaSeparacaoSelecionada.equipamento}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quantidade:</span>
                      <span className="text-sm">{caixaSeparacaoSelecionada.quantidade} equipamentos</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={caixaSeparacaoSelecionada.status === "Disponível" ? "default" : caixaSeparacaoSelecionada.status === "Em Uso" ? "secondary" : "destructive"}>
                        {caixaSeparacaoSelecionada.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Campo de MACs (sempre visível) */}
                <div className="space-y-2">
                  <Label htmlFor="macsVerificar">
                    {tipoSelecaoMac === "caixa" ? "MACs da Caixa Selecionada:" : "MACs para Verificar:"}
                  </Label>
                  <Textarea
                    id="macsVerificar"
                    value={macsParaVerificar}
                    onChange={(e) => setMacsParaVerificar(e.target.value)}
                    placeholder={tipoSelecaoMac === "caixa" 
                      ? "Selecione uma caixa acima para carregar os MACs automaticamente..."
                      : "Cole aqui os MACs (separados por vírgula ou quebra de linha)..."
                    }
                    rows={6}
                    className="font-mono text-sm"
                    disabled={tipoSelecaoMac === "caixa" && !selectedCaixaSeparacao}
                  />
                </div>

                {/* Lista de MACs Carregados */}
                {macsParaVerificar.trim() && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-primary">
                        📝 Lista de MACs Carregados:
                      </h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const macsList = macsParaVerificar.split(/[\n,]/).filter(mac => mac.trim()).join(',');
                          navigator.clipboard.writeText(macsList);
                          toast({
                            title: "Lista copiada",
                            description: "Lista de MACs copiada para a área de transferência",
                          });
                        }}
                      >
                        Copiar Lista
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {macsParaVerificar.split(/[\n,]/).filter(mac => mac.trim()).length} MAC(s)
                    </div>
                    <div className="text-xs font-mono text-foreground bg-background/50 p-2 rounded border max-h-20 overflow-y-auto">
                      {macsParaVerificar.split(/[\n,]/).filter(mac => mac.trim()).join(',')}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={limparMacs}>
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Passo 2: Dados dos Equipamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-success">Passo 2: Dados dos Equipamentos</CardTitle>
                <CardDescription>
                  Cole aqui os dados dos equipamentos no formato do sistema (aceita MAC com ou sem :)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dadosEquipamentos">Dados dos Equipamentos:</Label>
                  <div className="relative">
                    <Textarea
                      id="dadosEquipamentos"
                      value={dadosEquipamentos}
                      onChange={(e) => setDadosEquipamentos(e.target.value)}
                      placeholder="Cole aqui os dados dos equipamentos..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    {dadosEquipamentos && (
                      <div className="mt-4 space-y-4">
                        {/* Contador de Status */}
                        <div className="p-4 border border-border dark:border-gray-700 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 dark:from-gray-800/50 dark:to-gray-900/30 shadow-sm">
                          <div className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            Resumo dos Status:
                          </div>
                          <div className="flex gap-6 text-sm">
                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800/50">
                              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-sm"></div>
                              <span className="font-medium text-green-800 dark:text-green-200">Estoque ({dadosEquipamentos.split('\n').filter(line => line.trim() === 'Estoque').length})</span>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800/50">
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
                              <span className="font-medium text-blue-800 dark:text-blue-200">Comodato ({dadosEquipamentos.split('\n').filter(line => line.trim() === 'Comodato').length})</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Visualização com Status Destacados */}
                        <div className="border border-border dark:border-gray-700 rounded-xl p-4 bg-gradient-to-br from-background to-muted/30 dark:from-gray-900 dark:to-gray-800 max-h-60 overflow-y-auto shadow-sm">
                          <div className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            Dados com Status Destacados:
                          </div>
                          <div className="font-mono text-xs space-y-2">
                            {dadosEquipamentos.split('\n').map((line, index) => {
                              const trimmedLine = line.trim();
                              if (trimmedLine === 'Estoque') {
                                return (
                                  <div key={index} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 transition-all hover:shadow-md">
                                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-sm"></div>
                                    <span className="font-bold text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/50 px-3 py-1.5 rounded-full text-xs tracking-wide">{line}</span>
                                  </div>
                                );
                              } else if (trimmedLine === 'Comodato') {
                                return (
                                  <div key={index} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 transition-all hover:shadow-md">
                                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
                                    <span className="font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 px-3 py-1.5 rounded-full text-xs tracking-wide">{line}</span>
                                  </div>
                                );
                              } else if (trimmedLine) {
                                return (
                                  <div key={index} className="text-muted-foreground ml-6 py-1 px-2 rounded bg-muted/20 dark:bg-gray-800/30">{line}</div>
                                );
                              } else {
                                return <div key={index} className="h-2"></div>;
                              }
                            })}
                          </div>
                        </div>
                        

                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Processamento</CardTitle>
                <CardDescription>
                  Clique no botão abaixo para verificar quais MACs da lista foram encontrados nos dados dos equipamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={processarComparacao}
                  className="w-full"
                  disabled={!macsParaVerificar.trim() || !dadosEquipamentos.trim()}
                >
                  <Split className="h-4 w-4 mr-2" />
                  Verificar MACs
                </Button>

                {/* Resultado do Processamento - Continuação */}

                {/* Resultado do Processamento */}
                {(Object.keys(resultadoProcessamento.grupos).length > 0 || resultadoProcessamento.naoEncontrados.length > 0) && (
                  <div className="space-y-4">
                    <div className="p-6 border border-border dark:border-gray-700 rounded-xl bg-gradient-to-br from-background to-muted/30 dark:from-gray-900 dark:to-gray-800 shadow-lg">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-foreground">
                        <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/70 rounded-full animate-pulse shadow-sm"></div>
                        📋 Lista Organizada por Localização:
                      </h3>
                      
                      {/* Grupos por localização */}
                      {Object.entries(resultadoProcessamento.grupos).map(([local, macs]) => (
                        <div key={local} className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/70 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                              {local}
                            </h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 hover:scale-105 transition-all duration-200 shadow-sm"
                              onClick={() => {
                                const macsList = macs.join(',');
                                navigator.clipboard.writeText(macsList);
                                toast({
                                  title: "Lista copiada",
                                  description: `Lista de ${local} copiada para a área de transferência`,
                                });
                              }}
                            >
                              Copiar
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-gradient-to-r from-blue-100/70 to-blue-50/50 dark:from-blue-900/70 dark:to-blue-950/50 p-3 rounded-lg break-all border border-blue-200/50 dark:border-blue-800/30">
                              {macs.join(',')}
                            </div>
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/30 dark:bg-blue-900/30 px-3 py-1.5 rounded-full inline-block">
                              {macs.length} MAC(s)
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Equipamentos em Comodato - movido para cima dos não encontrados */}
                      {dadosEquipamentos && (() => {
                        const lines = dadosEquipamentos.split('\n');
                        const comodatoEquipamentos = [];
                        
                        // Verificar se há equipamentos em comodato
                        const hasComodato = lines.some(line => line.trim() === 'Comodato' || line.includes('Comodato'));
                        
                        if (!hasComodato) {
                          return null;
                        }
                        
                        for (let i = 0; i < lines.length; i++) {
                          if (lines[i].trim() === 'Comodato' || lines[i].includes('Comodato')) {
                             // Buscar informações do equipamento nas linhas anteriores e posteriores
                             let equipamentoInfo = '';
                             
                             // Buscar linha do equipamento (anterior com número)
                             for (let k = i - 1; k >= Math.max(0, i - 10); k--) {
                               if (lines[k].match(/^\(\d+\)/)) {
                                 equipamentoInfo = lines[k];
                                 break;
                               }
                             }
                             
                             // Buscar informações adicionais em um contexto mais amplo
                              let mac = '';
                              let local = '';
                              let numeroSerie = '';
                              let outrasInfos = [];
                              
                              // Buscar informações tanto nas linhas anteriores quanto posteriores
                              const searchStart = Math.max(0, i - 5);
                              const searchEnd = Math.min(lines.length, i + 25);
                              
                              for (let j = searchStart; j < searchEnd; j++) {
                                const infoLine = lines[j].trim();
                                
                                // Pular a linha atual do Comodato
                                if (j === i) continue;
                                
                                // Para quando encontrar outro equipamento
                                if (j > i && infoLine.match(/^\(\d+\)/) && j !== i + 1) {
                                  break;
                                }
                                
                                // Buscar MAC com diferentes padrões
                                if (infoLine.includes('MAC:')) {
                                  const macMatch = infoLine.match(/MAC:\s*([A-Fa-f0-9:.-]+)/);
                                  if (macMatch) {
                                    mac = macMatch[1];
                                  }
                                } else if (!mac && infoLine.match(/^[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}$/)) {
                                  // MAC sem prefixo no formato XX:XX:XX:XX:XX:XX
                                  mac = infoLine;
                                }
                                
                                // Buscar LOCAL ESTOQUE
                                if (infoLine.includes('LOCAL ESTOQUE:')) {
                                  const localMatch = infoLine.match(/LOCAL ESTOQUE:\s*(.+?)(?:\s+NÚMERO|\s+MAC|\t|$)/);
                                  if (localMatch) {
                                    local = localMatch[1].trim();
                                  }
                                }
                                
                                // Buscar NÚMERO DE SÉRIE
                                if (infoLine.includes('NÚMERO DE SÉRIE:')) {
                                  const serieMatch = infoLine.match(/NÚMERO DE SÉRIE:\s*(.+?)(?:\s+MAC|\s+LOCAL|\t|$)/);
                                  if (serieMatch) {
                                    numeroSerie = serieMatch[1].trim();
                                  }
                                }
                               
                               // Capturar outras informações que não sejam vazias e não sejam status
                               if (infoLine && 
                                   !infoLine.includes('MAC:') && 
                                   !infoLine.includes('LOCAL ESTOQUE:') && 
                                   !infoLine.includes('NÚMERO DE SÉRIE:') &&
                                   !infoLine.match(/^\(\d+\)/) && 
                                   infoLine.trim() !== 'Estoque' && 
                                   infoLine.trim() !== 'Comodato' &&
                                   infoLine.length > 0) {
                                 outrasInfos.push(infoLine);
                               }
                             }
                             
                             // Sempre adicionar o equipamento, mesmo que algumas informações estejam faltando
                             comodatoEquipamentos.push({ 
                               equipamento: equipamentoInfo || 'Equipamento em Comodato', 
                               mac: mac || 'N/A', 
                               local: local || 'N/A', 
                               numeroSerie: numeroSerie || 'N/A',
                               outrasInfos 
                             });
                          }
                        }
                        
                        if (comodatoEquipamentos.length === 0) {
                          return null;
                        }
                        
                        return (
                          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/70 dark:to-green-900/50 border border-green-200 dark:border-green-800/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-lg text-green-800 dark:text-green-200 flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                                📦 Equipamentos em Comodato
                              </h4>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-900 hover:scale-105 transition-all duration-200 shadow-sm"
                                onClick={() => {
                                  const comodatoMacs = comodatoEquipamentos
                                    .filter(item => item.mac && item.mac !== 'N/A')
                                    .map(item => item.mac.replace(/:/g, ''))
                                    .join(',');
                                  
                                  navigator.clipboard.writeText(comodatoMacs);
                                  toast({
                                    title: "Lista copiada",
                                    description: `MACs de Comodato copiados para a área de transferência`,
                                  });
                                }}
                              >
                                Copiar
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              {comodatoEquipamentos.map((item, index) => {
                                 // Extrair informações detalhadas do equipamento
                                 const equipamentoMatch = item.equipamento ? item.equipamento.match(/\((\d+)\)\s*(.+)/) : null;
                                 const numeroEquipamento = equipamentoMatch ? equipamentoMatch[1] : '';
                                 const modeloEquipamento = equipamentoMatch ? equipamentoMatch[2] : item.equipamento || 'Equipamento';
                                 
                                 return (
                                    <div key={index} className="p-3 bg-gradient-to-r from-green-100/70 to-green-50/50 dark:from-green-900/70 dark:to-green-950/50 border border-green-200/50 dark:border-green-800/30 rounded-lg font-mono text-sm">
                                      <div className="text-green-800 dark:text-green-200 font-semibold mb-1 bg-gradient-to-r from-yellow-200 to-yellow-300 dark:from-yellow-600 dark:to-yellow-700 px-2 py-1 rounded-md border border-yellow-400 dark:border-yellow-500 shadow-sm">
                                        🏷️ Comodato
                                      </div>
                                      {numeroEquipamento && (
                                        <div className="text-green-700 dark:text-green-300 mb-1">
                                          ({numeroEquipamento}) {modeloEquipamento}
                                        </div>
                                      )}
                                      {item.local && item.local !== 'N/A' && (
                                        <div className="text-green-600 dark:text-green-400 mb-1">
                                          LOCAL ESTOQUE: {item.local}
                                        </div>
                                      )}
                                      {item.numeroSerie && item.numeroSerie !== 'N/A' && (
                                        <div className="text-green-600 dark:text-green-400 mb-1">
                                          NÚMERO DE SÉRIE: {item.numeroSerie}
                                        </div>
                                      )}
                                      {item.outrasInfos && item.outrasInfos.length > 0 && (
                                        item.outrasInfos.filter(info => 
                                          !info.includes('VALOR VENDA:') && 
                                          !info.includes('RECONDICIONADO:') && 
                                          !info.includes('TIPO:') && 
                                          !info.includes('OBSERVAÇÕES:')
                                        ).map((info, infoIndex) => (
                                          <div key={infoIndex} className="text-green-600 dark:text-green-400 mb-1">
                                            {info}
                                          </div>
                                        ))
                                      )}
                                      {item.mac && item.mac !== 'N/A' && (
                                        <div className="text-green-700 dark:text-green-300 flex items-center justify-between">
                                          <span>MAC: {item.mac}</span>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-900 hover:scale-105 transition-all duration-200 shadow-sm h-6 px-2"
                                            onClick={() => {
                                              const macSemDoisPontos = item.mac.replace(/:/g, '');
                                              navigator.clipboard.writeText(macSemDoisPontos);
                                              toast({
                                                title: "Lista copiada",
                                                description: `MAC ${macSemDoisPontos} copiado para a área de transferência`,
                                              });
                                            }}
                                          >
                                            Copiar
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  );
                               })}
                               <div className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100/30 dark:bg-green-900/30 px-3 py-1.5 rounded-full inline-block">
                                 {comodatoEquipamentos.filter(item => item.mac && item.mac !== 'N/A').length} MAC(s)
                               </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Equipamentos não encontrados */}
                      {resultadoProcessamento.naoEncontrados.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/70 dark:to-red-900/50 border border-red-200 dark:border-red-800/50 rounded-xl shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-lg text-red-800 dark:text-red-200 flex items-center gap-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
                              ❌ Equipamentos Não Encontrados
                            </h4>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-900 hover:scale-105 transition-all duration-200 shadow-sm"
                                onClick={() => {
                                  const macsList = resultadoProcessamento.naoEncontrados.join(',');
                                  navigator.clipboard.writeText(macsList);
                                  toast({
                                    title: "Lista copiada",
                                    description: "MACs não encontrados copiados para a área de transferência",
                                  });
                                }}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copiar
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:scale-105 transition-all duration-200 shadow-sm"
                                onClick={gerarCSVEquipamentosNaoEncontrados}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Gerar Compra
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs font-mono text-red-700 dark:text-red-300 bg-gradient-to-r from-red-100/70 to-red-50/50 dark:from-red-900/70 dark:to-red-950/50 p-3 rounded-lg mb-3 border border-red-200/50 dark:border-red-800/30">
                            {resultadoProcessamento.naoEncontrados.map((mac, index) => (
                              <span key={mac}>
                                {mac}{index < resultadoProcessamento.naoEncontrados.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                          <div className="text-sm text-red-600 dark:text-red-400">
                            {resultadoProcessamento.naoEncontrados.length} MAC(S)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para Criar RMA */}
        <Dialog open={showRMADialog} onOpenChange={setShowRMADialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo RMA</DialogTitle>
              <DialogDescription>
                Preencha as informações para criar uma solicitação de RMA
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Equipamento *</Label>
                  <EquipmentSelector
                    onSelect={handleEquipmentSelectRMA}
                    selectedEquipment={selectedEquipmentRMA}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={rmaData.modelo}
                    onChange={(e) => setRmaData(prev => ({ ...prev, modelo: e.target.value }))}
                    placeholder="Modelo do equipamento"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereços MAC</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentMacRMA}
                    onChange={(e) => setCurrentMacRMA(e.target.value)}
                    placeholder="Ex: C85A9FC7B9C0 ou C8:5A:9F:C7:B9:C0"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addMacAddressRMA(currentMacRMA);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={() => addMacAddressRMA(currentMacRMA)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {macsRMA.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm font-medium">MACs adicionados:</div>
                    <div className="flex flex-wrap gap-1">
                      {macsRMA.map((mac, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="flex items-center gap-1"
                        >
                          {mac}
                          <button
                            onClick={() => removeMacRMA(mac)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origem">Origem do Equipamento *</Label>
                  <Input
                    id="origem"
                    value={rmaData.origem_equipamento}
                    onChange={(e) => setRmaData(prev => ({ ...prev, origem_equipamento: e.target.value }))}
                    placeholder="Ex: Estoque, Cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destino">Destino de Envio *</Label>
                  <Input
                    id="destino"
                    value={rmaData.destino_envio}
                    onChange={(e) => setRmaData(prev => ({ ...prev, destino_envio: e.target.value }))}
                    placeholder="Ex: Laboratório, Fornecedor"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defeito">Defeito Relatado *</Label>
                <Textarea
                  id="defeito"
                  value={rmaData.defeito_relatado}
                  onChange={(e) => setRmaData(prev => ({ ...prev, defeito_relatado: e.target.value }))}
                  placeholder="Descreva o defeito relatado"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tecnico">Técnico Responsável</Label>
                  <Select value={rmaData.tecnico_responsavel} onValueChange={(value) => setRmaData(prev => ({ ...prev, tecnico_responsavel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o técnico" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg">
                      {funcionariosAprovados.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.nome}>
                          {funcionario.nome} - {funcionario.funcao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nota-fiscal">Nota Fiscal</Label>
                  <Input
                    id="nota-fiscal"
                    value={rmaData.nota_fiscal}
                    onChange={(e) => setRmaData(prev => ({ ...prev, nota_fiscal: e.target.value }))}
                    placeholder="Número da nota fiscal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={rmaData.observacoes}
                  onChange={(e) => setRmaData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Anexos</Label>
                <FileUploadRMA onFilesChange={setAnexosRMA} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRMADialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRMA} disabled={rmaLoading}>
                {rmaLoading ? "Criando..." : "Criar RMA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
