import { useState } from "react";
import { toast } from "sonner";

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  type: string;
  title: string;
  description?: string;
  outcome?: string;
  outcome_notes?: string;
  scheduled_for?: string;
  completed_at?: string;
  is_completed: boolean;
  duration_minutes?: number;
  attachments?: any;
  created_at: string;
  updated_at: string;
}

export interface LeadActivityFormData {
  lead_id: string;
  type: string;
  title: string;
  description?: string;
  outcome?: string;
  outcome_notes?: string;
  scheduled_for?: string;
  duration_minutes?: number;
}

// Hook stub - CRM tables not yet implemented in database
export const useLeadActivities = (leadId?: string) => {
  const [activities] = useState<LeadActivity[]>([]);
  const [isLoading] = useState(false);

  const createActivity = {
    mutate: (_data: LeadActivityFormData) => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async (_data: LeadActivityFormData) => { toast.info("Funcionalidade CRM em desenvolvimento"); },
    isPending: false,
  };

  const updateActivity = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  const completeActivity = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  const deleteActivity = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  return {
    activities,
    isLoading,
    createActivity,
    updateActivity,
    completeActivity,
    deleteActivity,
  };
};
