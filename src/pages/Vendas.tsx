import { useState } from "react";
import { useSales } from "@/hooks/useSales";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useServices } from "@/hooks/useServices";
import { useEmployees } from "@/hooks/useEmployees";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon, Search, Loader, ShoppingCart, Trash2 } from "lucide-react";
import { DiscountInput } from "@/components/DiscountInput";
import { DocumentActionsMenu } from "@/components/DocumentActionsMenu";

interface SaleItem {
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
  approved: "bg-emerald-100 text-emerald-800",
  confirmed: "bg-green-100 text-green-800",
  delivered: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  confirmed: "Confirmado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const Vendas = () => {
  const { sales, isLoading, createSale, updateSale, deleteSale } = useSales();
  const { clients } = useClients();
  const { products } = useProducts();
  const { services } = useServices();
  const { employees } = useEmployees();
  const { paymentMethods } = usePaymentMethods();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [saleDateOpen, setSaleDateOpen] = useState(false);
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    seller_id: "",
    sale_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    payment_method: "",
    status: "pending",
    paid_amount: 0,
    notes: "",
    warranty_terms: "",
  });

  const filteredSales = sales.filter(
    (s: any) => s.sale_number?.toString().includes(searchTerm) ||
    s.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (sale?: any) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        client_id: sale.client_id || "",
        seller_id: sale.seller_id || "",
        sale_date: sale.sale_date || new Date().toISOString().split("T")[0],
        delivery_date: sale.delivery_date || "",
        payment_method: sale.payment_method || "",
        status: sale.status || "pending",
        paid_amount: sale.paid_amount || 0,
        notes: sale.notes || "",
        warranty_terms: sale.warranty_terms || "",
      });
      setItems([]);
    } else {
      setEditingSale(null);
      setFormData({
        client_id: "",
        seller_id: "",
        sale_date: new Date().toISOString().split("T")[0],
        delivery_date: "",
        payment_method: "",
        status: "pending",
        paid_amount: 0,
        notes: "",
        warranty_terms: "",
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
    
    // Ensure dates are in ISO format
    let saleDate = formData.sale_date;
    let deliveryDate = formData.delivery_date;

    if (saleDate && !saleDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      try {
        const date = new Date(saleDate);
        saleDate = !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      } catch {
        saleDate = new Date().toISOString().split("T")[0];
      }
    }

    if (deliveryDate && !deliveryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      try {
        const date = new Date(deliveryDate);
        deliveryDate = !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : "";
      } catch {
        deliveryDate = "";
      }
    }

    const saleData = {
      ...formData,
      sale_date: saleDate,
      delivery_date: deliveryDate || null,
      products_total: totals.productsTotal,
      services_total: totals.servicesTotal,
      discount_total: totals.discountTotal,
      total_amount: totals.total,
    };

    if (editingSale) {
      updateSale({ id: editingSale.id, ...saleData } as any);
    } else {
      await createSale(saleData as any);
    }
    setDialogOpen(false);
  };

  const handleSaleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData({ ...formData, sale_date: format(date, "yyyy-MM-dd") });
    }
    setSaleDateOpen(false);
  };

  const handleDeliveryDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData({ ...formData, delivery_date: format(date, "yyyy-MM-dd") });
    } else {
      setFormData({ ...formData, delivery_date: "" });
    }
    setDeliveryDateOpen(false);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas vendas</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
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
                <TableHead>Data</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Loader className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">#{sale.sale_number}</TableCell>
                    <TableCell>{sale.clients?.name || "-"}</TableCell>
                    <TableCell>
                      {sale.sale_date ? format(new Date(sale.sale_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell>{sale.payment_method || "-"}</TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sale.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[sale.status || "pending"]}>
                        {statusLabels[sale.status || "pending"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DocumentActionsMenu
                        document={sale}
                        documentType="sale"
                        onEdit={() => handleOpenDialog(sale)}
                        onDelete={() => deleteSale(sale.id)}
                        client={sale.clients}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSale ? `Editar Venda #${editingSale.sale_number}` : "Nova Venda"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="itens">Itens</TabsTrigger>
              <TabsTrigger value="observacoes">Observações</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
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
                  <label className="text-sm font-medium">Vendedor</label>
                  <Select value={formData.seller_id} onValueChange={(value) => setFormData({ ...formData, seller_id: value })}>
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
                  <label className="text-sm font-medium">Data da Venda</label>
                  <Popover open={saleDateOpen} onOpenChange={setSaleDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.sale_date 
                          ? format(new Date(formData.sale_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) 
                          : "Selecionar"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.sale_date ? new Date(formData.sale_date + "T00:00:00") : undefined}
                        onSelect={handleSaleDateSelect}
                        locale={ptBR}
                        className="pointer-events-auto"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium">Prazo de Entrega</label>
                  <Popover open={deliveryDateOpen} onOpenChange={setDeliveryDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.delivery_date 
                          ? format(new Date(formData.delivery_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) 
                          : "Selecionar"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.delivery_date ? new Date(formData.delivery_date + "T00:00:00") : undefined}
                        onSelect={handleDeliveryDateSelect}
                        locale={ptBR}
                        className="pointer-events-auto"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium">Forma de Pagamento</label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {['approved', 'confirmed', 'delivered'].includes(formData.status) && (
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
              </div>
            </TabsContent>

            <TabsContent value="itens" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleAddItem("product")}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
                <Button variant="outline" onClick={() => handleAddItem("service")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
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
                            {item.item_type === "product" ? "Produto" : "Serviço"}
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
                  <span>Produtos:</span>
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

            <TabsContent value="observacoes" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Observações gerais da venda..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Termos de Garantia</label>
                <Textarea
                  value={formData.warranty_terms}
                  onChange={(e) => setFormData({ ...formData, warranty_terms: e.target.value })}
                  rows={4}
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

export default Vendas;
