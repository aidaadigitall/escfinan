import { useState, useEffect } from "react";
import { useProducts, Product } from "@/hooks/useProducts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Loader, Package, DollarSign, TrendingUp, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { UnitManagerDialog, getUnits } from "@/components/UnitManagerDialog";

const Produtos = () => {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unitManagerOpen, setUnitManagerOpen] = useState(false);
  const [units, setUnits] = useState(getUnits());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    unit: "UN",
    cost_price: 0,
    sale_price: 0,
    stock_quantity: 0,
    min_stock: 0,
    category: "",
    is_active: true,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const refreshUnits = () => {
    setUnits(getUnits());
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        unit: product.unit || "UN",
        cost_price: product.cost_price || 0,
        sale_price: product.sale_price || 0,
        stock_quantity: product.stock_quantity || 0,
        min_stock: product.min_stock || 0,
        category: product.category || "",
        is_active: product.is_active ?? true,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        sku: "",
        unit: "UN",
        cost_price: 0,
        sale_price: 0,
        stock_quantity: 0,
        min_stock: 0,
        category: "",
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Nome do produto é obrigatório");
      return;
    }

    const dataToSave = {
      name: formData.name,
      description: formData.description || undefined,
      sku: formData.sku || undefined,
      unit: formData.unit,
      cost_price: formData.cost_price,
      sale_price: formData.sale_price,
      stock_quantity: formData.stock_quantity,
      min_stock: formData.min_stock,
      category: formData.category || undefined,
      is_active: formData.is_active,
    };

    if (editingProduct) {
      updateProduct({ id: editingProduct.id, ...dataToSave });
    } else {
      createProduct(dataToSave);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(id);
    }
  };

  // Calculated fields
  const profitAmount = formData.sale_price - formData.cost_price;
  const profitMargin = formData.cost_price > 0 
    ? ((formData.sale_price - formData.cost_price) / formData.cost_price) * 100 
    : 0;
  const markup = formData.cost_price > 0 
    ? ((formData.sale_price - formData.cost_price) / formData.cost_price) * 100 
    : 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Preço Custo</TableHead>
              <TableHead>Preço Venda</TableHead>
              <TableHead>Lucro</TableHead>
              <TableHead>Markup %</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <Loader className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhum produto cadastrado
                </TableCell>
              </TableRow>
            ) : filteredProducts.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell className="font-medium">{produto.name}</TableCell>
                <TableCell>{produto.sku || '-'}</TableCell>
                <TableCell>
                  {produto.cost_price?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </TableCell>
                <TableCell>
                  {produto.sale_price?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </TableCell>
                <TableCell className="text-green-600">
                  {produto.profit_amount?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </TableCell>
                <TableCell>{produto.markup?.toFixed(1)}%</TableCell>
                <TableCell>{produto.stock_quantity}</TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      produto.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {produto.is_active ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(produto)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(produto.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Precificação
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Estoque
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do Produto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Código</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Código de Referência"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="unit">Unidade</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setUnitManagerOpen(true)}
                      className="h-6 px-2 text-xs"
                    >
                      <Settings2 className="h-3 w-3 mr-1" />
                      Gerenciar
                    </Button>
                  </div>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.sigla} value={unit.sigla}>
                          {unit.sigla} - {unit.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Categoria do produto"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição detalhada do produto"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    id="is_active"
                    className="h-4 w-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Produto Ativo
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Preço de Custo (R$)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Calculated Fields */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">Análise de Precificação</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-background p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Lucro (R$)</p>
                    <p className={`text-2xl font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                    <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMargin.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Markup</p>
                    <p className={`text-2xl font-bold ${markup >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {markup.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Margem de Lucro e Markup são calculados automaticamente com base no preço de custo e venda
                </p>
              </div>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stock">Estoque Mínimo</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta quando estoque atingir este valor
                  </p>
                </div>
              </div>

              {formData.stock_quantity <= formData.min_stock && formData.min_stock > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                  ⚠️ Atenção: Estoque abaixo ou igual ao mínimo definido!
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnitManagerDialog 
        open={unitManagerOpen} 
        onOpenChange={setUnitManagerOpen}
        onUnitsChange={refreshUnits}
      />
    </div>
  );
};

export default Produtos;
