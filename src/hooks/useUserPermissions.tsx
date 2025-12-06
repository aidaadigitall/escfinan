import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPermissions, defaultPermissions } from "@/components/UserPermissionsForm";

export const useUserPermissions = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["user_permissions", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Remove non-permission fields
        const { id, user_id, owner_user_id, created_at, updated_at, ...perms } = data;
        return perms as UserPermissions;
      }
      
      return defaultPermissions;
    },
    enabled: !!userId,
  });

  const upsertPermissions = useMutation({
    mutationFn: async ({ 
      userId, 
      ownerUserId, 
      permissions 
    }: { 
      userId: string; 
      ownerUserId: string; 
      permissions: UserPermissions;
    }) => {
      const { data, error } = await supabase
        .from("user_permissions")
        .upsert({
          user_id: userId,
          owner_user_id: ownerUserId,
          ...permissions,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_permissions"] });
    },
    onError: (error: any) => {
      console.error("Error saving permissions:", error);
      toast.error("Erro ao salvar permissões");
    },
  });

  return {
    permissions: permissions || defaultPermissions,
    isLoading,
    upsertPermissions: upsertPermissions.mutate,
  };
};

// Hook to get current user's permissions
export const useCurrentUserPermissions = () => {
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["current_user_permissions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return defaultPermissions;

      // Check if user is an admin (owner) - they have all permissions
      const { data: systemUser } = await supabase
        .from("system_users")
        .select("role, owner_user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // If user is admin or has no owner, they have full permissions
      if (!systemUser || systemUser.role === "Administrador" || !systemUser.owner_user_id) {
        return { ...defaultPermissions, can_view_users: true, can_manage_users: true, can_view_settings: true, can_manage_settings: true, can_view_dashboard_values: true };
      }

      // Get user's specific permissions
      const { data: perms, error } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching permissions:", error);
        return defaultPermissions;
      }

      if (perms) {
        const { id, user_id, owner_user_id, created_at, updated_at, ...permissions } = perms;
        return permissions as UserPermissions;
      }

      return defaultPermissions;
    },
  });

  return {
    permissions: permissions || defaultPermissions,
    isLoading,
  };
};
