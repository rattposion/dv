export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      consumo_producao: {
        Row: {
          created_at: string
          id: string
          modelo_consumido: string
          ordem_producao_id: string | null
          produto_final_id: string | null
          quantidade_consumida: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          modelo_consumido: string
          ordem_producao_id?: string | null
          produto_final_id?: string | null
          quantidade_consumida?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          modelo_consumido?: string
          ordem_producao_id?: string | null
          produto_final_id?: string | null
          quantidade_consumida?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumo_producao_ordem_producao_id_fkey"
            columns: ["ordem_producao_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumo_producao_produto_final_id_fkey"
            columns: ["produto_final_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      defeitos: {
        Row: {
          created_at: string
          data_registro: string
          descricao_defeito: string | null
          destino: string | null
          equipamento: string
          foto_url: string | null
          id: string
          modelo: string
          observacoes: string | null
          origem: string | null
          quantidade: number
          responsavel: string
          tipo_defeito: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_registro?: string
          descricao_defeito?: string | null
          destino?: string | null
          equipamento: string
          foto_url?: string | null
          id?: string
          modelo: string
          observacoes?: string | null
          origem?: string | null
          quantidade: number
          responsavel: string
          tipo_defeito: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_registro?: string
          descricao_defeito?: string | null
          destino?: string | null
          equipamento?: string
          foto_url?: string | null
          id?: string
          modelo?: string
          observacoes?: string | null
          origem?: string | null
          quantidade?: number
          responsavel?: string
          tipo_defeito?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          created_at: string
          data_aquisicao: string | null
          garantia_ate: string | null
          id: string
          ip_address: unknown | null
          localizacao: string | null
          mac_address: string | null
          marca: string | null
          modelo: string | null
          nome: string
          observacoes: string | null
          responsavel_id: string | null
          status: string
          tipo: string
          updated_at: string
          valor_aquisicao: number | null
        }
        Insert: {
          created_at?: string
          data_aquisicao?: string | null
          garantia_ate?: string | null
          id?: string
          ip_address?: unknown | null
          localizacao?: string | null
          mac_address?: string | null
          marca?: string | null
          modelo?: string | null
          nome: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Update: {
          created_at?: string
          data_aquisicao?: string | null
          garantia_ate?: string | null
          id?: string
          ip_address?: unknown | null
          localizacao?: string | null
          mac_address?: string | null
          marca?: string | null
          modelo?: string | null
          nome?: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      estoque_recebimento: {
        Row: {
          created_at: string
          id: string
          modelo: string
          quantidade_disponivel: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          modelo: string
          quantidade_disponivel?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          modelo?: string
          quantidade_disponivel?: number
          updated_at?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          departamento: string | null
          email: string | null
          endereco: string | null
          funcao: string | null
          id: string
          nome: string
          observacoes: string | null
          salario: number | null
          status: string
          telefone: string | null
          turno: string | null
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          departamento?: string | null
          email?: string | null
          endereco?: string | null
          funcao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          salario?: number | null
          status?: string
          telefone?: string | null
          turno?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          departamento?: string | null
          email?: string | null
          endereco?: string | null
          funcao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          salario?: number | null
          status?: string
          telefone?: string | null
          turno?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      itens_recebimento: {
        Row: {
          created_at: string
          id: string
          modelo: string
          observacoes: string | null
          produto_nome: string
          quantidade: number
          recebimento_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          modelo: string
          observacoes?: string | null
          produto_nome: string
          quantidade: number
          recebimento_id: string
        }
        Update: {
          created_at?: string
          id?: string
          modelo?: string
          observacoes?: string | null
          produto_nome?: string
          quantidade?: number
          recebimento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_recebimento_recebimento_id_fkey"
            columns: ["recebimento_id"]
            isOneToOne: false
            referencedRelation: "recebimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes: {
        Row: {
          anexos_ids: string[] | null
          created_at: string
          data_abertura: string
          data_fechamento: string | null
          defeito_equipamento: string
          destino_envio: string | null
          equipamento_id: string | null
          houve_reparo: boolean
          id: string
          laudo_tecnico: string | null
          numero_tarefa: string
          observacoes: string | null
          origem_equipamento: string
          status: string
          tecnico_responsavel: string | null
          updated_at: string
          valor_servico: number | null
          vezes_faturado: number
        }
        Insert: {
          anexos_ids?: string[] | null
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          defeito_equipamento: string
          destino_envio?: string | null
          equipamento_id?: string | null
          houve_reparo?: boolean
          id?: string
          laudo_tecnico?: string | null
          numero_tarefa: string
          observacoes?: string | null
          origem_equipamento: string
          status?: string
          tecnico_responsavel?: string | null
          updated_at?: string
          valor_servico?: number | null
          vezes_faturado?: number
        }
        Update: {
          anexos_ids?: string[] | null
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          defeito_equipamento?: string
          destino_envio?: string | null
          equipamento_id?: string | null
          houve_reparo?: boolean
          id?: string
          laudo_tecnico?: string | null
          numero_tarefa?: string
          observacoes?: string | null
          origem_equipamento?: string
          status?: string
          tecnico_responsavel?: string | null
          updated_at?: string
          valor_servico?: number | null
          vezes_faturado?: number
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          documento: string | null
          funcionario_id: string | null
          id: string
          motivo: string | null
          observacoes: string | null
          produto_id: string
          quantidade: number
          tipo_movimento: string
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          documento?: string | null
          funcionario_id?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          produto_id: string
          quantidade: number
          tipo_movimento: string
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          documento?: string | null
          funcionario_id?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          produto_id?: string
          quantidade?: number
          tipo_movimento?: string
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao: {
        Row: {
          created_at: string
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio: string | null
          id: string
          numero_ordem: string
          observacoes: string | null
          produto_id: string
          quantidade_planejada: number
          quantidade_produzida: number
          responsavel_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio?: string | null
          id?: string
          numero_ordem: string
          observacoes?: string | null
          produto_id: string
          quantidade_planejada: number
          quantidade_produzida?: number
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio?: string | null
          id?: string
          numero_ordem?: string
          observacoes?: string | null
          produto_id?: string
          quantidade_planejada?: number
          quantidade_produzida?: number
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_diaria: {
        Row: {
          colaborador: string
          created_at: string
          data_producao: string
          id: string
          modelo: string
          observacoes: string | null
          quantidade_caixas: number
          quantidade_equipamentos: number
          updated_at: string
        }
        Insert: {
          colaborador: string
          created_at?: string
          data_producao?: string
          id?: string
          modelo: string
          observacoes?: string | null
          quantidade_caixas?: number
          quantidade_equipamentos?: number
          updated_at?: string
        }
        Update: {
          colaborador?: string
          created_at?: string
          data_producao?: string
          id?: string
          modelo?: string
          observacoes?: string | null
          quantidade_caixas?: number
          quantidade_equipamentos?: number
          updated_at?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          categoria: string | null
          codigo: string | null
          created_at: string
          descricao: string | null
          estoque_atual: number
          estoque_maximo: number | null
          estoque_minimo: number
          fornecedor: string | null
          id: string
          localizacao_estoque: string | null
          nome: string
          preco_unitario: number | null
          total_produzido: number
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number
          estoque_maximo?: number | null
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          localizacao_estoque?: string | null
          nome: string
          preco_unitario?: number | null
          total_produzido?: number
          unidade_medida?: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number
          estoque_maximo?: number | null
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          localizacao_estoque?: string | null
          nome?: string
          preco_unitario?: number | null
          total_produzido?: number
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recebimentos: {
        Row: {
          created_at: string
          data_recebimento: string
          id: string
          numero_documento: string
          observacoes: string | null
          origem: string
          responsavel_recebimento: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_recebimento?: string
          id?: string
          numero_documento: string
          observacoes?: string | null
          origem: string
          responsavel_recebimento: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_recebimento?: string
          id?: string
          numero_documento?: string
          observacoes?: string | null
          origem?: string
          responsavel_recebimento?: string
          updated_at?: string
        }
        Relationships: []
      }
      relatorios: {
        Row: {
          created_at: string
          dados: Json | null
          gerado_por: string
          id: string
          periodo_fim: string | null
          periodo_inicio: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          dados?: Json | null
          gerado_por: string
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          dados?: Json | null
          gerado_por?: string
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_gerado_por_fkey"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      resets: {
        Row: {
          created_at: string
          equipamento: string
          id: string
          modelo: string
          observacao: string | null
          quantidade: number
          responsavel: string
        }
        Insert: {
          created_at?: string
          equipamento: string
          id?: string
          modelo: string
          observacao?: string | null
          quantidade: number
          responsavel: string
        }
        Update: {
          created_at?: string
          equipamento?: string
          id?: string
          modelo?: string
          observacao?: string | null
          quantidade?: number
          responsavel?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      user_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      user_status: ["pending", "approved", "rejected"],
    },
  },
} as const
