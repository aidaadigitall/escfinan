import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CompanySettings = {
  id: string;
  user_id: string;
  company_name: string | null;
  trading_name: string | null;
  cnpj: string | null;
  ie: string | null;
  im: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  logo_header_url: string | null;
  logo_sidebar_url: string | null;
  warranty_terms: string | null;
  favicon_url: string | null;
  next_quote_number: number | null;
  next_service_order_number: number | null;
  next_sale_number: number | null;
  created_at: string;
  updated_at: string;
};

export const useCompanySettings = () => {
  const queryClient = useQueryClient();

  const { data: companySettings, isLoading } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CompanySettings | null;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (settingsData: Partial<CompanySettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get effective owner ID for the current user
      const { data: effectiveOwnerData } = await supabase
        .rpc('get_effective_owner_id', { _user_id: user.id });
      
      const effectiveUserId = effectiveOwnerData || user.id;

      // First try to get existing settings
      const { data: existing } = await supabase
        .from("company_settings")
        .select("id")
        .eq("user_id", effectiveUserId)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("company_settings")
          .update(settingsData)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("company_settings")
          .insert({ ...settingsData, user_id: effectiveUserId })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // Update localStorage for immediate UI update
      if (result) {
        if (result.logo_header_url) {
          localStorage.setItem("logo_header_url", result.logo_header_url);
        }
        if (result.logo_sidebar_url) {
          localStorage.setItem("logo_sidebar_url", result.logo_sidebar_url);
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company_settings"] });
      toast.success("Dados da empresa salvos com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar dados da empresa");
    },
  });

  return {
    companySettings,
    isLoading,
    saveCompanySettings: upsertMutation.mutate,
  };
};
