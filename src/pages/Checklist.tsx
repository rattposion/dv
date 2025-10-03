import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { FileText, Settings, CheckCircle, AlertTriangle, Plus, X, Download, Save, RefreshCw, Trash2, Calendar, Monitor, CheckSquare, Activity, History } from 'lucide-react';
import jsPDF from 'jspdf';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSupabaseChecklists, ChecklistData } from '@/hooks/useSupabaseChecklists';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Interfaces para o novo sistema de checklist técnico
interface TesteWiFi {
  statusConexao: boolean;
  estabilidade: string;
  obstaculosIdentificados: string;
}

interface TestePortasLAN {
  portasTestadas: string;
  linkAtivo: boolean;
  velocidadeNegociada: string;
  testePing: string;
}

interface TesteLogin {
  enderecoIP: string;
  usuarioTestado: string;
  resultadoLogin: boolean;
  permissoesVerificadas: string;
}

interface MedicaoSinal {
  intensidadeDbm: string;
  frequenciaTestada: '2.4GHz' | '5GHz' | '';
  perdaMedida: string;
  coberturaPorArea: string;
}

interface TesteVelocidade {
  download: string;
  upload: string;
  latencia: string;
  perdaPacotes: string;
  resultadoComparado: string;
}

interface DadosTecnico {
  nomeTecnico: string;
  dataHora: string;
}

interface ObservacaoFinal {
  observacoes: string;
}

const Checklist: React.FC = () => {
  // Hook do Supabase para operações CRUD
  const { createChecklist, updateChecklist, loading } = useSupabaseChecklists();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados de controle do salvamento
  const [checklistId, setChecklistId] = useState<string | null>(null);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estados para os dados do técnico
  const [dadosTecnico, setDadosTecnico] = useState<DadosTecnico>({
    nomeTecnico: '',
    dataHora: new Date().toLocaleString('pt-BR')
  });

  // Estados para os testes técnicos
  const [testeWiFi, setTesteWiFi] = useState<TesteWiFi>({
    statusConexao: false,
    estabilidade: '',
    obstaculosIdentificados: ''
  });

  const [testePortasLAN, setTestePortasLAN] = useState<TestePortasLAN>({
    portasTestadas: '',
    linkAtivo: false,
    velocidadeNegociada: '',
    testePing: ''
  });

  const [testeLogin, setTesteLogin] = useState<TesteLogin>({
    enderecoIP: '',
    usuarioTestado: '',
    resultadoLogin: false,
    permissoesVerificadas: ''
  });

  const [medicaoSinal, setMedicaoSinal] = useState<MedicaoSinal>({
    intensidadeDbm: '',
    frequenciaTestada: '',
    perdaMedida: '',
    coberturaPorArea: ''
  });

  const [testeVelocidade, setTesteVelocidade] = useState<TesteVelocidade>({
    download: '',
    upload: '',
    latencia: '',
    perdaPacotes: '',
    resultadoComparado: ''
  });

  // Estado para observações finais
  const [observacaoFinal, setObservacaoFinal] = useState<ObservacaoFinal>({
    observacoes: ''
  });
  
  // Estados para dados do equipamento
  const [dadosEquipamento, setDadosEquipamento] = useState({
    modelo: '',
    mac: '',
    snGpon: '',
    potenciaOptica: '',
    distanciaFibra: '',
    statusOnu: ''
  });

  // Função para calcular status geral
  const calcularStatusGeralDetalhado = (): number => {
    let totalCampos = 0;
    let camposPreenchidos = 0;

    // Dados do técnico (2 campos)
    totalCampos += 2;
    if (dadosTecnico.nomeTecnico) camposPreenchidos++;
    if (dadosTecnico.dataHora) camposPreenchidos++;

    // Dados do Equipamento (6 campos)
    totalCampos += 6;
    if (dadosEquipamento.modelo) camposPreenchidos++;
    if (dadosEquipamento.mac) camposPreenchidos++;
    if (dadosEquipamento.snGpon) camposPreenchidos++;
    if (dadosEquipamento.potenciaOptica) camposPreenchidos++;
    if (dadosEquipamento.distanciaFibra) camposPreenchidos++;
    if (dadosEquipamento.statusOnu) camposPreenchidos++;

    // Teste Wi-Fi (3 campos)
    totalCampos += 3;
    if (testeWiFi.statusConexao !== null) camposPreenchidos++;
    if (testeWiFi.estabilidade) camposPreenchidos++;
    if (testeWiFi.obstaculosIdentificados) camposPreenchidos++;

    // Teste Portas LAN (4 campos)
    totalCampos += 4;
    if (testePortasLAN.portasTestadas) camposPreenchidos++;
    if (testePortasLAN.linkAtivo !== null) camposPreenchidos++;
    if (testePortasLAN.velocidadeNegociada) camposPreenchidos++;
    if (testePortasLAN.testePing) camposPreenchidos++;

    // Teste Login (4 campos)
    totalCampos += 4;
    if (testeLogin.enderecoIP) camposPreenchidos++;
    if (testeLogin.usuarioTestado) camposPreenchidos++;
    if (testeLogin.resultadoLogin !== null) camposPreenchidos++;
    if (testeLogin.permissoesVerificadas) camposPreenchidos++;

    // Medição de Sinal (4 campos)
    totalCampos += 4;
    if (medicaoSinal.intensidadeDbm) camposPreenchidos++;
    if (medicaoSinal.frequenciaTestada) camposPreenchidos++;
    if (medicaoSinal.perdaMedida) camposPreenchidos++;
    if (medicaoSinal.coberturaPorArea) camposPreenchidos++;

    // Teste Velocidade (5 campos)
    totalCampos += 5;
    if (testeVelocidade.download) camposPreenchidos++;
    if (testeVelocidade.upload) camposPreenchidos++;
    if (testeVelocidade.latencia) camposPreenchidos++;
    if (testeVelocidade.perdaPacotes) camposPreenchidos++;
    if (testeVelocidade.resultadoComparado) camposPreenchidos++;

    // Observações finais (1 campo)
    totalCampos += 1;
    if (observacaoFinal.observacoes) camposPreenchidos++;

    return Math.round((camposPreenchidos / totalCampos) * 100);
  }

  // Função para calcular o status geral dos testes
  const calcularStatusGeral = () => {
    const testesCompletos = [
      testeWiFi.statusConexao,
      testePortasLAN.portasTestadas && testePortasLAN.linkAtivo,
      testeLogin.enderecoIP && testeLogin.resultadoLogin,
      medicaoSinal.intensidadeDbm && medicaoSinal.frequenciaTestada,
      testeVelocidade.download && testeVelocidade.upload
    ];

    const totalTestes = testesCompletos.length;
    const testesOK = testesCompletos.filter(Boolean).length;

    return {
      funcionando: testesOK === totalTestes,
      resetRealizado: testesOK > 0,
      atualizacaoRealizada: testesOK >= totalTestes / 2,
      percentualCompleto: Math.round((testesOK / totalTestes) * 100)
    };
  };

  // Cálculo dos badges de status
  const statusGeral = calcularStatusGeral();
  
  const funcionandoBadge = statusGeral.funcionando ? "Funcionando" : 
                          statusGeral.percentualCompleto > 50 ? "Parcial" : "Nao Funcionando";
  const funcionandoColor = statusGeral.funcionando ? "success" : 
                          statusGeral.percentualCompleto > 50 ? "warning" : "destructive";

  const resetBadge = statusGeral.resetRealizado ? "Reset Realizado" : "Reset Pendente";
  const resetColor = statusGeral.resetRealizado ? "success" : "destructive";

  const atualizacaoBadge = statusGeral.atualizacaoRealizada ? "Atualizacao Realizada" : "Atualizacao Pendente";
  const atualizacaoColor = statusGeral.atualizacaoRealizada ? "success" : "destructive";

  // Status badges para o PDF
  const statusBadges = [
    { label: funcionandoBadge, color: funcionandoColor },
    { label: resetBadge, color: resetColor },
    { label: atualizacaoBadge, color: atualizacaoColor }
  ];

  // Lista de testes técnicos para compatibilidade com o PDF
  const testesTecnicos = [
    {
      id: '1',
      nome: 'Teste de Conectividade Wi-Fi',
      descricao: 'Verificação da conectividade e estabilidade do Wi-Fi',
      concluido: testeWiFi.statusConexao,
      resultado: testeWiFi.statusConexao ? 'OK' : 'Falha',
      observacoes: testeWiFi.obstaculosIdentificados
    },
    {
      id: '2',
      nome: 'Teste de Portas LAN',
      descricao: 'Verificação das portas Ethernet e velocidade de conexão',
      concluido: testePortasLAN.linkAtivo,
      resultado: testePortasLAN.linkAtivo ? 'OK' : 'Falha',
      observacoes: testePortasLAN.velocidadeNegociada
    },
    {
      id: '3',
      nome: 'Teste de Login',
      descricao: 'Verificação de acesso ao painel administrativo',
      concluido: testeLogin.resultadoLogin,
      resultado: testeLogin.resultadoLogin ? 'OK' : 'Falha',
      observacoes: testeLogin.permissoesVerificadas
    },
    {
      id: '4',
      nome: 'Medição de Sinal',
      descricao: 'Análise da intensidade e qualidade do sinal',
      concluido: medicaoSinal.intensidadeDbm !== '',
      resultado: medicaoSinal.intensidadeDbm ? 'OK' : 'Pendente',
      observacoes: medicaoSinal.coberturaPorArea
    },
    {
      id: '5',
      nome: 'Teste de Velocidade',
      descricao: 'Medição de velocidade de download e upload',
      concluido: testeVelocidade.download !== '' && testeVelocidade.upload !== '',
      resultado: testeVelocidade.resultadoComparado || 'Pendente',
      observacoes: `Latência: ${testeVelocidade.latencia}`
    }
  ];

  // Função para converter dados do formulário para o formato do Supabase
  const convertToChecklistData = useCallback((): Omit<ChecklistData, 'id' | 'created_at' | 'updated_at'> => {
    const progressoAtual = calcularStatusGeralDetalhado();
    
    // Converter data_hora para formato ISO 8601
    const convertDataHora = (dataHoraStr: string): string => {
      try {
        console.log('🔍 convertDataHora - Input:', dataHoraStr, typeof dataHoraStr);
        
        // Verificar se o input é válido
        if (!dataHoraStr || typeof dataHoraStr !== 'string') {
          console.warn('⚠️ convertDataHora - Input inválido, usando data atual');
          return new Date().toISOString();
        }
        
        // Se já está no formato ISO, retorna como está
        if (dataHoraStr.includes('T') && dataHoraStr.includes('Z')) {
          console.log('✅ convertDataHora - Já está em formato ISO:', dataHoraStr);
          return dataHoraStr;
        }
        
        // Converter formato brasileiro para ISO
        // Formato esperado: "29/01/2025 10:00:00" ou "29/01/2025, 10:00:00"
        const normalizedStr = dataHoraStr.replace(',', ''); // Remove vírgula se existir
        const [datePart, timePart] = normalizedStr.split(' ');
        console.log('🔍 convertDataHora - Partes:', { datePart, timePart });
        
        if (datePart && timePart) {
          const [day, month, year] = datePart.split('/');
          console.log('🔍 convertDataHora - Data partes:', { day, month, year });
          
          // Validar se todas as partes existem e são números
          if (!day || !month || !year || isNaN(Number(day)) || isNaN(Number(month)) || isNaN(Number(year))) {
            console.warn('⚠️ convertDataHora - Partes da data inválidas, usando data atual');
            return new Date().toISOString();
          }
          
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          const result = `${isoDate}T${timePart}.000Z`;
          console.log('✅ convertDataHora - Resultado:', result);
          return result;
        }
        
        // Fallback: usar data/hora atual
        console.warn('⚠️ convertDataHora - Formato não reconhecido, usando data atual');
        return new Date().toISOString();
      } catch (error) {
        console.error('❌ convertDataHora - Erro:', error);
        console.warn('⚠️ convertDataHora - Usando data atual devido ao erro');
        return new Date().toISOString();
      }
    };
    
    return {
      // Dados do Técnico
      nome_tecnico: dadosTecnico.nomeTecnico && dadosTecnico.nomeTecnico.trim() !== '' ? dadosTecnico.nomeTecnico : 'Técnico não informado',
      data_atendimento: new Date().toISOString().split('T')[0],
      data_hora: convertDataHora(dadosTecnico.dataHora),
      
      // Dados do Equipamento
      tipo_equipamento: 'ONU', // Valor padrão baseado no contexto
      marca: dadosEquipamento.modelo && dadosEquipamento.modelo.split(' ')[0] ? dadosEquipamento.modelo.split(' ')[0] : 'Marca não informada',
      modelo: dadosEquipamento.modelo && dadosEquipamento.modelo.trim() !== '' ? dadosEquipamento.modelo : 'Modelo não informado',
      endereco_ip: testeLogin.enderecoIP && testeLogin.enderecoIP.trim() !== '' ? testeLogin.enderecoIP : null,
      mac_address: dadosEquipamento.mac && dadosEquipamento.mac.trim() !== '' ? dadosEquipamento.mac : null,
      sn_gpon: dadosEquipamento.snGpon && dadosEquipamento.snGpon.trim() !== '' ? dadosEquipamento.snGpon : null,
      
      // Testes Wi-Fi
      wifi_teste_realizado: testeWiFi.statusConexao !== null,
      wifi_resultado: testeWiFi.statusConexao ? 'aprovado' : 'reprovado',
      wifi_observacoes: testeWiFi.estabilidade || testeWiFi.obstaculosIdentificados ? 
        `Estabilidade: ${testeWiFi.estabilidade || 'N/A'}. Obstáculos: ${testeWiFi.obstaculosIdentificados || 'N/A'}` : null,
      
      // Teste de Portas LAN
      lan_teste_realizado: testePortasLAN.portasTestadas !== '',
      lan_resultado: testePortasLAN.linkAtivo ? 'aprovado' : 'reprovado',
      lan_observacoes: testePortasLAN.portasTestadas || testePortasLAN.velocidadeNegociada || testePortasLAN.testePing ? 
        `Portas testadas: ${testePortasLAN.portasTestadas || 'N/A'}. Velocidade: ${testePortasLAN.velocidadeNegociada || 'N/A'}. Ping: ${testePortasLAN.testePing || 'N/A'}` : null,
      
      // Teste de Login
      login_teste_realizado: testeLogin.enderecoIP !== '',
      login_resultado: testeLogin.resultadoLogin ? 'aprovado' : 'reprovado',
      login_observacoes: testeLogin.usuarioTestado || testeLogin.permissoesVerificadas ? 
        `Usuário testado: ${testeLogin.usuarioTestado || 'N/A'}. Permissões: ${testeLogin.permissoesVerificadas || 'N/A'}` : null,
      
      // Medição de Sinal
      medicao_teste_realizado: medicaoSinal.intensidadeDbm !== '',
      medicao_resultado: medicaoSinal.intensidadeDbm ? 'aprovado' : 'nao_aplicavel',
      medicao_frequencia_testada: medicaoSinal.frequenciaTestada && medicaoSinal.frequenciaTestada.trim() !== '' ? medicaoSinal.frequenciaTestada : null,
      medicao_potencia_recebida: medicaoSinal.intensidadeDbm ? parseFloat(medicaoSinal.intensidadeDbm) : undefined,
      medicao_observacoes: medicaoSinal.perdaMedida || medicaoSinal.coberturaPorArea ? 
        `Perda medida: ${medicaoSinal.perdaMedida || 'N/A'}. Cobertura: ${medicaoSinal.coberturaPorArea || 'N/A'}` : null,
      
      // Teste de Velocidade
      velocidade_teste_realizado: testeVelocidade.download !== '' || testeVelocidade.upload !== '',
      velocidade_resultado: testeVelocidade.resultadoComparado ? 'aprovado' : 'nao_aplicavel',
      velocidade_download: testeVelocidade.download ? parseFloat(testeVelocidade.download) : undefined,
      velocidade_upload: testeVelocidade.upload ? parseFloat(testeVelocidade.upload) : undefined,
      velocidade_observacoes: testeVelocidade.latencia || testeVelocidade.perdaPacotes ? 
        `Latência: ${testeVelocidade.latencia || 'N/A'}. Perda de pacotes: ${testeVelocidade.perdaPacotes || 'N/A'}` : null,
      
      // Dados Técnicos (assumindo que é um teste geral)
      dados_teste_realizado: true,
      dados_resultado: progressoAtual >= 80 ? 'aprovado' : progressoAtual >= 50 ? 'nao_aplicavel' : 'reprovado',
      dados_observacoes: dadosEquipamento.potenciaOptica || dadosEquipamento.distanciaFibra || dadosEquipamento.statusOnu ? 
        `Potência óptica: ${dadosEquipamento.potenciaOptica || 'N/A'}. Distância fibra: ${dadosEquipamento.distanciaFibra || 'N/A'}. Status ONU: ${dadosEquipamento.statusOnu || 'N/A'}` : null,
      
      // Observações Finais
      observacoes_finais: observacaoFinal.observacoes && observacaoFinal.observacoes.trim() !== '' ? observacaoFinal.observacoes : null,
      
      // Status e Progresso
      status_geral: progressoAtual >= 100 ? 'concluido' : progressoAtual > 0 ? 'em_andamento' : 'pendente',
      progresso_percentual: progressoAtual,
      
      // Metadados
      usuario_criacao: dadosTecnico.nomeTecnico && dadosTecnico.nomeTecnico.trim() !== '' ? dadosTecnico.nomeTecnico : 'Técnico não informado',
      usuario_ultima_alteracao: dadosTecnico.nomeTecnico && dadosTecnico.nomeTecnico.trim() !== '' ? dadosTecnico.nomeTecnico : 'Técnico não informado',
      ip_criacao: null,
      user_agent: navigator.userAgent || null,
      versao_app: '1.0.0',
    };
  }, [dadosTecnico, dadosEquipamento, testeWiFi, testePortasLAN, testeLogin, medicaoSinal, testeVelocidade, observacaoFinal]);

  // Função para salvar checklist
  const saveChecklist = useCallback(async (showToast = true) => {
    try {
      console.log('🔄 Iniciando salvamento do checklist...');
      const checklistData = convertToChecklistData();
      console.log('📋 Dados do checklist preparados:', checklistData);
      
      if (checklistId) {
        console.log('✏️ Atualizando checklist existente, ID:', checklistId);
        // Atualizar checklist existente
        const result = await updateChecklist(checklistId, checklistData);
        if (result) {
          console.log('✅ Checklist atualizado com sucesso:', result);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          if (showToast) {
            toast({
              title: "Sucesso",
              description: "Checklist atualizado automaticamente!",
            });
          }
        } else {
          console.error('❌ Falha na atualização - resultado vazio');
        }
      } else {
        console.log('➕ Criando novo checklist...');
        // Criar novo checklist
        const result = await createChecklist(checklistData);
        console.log('📤 Resultado da criação:', result);
        if (result) {
          console.log('✅ Checklist criado com sucesso, ID:', result.id);
          setChecklistId(result.id!);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          if (showToast) {
            toast({
              title: "Sucesso", 
              description: "Checklist salvo com sucesso!",
            });
          }
        } else {
          console.error('❌ Falha na criação - resultado vazio');
        }
      }
    } catch (error) {
      console.error('❌ ERRO DETALHADO ao salvar checklist:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      if (showToast) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        toast({
          title: "Erro",
          description: `Falha ao salvar checklist: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  }, [checklistId, convertToChecklistData, createChecklist, updateChecklist, toast]);



  // Marcar como alterado quando qualquer estado muda
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [dadosTecnico, dadosEquipamento, testeWiFi, testePortasLAN, testeLogin, medicaoSinal, testeVelocidade, observacaoFinal]);

  const generatePDF = async () => {
    try {
      console.log('Salvando checklist antes de gerar PDF...');
      // Salvar checklist automaticamente antes de gerar o PDF
      await saveChecklist(false);
      
      console.log('Iniciando geração do PDF...');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 0;

      // ===== CONFIGURAÇÃO DE CODIFICAÇÃO =====
      // Função para limpar caracteres especiais problemáticos
      const cleanText = (text: string): string => {
        if (!text) return '';
        return text
          .replace(/[ØÜá]/g, '') // Remove caracteres específicos problemáticos (removido M da lista)
          .replace(/[^\x00-\x7F]/g, '') // Remove caracteres não-ASCII
          .replace(/[""'']/g, '"') // Substitui aspas especiais
          .replace(/[–—]/g, '-') // Substitui travessões
          .replace(/…/g, '...') // Substitui reticências especiais
          .trim();
      };

      // ===== CABEÇALHO PROFISSIONAL =====
      // Fundo gradiente azul
      doc.setFillColor(30, 64, 175); // Azul escuro
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Adicionar logo da Allrede
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          logoImg.onload = () => {
            // Adicionar a logo no PDF (posição x: 10, y: 8, largura: 30, altura: 30)
            doc.addImage(logoImg, 'PNG', 10, 8, 30, 30);
            resolve(true);
          };
          logoImg.onerror = () => {
            console.warn('Erro ao carregar logo, usando placeholder');
            // Fallback: Logo placeholder (círculo com ícone)
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 22, 12, 'F');
            doc.setFillColor(30, 64, 175);
            doc.circle(25, 22, 8, 'F');
            resolve(true);
          };
          logoImg.src = '/Allrede_Primaria_RGB (1).png';
        });
      } catch (error) {
        console.warn('Erro ao processar logo, usando placeholder:', error);
        // Fallback: Logo placeholder (círculo com ícone)
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 22, 12, 'F');
        doc.setFillColor(30, 64, 175);
        doc.circle(25, 22, 8, 'F');
      }
      
      // Título principal
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(cleanText('ALLREDE TELECOM'), 45, 18);
      
      // Subtítulo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanText('Sistema de Verificacao e Controle de Qualidade'), 45, 26);
      
      // Título do documento
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(cleanText('RELATORIO TECNICO DE REDE'), 45, 35);
      
      // Data e hora no canto direito
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const horaAtual = new Date().toLocaleTimeString('pt-BR');
      doc.text(`${dataAtual} - ${horaAtual}`, pageWidth - 15, 15, { align: 'right' });
      doc.text('Documento Oficial', pageWidth - 15, 25, { align: 'right' });
      
      yPosition = 55;

      // ===== FUNÇÕES AUXILIARES MELHORADAS =====
      const addSection = (title: string, x: number, y: number, width: number, color: [number, number, number] = [37, 99, 235]) => {
        // Fundo da seção
        doc.setFillColor(...color);
        doc.rect(x, y, width, 12, 'F');
        
        // Borda inferior
        doc.setFillColor(color[0] - 20, color[1] - 20, color[2] - 20);
        doc.rect(x, y + 10, width, 2, 'F');
        
        // Texto do título
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(cleanText(title), x + 3, y + 8);
        
        return y + 18;
      };

      const addField = (label: string, value: string, x: number, y: number, isStatus: boolean = false) => {
        // Linha zebrada para melhor legibilidade
        if (Math.floor((y - 55) / 8) % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(x, y - 2, 85, 8, 'F');
        }
        
        // Label
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        doc.text(cleanText(`${label}:`), x + 2, y + 3);
        
        // Valor
        doc.setFont('helvetica', 'bold');
        const cleanValue = cleanText(value || 'N/A');
        if (isStatus) {
          if (cleanValue === 'OK' || cleanValue === 'Funcionando') {
            doc.setTextColor(34, 197, 94); // Verde
          } else if (cleanValue === 'FALHA' || cleanValue === 'Nao Funcionando') {
            doc.setTextColor(239, 68, 68); // Vermelho
          } else {
            doc.setTextColor(245, 158, 11); // Amarelo
          }
        } else {
          doc.setTextColor(17, 24, 39);
        }
        doc.text(cleanValue, x + 45, y + 3);
        
        return y + 8;
      };

      // ===== LAYOUT EM DUAS COLUNAS =====
      const leftColumn = 15;
      const rightColumn = 110;
      const columnWidth = 85;
      
      let leftY = yPosition;
      let rightY = yPosition;

      // COLUNA ESQUERDA
      // Dados do Técnico
      leftY = addSection('DADOS DO TECNICO', leftColumn, leftY, columnWidth, [34, 197, 94]);
      leftY = addField('Nome do Tecnico', dadosTecnico.nomeTecnico, leftColumn, leftY);
      leftY = addField('Data/Hora', dadosTecnico.dataHora, leftColumn, leftY);
      leftY += 8;

      // Testes Wi-Fi
      leftY = addSection('WI-FI', leftColumn, leftY, columnWidth, [168, 85, 247]);
      leftY = addField('Status Conexao', testeWiFi.statusConexao ? 'OK' : 'FALHA', leftColumn, leftY, true);
      leftY = addField('Estabilidade', testeWiFi.estabilidade, leftColumn, leftY);
      leftY = addField('Obstaculos', testeWiFi.obstaculosIdentificados, leftColumn, leftY);
      leftY += 8;

      // Medição de Sinal
      leftY = addSection('MEDICAO DE SINAL', leftColumn, leftY, columnWidth, [245, 158, 11]);
      leftY = addField('Intensidade (dBm)', medicaoSinal.intensidadeDbm, leftColumn, leftY);
      leftY = addField('Frequencia', medicaoSinal.frequenciaTestada, leftColumn, leftY);
      leftY = addField('Perda Medida', medicaoSinal.perdaMedida, leftColumn, leftY);
      leftY = addField('Cobertura/Area', medicaoSinal.coberturaPorArea, leftColumn, leftY);
      leftY += 8;

      // COLUNA DIREITA
      // Dados do Equipamento
      rightY = addSection('DADOS DO EQUIPAMENTO', rightColumn, rightY, columnWidth, [239, 68, 68]);
      rightY = addField('Modelo', dadosEquipamento.modelo, rightColumn, rightY);
      rightY = addField('MAC Address', dadosEquipamento.mac, rightColumn, rightY);
      rightY = addField('SN GPON', dadosEquipamento.snGpon, rightColumn, rightY);
      rightY += 8;

      // Dados GPON
      rightY = addSection('DADOS GPON', rightColumn, rightY, columnWidth, [14, 165, 233]);
      rightY = addField('Potencia Optica', dadosEquipamento.potenciaOptica + ' dBm', rightColumn, rightY);
      rightY = addField('Distancia Fibra', dadosEquipamento.distanciaFibra + ' km', rightColumn, rightY);
      rightY = addField('Status ONU', dadosEquipamento.statusOnu, rightColumn, rightY, true);
      rightY += 8;

      // Testes Portas LAN
      rightY = addSection('TESTES PORTAS LAN', rightColumn, rightY, columnWidth, [16, 185, 129]);
      rightY = addField('Portas Testadas', testePortasLAN.portasTestadas, rightColumn, rightY);
      rightY = addField('Link Ativo', testePortasLAN.linkAtivo ? 'SIM' : 'NAO', rightColumn, rightY, true);
      rightY = addField('Velocidade', testePortasLAN.velocidadeNegociada, rightColumn, rightY);
      rightY = addField('Teste Ping', testePortasLAN.testePing, rightColumn, rightY);
      rightY += 8;

      // ===== SECOES FULL-WIDTH =====
      const fullWidthY = Math.max(leftY, rightY) + 5;
      
      // Teste de Login
      let currentY = addSection('LOGIN', leftColumn, fullWidthY, pageWidth - 30, [99, 102, 241]);
      const loginY = currentY;
      currentY = addField('Endereco IP', testeLogin.enderecoIP, leftColumn, currentY);
      addField('Usuario', testeLogin.usuarioTestado, rightColumn, loginY);
      currentY = addField('Resultado', testeLogin.resultadoLogin ? 'LOGIN OK' : 'FALHA NO LOGIN', leftColumn, currentY, true);
      addField('Senha', testeLogin.permissoesVerificadas, rightColumn, loginY + 8);
      currentY += 8;

      // Teste de Velocidade
      currentY = addSection('VELOCIDADE', leftColumn, currentY, pageWidth - 30, [236, 72, 153]);
      const velocidadeY = currentY;
      currentY = addField('Download', testeVelocidade.download + ' Mbps', leftColumn, currentY);
      addField('Upload', testeVelocidade.upload + ' Mbps', rightColumn, velocidadeY);
      currentY = addField('Latencia', testeVelocidade.latencia + ' ms', leftColumn, currentY);
      addField('Perda Pacotes', testeVelocidade.perdaPacotes + '%', rightColumn, velocidadeY + 8);
      currentY = addField('Resultado', testeVelocidade.resultadoComparado, leftColumn, currentY);
      currentY += 12;

      // ===== STATUS GERAL DESTACADO =====
      const statusGeral = calcularStatusGeralDetalhado();
      let statusColor: [number, number, number] = [34, 197, 94]; // Verde
      let statusText = 'EXCELENTE';
      
      if (statusGeral < 50) {
        statusColor = [239, 68, 68]; // Vermelho
        statusText = 'CRÍTICO';
      } else if (statusGeral < 70) {
        statusColor = [245, 158, 11]; // Amarelo
        statusText = 'ATENÇÃO';
      } else if (statusGeral < 90) {
        statusColor = [59, 130, 246]; // Azul
        statusText = 'BOM';
      }

      // Caixa de status com sombra
      doc.setFillColor(0, 0, 0, 0.1);
      doc.rect(16, currentY + 1, pageWidth - 30, 20, 'F');
      doc.setFillColor(...statusColor);
      doc.rect(15, currentY, pageWidth - 30, 20, 'F');
      
      // Borda superior destacada
      doc.setFillColor(statusColor[0] + 30, statusColor[1] + 30, statusColor[2] + 30);
      doc.rect(15, currentY, pageWidth - 30, 3, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(cleanText(`STATUS GERAL: ${statusGeral.toFixed(0)}% - ${statusText}`), pageWidth / 2, currentY + 13, { align: 'center' });
      
      currentY += 30;

      // ===== OBSERVAÇÕES =====
      if (observacaoFinal.observacoes && currentY < pageHeight - 50) {
        currentY = addSection('OBSERVACOES TECNICAS', leftColumn, currentY, pageWidth - 30, [75, 85, 99]);
        
        // Caixa de observações
        doc.setFillColor(249, 250, 251);
        doc.rect(15, currentY, pageWidth - 30, 25, 'F');
        doc.setDrawColor(209, 213, 219);
        doc.rect(15, currentY, pageWidth - 30, 25);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        // Quebra de linha para observações longas
        const cleanedObs = cleanText(observacaoFinal.observacoes);
        const obsLines = doc.splitTextToSize(cleanedObs, pageWidth - 40);
        doc.text(obsLines.slice(0, 3), 18, currentY + 8); // Máximo 3 linhas
        
        currentY += 35;
      }

      // ===== RODAPÉ REMOVIDO =====
      // Rodapé removido conforme solicitado

      console.log('Salvando PDF...');
      doc.save(`relatorio-tecnico-${dataAtual.replace(/\//g, '-')}.pdf`);
      console.log('PDF gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório PDF. Verifique o console para mais detalhes.');
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="bg-card shadow-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">RELATÓRIO TÉCNICO DE REDE</h1>
                <p className="text-sm text-muted-foreground">Allrede Telecom - Sistema de Checklist</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dados do Técnico */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>DADOS DO TÉCNICO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeTecnico" className="text-sm font-medium text-foreground">Nome do Técnico</Label>
                    <Input
                      id="nomeTecnico"
                      placeholder="Nome completo do técnico"
                      value={dadosTecnico.nomeTecnico}
                      onChange={(e) => setDadosTecnico({...dadosTecnico, nomeTecnico: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataHora" className="text-sm font-medium text-foreground">Data / Hora</Label>
                    <Input
                      id="dataHora"
                      value={dadosTecnico.dataHora}
                      onChange={(e) => setDadosTecnico({...dadosTecnico, dataHora: e.target.value})}
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Dados do Equipamento */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>DADOS DO EQUIPAMENTO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modelo" className="text-sm font-medium text-foreground">Modelo</Label>
                    <Input
                      id="modelo"
                      placeholder="Ex: ONU GPON"
                      value={dadosEquipamento.modelo}
                      onChange={(e) => setDadosEquipamento({...dadosEquipamento, modelo: e.target.value})}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mac" className="text-sm font-medium text-foreground">MAC</Label>
                    <Input
                      id="mac"
                      placeholder="Ex: AA:BB:CC:DD:EE:FF"
                      value={dadosEquipamento.mac}
                      onChange={(e) => setDadosEquipamento({...dadosEquipamento, mac: e.target.value})}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="snGpon" className="text-sm font-medium text-foreground">SN GPON</Label>
                    <Input
                      id="snGpon"
                      placeholder="Ex: ALCL12345678"
                      value={dadosEquipamento.snGpon}
                      onChange={(e) => setDadosEquipamento({...dadosEquipamento, snGpon: e.target.value})}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Checklist de Testes de Rede */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>CHECKLIST DE TESTES DE REDE</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  
                  {/* 1. Teste de Wi-Fi */}
                   <div className="border border-border rounded-lg p-4 bg-muted/50">
                     <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
                       <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                       <span>Teste de Wi-Fi</span>
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                       <div className="space-y-2">
                         <Label className="text-sm text-muted-foreground">Status da conexão</Label>
                         <div className="flex items-center space-x-4">
                           <label className="flex items-center space-x-2">
                             <input
                               type="radio"
                               name="statusConexao"
                               checked={testeWiFi.statusConexao === true}
                               onChange={() => setTesteWiFi({...testeWiFi, statusConexao: true})}
                             />
                             <span className="text-sm text-foreground">OK</span>
                           </label>
                           <label className="flex items-center space-x-2">
                             <input
                               type="radio"
                               name="statusConexao"
                               checked={testeWiFi.statusConexao === false}
                               onChange={() => setTesteWiFi({...testeWiFi, statusConexao: false})}
                             />
                             <span className="text-sm text-foreground">FALHA</span>
                           </label>
                         </div>
                       </div>

                       <div className="space-y-2">
                         <Label className="text-sm text-muted-foreground">Estabilidade</Label>
                         <Input
                           placeholder="Ex: Estável, Instável"
                           value={testeWiFi.estabilidade}
                           onChange={(e) => setTesteWiFi({...testeWiFi, estabilidade: e.target.value})}
                         />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                         <Label className="text-sm text-muted-foreground">Obstáculos identificados</Label>
                         <Input
                           placeholder="Ex: Paredes, interferências, etc."
                           value={testeWiFi.obstaculosIdentificados}
                           onChange={(e) => setTesteWiFi({...testeWiFi, obstaculosIdentificados: e.target.value})}
                         />
                       </div>
                     </div>
                   </div>

                  {/* 2. Teste de Portas LAN */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                      <span>Teste de Portas LAN</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Porta(s) testada(s)</Label>
                        <Input
                          placeholder="Ex: Porta 1, 2, 3"
                          value={testePortasLAN.portasTestadas}
                          onChange={(e) => setTestePortasLAN({...testePortasLAN, portasTestadas: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Link ativo (LED)</Label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="linkAtivo"
                              checked={testePortasLAN.linkAtivo === true}
                              onChange={() => setTestePortasLAN({...testePortasLAN, linkAtivo: true})}
                            />
                            <span className="text-sm text-foreground">OK</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="linkAtivo"
                              checked={testePortasLAN.linkAtivo === false}
                              onChange={() => setTestePortasLAN({...testePortasLAN, linkAtivo: false})}
                            />
                            <span className="text-sm text-foreground">FALHA</span>
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Velocidade negociada</Label>
                        <Input
                          placeholder="Ex: 100 Mbps, 1000 Mbps"
                          value={testePortasLAN.velocidadeNegociada}
                          onChange={(e) => setTestePortasLAN({...testePortasLAN, velocidadeNegociada: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Teste de ping</Label>
                        <Input
                          placeholder="Ex: 5ms, timeout"
                          value={testePortasLAN.testePing}
                          onChange={(e) => setTestePortasLAN({...testePortasLAN, testePing: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Teste de Login */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                      <span>Teste de Login</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Endereço IP de acesso</Label>
                        <Input
                          placeholder="Ex: 192.168.1.1"
                          value={testeLogin.enderecoIP}
                          onChange={(e) => setTesteLogin({...testeLogin, enderecoIP: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Usuário testado</Label>
                        <Input
                          placeholder="Ex: admin, user"
                          value={testeLogin.usuarioTestado}
                          onChange={(e) => setTesteLogin({...testeLogin, usuarioTestado: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Resultado do login</Label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="resultadoLogin"
                              checked={testeLogin.resultadoLogin === true}
                              onChange={() => setTesteLogin({...testeLogin, resultadoLogin: true})}
                            />
                            <span className="text-sm text-foreground">OK</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="resultadoLogin"
                              checked={testeLogin.resultadoLogin === false}
                              onChange={() => setTesteLogin({...testeLogin, resultadoLogin: false})}
                            />
                            <span className="text-sm text-foreground">FALHA</span>
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Senha utilizada</Label>
                        <Input
                          placeholder="Ex: admin123, senha padrão"
                          value={testeLogin.permissoesVerificadas}
                          onChange={(e) => setTesteLogin({...testeLogin, permissoesVerificadas: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Medição de Sinal */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                      <span>Medição de Sinal</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Intensidade (dBm)</Label>
                        <Input
                          placeholder="Ex: -45 dBm"
                          value={medicaoSinal.intensidadeDbm}
                          onChange={(e) => setMedicaoSinal({...medicaoSinal, intensidadeDbm: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Frequência testada</Label>
                        <select
                          value={medicaoSinal.frequenciaTestada}
                          onChange={(e) => setMedicaoSinal({...medicaoSinal, frequenciaTestada: e.target.value})}
                          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        >
                          <option value="">Selecione</option>
                          <option value="2.4GHz">2.4GHz</option>
                          <option value="5GHz">5GHz</option>
                          <option value="2.4GHz / 5GHz">2.4GHz / 5GHz</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Perda medida</Label>
                        <Input
                          placeholder="Ex: -10 dBm"
                          value={medicaoSinal.perdaMedida}
                          onChange={(e) => setMedicaoSinal({...medicaoSinal, perdaMedida: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm text-muted-foreground">Cobertura por área</Label>
                        <Input
                          placeholder="Ex: Boa cobertura em toda casa"
                          value={medicaoSinal.coberturaPorArea}
                          onChange={(e) => setMedicaoSinal({...medicaoSinal, coberturaPorArea: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Teste de Velocidade */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
                      <span>Teste de Velocidade</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Download (Mbps)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 100"
                          value={testeVelocidade.download}
                          onChange={(e) => setTesteVelocidade({...testeVelocidade, download: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Upload (Mbps)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 50"
                          value={testeVelocidade.upload}
                          onChange={(e) => setTesteVelocidade({...testeVelocidade, upload: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Latência (Ping) ms</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 15"
                          value={testeVelocidade.latencia}
                          onChange={(e) => setTesteVelocidade({...testeVelocidade, latencia: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Perda de pacotes (%)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 0"
                          value={testeVelocidade.perdaPacotes}
                          onChange={(e) => setTesteVelocidade({...testeVelocidade, perdaPacotes: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm text-muted-foreground">Resultado comparado ao contratado</Label>
                        <Input
                          placeholder="Ex: Dentro do esperado, Abaixo do contratado"
                          value={testeVelocidade.resultadoComparado}
                          onChange={(e) => setTesteVelocidade({...testeVelocidade, resultadoComparado: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 6. Dados GPON */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">6</span>
                      <span>Dados GPON</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Potência Óptica (dBm)</Label>
                        <Input
                          placeholder="Ex: -15 dBm"
                          value={dadosEquipamento.potenciaOptica}
                          onChange={(e) => setDadosEquipamento({...dadosEquipamento, potenciaOptica: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Distância da Fibra (km)</Label>
                        <Input
                          placeholder="Ex: 2.5 km"
                          value={dadosEquipamento.distanciaFibra}
                          onChange={(e) => setDadosEquipamento({...dadosEquipamento, distanciaFibra: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm text-muted-foreground">Status ONU</Label>
                        <select
                          value={dadosEquipamento.statusOnu}
                          onChange={(e) => setDadosEquipamento({...dadosEquipamento, statusOnu: e.target.value})}
                          className="w-full p-2 border border-input rounded-md bg-background text-foreground focus:border-ring focus:ring-ring"
                        >
                          <option value="">Selecione o status</option>
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                          <option value="Registrando">Registrando</option>
                          <option value="Erro">Erro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observações Finais */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>OBSERVAÇÕES FINAIS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-sm font-medium text-muted-foreground">Observações e comentários adicionais</Label>
                  <textarea
                    id="observacoes"
                    placeholder="Descreva observações importantes, recomendações ou comentários sobre o atendimento..."
                    value={observacaoFinal.observacoes}
                    onChange={(e) => setObservacaoFinal({...observacaoFinal, observacoes: e.target.value})}
                    className="w-full p-3 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Geral */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>STATUS GERAL</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{calcularStatusGeralDetalhado()}%</div>
                    <div className="text-sm text-muted-foreground">Progresso do Checklist</div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${calcularStatusGeralDetalhado()}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>AÇÕES</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">


                  <Button 
                    onClick={generatePDF}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Relatório PDF
                  </Button>

                  <Button 
                    onClick={() => navigate('/checklist-history')}
                    variant="outline"
                    className="w-full"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Ver Histórico
                  </Button>

                  {lastSaved && (
                    <div className="text-xs text-muted-foreground mt-2 text-right">
                      <span>Salvo: {lastSaved.toLocaleTimeString('pt-BR')}</span>
                    </div>
                  )}

                  {hasUnsavedChanges && (
                    <div className="flex items-center text-xs text-orange-500">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Alterações não salvas
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Allrede Telecom</h3>
                  <p className="text-xs text-muted-foreground">Sistema de Checklist Técnico</p>
                  <p className="text-xs text-muted-foreground">v2.1.0</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default Checklist;