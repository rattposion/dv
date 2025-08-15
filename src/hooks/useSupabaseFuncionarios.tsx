import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface FuncionarioSupabase {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cargo?: string;
  funcao?: string;
  turno?: string;
  departamento?: string;
  salario?: number;
  data_admissao?: string;
  status: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface FuncionarioLocal {
  id: string;
  nome: string;
  funcao: string;
  turno: string;
  status: "Ativo" | "Em Produção" | "Inativo";
  aprovado: boolean;
}

export const useSupabaseFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState<FuncionarioLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Converter de Supabase para formato local
  const convertFromSupabase = (funcionario: FuncionarioSupabase): FuncionarioLocal => ({
    id: funcionario.id,
    nome: funcionario.nome,
    funcao: funcionario.cargo || funcionario.funcao || 'Operador',
    turno: funcionario.turno || 'Diurno',
    status: funcionario.status === 'ativo' ? 'Ativo' : 'Inativo',
    aprovado: funcionario.status === 'ativo'
  });

  // Converter de formato local para Supabase
  const convertToSupabase = (funcionario: Omit<FuncionarioLocal, 'id'>): Omit<FuncionarioSupabase, 'id' | 'created_at' | 'updated_at'> => ({
    nome: funcionario.nome,
    cargo: funcionario.funcao,
    funcao: funcionario.funcao,
    turno: funcionario.turno,
    status: funcionario.status === 'Ativo' ? 'ativo' : 'inativo'
  });

  const fetchFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const funcionariosLocais = (data || []).map(convertFromSupabase);
      setFuncionarios(funcionariosLocais);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar funcionários",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const addFuncionario = async (funcionario: Omit<FuncionarioLocal, 'id'>) => {
    try {
      const funcionarioSupabase = convertToSupabase(funcionario);
      
      const { data, error } = await supabase
        .from('funcionarios')
        .insert([funcionarioSupabase])
        .select()
        .single();

      if (error) throw error;

      const novoFuncionario = convertFromSupabase(data);
      setFuncionarios(prev => [novoFuncionario, ...prev]);
      
      return novoFuncionario;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar funcionário",
        description: error.message
      });
      throw error;
    }
  };

  const updateFuncionario = async (id: string, updates: Partial<FuncionarioLocal>) => {
    try {
      const { error } = await supabase
        .from('funcionarios')
        .update(convertToSupabase(updates as any))
        .eq('id', id);

      if (error) throw error;

      setFuncionarios(prev => 
        prev.map(func => func.id === id ? { ...func, ...updates } : func)
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar funcionário",
        description: error.message
      });
      throw error;
    }
  };

  const removeFuncionario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFuncionarios(prev => prev.filter(func => func.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover funcionário",
        description: error.message
      });
      throw error;
    }
  };

  const aprovarFuncionario = async (id: string) => {
    await updateFuncionario(id, { aprovado: true, status: 'Ativo' });
  };

  const funcionariosAprovados = funcionarios.filter(f => f.aprovado);

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  return {
    funcionarios,
    funcionariosAprovados,
    loading,
    addFuncionario,
    updateFuncionario,
    removeFuncionario,
    aprovarFuncionario,
    refetch: fetchFuncionarios
  };
};