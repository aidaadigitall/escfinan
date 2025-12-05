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

      const { data, error } = await supabase
        .from("company_settings")
        .upsert({ ...settingsData, user_id: user.id }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
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
