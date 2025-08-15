import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileImage, File, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  manutencaoId: string;
  anexosIds: string[];
  onAnexosChange: (anexosIds: string[]) => void;
  maxFiles?: number;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

export function FileUpload({ 
  manutencaoId, 
  anexosIds, 
  onAnexosChange, 
  maxFiles = 5 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentCount = anexosIds.length;
    const remainingSlots = maxFiles - currentCount;
    
    if (files.length > remainingSlots) {
      toast({
        title: "Limite de arquivos",
        description: `Máximo de ${maxFiles} arquivos. Espaço disponível: ${remainingSlots}`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newAnexosIds = [...anexosIds];
    const newUploadedFiles = [...uploadedFiles];

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede 10MB`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${manutencaoId}/${Date.now()}-${Math.random().toString(36).substr(2)}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('manutencao-anexos')
          .upload(fileName, file);

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('manutencao-anexos')
          .getPublicUrl(fileName);

        newAnexosIds.push(fileName);
        newUploadedFiles.push({
          id: fileName,
          name: file.name,
          type: file.type,
          url: publicUrl
        });
      }

      setUploadedFiles(newUploadedFiles);
      onAnexosChange(newAnexosIds);
      
      toast({
        title: "Upload concluído",
        description: `${files.length} arquivo(s) enviado(s) com sucesso`,
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar os arquivos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    try {
      // Remove from storage
      const { error } = await supabase.storage
        .from('manutencao-anexos')
        .remove([fileId]);

      if (error) {
        throw error;
      }

      // Update state
      const newAnexosIds = anexosIds.filter(id => id !== fileId);
      const newUploadedFiles = uploadedFiles.filter(file => file.id !== fileId);
      
      setUploadedFiles(newUploadedFiles);
      onAnexosChange(newAnexosIds);

      toast({
        title: "Arquivo removido",
        description: "Arquivo removido com sucesso",
      });

    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o arquivo",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <FileImage className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const viewFile = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-upload">
          Anexar Arquivos ({anexosIds.length}/{maxFiles})
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Imagens "antes e depois", documentos, etc. (máx 10MB por arquivo)
        </p>
        
        <div className="flex items-center gap-2">
          <Input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            disabled={uploading || anexosIds.length >= maxFiles}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || anexosIds.length >= maxFiles}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Enviando..." : "Selecionar Arquivos"}
          </Button>
        </div>
      </div>

      {/* Lista de arquivos anexados */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Arquivos Anexados:</Label>
          <div className="grid gap-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 border rounded-lg bg-muted/20"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <span className="text-sm truncate">{file.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {file.type.startsWith('image/') ? 'Imagem' : 'Documento'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => viewFile(file.url)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}