import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploadDefeitosProps {
  onFileUploaded: (url: string) => void;
  currentFile?: string;
  onRemove?: () => void;
}

export function FileUploadDefeitos({ onFileUploaded, currentFile, onRemove }: FileUploadDefeitosProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas imagens são permitidas');
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB');
      }

      // Gerar nome único do arquivo
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `defeito_${timestamp}.${fileExt}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('manutencao-anexos')
        .upload(fileName, file);

      if (error) throw error;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('manutencao-anexos')
        .getPublicUrl(fileName);

      onFileUploaded(urlData.publicUrl);
      
      toast({
        title: "Sucesso",
        description: "Foto do defeito enviada com sucesso",
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar arquivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  if (currentFile) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Foto do defeito</p>
                <p className="text-xs text-muted-foreground">Imagem anexada</p>
                <a 
                  href={currentFile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Visualizar imagem
                </a>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Foto do Defeito (Opcional)</Label>
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
      >
        <CardContent 
          className="p-6 text-center cursor-pointer"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-defeitos')?.click()}
        >
          <input
            id="file-upload-defeitos"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <div>
              <p className="text-sm font-medium">
                {uploading ? "Enviando..." : "Clique ou arraste uma imagem"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG até 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}