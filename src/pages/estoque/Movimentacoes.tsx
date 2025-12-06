import { useState, useEffect } from "react";
import { useProducts, Product } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, RefreshCw, Package, Loader } from "lucide-react";
import { toast } from "sonner";

interface StockMovement {
  id: string;
  date: string;
  type: "entrada" | "saida" | "ajuste" | "venda" | "os";
  product_id: string;
  product_name: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  responsible: string;
  notes: string;
}

const STORAGE_KEY = "stock_movements";

const movementTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  entrada: { label: "Entrada", color: "bg-green-100 text-green-800", icon: ArrowUpCircle },
  saida: { label: "Saída", color: "bg-red-100 text-red-800", icon: ArrowDownCircle },
  ajuste: { label: "Ajuste", color: "bg-blue-100 text-blue-800", icon: RefreshCw },
  venda: { label: "Venda", color: "bg-purple-100 text-purple-800", icon: Package },
  os: { label: "Ordem de Serviço", color: "bg-orange-100 text-orange-800", icon: Package },
};

const Movimentacoes = () => {
  const { products, updateProduct } = useProducts();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    type: "entrada" as "entrada" | "saida" | "ajuste" | "venda" | "os",
    product_id: "",
    quantity: 0,
    responsible: "",
    notes: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setMovements(JSON.parse(stored));
    }
  }, []);

  const saveMovements = (newMovements: StockMovement[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMovements));
    setMovements(newMovements);
  };

  const filteredMovements = movements.filter(
    (m) =>
      m.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.responsible?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = () => {
    setFormData({
      type: "entrada",
      product_id: "",
      quantity: 0,
      responsible: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.product_id || formData.quantity <= 0) {
      toast.error("Selecione um produto e informe a quantidade");
      return;
    }

    const product = products.find((p) => p.id === formData.product_id);
    if (!product) {
      toast.error("Produto não encontrado");
      return;
    }

    const stockBefore = product.stock_quantity || 0;
    let stockAfter = stockBefore;

    if (formData.type === "entrada") {
      stockAfter = stockBefore + formData.quantity;
    } else if (formData.type === "saida" || formData.type === "venda" || formData.type === "os") {
      if (formData.quantity > stockBefore) {
        toast.error("Quantidade insuficiente em estoque");
        return;
      }
      stockAfter = stockBefore - formData.quantity;
    } else if (formData.type === "ajuste") {
      stockAfter = formData.quantity;
    }

    // Update product stock
    updateProduct({
      id: product.id,
      stock_quantity: stockAfter,
    });

    // Create movement record
    const newMovement: StockMovement = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: formData.type,
      product_id: product.id,
      product_name: product.name,
      quantity: formData.quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      responsible: formData.responsible,
      notes: formData.notes,
    };

    const newMovements = [newMovement, ...movements];
    saveMovements(newMovements);
    setDialogOpen(false);
    toast.success("Movimentação registrada com sucesso");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Movimentações de Estoque</h1>
          <p className="text-muted-foreground mt-1">Controle de entradas, saídas e ajustes</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Movimentação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto ou responsável..."
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
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Estoque Ant.</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma movimentação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((movement) => {
                  const config = movementTypeConfig[movement.type];
                  const Icon = config.icon;
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {format(new Date(movement.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{movement.product_name}</TableCell>
                      <TableCell className="text-right">{movement.quantity}</TableCell>
                      <TableCell className="text-right">{movement.stock_before}</TableCell>
                      <TableCell className="text-right font-medium">{movement.stock_after}</TableCell>
                      <TableCell>{movement.responsible || "-"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo de Movimentação *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste de Estoque</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="os">Ordem de Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Produto *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Estoque: {product.stock_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                {formData.type === "ajuste" ? "Novo Estoque *" : "Quantidade *"}
              </Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                min="0"
              />
              {formData.type === "ajuste" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Informe o valor absoluto do novo estoque
                </p>
              )}
            </div>

            <div>
              <Label>Responsável</Label>
              <Input
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionais..."
                rows={2}
              />
            </div>
          </div>

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

export default Movimentacoes;
