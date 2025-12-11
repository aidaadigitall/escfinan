import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";
import { AdvancedFilters } from "@/components/AdvancedSearchBar";

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

interface UsePaginatedClientsOptions {
  page: number;
  pageSize: number;
  searchTerm?: string;
  filters?: AdvancedFilters;
}

export const usePaginatedClients = ({ page, pageSize, searchTerm, filters }: UsePaginatedClientsOptions) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["clients", page, pageSize, searchTerm, filters],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*", { count: "exact" });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`);
      }

      if (filters) {
        if (filters.type === 'pf') query = query.not('cpf', 'is', null);
        if (filters.type === 'pj') query = query.not('cnpj', 'is', null);
        if (filters.code) query = query.eq('id', filters.code);
        if (filters.name) query = query.ilike('name', `%${filters.name}%`);
        if (filters.cpfCnpj) query = query.or(`cpf.ilike.%${filters.cpfCnpj}%,cnpj.ilike.%${filters.cpfCnpj}%`);
        if (filters.phone) query = query.ilike('phone', `%${filters.phone}%`);
        if (filters.email) query = query.ilike('email', `%${filters.email}%`);
        if (filters.city) query = query.ilike('city', `%${filters.city}%`);
        if (filters.state) query = query.ilike('state', `%${filters.state}%`);
        if (filters.status === 'active') query = query.eq('is_active', true);
        if (filters.status === 'inactive') query = query.eq('is_active', false);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order("name")
        .range(from, to);

      if (error) {
        console.error("Erro ao buscar clientes paginados:", error);
        throw error;
      }

      return {
        clients: (data || []) as Client[],
        totalCount: count || 0
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: async (clientData: Omit<Client, "id" | "user_id" | "created_at" | "updated_at" | "is_active">) => {
      const effectiveUserId = await getEffectiveUserId();
      const { data, error } = await supabase
        .from("clients")
        .insert([{ ...clientData, user_id: effectiveUserId }])
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
      console.error("Erro ao criar cliente:", error);
      toast.error(error.message || "Erro ao criar cliente.");
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
      console.error("Erro ao atualizar cliente:", error);
      toast.error(error.message || "Erro ao atualizar cliente.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao excluir cliente:", error);
      toast.error(error.message || "Erro ao excluir cliente.");
    },
  });

  return {
    clients: data?.clients || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    deleteClient: deleteMutation.mutate,
  };
};
