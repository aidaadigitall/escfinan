import { Card } from "@/components/ui/card";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { Building2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const BankAccountsCard = () => {
  const { accounts: bankAccounts, isLoading } = useBankAccounts();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contas Bancárias</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  const totalBalance = bankAccounts.reduce(
    (sum, account) => sum + parseFloat(account.current_balance.toString()),
    0
  );

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Contas Bancárias</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/boletos-bancarios")}
        >
          Ver todas
        </Button>
      </div>

      <div className="mb-6 p-4 bg-primary/10 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">Saldo Total</p>
        <p className={`text-2xl font-bold ${
          totalBalance >= 0 ? "text-income" : "text-expense"
        }`}>
          R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="space-y-3">
        {bankAccounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma conta bancária cadastrada
          </p>
        ) : (
          bankAccounts.slice(0, 4).map((account) => {
            const balance = parseFloat(account.current_balance.toString());
            const isPositive = balance >= 0;

            return (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.bank_name || "Banco"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${
                    isPositive ? "text-income" : "text-expense"
                  }`}>
                    R$ {Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-income" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-expense" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {bankAccounts.length > 4 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3"
          onClick={() => navigate("/boletos-bancarios")}
        >
          Ver mais {bankAccounts.length - 4} contas
        </Button>
      )}
    </Card>
  );
};