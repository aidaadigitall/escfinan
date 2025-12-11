import { useState } from "react";
import { toast } from "sonner";

export interface PipelineStage {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  order: number;
  probability_default: number;
  color: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface PipelineStageFormData {
  name: string;
  description?: string;
  order?: number;
  probability_default?: number;
  color?: string;
}

// Hook stub - CRM tables not yet implemented in database
export const usePipelineStages = () => {
  const [stages] = useState<PipelineStage[]>([
    { id: "1", user_id: "", name: "Novo Lead", order: 1, probability_default: 10, color: "#6366f1", is_active: true, is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "2", user_id: "", name: "Qualificação", order: 2, probability_default: 25, color: "#8b5cf6", is_active: true, is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "3", user_id: "", name: "Proposta", order: 3, probability_default: 50, color: "#a855f7", is_active: true, is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "4", user_id: "", name: "Negociação", order: 4, probability_default: 75, color: "#d946ef", is_active: true, is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "5", user_id: "", name: "Fechamento", order: 5, probability_default: 90, color: "#22c55e", is_active: true, is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);
  const [isLoading] = useState(false);

  const createStage = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  const updateStage = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  const deleteStage = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  const reorderStages = {
    mutate: () => toast.info("Funcionalidade CRM em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade CRM em desenvolvimento"),
    isPending: false,
  };

  return {
    stages,
    isLoading,
    error: null,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
};
