import { useState } from "react";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useServices } from "@/hooks/useServices";
import { useEmployees } from "@/hooks/useEmployees";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Loader, Wrench, Monitor, Trash2 } from "lucide-react";
import { DiscountInput } from "@/components/DiscountInput";
import { DocumentActionsMenu } from "@/components/DocumentActionsMenu";

interface OrderItem {
  id?: string;
  item_type: "product" | "service";
  product_id?: string | null;
  service_id?: string | null;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  waiting_parts: "bg-orange-100 text-orange-800",
  approved: "bg-emerald-100 text-emerald-800",
  completed: "bg-green-100 text-green-800",
  delivered: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  waiting_parts: "Aguardando Peças",
  approved: "Aprovado",
  completed: "Concluída",
  delivered: "Entregue",
  cancelled: "Cancelada",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const OrdensServico = () => {
  const { serviceOrders, isLoading, createServiceOrder, updateServiceOrder, deleteServiceOrder } = useServiceOrders();
  const { clients } = useClients();
  const { products } = useProducts();
  const { services } = useServices();
  const { employees } = useEmployees();
  const { companySettings } = useCompanySettings();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [formData, setFormData] = useState({
    client_id: "",
    technician_id: "",
    responsible_id: "",
    status: "pending",
    priority: "medium",
    entry_date: new Date().toISOString(),
    exit_date: "",
    equipment_name: "",
    equipment_brand: "",
    equipment_model: "",
    equipment_serial: "",
    equipment_memory: "",
    equipment_storage: "",
    equipment_processor: "",
    defects: "",
    technical_report: "",
    warranty_terms: companySettings?.warranty_terms || "",
    paid_amount: 0,
    notes: "",
  });

  const filteredOrders = serviceOrders.filter(
    (o: any) => o.order_number?.toString().includes(searchTerm) ||
    o.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (order?: any) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        client_id: order.client_id || "",
        technician_id: order.technician_id || "",
        responsible_id: order.responsible_id || "",
        status: order.status || "pending",
        priority: order.priority || "medium",
        entry_date: order.entry_date || new Date().toISOString(),
        exit_date: order.exit_date || "",
        equipment_name: order.equipment_name || "",
        equipment_brand: order.equipment_brand || "",
        equipment_model: order.equipment_model || "",
        equipment_serial: order.equipment_serial || "",
        equipment_memory: order.equipment_memory || "",
        equipment_storage: order.equipment_storage || "",
        equipment_processor: order.equipment_processor || "",
        defects: order.defects || "",
        technical_report: order.technical_report || "",
        warranty_terms: order.warranty_terms || companySettings?.warranty_terms || "",
        paid_amount: order.paid_amount || 0,
        notes: order.notes || "",
      });
      setItems([]);
    } else {
      setEditingOrder(null);
      setFormData({
        client_id: "",
        technician_id: "",
        responsible_id: "",
        status: "pending",
        priority: "medium",
        entry_date: new Date().toISOString(),
        exit_date: "",
        equipment_name: "",
        equipment_brand: "",
        equipment_model: "",
        equipment_serial: "",
        equipment_memory: "",
        equipment_storage: "",
        equipment_processor: "",
        defects: "",
        technical_report: "",
        warranty_terms: companySettings?.warranty_terms || "",
        paid_amount: 0,
        notes: "",
      });
      setItems([]);
    }
    setDialogOpen(true);
  };

  const handleAddItem = (type: "product" | "service") => {
    setItems([...items, {
      item_type: type,
      product_id: null,
      service_id: null,
      name: "",
      unit: "UN",
      quantity: 1,
      unit_price: 0,
      discount: 0,
      subtotal: 0,
    }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;

    if (field === "product_id" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].name = product.name;
        newItems[index].unit_price = product.sale_price || 0;
        newItems[index].unit = product.unit || "UN";
      }
    }

    if (field === "service_id" && value) {
      const service = services.find((s) => s.id === value);
      if (service) {
        newItems[index].name = service.name;
        newItems[index].unit_price = service.sale_price || 0;
      }
    }

    const item = newItems[index];
    item.subtotal = (item.quantity * item.unit_price) - item.discount;

    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const productsTotal = items.filter((i) => i.item_type === "product").reduce((sum, i) => sum + i.subtotal, 0);
    const servicesTotal = items.filter((i) => i.item_type === "service").reduce((sum, i) => sum + i.subtotal, 0);
    const discountTotal = items.reduce((sum, i) => sum + i.discount, 0);
    const total = productsTotal + servicesTotal;
    return { productsTotal, servicesTotal, discountTotal, total };
  };

  const handleSave = async () => {
    if (!formData.client_id) return;

    const totals = calculateTotals();
    const orderData = {
      ...formData,
      products_total: totals.productsTotal,
      services_total: totals.servicesTotal,
      discount_total: totals.discountTotal,
      total_amount: totals.total,
    };

    if (editingOrder) {
      updateServiceOrder({ id: editingOrder.id, ...orderData } as any);
    } else {
      await createServiceOrder(orderData as any);
    }
    setDialogOpen(false);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas ordens de serviço</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova OS
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <Loader className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhuma ordem de serviço encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.order_number}</TableCell>
                    <TableCell>{order.clients?.name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        {order.equipment_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.entry_date ? format(new Date(order.entry_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[order.priority || "medium"]}>
                        {priorityLabels[order.priority || "medium"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status || "pending"]}>
                        {statusLabels[order.status || "pending"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <DocumentActionsMenu
                        document={order}
                        documentType="service_order"
                        onEdit={() => handleOpenDialog(order)}
                        onDelete={() => deleteServiceOrder(order.id)}
                        client={order.clients}
                        items={[]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? `Editar OS #${editingOrder.order_number}` : "Nova Ordem de Serviço"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="cliente" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="equipamento">Equipamento</TabsTrigger>
              <TabsTrigger value="servicos">Serviços/Peças</TabsTrigger>
              <TabsTrigger value="laudo">Laudo</TabsTrigger>
              <TabsTrigger value="garantia">Garantia</TabsTrigger>
            </TabsList>

            <TabsContent value="cliente" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cliente *</label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Técnico</label>
                  <Select value={formData.technician_id} onValueChange={(value) => setFormData({ ...formData, technician_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Responsável</label>
                  <Select value={formData.responsible_id} onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data de Entrada</label>
                  <Input
                    type="datetime-local"
                    value={formData.entry_date ? formData.entry_date.slice(0, 16) : ""}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Data de Saída</label>
                  <Input
                    type="datetime-local"
                    value={formData.exit_date ? formData.exit_date.slice(0, 16) : ""}
                    onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
                  />
                </div>
              </div>

              {['approved', 'completed', 'delivered'].includes(formData.status) && (
                <div>
                  <label className="text-sm font-medium">Valor Pago (Parcial)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.paid_amount || ""}
                    onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe em branco ou 0 para gerar todo o valor em contas a receber
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="equipamento" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome do Equipamento</label>
                  <Input
                    value={formData.equipment_name}
                    onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                    placeholder="Ex: Notebook, Desktop, Impressora..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Marca</label>
                  <Input
                    value={formData.equipment_brand}
                    onChange={(e) => setFormData({ ...formData, equipment_brand: e.target.value })}
                    placeholder="Ex: Dell, HP, Samsung..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Modelo</label>
                  <Input
                    value={formData.equipment_model}
                    onChange={(e) => setFormData({ ...formData, equipment_model: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Número de Série</label>
                  <Input
                    value={formData.equipment_serial}
                    onChange={(e) => setFormData({ ...formData, equipment_serial: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Memória RAM</label>
                  <Input
                    value={formData.equipment_memory}
                    onChange={(e) => setFormData({ ...formData, equipment_memory: e.target.value })}
                    placeholder="Ex: 8 GB"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Armazenamento</label>
                  <Input
                    value={formData.equipment_storage}
                    onChange={(e) => setFormData({ ...formData, equipment_storage: e.target.value })}
                    placeholder="Ex: SSD 256 GB"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Processador</label>
                  <Input
                    value={formData.equipment_processor}
                    onChange={(e) => setFormData({ ...formData, equipment_processor: e.target.value })}
                    placeholder="Ex: Intel i5"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Defeitos Relatados</label>
                <Textarea
                  value={formData.defects}
                  onChange={(e) => setFormData({ ...formData, defects: e.target.value })}
                  rows={4}
                  placeholder="Descreva os problemas relatados pelo cliente..."
                />
              </div>
            </TabsContent>

            <TabsContent value="servicos" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleAddItem("service")}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
                <Button variant="outline" onClick={() => handleAddItem("product")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Peça/Produto
                </Button>
              </div>

              {items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Desc.</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">
                            {item.item_type === "product" ? "Peça" : "Serviço"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.item_type === "product" ? (
                            <Select
                              value={item.product_id || ""}
                              onValueChange={(value) => handleItemChange(index, "product_id", value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Select
                              value={item.service_id || ""}
                              onValueChange={(value) => handleItemChange(index, "service_id", value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {services.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <DiscountInput
                            value={item.discount}
                            onChange={(value) => handleItemChange(index, "discount", value)}
                            baseValue={item.quantity * item.unit_price}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.subtotal)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Peças/Produtos:</span>
                  <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totals.productsTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Serviços:</span>
                  <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totals.servicesTotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totals.total)}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="laudo" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Laudo Técnico</label>
                <Textarea
                  value={formData.technical_report}
                  onChange={(e) => setFormData({ ...formData, technical_report: e.target.value })}
                  rows={8}
                  placeholder="Descreva o diagnóstico técnico, procedimentos realizados e observações..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Observações Gerais</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Outras observações sobre a ordem de serviço..."
                />
              </div>
            </TabsContent>

            <TabsContent value="garantia" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Termos de Garantia</label>
                <Textarea
                  value={formData.warranty_terms}
                  onChange={(e) => setFormData({ ...formData, warranty_terms: e.target.value })}
                  rows={10}
                  placeholder="Termos e condições de garantia..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdensServico;
