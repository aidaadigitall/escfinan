import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the effective owner ID for data operations.
 * For sub-users, this returns the admin's user ID.
 * For admin users, this returns their own user ID.
 */
export const getEffectiveUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: effectiveOwnerData } = await supabase
    .rpc('get_effective_owner_id', { _user_id: user.id });
  
  return effectiveOwnerData || user.id;
};
