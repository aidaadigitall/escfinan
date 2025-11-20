import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Employee = {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string | null;
  position: string | null;
  salary: number;
  is_active: boolean;
};

export const useEmployees = () => {
  const queryClient = useQueryClient();

  // 1. READ: Buscar todos os funcionários
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees" as any)
        .select("*")
        .order("name");

      if (error) throw error;
      return data as any as Employee[];
    },
  });

  // 2. CREATE: Criar um novo funcionário
  const createMutation = useMutation({
    mutationFn: async (employeeData: Omit<Employee, "id">) => {
      const { data, error } = await supabase
        .from("employees" as any)
        .insert(employeeData as any)
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

  // 3. UPDATE: Atualizar um funcionário
  const updateMutation = useMutation({
    mutationFn: async (employeeData: Partial<Employee> & { id: string }) => {
      const { id, ...updateData } = employeeData;
      
      const { data, error } = await supabase
        .from("employees" as any)
        .update(updateData as any)
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

  // 4. DELETE: Deletar um funcionário
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees" as any)
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
