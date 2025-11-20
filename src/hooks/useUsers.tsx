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
        .from("system_users" as any)
        .select("*")
        .order("name");

      if (error) throw error;
      return data as any as UserProfile[];
    },
  });

  // 2. CREATE: Criar um novo usuário (usando a função de signup do Supabase para criar a conta Auth)
  const createMutation = useMutation({
    mutationFn: async (userData: { email: string; password?: string; name: string; phone?: string; role: string; is_active: boolean }) => {
      const { email, password, name, phone, role, is_active } = userData;

      if (!password) {
        throw new Error("A senha é obrigatória para criar um novo usuário.");
      }

      // 1. Criar a conta de autenticação no Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            role,
          },
        },
      });

      if (authError) throw authError;

      // 2. Criar o perfil do usuário na tabela 'system_users'
      const { data: profileData, error: profileError } = await supabase
        .from("system_users" as any)
        .insert({
          user_id: authData.user?.id,
          email,
          name,
          phone,
          role,
          is_active,
        } as any)
        .select()
        .single();

      if (profileError) throw profileError;
      return profileData;
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
        .from("system_users" as any)
        .update(updateData as any)
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
      // Nota: A exclusão da conta Auth (supabase.auth.admin.deleteUser) deve ser feita
      // em uma Edge Function segura. Aqui, vamos apenas deletar o perfil.
      const { error } = await supabase
        .from("system_users" as any)
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
