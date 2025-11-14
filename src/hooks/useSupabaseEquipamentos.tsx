import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface EquipamentoSupabase {
  id: string;
  nome: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  mac_address?: string;
  ip_address?: any; // Supabase retorna INET como unknown
  localizacao?: string;
  status: string;
  data_aquisicao?: string;
  valor_aquisicao?: number;
  garantia_ate?: string;
  observacoes?: string;
  responsavel_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipamentoLocal {
  id: string;
  nome: string;
  modelo: string;
  numeroSerie: string;
  mac: string;
  responsavel: string;
  status: "Ativo" | "Em Operação" | "Manutenção" | "Inativo";
  dataCadastro: Date;
  localizacao?: string;
  observacoes?: string;
}

export const useSupabaseEquipamentos = () => {
  const [equipamentos, setEquipamentos] = useState<EquipamentoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Verificar conectividade com Supabase
  const checkConnection = async () => {
    try {
      const { data, error, count } = await supabase
        .from('equipamentos')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Erro de conectividade:', error);
        return false;
      }
      
      console.log('Conexão com Supabase OK. Total de equipamentos:', count ?? 0);
      return true;
    } catch (error) {
      console.error('Falha na conectividade:', error);
      return false;
    }
  };

  // Verificar se MAC address já existe
  const checkMacExists = async (macAddress: string): Promise<{ exists: boolean; equipamento?: any }> => {
    try {
      if (!macAddress || macAddress.trim() === '') {
        return { exists: false };
      }

      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, nome, mac_address')
        .eq('mac_address', macAddress.trim())
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar MAC:', error);
        return { exists: false };
      }

      return { 
        exists: !!data, 
        equipamento: data 
      };
    } catch (error) {
      console.error('Erro na verificação de MAC:', error);
      return { exists: false };
    }
  };

  // Converter de Supabase para formato local
  const convertFromSupabase = (equipamento: EquipamentoSupabase): EquipamentoLocal => ({
    id: equipamento.id,
    nome: equipamento.nome,
    modelo: equipamento.modelo || '',
    numeroSerie: equipamento.id, // Usar ID como número de série
    mac: equipamento.mac_address || '',
    responsavel: 'Sistema', // Padrão
    status: equipamento.status === 'ativo' ? 'Ativo' : 
           equipamento.status === 'manutencao' ? 'Manutenção' : 'Inativo',
    dataCadastro: new Date(equipamento.created_at),
    localizacao: equipamento.localizacao,
    observacoes: equipamento.observacoes
  });

  // Converter de formato local para Supabase
  const convertToSupabase = (equipamento: Omit<EquipamentoLocal, 'id' | 'dataCadastro'>): Omit<EquipamentoSupabase, 'id' | 'created_at' | 'updated_at'> => ({
    nome: equipamento.nome,
    tipo: 'equipamento', // Padrão
    modelo: equipamento.modelo,
    // MAC address é opcional - só inclui se fornecido
    mac_address: equipamento.mac && equipamento.mac.trim() !== '' ? equipamento.mac : null,
    status: equipamento.status === 'Ativo' ? 'ativo' : 
           equipamento.status === 'Manutenção' ? 'manutencao' : 'inativo',
    // Localização é opcional - só inclui se fornecida
    localizacao: equipamento.localizacao && equipamento.localizacao.trim() !== '' ? equipamento.localizacao : null,
    observacoes: equipamento.observacoes
  });

  const fetchEquipamentos = async () => {
    try {
      setLoading(true);
      
      // Verificar conectividade primeiro
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('Falha na conectividade com o banco de dados');
      }
      
      // Fazer a requisição com campos específicos para evitar problemas de URL
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          id,
          nome,
          tipo,
          marca,
          modelo,
          mac_address,
          ip_address,
          localizacao,
          status,
          data_aquisicao,
          valor_aquisicao,
          garantia_ate,
          observacoes,
          responsavel_id,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Dados recebidos do Supabase:', data);
      const equipamentosLocais = (data || []).map(convertFromSupabase);
      setEquipamentos(equipamentosLocais);
    } catch (error: any) {
      console.error('Erro completo ao carregar equipamentos:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar equipamentos",
        description: error.message || "Erro desconhecido ao carregar dados"
      });
    } finally {
      setLoading(false);
    }
  };

  const addEquipamento = async (equipamento: Omit<EquipamentoLocal, 'id' | 'dataCadastro'>) => {
    try {
      const equipamentoSupabase = convertToSupabase(equipamento);
      
      console.log('Dados a serem inseridos:', equipamentoSupabase);
      
      const { data, error } = await supabase
        .from('equipamentos')
        .insert([equipamentoSupabase])
        .select(`
          id,
          nome,
          tipo,
          marca,
          modelo,
          mac_address,
          ip_address,
          localizacao,
          status,
          data_aquisicao,
          valor_aquisicao,
          garantia_ate,
          observacoes,
          responsavel_id,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error('Erro ao inserir equipamento:', error);
        toast({
          variant: "destructive",
          title: "Erro ao adicionar equipamento",
          description: error.message || "Erro desconhecido ao adicionar equipamento"
        });
        throw error;
      }

      const novoEquipamento = convertFromSupabase(data);
      setEquipamentos(prev => [novoEquipamento, ...prev]);
      
      toast({
        title: "Equipamento adicionado",
        description: `${novoEquipamento.nome} foi adicionado com sucesso!`
      });
      
      return novoEquipamento;
    } catch (error: any) {
      console.error('Erro completo ao adicionar equipamento:', error);
      // Erro já foi tratado acima, apenas re-throw
      throw error;
    }
  };

  const updateEquipamento = async (id: string, updates: Partial<EquipamentoLocal>) => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update(convertToSupabase(updates as any))
        .eq('id', id);

      if (error) throw error;

      setEquipamentos(prev => 
        prev.map(eq => eq.id === id ? { ...eq, ...updates } : eq)
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar equipamento",
        description: error.message
      });
      throw error;
    }
  };

  const removeEquipamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEquipamentos(prev => prev.filter(eq => eq.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover equipamento",
        description: error.message
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchEquipamentos();
  }, []);

  return {
    equipamentos,
    loading,
    addEquipamento,
    updateEquipamento,
    removeEquipamento,
    refetch: fetchEquipamentos
  };
};