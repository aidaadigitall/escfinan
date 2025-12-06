import { Card } from "@/components/ui/card";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { Building2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface BankAccountsCardProps {
  hideValues?: boolean;
}

export const BankAccountsCard = ({ hideValues = false }: BankAccountsCardProps) => {
  const { accounts: bankAccounts, isLoading } = useBankAccounts();
  const navigate = useNavigate();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    bankAccounts.map(acc => acc.id)
  );

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

  // Filter accounts based on selection
  const visibleAccounts = bankAccounts.filter(acc => 
    selectedAccounts.includes(acc.id)
  );

  // Calculate max balance for chart scaling
  const maxBalance = Math.max(
    ...bankAccounts.map(acc => Math.abs(parseFloat(acc.current_balance.toString()))),
    100
  );

  // Toggle account visibility
  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  // Define colors for accounts
  const accountColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Contas bancárias</h3>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/auxiliares/contas-bancarias")}
          className="h-8 w-8"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      {bankAccounts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhuma conta bancária cadastrada
        </p>
      ) : (
        <>
          {/* Chart Area */}
          <div className="mb-6">
            <div className="h-48 flex items-end gap-2 mb-2">
              {visibleAccounts.map((account, index) => {
                const balance = hideValues ? 50 : Math.abs(parseFloat(account.current_balance.toString()));
                const heightPercentage = hideValues ? 50 : (balance / maxBalance) * 100;
                const color = accountColors[index % accountColors.length];

                return (
                  <div key={account.id} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: "180px" }}>
                      <div
                        className="w-full rounded-t transition-all duration-300"
                        style={{
                          height: `${heightPercentage}%`,
                          backgroundColor: color,
                          minHeight: "8px"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-muted-foreground border-t pt-2">
              Saldo atual
            </div>
          </div>

          {/* Account List with Checkboxes */}
          <div className="border rounded-lg p-3 mb-4">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {bankAccounts.map((account, index) => {
                const color = accountColors[index % accountColors.length];
                
                return (
                  <div key={account.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`account-${account.id}`}
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={() => toggleAccount(account.id)}
                    />
                    <label
                      htmlFor={`account-${account.id}`}
                      className="flex items-center gap-2 flex-1 cursor-pointer text-sm"
                    >
                      <div 
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="flex-1">{account.name}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend with Values */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {visibleAccounts.map((account, index) => {
              const balance = parseFloat(account.current_balance.toString());
              const color = accountColors[index % accountColors.length];
              
              return (
                <div key={account.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{account.name}</div>
                    <div className={`text-xs ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                      {hideValues ? "••••••" : `(${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};
