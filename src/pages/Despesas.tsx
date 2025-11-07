import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

const summaryData = [
  { label: "Vencidos", value: "1.250,00", variant: "expense" as const },
  { label: "Vencem hoje", value: "200,00", variant: "warning" as const },
  { label: "A vencer", value: "8.534,49", variant: "pending" as const },
  { label: "Pagos", value: "794,39", variant: "income" as const },
  { label: "Total", value: "10.778,88", variant: "default" as const },
];

const transactions = [
  {
    id: "10945",
    description: "Conta de luz - Novembro",
    entity: "Cemig",
    account: "Contas de consumo",
    payment: "Boleto",
    date: "05/11/2025",
    status: "Pendente",
    value: "245,80",
  },
  {
    id: "10944",
    description: "Aluguel - Novembro",
    entity: "Imobiliária Silva",
    account: "Moradia",
    payment: "PIX",
    date: "10/11/2025",
    status: "Pendente",
    value: "1.500,00",
  },
  {
    id: "10943",
    description: "Internet - Novembro",
    entity: "Vivo Fibra",
    account: "Contas de consumo",
    payment: "PIX",
    date: "15/11/2025",
    status: "Pago",
    value: "99,90",
  },
];

const Despesas = () => {
  const handleAdvancedSearch = () => {
    toast.info("Busca avançada em desenvolvimento");
  };

  const handleAdd = () => {
    toast.info("Adicionar nova conta a pagar em desenvolvimento");
  };

  const handleView = (id: string) => {
    toast.info(`Visualizar conta ${id}`);
  };

  const handleEdit = (id: string) => {
    toast.info(`Editar conta ${id}`);
  };

  const handleDelete = (id: string) => {
    toast.success(`Conta ${id} excluída com sucesso`);
  };

  const handleCopy = (id: string) => {
    toast.success(`Conta ${id} copiada com sucesso`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contas a Pagar</h1>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleAdvancedSearch}>
            <Search className="h-4 w-4 mr-2" />
            Busca avançada
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryData.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${
              item.variant === "income" ? "text-income" :
              item.variant === "expense" ? "text-expense" :
              item.variant === "warning" ? "text-warning" :
              item.variant === "pending" ? "text-pending" :
              "text-foreground"
            }`}>
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Plano de contas</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.id}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.entity}</TableCell>
                <TableCell>{transaction.account}</TableCell>
                <TableCell>{transaction.payment}</TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>
                  <Badge className={
                    transaction.status === "Pago" 
                      ? "bg-income text-income-foreground" 
                      : "bg-warning text-warning-foreground"
                  }>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">{transaction.value}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleView(transaction.id)}
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(transaction.id)}
                    >
                      <Edit className="h-4 w-4 text-warning" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-expense" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleCopy(transaction.id)}
                    >
                      <Copy className="h-4 w-4 text-income" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Despesas;
