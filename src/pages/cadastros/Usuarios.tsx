import { useState, useEffect } from "react";
import { useUsers, UserProfile } from "@/hooks/useUsers";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { UserPermissionsForm, UserPermissions, defaultPermissions } from "@/components/UserPermissionsForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Usuarios = () => {
  const { user } = useAuth();
  const { users, isLoading, createUser, updateUser, deleteUser } = useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("dados");
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: "Administrador" | "Gerente" | "Usuário";
    is_active: boolean;
    password?: string;
  }>({
    name: "",
    email: "",
    phone: "",
    role: "Usuário",
    is_active: true,
    password: "",
  });
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { permissions: editingUserPermissions, upsertPermissions } = useUserPermissions(editingUser?.user_id);
  
  // Load permissions when editing user changes
  useEffect(() => {
    if (editingUser && editingUserPermissions) {
      setPermissions(editingUserPermissions);
    }
  }, [editingUser, editingUserPermissions]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (userToEdit?: UserProfile) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        phone: userToEdit.phone || "",
        role: userToEdit.role,
        is_active: userToEdit.is_active,
        password: "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "Usuário",
        is_active: true,
        password: "",
      });
      setPermissions(defaultPermissions);
    }
    setActiveTab("dados");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error("A senha é obrigatória para um novo usuário.");
      return;
    }

    const dataToSave = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      is_active: formData.is_active,
    };

    if (editingUser) {
      updateUser({ id: editingUser.id, ...dataToSave });
      
      // Save permissions using user_id (from auth.users), not the record id
      if (user?.id && editingUser.user_id) {
        upsertPermissions({
          userId: editingUser.user_id,
          ownerUserId: user.id,
          permissions,
        });
      }
    } else {
      createUser({ 
        ...dataToSave, 
        password: formData.password!,
        permissions,
      });
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete);
      setUserToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  // Set default permissions based on role
  const handleRoleChange = (role: "Administrador" | "Gerente" | "Usuário") => {
    setFormData({ ...formData, role });
    
    if (role === "Administrador") {
      // Admins get all permissions
      const allEnabled = Object.keys(defaultPermissions).reduce((acc, key) => {
        acc[key as keyof UserPermissions] = true;
        return acc;
      }, {} as UserPermissions);
      setPermissions(allEnabled);
    } else if (role === "Gerente") {
      // Managers get most permissions except user management and settings
      setPermissions({
        ...defaultPermissions,
        can_view_users: true,
        can_manage_users: false,
        can_view_settings: true,
        can_manage_settings: false,
      });
    } else {
      // Regular users get default permissions
      setPermissions(defaultPermissions);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Usuários</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Loader className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>{usuario.name}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{usuario.phone}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    usuario.role === "Administrador" 
                      ? "bg-primary/10 text-primary" 
                      : usuario.role === "Gerente"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {usuario.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      usuario.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {usuario.is_active ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(usuario)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(usuario.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Usuário
              </TabsTrigger>
              <TabsTrigger value="permissoes" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissões
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] mt-4">
              <TabsContent value="dados" className="space-y-4 px-1">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nome do usuário"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </div>
                
                {!editingUser && (
                  <div>
                    <label className="text-sm font-medium">Senha *</label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(11) 98765-4321"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Papel</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option>Administrador</option>
                    <option>Gerente</option>
                    <option>Usuário</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.role === "Administrador" 
                      ? "Acesso total ao sistema"
                      : formData.role === "Gerente"
                      ? "Acesso amplo, sem gerenciamento de usuários"
                      : "Acesso limitado conforme permissões definidas"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    id="is_active"
                    className="rounded border-input"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Ativo
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="permissoes" className="px-1">
                <UserPermissionsForm
                  permissions={permissions}
                  onChange={setPermissions}
                  disabled={formData.role === "Administrador"}
                />
                {formData.role === "Administrador" && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Administradores possuem acesso total ao sistema.
                  </p>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir usuário"
        description="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
};

export default Usuarios;
