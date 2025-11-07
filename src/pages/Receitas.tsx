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

const summaryData = [
  { label: "Vencidos", value: "499,90", variant: "expense" as const },
  { label: "Vencem hoje", value: "130,00", variant: "warning" as const },
  { label: "A vencer", value: "7.758,54", variant: "pending" as const },
  { label: "Recebidos", value: "522,58", variant: "income" as const },
  { label: "Total", value: "8.911,02", variant: "default" as const },
];

const transactions = [
  {
    id: "10940",
    description: "Empréstimo Elton",
    entity: "Elton Santos",
    account: "Recebimento de empréstimo",
    payment: "PIX",
    date: "03/11/2025",
    status: "Confirmada",
    value: "89,34",
  },
  {
    id: "9902",
    description: "Contrato de serviços nº 124 (2/6)",
    entity: "MARTELENA ALMEIDA",
    account: "Contratos de serviços",
    payment: "PIX",
    date: "04/11/2025",
    status: "Confirmada",
    value: "31,44",
  },
  {
    id: "9903",
    description: "Contrato de serviços nº 124 (2/6)",
    entity: "MARTELENA ALMEIDA",
    account: "Contratos de serviços",
    payment: "PIX",
    date: "04/11/2025",
    status: "Confirmada",
    value: "31,14",
  },
];

const Receitas = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Busca avançada
          </Button>
          <Button size="sm">
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
                  <Badge className="bg-income text-income-foreground">
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">{transaction.value}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4 text-warning" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-expense" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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

export default Receitas;
