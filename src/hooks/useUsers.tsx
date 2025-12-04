import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "Administrador" | "Gerente" | "Usuário";
  is_active: boolean;
  created_at: string;
};

// Este hook simula a gestão de usuários.
// A criação de usuários com senha no Supabase é feita via `supabase.auth.signUp()`.
// Para um painel de administração, o ideal seria usar a chave de serviço (Service Role Key)
// e a função `supabase.auth.admin.createUser()`, mas isso requer uma Edge Function ou API
// segura. Por simplicidade e segurança no frontend, vamos simular a criação de um perfil
// e, para a senha, usaremos a função de convite/signup do Supabase.

export const useUsers = () => {
  const queryClient = useQueryClient();

  // 1. READ: Buscar todos os perfis de usuários (simulando a tabela de perfis)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_users")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // 2. CREATE: Criar um novo usuário (usando Edge Function com privilégios admin)
  const createMutation = useMutation({
    mutationFn: async (userData: { email: string; password?: string; name: string; phone?: string; role: string; is_active: boolean }) => {
      const { email, password, name, phone, role, is_active } = userData;

      if (!password) {
        throw new Error("A senha é obrigatória para criar um novo usuário.");
      }

      // Chamar Edge Function para criar usuário com privilégios admin
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          name,
          phone,
          role,
          is_active,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário criado com sucesso! (Conta Auth e Perfil)");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

  // 3. UPDATE: Atualizar o perfil do usuário
  const updateMutation = useMutation({
    mutationFn: async (userData: Partial<UserProfile> & { id: string }) => {
      const { id, ...updateData } = userData;
      
      const { data, error } = await supabase
        .from("system_users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar usuário");
    },
  });

  // 4. DELETE: Deletar o perfil do usuário (a exclusão da conta Auth deve ser feita via Service Role Key)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("system_users")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir usuário");
    },
  });

  return {
    users,
    isLoading,
    createUser: createMutation.mutate,
    updateUser: updateMutation.mutate,
    deleteUser: deleteMutation.mutate,
  };
};
