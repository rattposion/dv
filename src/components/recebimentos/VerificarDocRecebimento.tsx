import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Package, User, MapPin, Hash, Wifi, Loader2, AlertCircle, Image as ImageIcon, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { pipeline } from '@huggingface/transformers';

interface EquipamentoExtraido {
  modelo: string;
  quantidade: number;
  macs: string[];
  produto?: string;
  observacoes?: string;
}

interface DadosExtraidos {
  responsavel?: string;
  origem?: string;
  dataMovimentacao?: string;
  equipamentos: EquipamentoExtraido[];
  totalEquipamentos: number;
}

interface ImagemCarregada {
  file: File;
  url: string;
  texto?: string;
  processando?: boolean;
}

export function VerificarDocRecebimento() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [imagens, setImagens] = useState<ImagemCarregada[]>([]);
  const [conteudoTexto, setConteudoTexto] = useState("");
  const [dadosExtraidos, setDadosExtraidos] = useState<DadosExtraidos | null>(null);
  const [processando, setProcessando] = useState(false);
  const [extraindoTexto, setExtraindoTexto] = useState(false);
  const [processandoOCR, setProcessandoOCR] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar tipo de arquivo - aceitar PDF ou texto
    const isValidFile = file.type === 'application/pdf' || 
                       file.type === 'text/plain' || 
                       file.name.endsWith('.txt');
    
    if (!isValidFile) {
      toast({
        title: "Formato não suportado",
        description: "Por favor, selecione um arquivo PDF ou TXT",
        variant: "destructive",
      });
      return;
    }

    setArquivo(file);
    setExtraindoTexto(true);
    
    try {
      let texto = '';
      
      if (file.type === 'application/pdf') {
        // Para PDF, usar uma abordagem simplificada
        texto = await extrairTextoPDFSimplificado(file);
      } else {
        // Para arquivo de texto
        texto = await extrairTextoTXT(file);
      }
      
      setConteudoTexto(texto);
      
      if (texto.trim()) {
        toast({
          title: "Arquivo carregado",
          description: "Texto extraído com sucesso. Clique em 'Analisar Documento' para processar.",
        });
      } else {
        toast({
          title: "Aviso",
          description: "Nenhum texto foi encontrado no arquivo. Verifique se o PDF contém texto selecionável.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao extrair texto:', error);
      toast({
        title: "Erro",
        description: "Falha ao extrair texto do arquivo. Tente converter o PDF para texto ou use um arquivo TXT.",
        variant: "destructive",
      });
    } finally {
      setExtraindoTexto(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const novasImagens: ImagemCarregada[] = [];
    
    for (const file of Array.from(files)) {
      // Verificar se é imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato não suportado",
          description: `${file.name} não é uma imagem válida`,
          variant: "destructive",
        });
        continue;
      }

      const url = URL.createObjectURL(file);
      novasImagens.push({ file, url });
    }

    setImagens(prev => [...prev, ...novasImagens]);
    
    toast({
      title: "Imagens carregadas",
      description: `${novasImagens.length} imagem(ns) adicionada(s). Clique em "Extrair Texto das Imagens" para processar.`,
    });
  };

  const processarImagensOCR = async () => {
    if (imagens.length === 0) {
      toast({
        title: "Nenhuma imagem",
        description: "Adicione pelo menos uma imagem para processar",
        variant: "destructive",
      });
      return;
    }

    setProcessandoOCR(true);
    let textoCompleto = '';

    try {
      toast({
        title: "Iniciando OCR",
        description: "Carregando modelo de reconhecimento de texto...",
      });

      // Carregar modelo OCR - usando um modelo compatível
      const ocrPipeline = await pipeline('image-to-text', 'Xenova/trocr-base-printed', {
        device: 'cpu'
      });

      for (let i = 0; i < imagens.length; i++) {
        const imagem = imagens[i];
        
        // Marcar imagem como processando
        setImagens(prev => prev.map((img, idx) => 
          idx === i ? { ...img, processando: true } : img
        ));

        try {
          // Criar canvas para processar a imagem
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              // Redimensionar se necessário para melhor OCR
              const maxSize = 800;
              let { width, height } = img;
              
              if (width > maxSize || height > maxSize) {
                if (width > height) {
                  height = (height * maxSize) / width;
                  width = maxSize;
                } else {
                  width = (width * maxSize) / height;
                  height = maxSize;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              ctx?.drawImage(img, 0, 0, width, height);
              resolve();
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = imagem.url;
          });

          // Processar com OCR usando o canvas
          const resultado = await ocrPipeline(canvas);
          
          // Extrair texto do resultado de forma mais segura
          let textoExtraido = '';
          try {
            if (Array.isArray(resultado)) {
              textoExtraido = (resultado[0] as any)?.generated_text || '';
            } else if (typeof resultado === 'object' && resultado !== null) {
              textoExtraido = (resultado as any).generated_text || '';
            } else {
              textoExtraido = String(resultado || '');
            }
          } catch (e) {
            console.warn('Erro ao extrair texto do resultado OCR:', e);
            textoExtraido = 'Erro na extração de texto';
          }
          
          // Atualizar imagem com texto extraído
          setImagens(prev => prev.map((img, idx) => 
            idx === i ? { ...img, texto: textoExtraido, processando: false } : img
          ));

          textoCompleto += `\n--- Imagem ${i + 1} ---\n${textoExtraido}\n`;
          
          toast({
            title: `Imagem ${i + 1} processada`,
            description: `Texto extraído: ${textoExtraido.substring(0, 50)}...`,
          });

        } catch (error) {
          console.error(`Erro ao processar imagem ${i + 1}:`, error);
          
          setImagens(prev => prev.map((img, idx) => 
            idx === i ? { ...img, processando: false } : img
          ));
          
          toast({
            title: `Erro na imagem ${i + 1}`,
            description: "Falha ao extrair texto desta imagem",
            variant: "destructive",
          });
        }
      }

      // Combinar com texto existente
      const textoFinal = conteudoTexto + textoCompleto;
      setConteudoTexto(textoFinal);

      toast({
        title: "OCR concluído",
        description: `Texto extraído de ${imagens.length} imagem(ns). Agora você pode analisar o documento.`,
      });

    } catch (error) {
      console.error('Erro no OCR:', error);
      toast({
        title: "Erro no OCR",
        description: "Falha ao processar imagens. Verifique se o WebGPU está disponível no seu navegador.",
        variant: "destructive",
      });
    } finally {
      setProcessandoOCR(false);
    }
  };

  const removerImagem = (index: number) => {
    setImagens(prev => {
      const nova = [...prev];
      URL.revokeObjectURL(nova[index].url);
      nova.splice(index, 1);
      return nova;
    });
  };

  const extrairTextoTXT = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultado = e.target?.result as string;
        resolve(resultado || '');
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo de texto'));
      reader.readAsText(file);
    });
  };

  const extrairTextoPDFSimplificado = async (file: File): Promise<string> => {
    // Para simplificar, vamos instruir o usuário a converter o PDF para texto
    // ou implementar uma solução server-side posteriormente
    throw new Error('Para PDFs, por favor converta para arquivo de texto (.txt) primeiro ou cole o conteúdo no campo de texto abaixo.');
  };

  const processarDocumento = () => {
    if (!conteudoTexto.trim()) {
      toast({
        title: "Erro",
        description: "Nenhum conteúdo encontrado no arquivo. Tente colar o texto manualmente no campo abaixo.",
        variant: "destructive",
      });
      return;
    }

    setProcessando(true);

    try {
      console.log('Iniciando processamento do documento...');
      console.log('Conteúdo do texto:', conteudoTexto.substring(0, 500) + '...');
      
      // Extrair dados do documento
      const dados = extrairDadosDocumento(conteudoTexto);
      setDadosExtraidos(dados);
      
      toast({
        title: "Processamento concluído",
        description: `${dados.equipamentos.length} modelos de equipamentos encontrados, total de ${dados.totalEquipamentos} equipamentos`,
      });
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      toast({
        title: "Erro no processamento",
        description: "Falha ao analisar o documento. Verifique se o formato está correto.",
        variant: "destructive",
      });
    } finally {
      setProcessando(false);
    }
  };

  const extrairDadosDocumento = (texto: string): DadosExtraidos => {
    console.log('Extraindo dados do documento...');
    const linhas = texto.split('\n').map(linha => linha.trim()).filter(linha => linha);
    let responsavel = '';
    let origem = '';
    let dataMovimentacao = '';
    const equipamentosMap = new Map<string, EquipamentoExtraido>();

    console.log(`Total de linhas: ${linhas.length}`);

    // Extrair informações do cabeçalho
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      
      // Buscar responsável (linha que começa com "Eu,")
      if (linha.includes('Eu,') && !responsavel) {
        const match = linha.match(/Eu,\s*([^,]+)/);
        if (match) {
          responsavel = match[1].trim();
          console.log(`Responsável encontrado: ${responsavel}`);
        }
      }

      // Buscar data (padrão dd/mm/yyyy)
      if (!dataMovimentacao) {
        const matchData = linha.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (matchData) {
          dataMovimentacao = matchData[1];
          console.log(`Data encontrada: ${dataMovimentacao}`);
        }
      }

      // Buscar origem (menciona estoque)
      if (linha.toLowerCase().includes('estoque') && !origem) {
        if (linha.toLowerCase().includes('origem')) {
          const matchOrigem = linha.match(/origem\s+([^:]+)/i);
          if (matchOrigem) {
            origem = matchOrigem[1].trim();
            console.log(`Origem encontrada: ${origem}`);
          }
        }
      }
    }

    // Processar tabela de equipamentos - buscar padrões mais flexíveis
    console.log('Processando tabela de equipamentos...');
    let encontrouTabela = false;
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      
      // Detectar início da tabela (várias variações possíveis)
      if ((linha.toLowerCase().includes('produto') && linha.toLowerCase().includes('quantidade')) ||
          (linha.includes('Produto') && linha.includes('Quantidade')) ||
          linha.match(/^\s*\d+\s+\d+\s+/)) {
        encontrouTabela = true;
        console.log(`Tabela detectada na linha ${i}: ${linha}`);
        continue;
      }
      
      if (!encontrouTabela) continue;

      // Parar se chegou no final da tabela
      if (linha.toLowerCase().includes('por meio desta') || 
          linha.toLowerCase().includes('atenciosamente') ||
          linha.toLowerCase().includes('responsável')) {
        console.log(`Fim da tabela detectado na linha ${i}`);
        break;
      }

      // Processar linha da tabela - buscar padrões numéricos e códigos
      // Padrão esperado: [número] [quantidade] [código] [modelo] [outros...]
      const partes = linha.split(/\s+/).filter(parte => parte.trim());
      
      if (partes.length >= 3) {
        // Verificar se os primeiros elementos são números
        const primeiroNum = parseInt(partes[0]);
        const segundoNum = parseInt(partes[1]);
        
        if (!isNaN(primeiroNum) && !isNaN(segundoNum) && segundoNum > 0) {
          const quantidade = segundoNum;
          const codigo = partes[2] || '';
          const modelo = partes[3] || '';
          
          console.log(`Linha processada: quantidade=${quantidade}, código=${codigo}, modelo=${modelo}`);
          
          if (modelo && quantidade > 0) {
            // Extrair MACs da linha completa
            const macs: string[] = [];
            const macRegex = /([0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}|[0-9A-Fa-f]{12})/g;
            let macMatch;
            
            while ((macMatch = macRegex.exec(linha)) !== null) {
              macs.push(macMatch[1]);
              console.log(`MAC encontrado: ${macMatch[1]}`);
            }

            // Agrupar por modelo
            const chaveModelo = modelo.toUpperCase();
            if (equipamentosMap.has(chaveModelo)) {
              const existente = equipamentosMap.get(chaveModelo)!;
              existente.quantidade += quantidade;
              existente.macs.push(...macs);
            } else {
              equipamentosMap.set(chaveModelo, {
                modelo: chaveModelo,
                quantidade,
                macs,
                produto: codigo || undefined
              });
            }
          }
        }
      }
    }

    const equipamentos = Array.from(equipamentosMap.values());
    const totalEquipamentos = equipamentos.reduce((sum, eq) => sum + eq.quantidade, 0);

    console.log(`Processamento concluído: ${equipamentos.length} modelos, ${totalEquipamentos} equipamentos total`);

    return {
      responsavel: responsavel || undefined,
      origem: origem || undefined,
      dataMovimentacao: dataMovimentacao || undefined,
      equipamentos,
      totalEquipamentos
    };
  };

  const limparAnalise = () => {
    setArquivo(null);
    imagens.forEach(img => URL.revokeObjectURL(img.url));
    setImagens([]);
    setConteudoTexto("");
    setDadosExtraidos(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload de Arquivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload do Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Arquivo do Comprovante de Movimento</Label>
            <Input
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={handleFileUpload}
              className="cursor-pointer"
              disabled={extraindoTexto}
            />
            <p className="text-sm text-muted-foreground">
              Aceita arquivos PDF ou TXT contendo o comprovante de movimentação
            </p>
            {arquivo?.type === 'application/pdf' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para PDFs, recomendamos copiar o texto e colar no campo abaixo se houver problemas na extração automática.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Upload de Imagens */}
          <div className="space-y-2">
            <Label>Ou envie imagens do documento</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="cursor-pointer"
              disabled={processandoOCR}
            />
            <p className="text-sm text-muted-foreground">
              Aceita múltiplas imagens (JPG, PNG, etc.) para extração de texto via OCR
            </p>
          </div>

          {/* Imagens Carregadas */}
          {imagens.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Imagens Carregadas ({imagens.length})</Label>
                <Button
                  onClick={processarImagensOCR}
                  disabled={processandoOCR}
                  variant="outline"
                  size="sm"
                >
                  {processandoOCR ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando OCR...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Extrair Texto das Imagens
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagens.map((imagem, index) => (
                  <div key={index} className="relative border rounded-lg overflow-hidden">
                    <img
                      src={imagem.url}
                      alt={`Documento ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(imagem.url, '_blank')}
                        className="h-6 w-6 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerImagem(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {imagem.processando && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    {imagem.texto && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>Texto extraído</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campo manual para texto */}
          <div className="space-y-2">
            <Label htmlFor="texto-manual">Ou cole o texto do documento aqui</Label>
            <Textarea
              id="texto-manual"
              value={conteudoTexto}
              onChange={(e) => setConteudoTexto(e.target.value)}
              placeholder="Cole aqui o conteúdo do documento de movimentação..."
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Você pode copiar e colar o texto diretamente do PDF se houver problemas com o upload
            </p>
          </div>

          {arquivo && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                {extraindoTexto ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Extraindo texto do PDF: <strong>{arquivo.name}</strong></span>
                  </div>
                ) : (
                  <span>PDF carregado: <strong>{arquivo.name}</strong></span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={processarDocumento}
              disabled={!conteudoTexto.trim() || processando || extraindoTexto || processandoOCR}
              className="flex-1"
            >
              {processando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Analisar Documento
                </>
              )}
            </Button>
            
            {(dadosExtraidos || imagens.length > 0 || arquivo) && (
              <Button variant="outline" onClick={limparAnalise}>
                Limpar Tudo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dados Extraídos */}
      {dadosExtraidos && (
        <>
          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações da Movimentação
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Responsável</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{dadosExtraidos.responsavel || "Não identificado"}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Origem</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{dadosExtraidos.origem || "Não identificado"}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Data</Label>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{dadosExtraidos.dataMovimentacao || "Não identificado"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Resumo dos Equipamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {dadosExtraidos.equipamentos.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Modelos Diferentes</div>
                </div>
                
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {dadosExtraidos.totalEquipamentos}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Equipamentos</div>
                </div>
                
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {dadosExtraidos.equipamentos.reduce((sum, eq) => sum + eq.macs.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">MACs Identificados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detalhes dos Equipamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>MACs</TableHead>
                    <TableHead>Produto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosExtraidos.equipamentos.map((equipamento, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {equipamento.modelo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {equipamento.quantidade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {equipamento.macs.length > 0 ? (
                          <div className="space-y-1">
                            {equipamento.macs.map((mac, macIndex) => (
                              <div key={macIndex} className="flex items-center gap-2">
                                <Wifi className="h-3 w-3 text-muted-foreground" />
                                <code className="text-xs bg-muted px-1 rounded">
                                  {mac}
                                </code>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Nenhum MAC identificado
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {equipamento.produto || "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}