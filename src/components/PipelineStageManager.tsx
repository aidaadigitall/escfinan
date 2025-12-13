import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePipelineStages, PipelineStage } from "@/hooks/usePipelineStages";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Save,
  X,
  Palette,
} from "lucide-react";
import { toast } from "sonner";

interface PipelineStageManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Verde", value: "#10b981" },
  { name: "Amarelo", value: "#f59e0b" },
  { name: "Laranja", value: "#f97316" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cinza", value: "#6b7280" },
];

export const PipelineStageManager = ({ open, onOpenChange }: PipelineStageManagerProps) => {
  const { stages, createStage, updateStage, deleteStage, reorderStages } = usePipelineStages();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<PipelineStage | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    probability_default: 50,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      probability_default: 50,
    });
    setSelectedStage(null);
  };

  const handleNew = () => {
    resetForm();
    setIsEditDialogOpen(true);
  };

  const handleEdit = (stage: PipelineStage) => {
    setSelectedStage(stage);
    setFormData({
      name: stage.name,
      description: stage.description || "",
      color: stage.color,
      probability_default: stage.probability_default,
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome do estágio é obrigatório");
      return;
    }

    try {
      if (selectedStage) {
        // Atualizar
        await updateStage.mutateAsync({
          id: selectedStage.id,
          data: {
            name: formData.name,
            description: formData.description,
            color: formData.color,
            probability_default: formData.probability_default,
          },
        });
      } else {
        // Criar novo
        await createStage.mutateAsync({
          name: formData.name,
          description: formData.description,
          color: formData.color,
          probability_default: formData.probability_default,
          order_index: stages.length,
        });
      }
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar estágio:", error);
    }
  };

  const handleDelete = (stage: PipelineStage) => {
    setStageToDelete(stage);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (stageToDelete) {
      try {
        await deleteStage.mutateAsync(stageToDelete.id);
        setDeleteDialogOpen(false);
        setStageToDelete(null);
      } catch (error) {
        console.error("Erro ao deletar estágio:", error);
      }
    }
  };

  const moveStage = (fromIndex: number, toIndex: number) => {
    const newStages = [...stages];
    const [moved] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, moved);
    
    const orderedIds = newStages.map(s => s.id);
    reorderStages.mutate(orderedIds);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Estágios do Funil</DialogTitle>
            <DialogDescription>
              Configure os estágios do seu pipeline de vendas. Arraste para reordenar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Botão adicionar */}
            <Button onClick={handleNew} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Novo Estágio
            </Button>

            {/* Lista de estágios */}
            {stages.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Nenhum estágio configurado. Crie seu primeiro estágio para começar.
                    </p>
                    <Button onClick={handleNew}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Estágio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <Card key={stage.id} className="border-l-4" style={{ borderLeftColor: stage.color }}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        {/* Drag handle */}
                        <div className="cursor-move">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>

                        {/* Color indicator */}
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stage.color }}
                        />

                        {/* Stage info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{stage.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {stage.probability_default}%
                            </Badge>
                          </div>
                          {stage.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {stage.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStage(index, index - 1)}
                              title="Mover para cima"
                            >
                              ↑
                            </Button>
                          )}
                          {index < stages.length - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStage(index, index + 1)}
                              title="Mover para baixo"
                            >
                              ↓
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(stage)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(stage)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Dica */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              💡 <strong>Dica:</strong> Os leads movidos entre colunas no funil mudarão automaticamente de estágio. A ordem dos estágios define a sequência do funil.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição/criação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStage ? 'Editar Estágio' : 'Novo Estágio'}
            </DialogTitle>
            <DialogDescription>
              Configure as informações do estágio do funil
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="stage-name">Nome do Estágio *</Label>
              <Input
                id="stage-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Qualificação, Proposta, Negociação..."
                maxLength={50}
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="stage-description">Descrição (opcional)</Label>
              <Textarea
                id="stage-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que acontece neste estágio"
                rows={2}
                maxLength={200}
              />
            </div>

            {/* Probabilidade padrão */}
            <div>
              <Label htmlFor="stage-probability">
                Probabilidade de Conversão Padrão: {formData.probability_default}%
              </Label>
              <input
                id="stage-probability"
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.probability_default}
                onChange={(e) => setFormData({ ...formData, probability_default: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Define a probabilidade padrão para leads neste estágio
              </p>
            </div>

            {/* Cor */}
            <div>
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Cor do Estágio
              </Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-10 rounded-md border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4" style={{ borderLeftColor: formData.color, borderLeftWidth: '4px' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <div>
                  <p className="font-semibold">{formData.name || 'Nome do Estágio'}</p>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground">{formData.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {selectedStage ? 'Atualizar' : 'Criar'} Estágio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Estágio?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o estágio <strong>{stageToDelete?.name}</strong>?
              <br /><br />
              Os leads deste estágio <strong>não serão excluídos</strong>, mas ficarão sem estágio atribuído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir Estágio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
