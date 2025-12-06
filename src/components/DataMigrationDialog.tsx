import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRightLeft, Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";

interface DataMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MigrationMapping {
  sourceField: string;
  targetField: string;
}

const MIGRATION_TEMPLATES = {
  clients: {
    name: "Clientes",
    fields: ["name", "email", "phone", "document_type", "cpf", "cnpj", "company_name", "address", "city", "state", "zipcode", "notes"],
    required: ["name"],
  },
  suppliers: {
    name: "Fornecedores",
    fields: ["name", "email", "phone", "document_type", "cpf", "cnpj", "company_name", "address", "city", "state", "zipcode", "notes"],
    required: ["name"],
  },
  products: {
    name: "Produtos",
    fields: ["name", "description", "sku", "unit", "cost_price", "sale_price", "stock_quantity", "min_stock", "category"],
    required: ["name"],
  },
  services: {
    name: "Serviços",
    fields: ["name", "description", "cost_price", "sale_price", "estimated_hours", "category"],
    required: ["name"],
  },
  categories: {
    name: "Categorias",
    fields: ["name", "type"],
    required: ["name", "type"],
  },
  payment_methods: {
    name: "Formas de Pagamento",
    fields: ["name"],
    required: ["name"],
  },
  bank_accounts: {
    name: "Contas Bancárias",
    fields: ["name", "bank_name", "agency", "account_number", "account_type", "initial_balance"],
    required: ["name"],
  },
  employees: {
    name: "Funcionários",
    fields: ["name", "email", "phone", "cpf", "position", "salary"],
    required: ["name"],
  },
};

export function DataMigrationDialog({ open, onOpenChange }: DataMigrationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<keyof typeof MIGRATION_TEMPLATES>("clients");
  const [csvData, setCsvData] = useState("");
  const [jsonData, setJsonData] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const parseCSV = (csv: string): Record<string, string>[] => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/"/g, ""));
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim().replace(/"/g, ""));
      if (values.length === headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const mapFields = (data: Record<string, any>[], type: keyof typeof MIGRATION_TEMPLATES): any[] => {
    const template = MIGRATION_TEMPLATES[type];
    
    return data.map((row) => {
      const mapped: Record<string, any> = {};
      
      template.fields.forEach((field) => {
        // Try direct match
        if (row[field] !== undefined && row[field] !== "") {
          mapped[field] = row[field];
        }
        // Try common alternative names
        const alternatives: Record<string, string[]> = {
          name: ["nome", "razao_social", "razão social", "nome_fantasia"],
          email: ["e-mail", "e_mail", "correio"],
          phone: ["telefone", "tel", "celular", "fone"],
          cpf: ["CPF", "documento_cpf"],
          cnpj: ["CNPJ", "documento_cnpj"],
          company_name: ["razao_social", "razão social", "empresa"],
          address: ["endereco", "endereço", "logradouro"],
          city: ["cidade", "municipio", "município"],
          state: ["estado", "uf", "UF"],
          zipcode: ["cep", "CEP", "codigo_postal"],
          notes: ["observacoes", "observações", "obs"],
          cost_price: ["preco_custo", "preço_custo", "custo"],
          sale_price: ["preco_venda", "preço_venda", "venda", "preco", "preço"],
          stock_quantity: ["estoque", "quantidade", "qtd"],
          description: ["descricao", "descrição", "desc"],
        };

        if (!mapped[field] && alternatives[field]) {
          for (const alt of alternatives[field]) {
            if (row[alt] !== undefined && row[alt] !== "") {
              mapped[field] = row[alt];
              break;
            }
          }
        }
      });

      // Convert numeric fields
      ["cost_price", "sale_price", "stock_quantity", "min_stock", "initial_balance", "salary", "estimated_hours"].forEach((numField) => {
        if (mapped[numField]) {
          const value = String(mapped[numField]).replace(",", ".").replace(/[^\d.-]/g, "");
          mapped[numField] = parseFloat(value) || 0;
        }
      });

      // Set defaults
      if (type === "products") {
        mapped.stock_quantity = mapped.stock_quantity || 0;
        mapped.cost_price = mapped.cost_price || 0;
        mapped.sale_price = mapped.sale_price || 0;
        mapped.unit = mapped.unit || "UN";
      }

      if (type === "services") {
        mapped.cost_price = mapped.cost_price || 0;
        mapped.sale_price = mapped.sale_price || 0;
      }

      if (type === "bank_accounts") {
        mapped.initial_balance = mapped.initial_balance || 0;
      }

      if (type === "categories") {
        mapped.type = mapped.type || "expense";
      }

      if (type === "clients" || type === "suppliers") {
        mapped.document_type = mapped.cnpj ? "cnpj" : "cpf";
      }

      return mapped;
    });
  };

  const handleImportCSV = async () => {
    if (!csvData.trim()) {
      toast.error("Cole os dados CSV para importar");
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const parsedData = parseCSV(csvData);
      if (parsedData.length === 0) {
        toast.error("Nenhum dado válido encontrado no CSV");
        setLoading(false);
        return;
      }

      const mappedData = mapFields(parsedData, selectedType);
      const template = MIGRATION_TEMPLATES[selectedType];
      
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < mappedData.length; i++) {
        const record = mappedData[i];
        
        // Check required fields
        const missingRequired = template.required.filter((field) => !record[field]);
        if (missingRequired.length > 0) {
          errors.push(`Linha ${i + 2}: campos obrigatórios faltando (${missingRequired.join(", ")})`);
          continue;
        }

        const { error } = await supabase
          .from(selectedType)
          .insert({ ...record, user_id: user.id, is_active: true });

        if (error) {
          errors.push(`Linha ${i + 2}: ${error.message}`);
        } else {
          successCount++;
        }
      }

      setImportResult({ success: successCount, errors });
      
      if (successCount > 0) {
        toast.success(`${successCount} registros importados com sucesso!`);
      }
      if (errors.length > 0) {
        toast.warning(`${errors.length} registros com erros`);
      }

    } catch (error: any) {
      toast.error(error.message || "Erro ao importar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleImportJSON = async () => {
    if (!jsonData.trim()) {
      toast.error("Cole os dados JSON para importar");
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const parsedData = JSON.parse(jsonData);
      const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      const mappedData = mapFields(dataArray, selectedType);
      const template = MIGRATION_TEMPLATES[selectedType];
      
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < mappedData.length; i++) {
        const record = mappedData[i];
        
        // Check required fields
        const missingRequired = template.required.filter((field) => !record[field]);
        if (missingRequired.length > 0) {
          errors.push(`Registro ${i + 1}: campos obrigatórios faltando (${missingRequired.join(", ")})`);
          continue;
        }

        const { error } = await supabase
          .from(selectedType)
          .insert({ ...record, user_id: user.id, is_active: true });

        if (error) {
          errors.push(`Registro ${i + 1}: ${error.message}`);
        } else {
          successCount++;
        }
      }

      setImportResult({ success: successCount, errors });
      
      if (successCount > 0) {
        toast.success(`${successCount} registros importados com sucesso!`);
      }
      if (errors.length > 0) {
        toast.warning(`${errors.length} registros com erros`);
      }

    } catch (error: any) {
      if (error instanceof SyntaxError) {
        toast.error("Formato JSON inválido");
      } else {
        toast.error(error.message || "Erro ao importar dados");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "csv" | "json") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (type === "csv") {
        setCsvData(content);
      } else {
        setJsonData(content);
      }
    };
    reader.readAsText(file);
  };

  const generateTemplate = () => {
    const template = MIGRATION_TEMPLATES[selectedType];
    return template.fields.join(delimiter);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Migração de Dados</DialogTitle>
              <DialogDescription>
                Importe dados de outro sistema para este sistema
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Dados</Label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MIGRATION_TEMPLATES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delimitador CSV</Label>
              <Select value={delimiter} onValueChange={setDelimiter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Vírgula (,)</SelectItem>
                  <SelectItem value=";">Ponto e vírgula (;)</SelectItem>
                  <SelectItem value="\t">Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-sm font-medium mb-1">Campos disponíveis para {MIGRATION_TEMPLATES[selectedType].name}:</p>
            <p className="text-xs text-muted-foreground font-mono">{MIGRATION_TEMPLATES[selectedType].fields.join(", ")}</p>
            <p className="text-xs text-destructive mt-1">* Obrigatórios: {MIGRATION_TEMPLATES[selectedType].required.join(", ")}</p>
          </div>

          <Tabs defaultValue="csv">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="csv" className="rounded-lg">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV/Excel
              </TabsTrigger>
              <TabsTrigger value="json" className="rounded-lg">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4 mt-4">
              <div>
                <Label>Arquivo CSV</Label>
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => handleFileUpload(e, "csv")}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Ou cole os dados CSV</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generateTemplate());
                      toast.success("Modelo copiado para a área de transferência");
                    }}
                  >
                    Copiar modelo
                  </Button>
                </div>
                <Textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder={`${generateTemplate()}\nValor1${delimiter}Valor2${delimiter}...`}
                  className="rounded-xl h-40 font-mono text-xs"
                />
              </div>
              <Button 
                onClick={handleImportCSV} 
                disabled={loading || !csvData.trim()}
                className="w-full rounded-xl"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Importar CSV
              </Button>
            </TabsContent>

            <TabsContent value="json" className="space-y-4 mt-4">
              <div>
                <Label>Arquivo JSON</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, "json")}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Ou cole os dados JSON</Label>
                <Textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder='[{"name": "Nome", "email": "email@exemplo.com"}, ...]'
                  className="rounded-xl h-40 font-mono text-xs mt-1"
                />
              </div>
              <Button 
                onClick={handleImportJSON} 
                disabled={loading || !jsonData.trim()}
                className="w-full rounded-xl"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Importar JSON
              </Button>
            </TabsContent>
          </Tabs>

          {importResult && (
            <div className={`p-4 rounded-xl ${importResult.errors.length > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className={`h-5 w-5 ${importResult.errors.length > 0 ? "text-yellow-600" : "text-green-600"}`} />
                <p className="font-medium">
                  {importResult.success} registros importados com sucesso
                </p>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Erros ({importResult.errors.length}):</p>
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.errors.map((error, i) => (
                      <p key={i} className="text-xs text-yellow-700">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
