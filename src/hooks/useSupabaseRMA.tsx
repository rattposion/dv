import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RMA {
  id: string;
  numero_rma: string;
  equipamento: string;
  modelo?: string;
  mac_address?: string;
  origem_equipamento: string;
  destino_envio: string;
  defeito_relatado: string;
  status: "Aberto" | "Em Análise" | "Aprovado" | "Rejeitado" | "Concluído" | "Retornou para origem" | "Transformado em saldo" | "Reparado" | "Substituído";
  data_abertura: string;
  data_conclusao?: string;
  tecnico_responsavel?: string;
  diagnostico?: string;
  solucao?: string;
  observacoes?: string;
  nota_fiscal?: string;
  anexos_ids?: string[];
  created_at: string;
  updated_at: string;
}

export function useSupabaseRMA() {
  const [rmas, setRmas] = useState<RMA[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRMAs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rmas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRmas((data || []) as RMA[]);
    } catch (error) {
      console.error("Erro ao buscar RMAs:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar RMAs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRMA = async (rmaData: Omit<RMA, "id" | "numero_rma" | "created_at" | "updated_at">) => {
    setLoading(true);
    try {
      // Gerar número RMA
      const currentYear = new Date().getFullYear();
      const { count } = await supabase
        .from("rmas")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${currentYear}-01-01`);

      const numeroRMA = `RMA-${currentYear}-${String((count || 0) + 1).padStart(3, "0")}`;

      const { data, error } = await supabase
        .from("rmas")
        .insert([
          {
            ...rmaData,
            numero_rma: numeroRMA,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchRMAs();
      toast({
        title: "Sucesso",
        description: `RMA ${numeroRMA} criado com sucesso`,
      });

      return data;
    } catch (error) {
      console.error("Erro ao criar RMA:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar RMA",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateRMA = async (id: string, updates: Partial<RMA>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("rmas")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      await fetchRMAs();
      toast({
        title: "Sucesso",
        description: "RMA atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar RMA:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar RMA",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRMAs();
  }, []);

  return {
    rmas,
    loading,
    fetchRMAs,
    createRMA,
    updateRMA,
  };
}