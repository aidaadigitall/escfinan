import { useState } from "react";
import { toast } from "sonner";

export interface Lead {
  id: string;
  user_id: string;
  owner_user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  source_details?: string;
  pipeline_stage_id?: string;
  status: string;
  score: number;
  expected_value?: number;
  probability?: number;
  expected_close_date?: string;
  lost_reason?: string;
  lost_date?: string;
  converted_to_client: boolean;
  client_id?: string;
  converted_at?: string;
  assigned_to?: string;
  first_contact_date?: string;
  last_contact_date?: string;
  last_activity_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  pipeline_stage?: {
    id: string;
    name: string;
    color: string;
  };
  assigned_user?: {
    id: string;
    email: string;
  };
}

export interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  source_details?: string;
  pipeline_stage_id?: string;
  status?: string;
  score?: number;
  expected_value?: number;
  probability?: number;
  expected_close_date?: string;
  assigned_to?: string;
  notes?: string;
}

// Hook stub - CRM tables not yet implemented in database
export const useLeads = () => {
  const [leads] = useState<Lead[]>([]);
  const [isLoading] = useState(false);

  const createLead = {
    mutate: (_data: LeadFormData) => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async (_data: LeadFormData) => { toast.info("Funcionalidade CRM em desenvolvimento"); },
    isPending: false,
  };

  const updateLead = {
    mutate: (_params: { id: string; data: Partial<LeadFormData> }) => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async (_params: { id: string; data: Partial<LeadFormData> }) => { toast.info("Funcionalidade CRM em desenvolvimento"); },
    isPending: false,
  };

  const deleteLead = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  const convertToClient = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  const moveToPipelineStage = {
    mutate: (_params: { leadId: string; stageId: string }) => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async (_params: { leadId: string; stageId: string }) => { toast.info("Funcionalidade CRM em desenvolvimento"); },
    isPending: false,
  };

  return {
    leads,
    isLoading,
    error: null,
    createLead,
    updateLead,
    deleteLead,
    convertToClient,
    moveToPipelineStage,
  };
};
