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

const recebimentos = [
  {
    date: "03/11/2025",
    description: "Empréstimo Elton - Elton Santos",
    account: "Recebimento de empréstimo",
    costCenter: "",
    status: "Confirmada",
    value: 85.34,
  },
  {
    date: "04/11/2025",
    description: "Contrato de serviços nº 124 (2/6) - MARTELENA ALMEIDA",
    account: "Contratos de serviços",
    costCenter: "",
    status: "Confirmada",
    value: 31.44,
  },
];

const pagamentos = [
  {
    date: "01/11/2025",
    description: "Chat GPT Plus (4/12) - Chat GPT",
    account: "Licença ou aluguel de softwares",
    costCenter: "",
    status: "Atrasado",
    value: -120.00,
  },
  {
    date: "01/11/2025",
    description: "Pro Labore (102/111) - Elisa Souza",
    account: "Pró Labore",
    costCenter: "",
    status: "Confirmado",
    value: -4.40,
  },
];

const totals = {
  totalRecebido: 322.58,
  totalAReceber: 8388.44,
  totalPago: 794.35,
  totalAPagar: 12190.15,
  total: -4073.47,
};

export const ResumoTab = () => {
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

      {/* Recebimentos */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold">Recebimentos</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-income/20">
                <TableHead>Data</TableHead>
                <TableHead>Descrição do recebimento</TableHead>
                <TableHead>Plano de contas</TableHead>
                <TableHead>Centro de custo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recebimentos.map((item, index) => (
                <TableRow key={index} className="bg-income/10">
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.account}</TableCell>
                  <TableCell>{item.costCenter}</TableCell>
                  <TableCell>
                    <Badge className="bg-income text-income-foreground">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <div className="text-right pr-4">
          <span className="text-lg font-bold">Valor Total: </span>
          <span className="text-2xl font-bold text-income">8.911,02</span>
        </div>
      </div>

      {/* Pagamentos */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold">Pagamentos</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-expense/20">
                <TableHead>Data</TableHead>
                <TableHead>Descrição do pagamento</TableHead>
                <TableHead>Plano de contas</TableHead>
                <TableHead>Centro de custo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos.map((item, index) => (
                <TableRow key={index} className="bg-expense/10">
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.account}</TableCell>
                  <TableCell>{item.costCenter}</TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        item.status === "Confirmado" 
                          ? "bg-income text-income-foreground" 
                          : "bg-destructive text-destructive-foreground"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <div className="text-right pr-4">
          <span className="text-lg font-bold">Valor Total: </span>
          <span className="text-2xl font-bold text-expense">-12.984,48</span>
        </div>
      </div>

      {/* Total Summary */}
      <Card className="p-6 bg-muted/30">
        <h3 className="text-xl font-bold mb-4">Total</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total recebido</span>
            <span className="font-semibold">{totals.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-income">Total a receber</span>
            <span className="font-semibold text-income">{totals.totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span>Total pago</span>
            <span className="font-semibold">{totals.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-expense">Total a pagar</span>
            <span className="font-semibold text-expense">{totals.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-lg font-bold">Total</span>
            <span className="text-xl font-bold text-expense">{totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
