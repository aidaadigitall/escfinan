import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";

export type Client = {
  id: string;
  user_id: string;
  name: string;
  company_name?: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  zipcode?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export const useClients = () => {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }
      console.log("Clientes encontrados:", data?.length);
      return (data || []) as Client[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (clientData: Omit<Client, "id" | "user_id" | "created_at" | "updated_at" | "is_active">) => {
      const effectiveUserId = await getEffectiveUserId();

      const { data, error } = await supabase
        .from("clients")
        .insert({ ...clientData, user_id: effectiveUserId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar cliente");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...clientData }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir cliente");
    },
  });

  return {
    clients,
    isLoading,
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    deleteClient: deleteMutation.mutate,
  };
};
