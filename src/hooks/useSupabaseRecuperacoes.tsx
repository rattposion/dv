import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Recuperacao {
  id: string;
  equipamento: string;
  problema: string;
  solucao: string;
  macs: string[];
  data_recuperacao: string;
  responsavel: string;
  created_at: string;
  updated_at: string;
}

export function useSupabaseRecuperacoes() {
  const [recuperacoes, setRecuperacoes] = useState<Recuperacao[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRecuperacoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recuperacoes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecuperacoes((data || []) as Recuperacao[]);
    } catch (error) {
      console.error("Erro ao buscar recuperações:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar recuperações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRecuperacao = async (recuperacaoData: Omit<Recuperacao, "id" | "created_at" | "updated_at">) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recuperacoes")
        .insert([recuperacaoData])
        .select()
        .single();

      if (error) throw error;

      await fetchRecuperacoes();
      toast({
        title: "Sucesso",
        description: `Recuperação registrada com sucesso`,
      });

      return data;
    } catch (error) {
      console.error("Erro ao criar recuperação:", error);
      toast({
        title: "Erro",
        description: "Falha ao registrar recuperação",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateRecuperacao = async (id: string, updates: Partial<Recuperacao>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("recuperacoes")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      await fetchRecuperacoes();
      toast({
        title: "Sucesso",
        description: "Recuperação atualizada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar recuperação:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar recuperação",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecuperacoes();
  }, []);

  return {
    recuperacoes,
    loading,
    fetchRecuperacoes,
    createRecuperacao,
    updateRecuperacao,
  };
}