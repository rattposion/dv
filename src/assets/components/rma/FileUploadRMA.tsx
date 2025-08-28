import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, FileText, Image, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadRMAProps {
  onFilesChange: (fileIds: string[]) => void;
  existingFiles?: string[];
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

export function FileUploadRMA({ onFilesChange, existingFiles = [] }: FileUploadRMAProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `rma/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('rma-anexos')
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

  return (
    <div className="space-y-4">
      <Label>Anexos (Nota fiscal, laudos, arquivos de teste, etc.)</Label>
      
      <div className="flex items-center gap-2">
        <Input
          type="file"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
          className="hidden"
          id="file-upload-rma"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('file-upload-rma')?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Enviando..." : "Adicionar Anexos"}
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Arquivos Anexados:</Label>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  {getFileIcon(file.type)}
                  <span className="text-sm truncate">{file.name}</span>
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
    </div>
  );
}