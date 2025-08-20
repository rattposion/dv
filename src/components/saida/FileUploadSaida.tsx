import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, FileText, Image, File, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadSaidaProps {
  onFilesChange: (fileIds: string[]) => void;
  existingFiles?: string[];
  maxFiles?: number;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export function FileUploadSaida({ onFilesChange, existingFiles = [], maxFiles = 3 }: FileUploadSaidaProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Verificar limite de arquivos
    const totalFiles = files.length + existingFiles.length + selectedFiles.length;
    if (totalFiles > maxFiles) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxFiles} arquivos permitidos`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        // Verificar tamanho do arquivo (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o limite de 10MB`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `saida/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('rma-anexos') // Usando o mesmo bucket já criado
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('rma-anexos')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          id: data.path,
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.publicUrl
        });
      }

      const newFiles = [...files, ...uploadedFiles];
      setFiles(newFiles);
      onFilesChange([...existingFiles, ...newFiles.map(f => f.id)]);

      toast({
        title: "Sucesso",
        description: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar arquivo(s)",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      const { error } = await supabase.storage
        .from('rma-anexos')
        .remove([fileId]);

      if (error) throw error;

      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      const updatedFileIds = [...existingFiles.filter(id => id !== fileId), ...updatedFiles.map(f => f.id)];
      onFilesChange(updatedFileIds);

      toast({
        title: "Sucesso",
        description: "Arquivo removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover arquivo",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const totalFiles = files.length + existingFiles.length;
  const canUploadMore = totalFiles < maxFiles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Anexos da Saída</Label>
        <span className="text-sm text-muted-foreground">
          {totalFiles}/{maxFiles} arquivos
        </span>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Anexe até {maxFiles} arquivos relacionados à saída (máximo 10MB cada). Formatos aceitos: PDF, imagens, documentos.
        </AlertDescription>
      </Alert>
      
      {canUploadMore && (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.xlsx,.xls"
            className="hidden"
            id="file-upload-saida"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('file-upload-saida')?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Enviando..." : `Adicionar Arquivo${totalFiles > 0 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Arquivos Anexados:</Label>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalFiles >= maxFiles && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Limite máximo de {maxFiles} arquivos atingido.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}