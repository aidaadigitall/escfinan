import { useState, useEffect } from "react";
import { Task, useTaskComments } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { useUsers } from "@/hooks/useUsers";
import { useTaskLabels } from "@/hooks/useTaskLabels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon, Clock, Tag, Users, Paperclip, MessageSquare, AtSign, Trash2, Send, Settings } from "lucide-react";
import { TaskAttachments, Attachment } from "./TaskAttachments";
import { LabelManagerDialog } from "./LabelManagerDialog";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  parentTaskId?: string | null;
  onSave: (taskData: Partial<Task>) => void;
}

export const TaskDialog = ({ open, onOpenChange, task, parentTaskId, onSave }: TaskDialogProps) => {
  const { employees } = useEmployees();
  const { users } = useUsers();
  const { labels: savedLabels, createLabel } = useTaskLabels();
  const { comments, addComment, deleteComment } = useTaskComments(task?.id);
  
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    due_date: null,
    due_time: null,
    responsible_id: null,
    assigned_users: [],
    labels: [],
    reminder_date: null,
    is_recurring: false,
    recurrence_type: null,
    parent_task_id: parentTaskId || null,
    attachments: [],
  });
  
  const [newLabel, setNewLabel] = useState("");
  const [newComment, setNewComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [reminderPopoverOpen, setReminderPopoverOpen] = useState(false);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        status: "pending",
        due_date: null,
        due_time: null,
        responsible_id: null,
        assigned_users: [],
        labels: [],
        reminder_date: null,
        is_recurring: false,
        recurrence_type: null,
        parent_task_id: parentTaskId || null,
        attachments: [],
      });
    }
  }, [task, parentTaskId, open]);

  const handleSave = () => {
    if (!formData.title) return;
    onSave(formData);
    onOpenChange(false);
  };

  const handleAddLabel = async () => {
    if (newLabel && !formData.labels?.includes(newLabel)) {
      // Also save to database if it's a new label
      const existingLabel = savedLabels.find(l => l.name.toLowerCase() === newLabel.toLowerCase());
      if (!existingLabel) {
        await createLabel({ name: newLabel });
      }
      setFormData({ ...formData, labels: [...(formData.labels || []), newLabel] });
      setNewLabel("");
    }
  };

  const handleSelectSavedLabel = (labelName: string) => {
    if (!formData.labels?.includes(labelName)) {
      setFormData({ ...formData, labels: [...(formData.labels || []), labelName] });
    }
  };

  const handleRemoveLabel = (label: string) => {
    setFormData({ ...formData, labels: formData.labels?.filter((l) => l !== label) });
  };

  const toggleAssignedUser = (userId: string) => {
    const current = formData.assigned_users || [];
    if (current.includes(userId)) {
      setFormData({ ...formData, assigned_users: current.filter(id => id !== userId) });
    } else {
      setFormData({ ...formData, assigned_users: [...current, userId] });
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !task?.id) return;
    
    // Extract mentions from comment
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push(match[2]);
    }
    
    addComment({
      task_id: task.id,
      content: newComment,
      mentions,
    });
    setNewComment("");
  };

  const insertMention = (userId: string, userName: string) => {
    setNewComment(prev => prev + `@[${userName}](${userId}) `);
    setShowMentions(false);
  };

  const allUsers = [...employees.map(e => ({ id: e.id, name: e.name, type: 'employee' })), 
                   ...users.map(u => ({ id: u.id, name: u.name, type: 'user' }))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {task ? "Editar Tarefa" : parentTaskId ? "Nova Subtarefa" : "Nova Tarefa"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="assign">Delegação</TabsTrigger>
            <TabsTrigger value="attachments">Anexos</TabsTrigger>
            <TabsTrigger value="comments">Comentários</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="details" className="space-y-4 m-0 p-1">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="O que precisa ser feito?"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes da tarefa..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date
                          ? format(new Date(formData.due_date), "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={formData.due_date ? new Date(formData.due_date + "T12:00:00") : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Use local date formatting to avoid timezone issues
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setFormData({ ...formData, due_date: `${year}-${month}-${day}` });
                          } else {
                            setFormData({ ...formData, due_date: null });
                          }
                          setDatePopoverOpen(false);
                        }}
                        locale={ptBR}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium">Hora</label>
                  <Input
                    type="time"
                    value={formData.due_time || ""}
                    onChange={(e) => setFormData({ ...formData, due_time: e.target.value || null })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select
                    value={formData.priority || "medium"}
                    onValueChange={(value: "low" | "medium" | "high" | "urgent") => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Responsável</label>
                  <Select
                    value={formData.responsible_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, responsible_id: value === "none" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="none">Nenhum</SelectItem>
                      {allUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({user.type === 'employee' ? 'Funcionário' : 'Usuário'})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Etiquetas</label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLabelManagerOpen(true)}>
                    <Settings className="h-3 w-3 mr-1" /> Gerenciar
                  </Button>
                </div>
                {savedLabels.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1 mb-2">
                    {savedLabels.filter(l => !formData.labels?.includes(l.name)).slice(0, 6).map((label) => (
                      <Badge 
                        key={label.id} 
                        variant="outline" 
                        className="cursor-pointer text-xs"
                        style={{ borderColor: label.color, color: label.color }}
                        onClick={() => handleSelectSavedLabel(label.name)}
                      >
                        + {label.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Nova etiqueta"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLabel())}
                  />
                  <Button type="button" variant="outline" onClick={() => handleAddLabel()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.labels && formData.labels.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {formData.labels.map((label) => (
                      <Badge key={label} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveLabel(label)}>
                        {label} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Lembrete</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Popover open={reminderPopoverOpen} onOpenChange={setReminderPopoverOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.reminder_date
                          ? format(new Date(formData.reminder_date), "dd/MM/yyyy", { locale: ptBR })
                          : "Data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={formData.reminder_date ? new Date(formData.reminder_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const currentReminder = formData.reminder_date ? new Date(formData.reminder_date) : new Date();
                            date.setHours(currentReminder.getHours(), currentReminder.getMinutes());
                            setFormData({ ...formData, reminder_date: date.toISOString() });
                          }
                          setReminderPopoverOpen(false);
                        }}
                        locale={ptBR}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      className="pl-9"
                      value={formData.reminder_date 
                        ? format(new Date(formData.reminder_date), "HH:mm") 
                        : ""}
                      onChange={(e) => {
                        const time = e.target.value;
                        if (time) {
                          const [hours, minutes] = time.split(':').map(Number);
                          const date = formData.reminder_date ? new Date(formData.reminder_date) : new Date();
                          date.setHours(hours, minutes);
                          setFormData({ ...formData, reminder_date: date.toISOString() });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assign" className="space-y-4 m-0 p-1">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Delegar para Usuários
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Selecione um ou mais usuários para delegar esta tarefa
                </p>
                <div className="space-y-2 border rounded-lg p-3">
                  {allUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum usuário disponível</p>
                  ) : (
                    allUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={formData.assigned_users?.includes(user.id) || false}
                            onCheckedChange={() => toggleAssignedUser(user.id)}
                            className="rounded-full"
                          />
                          <label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer flex-1">
                            {user.name}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({user.type === 'employee' ? 'Funcionário' : 'Usuário'})
                            </span>
                          </label>
                        </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4 m-0 p-1">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4" />
                  Anexos
                </label>
                <TaskAttachments
                  attachments={(formData.attachments as Attachment[]) || []}
                  onAttachmentsChange={(attachments) => setFormData({ ...formData, attachments })}
                  taskId={task?.id}
                />
              </div>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4 m-0 p-1">
              {!task?.id ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Salve a tarefa primeiro para adicionar comentários
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comentários
                  </label>
                  
                  <div className="space-y-3 mt-3 max-h-48 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum comentário ainda
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteComment(comment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Adicione um comentário... Use @ para mencionar"
                          rows={2}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-6 w-6"
                          onClick={() => setShowMentions(!showMentions)}
                        >
                          <AtSign className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button type="button" onClick={handleAddComment} size="icon" disabled={!newComment.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {showMentions && (
                      <div className="absolute left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-[200] max-h-32 overflow-y-auto">
                        {allUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                            onClick={() => insertMention(user.id, user.name)}
                          >
                            {user.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
