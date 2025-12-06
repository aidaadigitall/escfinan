import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPermissions, defaultPermissions } from "@/components/UserPermissionsForm";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "Administrador" | "Gerente" | "Usuário";
  is_active: boolean;
  created_at: string;
  owner_user_id?: string;
};

export const useUsers = () => {
  const queryClient = useQueryClient();

  // Get current user to determine owner context
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  // Fetch users - show users created by the current owner or the current user's own profile
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) return [];

      // First, check if current user is a sub-user (has owner_user_id)
      const { data: currentUserProfile } = await supabase
        .from("system_users")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      let ownerUserId = currentUser.id;
      
      // If current user has an owner, use that owner's ID to fetch users
      if (currentUserProfile?.owner_user_id) {
        ownerUserId = currentUserProfile.owner_user_id;
      }

      // Fetch all users that belong to this owner OR the owner themselves
      const { data, error } = await supabase
        .from("system_users")
        .select("*")
        .or(`owner_user_id.eq.${ownerUserId},user_id.eq.${ownerUserId}`)
        .order("name");

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // CREATE: Create a new user using Edge Function with admin privileges
  const createMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password?: string; 
      name: string; 
      phone?: string; 
      role: string; 
      is_active: boolean;
      permissions?: UserPermissions;
    }) => {
      const { email, password, name, phone, role, is_active, permissions } = userData;

      if (!password) {
        throw new Error("A senha é obrigatória para criar um novo usuário.");
      }

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }

      // Call Edge Function to create user with admin privileges
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          name,
          phone,
          role,
          is_active,
          owner_user_id: currentUser.id,
          permissions: permissions || defaultPermissions,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

  // UPDATE: Update user profile
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

  // DELETE: Delete user profile
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
