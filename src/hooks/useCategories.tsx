import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  created_at: string;
};

export const useCategories = (type?: "income" | "expense") => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      let query = supabase
        .from("categories")
        .select("*")
        .order("name");

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Category[];
    },
  });

  return { categories, isLoading };
};
