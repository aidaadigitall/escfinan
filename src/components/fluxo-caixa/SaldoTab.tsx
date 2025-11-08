import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const transactions = [
  {
    entity: "Cliente",
    client: "",
    description: "Chat GPT Plus (4/12) - Chat GPT",
    account: "Licença ou aluguel de softwares",
    movement: "Atrasado",
    value: -120.00,
    type: "expense",
  },
  {
    entity: "Cliente",
    client: "",
    description: "Pro Labore (102/111) - Elisa Souza",
    account: "Pró Labore",
    movement: "Confirmado",
    value: -4.40,
    type: "expense",
  },
  {
    entity: "Cliente",
    client: "",
    description: "Lanche - Padaria",
    account: "Alimentação",
    movement: "Confirmado",
    value: -30.60,
    type: "expense",
  },
  {
    entity: "Cliente",
    client: "",
    description: "Veja - Supermercado",
    account: "Material para uso interno",
    movement: "Confirmado",
    value: -5.00,
    type: "expense",
  },
  {
    entity: "Cliente",
    client: "",
    description: "Compra de nº 704 - Techouse Computadores 🏠",
    account: "Compras",
    movement: "Confirmado",
    value: -140.00,
    type: "expense",
  },
];

export const SaldoTab = () => {
  return (
    <div className="space-y-6">
      {/* Header with balance */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Pagamentos X Recebimentos</h3>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Saldo:</p>
              <p className="text-2xl font-bold text-expense">-271,81</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo final previsto:</p>
              <p className="text-2xl font-bold text-expense">-4.073,47</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entidade</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Plano de contas</TableHead>
              <TableHead>Movimentação</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index} className={transaction.type === "expense" ? "bg-expense/10" : "bg-income/10"}>
                <TableCell>{transaction.entity}</TableCell>
                <TableCell>{transaction.client}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.account}</TableCell>
                <TableCell>
                  <Badge 
                    className={
                      transaction.movement === "Confirmado" 
                        ? "bg-income text-income-foreground" 
                        : "bg-destructive text-destructive-foreground"
                    }
                  >
                    {transaction.movement}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {transaction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
