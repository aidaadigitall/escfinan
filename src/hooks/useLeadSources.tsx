import { useState } from "react";
import { toast } from "sonner";

export interface LeadSource {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

// Hook stub - CRM tables not yet implemented in database
export const useLeadSources = () => {
  const [sources] = useState<LeadSource[]>([
    { id: "1", user_id: "", name: "Website", is_active: true, created_at: new Date().toISOString() },
    { id: "2", user_id: "", name: "Indicação", is_active: true, created_at: new Date().toISOString() },
    { id: "3", user_id: "", name: "Redes Sociais", is_active: true, created_at: new Date().toISOString() },
    { id: "4", user_id: "", name: "Google", is_active: true, created_at: new Date().toISOString() },
    { id: "5", user_id: "", name: "Evento", is_active: true, created_at: new Date().toISOString() },
  ]);
  const [isLoading] = useState(false);

  const createSource = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  return { sources, isLoading, createSource };
};
