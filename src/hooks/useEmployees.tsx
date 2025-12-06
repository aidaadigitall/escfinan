import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";

export type Employee = {
  id: string;
  user_id: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  salary: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useEmployees = () => {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Employee[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (employeeData: Omit<Employee, "id" | "user_id" | "created_at" | "updated_at">) => {
      const effectiveUserId = await getEffectiveUserId();

      const { data, error } = await supabase
        .from("employees")
        .insert({ ...employeeData, user_id: effectiveUserId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Funcionário criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar funcionário");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (employeeData: Partial<Employee> & { id: string }) => {
      const { id, ...updateData } = employeeData;
      
      const { data, error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Funcionário atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar funcionário");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Funcionário excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir funcionário");
    },
  });

  return {
    employees,
    isLoading,
    createEmployee: createMutation.mutate,
    updateEmployee: updateMutation.mutate,
    deleteEmployee: deleteMutation.mutate,
  };
};
