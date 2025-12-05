import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Service = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cost_price: number;
  sale_price: number;
  estimated_hours: number | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useServices = () => {
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Service[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (serviceData: {
      name: string;
      description?: string;
      cost_price: number;
      sale_price: number;
      estimated_hours?: number;
      category?: string;
      is_active?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("services")
        .insert([{ 
          name: serviceData.name,
          description: serviceData.description || null,
          cost_price: serviceData.cost_price,
          sale_price: serviceData.sale_price,
          estimated_hours: serviceData.estimated_hours || null,
          category: serviceData.category || null,
          is_active: serviceData.is_active ?? true,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar serviço");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (serviceData: Partial<Service> & { id: string }) => {
      const { id, user_id, created_at, updated_at, ...updateData } = serviceData;
      
      const { data, error } = await supabase
        .from("services")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar serviço");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir serviço");
    },
  });

  return {
    services,
    isLoading,
    createService: createMutation.mutate,
    updateService: updateMutation.mutate,
    deleteService: deleteMutation.mutate,
  };
};
