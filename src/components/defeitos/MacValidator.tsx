import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useMacValidation } from "@/hooks/useMacValidation";

interface MacValidatorProps {
  macs: string[];
  onValidationComplete?: (isValid: boolean, conflicts: string[]) => void;
  className?: string;
}

export function MacValidator({ macs, onValidationComplete, className }: MacValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    conflicts: string[];
    validated: boolean;
  }>({ isValid: false, conflicts: [], validated: false });
  
  const { findMacConflicts } = useMacValidation();

  const validateMacs = async () => {
    if (macs.length === 0) {
      setValidationResult({ isValid: true, conflicts: [], validated: true });
      onValidationComplete?.(true, []);
      return;
    }

    setIsValidating(true);
    const conflicts: string[] = [];

    try {
      for (const mac of macs) {
        const macConflicts = await findMacConflicts(mac);
        const hasConflicts = 
          macConflicts.equipamentos.length > 0 ||
          macConflicts.caixas.length > 0 ||
          macConflicts.defeitos.length > 0;
        
        if (hasConflicts) {
          conflicts.push(mac);
        }
      }

      const isValid = conflicts.length === 0;
      setValidationResult({ isValid, conflicts, validated: true });
      onValidationComplete?.(isValid, conflicts);
    } catch (error) {
      console.error('Erro na validação de MACs:', error);
      setValidationResult({ isValid: false, conflicts: [], validated: true });
      onValidationComplete?.(false, []);
    } finally {
      setIsValidating(false);
    }
  };

  const resetValidation = () => {
    setValidationResult({ isValid: false, conflicts: [], validated: false });
  };

  // Reset validation when MACs change
  useEffect(() => {
    if (validationResult.validated) {
      resetValidation();
    }
  }, [macs]);

  if (macs.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={validateMacs}
          disabled={isValidating}
          className="h-8"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Validar MACs
            </>
          )}
        </Button>
        
        {validationResult.validated && (
          <Badge 
            variant={validationResult.isValid ? "default" : "destructive"}
            className="text-xs"
          >
            {validationResult.isValid ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Todos válidos
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {validationResult.conflicts.length} conflito(s)
              </>
            )}
          </Badge>
        )}
      </div>

      {validationResult.validated && !validationResult.isValid && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">MACs com conflitos encontrados:</p>
              <div className="flex flex-wrap gap-1">
                {validationResult.conflicts.map((mac, index) => (
                  <Badge key={index} variant="destructive" className="font-mono text-xs">
                    {mac}
                  </Badge>
                ))}
              </div>
              <p className="text-xs mt-2">
                Estes MACs já estão registrados no sistema. Remova-os ou resolva os conflitos antes de continuar.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validationResult.validated && validationResult.isValid && (
        <Alert className="mt-2 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Todos os MACs foram validados e estão disponíveis para uso.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}