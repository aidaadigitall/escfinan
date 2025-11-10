import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Client = {
  id: string;
  user_id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  created_at: string;
};

export const useClients = () => {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Client[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("clients")
        .insert({ name, user_id: user.id })
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

  return {
    clients,
    isLoading,
    createClient: createMutation.mutate,
  };
};
