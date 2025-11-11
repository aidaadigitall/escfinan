import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";

type ParsedTransaction = {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  identifier?: string;
};

type BankStatementImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccountId: string;
  bankAccountName: string;
};

export const BankStatementImportDialog = ({
  open,
  onOpenChange,
  bankAccountId,
  bankAccountName,
}: BankStatementImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const parseCSV = (text: string): ParsedTransaction[] => {
    const lines = text.split("\n").filter(line => line.trim());
    const transactions: ParsedTransaction[] = [];
    
    // Skip header (first line)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(",");
      
      if (parts.length < 3) continue;
      
      try {
        const dateStr = parts[0].trim();
        const valueStr = parts[1].trim();
        const identifier = parts[2]?.trim();
        const description = parts[3]?.trim() || "Transação importada";
        
        // Parse date DD/MM/YYYY
        const [day, month, year] = dateStr.split("/");
        const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        
        // Parse value
        const amount = parseFloat(valueStr);
        
        transactions.push({
          date,
          description,
          amount: Math.abs(amount),
          type: amount >= 0 ? "income" : "expense",
          identifier,
        });
      } catch (error) {
        console.error("Error parsing CSV line:", line, error);
      }
    }
    
    return transactions;
  };

  const parseOFX = (text: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    
    // Extract transaction blocks
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;
    
    while ((match = stmtTrnRegex.exec(text)) !== null) {
      const transactionBlock = match[1];
      
      try {
        // Extract fields
        const trnTypeMatch = transactionBlock.match(/<TRNTYPE>(.*?)<\/TRNTYPE>/);
        const dtPostedMatch = transactionBlock.match(/<DTPOSTED>(.*?)<\/DTPOSTED>/);
        const trnAmtMatch = transactionBlock.match(/<TRNAMT>(.*?)<\/TRNAMT>/);
        const fitIdMatch = transactionBlock.match(/<FITID>(.*?)<\/FITID>/);
        const memoMatch = transactionBlock.match(/<MEMO>(.*?)<\/MEMO>/);
        
        if (!dtPostedMatch || !trnAmtMatch) continue;
        
        // Parse date from YYYYMMDD format
        const dateStr = dtPostedMatch[1].substring(0, 8);
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const date = `${year}-${month}-${day}`;
        
        // Parse amount
        const amount = parseFloat(trnAmtMatch[1]);
        
        // Get description from MEMO or use default
        const description = memoMatch?.[1]?.trim() || "Transação importada";
        
        transactions.push({
          date,
          description,
          amount: Math.abs(amount),
          type: amount >= 0 ? "income" : "expense",
          identifier: fitIdMatch?.[1],
        });
      } catch (error) {
        console.error("Error parsing OFX transaction:", error);
      }
    }
    
    return transactions;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      let parsed: ParsedTransaction[] = [];
      
      // Detect format and parse
      if (selectedFile.name.toLowerCase().endsWith(".csv")) {
        parsed = parseCSV(text);
      } else if (selectedFile.name.toLowerCase().endsWith(".ofx")) {
        parsed = parseOFX(text);
      } else {
        toast.error("Formato de arquivo não suportado. Use CSV ou OFX.");
        return;
      }
      
      if (parsed.length === 0) {
        toast.error("Não foi possível extrair transações do arquivo.");
        return;
      }
      
      setParsedTransactions(parsed);
      setStep("preview");
      toast.success(`${parsed.length} transações encontradas!`);
    };
    
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (parsedTransactions.length === 0) return;
    
    setIsImporting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      let imported = 0;
      let errors = 0;
      
      for (const transaction of parsedTransactions) {
        try {
          // Check if transaction already exists by identifier
          if (transaction.identifier) {
            const { data: existing } = await supabase
              .from("transactions")
              .select("id")
              .eq("notes", `ID: ${transaction.identifier}`)
              .eq("bank_account_id", bankAccountId)
              .maybeSingle();
            
            if (existing) {
              // Skip duplicate
              continue;
            }
          }
          
          await supabase.from("transactions").insert({
            user_id: user.id,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            status: "confirmed",
            due_date: transaction.date,
            paid_date: transaction.date,
            paid_amount: transaction.amount,
            bank_account_id: bankAccountId,
            notes: transaction.identifier ? `ID: ${transaction.identifier}` : undefined,
          });
          
          imported++;
        } catch (error) {
          console.error("Error importing transaction:", error);
          errors++;
        }
      }
      
      if (imported > 0) {
        toast.success(`${imported} transação(ões) importada(s) com sucesso!`);
      }
      if (errors > 0) {
        toast.error(`${errors} transação(ões) já existiam ou tiveram erro`);
      }
      
      // Reset and close
      setFile(null);
      setParsedTransactions([]);
      setStep("upload");
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Erro ao importar transações");
    } finally {
      setIsImporting(false);
    }
  };

  const handleBack = () => {
    setStep("upload");
    setParsedTransactions([]);
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Importar Extrato - {bankAccountName}
          </DialogTitle>
        </DialogHeader>
        
        {step === "upload" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statement-file">Arquivo do Extrato</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="statement-file"
                  type="file"
                  accept=".csv,.ofx"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Formatos suportados: CSV e OFX (Nubank e outros bancos)
              </p>
            </div>
            
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Instruções:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Baixe o extrato do seu banco no formato CSV ou OFX</li>
                    <li>O sistema irá detectar automaticamente o formato</li>
                    <li>Você poderá revisar as transações antes de importar</li>
                    <li>Transações duplicadas (com mesmo ID) serão ignoradas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">
                  {parsedTransactions.length} transações encontradas
                </span>
              </div>
              <Badge variant="outline">
                {file?.name}
              </Badge>
            </div>
            
            <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(transaction.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
                          {transaction.type === "income" ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Todas as transações serão importadas como <strong>confirmadas</strong> 
                com data de vencimento e pagamento iguais à data da transação no extrato.
              </p>
            </div>
          </div>
        )}
        
        <DialogFooter>
          {step === "preview" && (
            <Button variant="outline" onClick={handleBack} disabled={isImporting}>
              Voltar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancelar
          </Button>
          {step === "preview" && (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Confirmar Importação
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};