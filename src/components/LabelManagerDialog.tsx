import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTaskLabels, TaskLabel } from "@/hooks/useTaskLabels";
import { Plus, Edit2, Trash2, Check, X, Tag } from "lucide-react";

interface LabelManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6366f1", // indigo
  "#64748b", // slate
];

export const LabelManagerDialog = ({ open, onOpenChange }: LabelManagerDialogProps) => {
  const { labels, createLabel, updateLabel, deleteLabel } = useTaskLabels();
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6366f1");
  const [editingLabel, setEditingLabel] = useState<TaskLabel | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    await createLabel({ name: newLabelName.trim(), color: newLabelColor });
    setNewLabelName("");
    setNewLabelColor("#6366f1");
  };

  const handleStartEdit = (label: TaskLabel) => {
    setEditingLabel(label);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleSaveEdit = async () => {
    if (!editingLabel || !editName.trim()) return;
    await updateLabel({ id: editingLabel.id, name: editName.trim(), color: editColor });
    setEditingLabel(null);
  };

  const handleCancelEdit = () => {
    setEditingLabel(null);
    setEditName("");
    setEditColor("");
  };

  const handleDelete = async (id: string) => {
    await deleteLabel(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gerenciar Etiquetas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new label */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nova Etiqueta</label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da etiqueta"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateLabel()}
              />
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: newLabelColor === color ? "white" : "transparent",
                      boxShadow: newLabelColor === color ? "0 0 0 2px currentColor" : "none",
                    }}
                    onClick={() => setNewLabelColor(color)}
                  />
                ))}
              </div>
              <Button size="icon" onClick={handleCreateLabel}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Labels list */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Etiquetas Existentes</label>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {labels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma etiqueta criada ainda
                </p>
              ) : (
                labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                  >
                    {editingLabel?.id === label.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                        />
                        <div className="flex gap-1">
                          {PRESET_COLORS.slice(0, 5).map((color) => (
                            <button
                              key={color}
                              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                              style={{
                                backgroundColor: color,
                                borderColor: editColor === color ? "white" : "transparent",
                                boxShadow: editColor === color ? "0 0 0 2px currentColor" : "none",
                              }}
                              onClick={() => setEditColor(color)}
                            />
                          ))}
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge
                          style={{ backgroundColor: label.color, color: "white" }}
                          className="border-0"
                        >
                          {label.name}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(label)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleDelete(label.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};