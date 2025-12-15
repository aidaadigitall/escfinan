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
import { ArrowRightLeft, Upload, FileSpreadsheet, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import * as XLSX from "xlsx";

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
    aliases: {
      name: ["nome", "cliente", "razao_social", "razão social", "nome_fantasia", "Nome", "Cliente", "NOME", "CLIENTE", "Nome do Cliente", "Nome Cliente"],
      email: ["e-mail", "e_mail", "correio", "Email", "E-mail", "EMAIL", "E-MAIL"],
      phone: ["telefone", "tel", "celular", "fone", "Telefone", "Celular", "TELEFONE", "CELULAR", "Fone"],
      cpf: ["CPF", "documento_cpf", "CPF/CNPJ", "Documento"],
      cnpj: ["CNPJ", "documento_cnpj"],
      company_name: ["razao_social", "razão social", "empresa", "Razão Social", "Empresa", "RAZÃO SOCIAL"],
      address: ["endereco", "endereço", "logradouro", "Endereço", "Endereco", "ENDEREÇO", "Logradouro"],
      city: ["cidade", "municipio", "município", "Cidade", "CIDADE", "Município"],
      state: ["estado", "uf", "UF", "Estado", "ESTADO"],
      zipcode: ["cep", "CEP", "codigo_postal", "Cep", "Código Postal"],
      notes: ["observacoes", "observações", "obs", "Observações", "OBS", "Observacao", "Observação"],
    }
  },
  suppliers: {
    name: "Fornecedores",
    fields: ["name", "email", "phone", "document_type", "cpf", "cnpj", "company_name", "address", "city", "state", "zipcode", "notes"],
    required: ["name"],
    aliases: {
      name: ["nome", "fornecedor", "razao_social", "razão social", "Nome", "Fornecedor", "NOME", "FORNECEDOR"],
      email: ["e-mail", "e_mail", "correio", "Email", "E-mail", "EMAIL"],
      phone: ["telefone", "tel", "celular", "fone", "Telefone", "Celular", "TELEFONE"],
      cpf: ["CPF", "documento_cpf", "CPF/CNPJ"],
      cnpj: ["CNPJ", "documento_cnpj"],
      company_name: ["razao_social", "razão social", "empresa", "Razão Social", "Empresa"],
      address: ["endereco", "endereço", "logradouro", "Endereço", "ENDEREÇO"],
      city: ["cidade", "municipio", "município", "Cidade", "CIDADE"],
      state: ["estado", "uf", "UF", "Estado", "ESTADO"],
      zipcode: ["cep", "CEP", "codigo_postal", "Cep"],
      notes: ["observacoes", "observações", "obs", "Observações", "OBS"],
    }
  },
  products: {
    name: "Produtos",
    fields: ["name", "description", "sku", "unit", "cost_price", "sale_price", "stock_quantity", "min_stock", "category"],
    required: ["name"],
    aliases: {
      name: ["nome", "produto", "Nome", "Produto", "NOME", "PRODUTO", "Descrição do Produto", "Nome do Produto"],
      description: ["descricao", "descrição", "desc", "Descrição", "Descricao", "DESCRIÇÃO", "Detalhes"],
      sku: ["codigo", "código", "cod", "ref", "referencia", "referência", "Código", "SKU", "COD", "REF", "Codigo", "Referência"],
      unit: ["unidade", "un", "Unidade", "UNIDADE", "UN", "Und"],
      cost_price: ["preco_custo", "preço_custo", "custo", "valor_custo", "Custo", "Preço de Custo", "CUSTO", "Valor Custo", "Preço Custo"],
      sale_price: ["preco_venda", "preço_venda", "venda", "preco", "preço", "valor", "Preço", "Venda", "Preço de Venda", "PREÇO", "VENDA", "Valor Venda", "Preço Venda"],
      stock_quantity: ["estoque", "quantidade", "qtd", "saldo", "Estoque", "Quantidade", "QTD", "ESTOQUE", "QUANTIDADE", "Saldo", "Qtde"],
      min_stock: ["estoque_minimo", "minimo", "min", "Estoque Mínimo", "Mínimo", "MIN"],
      category: ["categoria", "grupo", "Categoria", "Grupo", "CATEGORIA"],
    }
  },
  services: {
    name: "Serviços",
    fields: ["name", "description", "cost_price", "sale_price", "estimated_hours", "category"],
    required: ["name"],
    aliases: {
      name: ["nome", "servico", "serviço", "Nome", "Serviço", "Servico", "NOME", "SERVIÇO"],
      description: ["descricao", "descrição", "desc", "Descrição", "Descricao", "DESCRIÇÃO"],
      cost_price: ["preco_custo", "preço_custo", "custo", "Custo", "Preço de Custo", "CUSTO"],
      sale_price: ["preco_venda", "preço_venda", "venda", "preco", "preço", "valor", "Preço", "Venda", "Preço de Venda", "PREÇO"],
      estimated_hours: ["horas", "tempo", "duracao", "duração", "Horas", "Tempo", "Duração"],
      category: ["categoria", "grupo", "Categoria", "Grupo", "CATEGORIA"],
    }
  },
  categories: {
    name: "Categorias",
    fields: ["name", "type"],
    required: ["name", "type"],
    aliases: {
      name: ["nome", "categoria", "Nome", "Categoria", "NOME", "CATEGORIA"],
      type: ["tipo", "Tipo", "TIPO"],
    }
  },
  payment_methods: {
    name: "Formas de Pagamento",
    fields: ["name", "fee_percentage"],
    required: ["name"],
    aliases: {
      name: ["nome", "forma", "metodo", "método", "Nome", "Forma", "NOME", "Forma de Pagamento"],
      fee_percentage: ["taxa", "percentual", "fee", "Taxa", "Percentual"],
    }
  },
  bank_accounts: {
    name: "Contas Bancárias",
    fields: ["name", "bank_name", "agency", "account_number", "account_type", "initial_balance"],
    required: ["name"],
    aliases: {
      name: ["nome", "conta", "Nome", "Conta", "NOME", "Nome da Conta"],
      bank_name: ["banco", "nome_banco", "Banco", "Nome do Banco", "BANCO"],
      agency: ["agencia", "agência", "Agência", "Agencia", "AGÊNCIA"],
      account_number: ["numero_conta", "número_conta", "conta", "Número da Conta", "Numero Conta", "CONTA"],
      account_type: ["tipo_conta", "tipo", "Tipo de Conta", "Tipo", "TIPO"],
      initial_balance: ["saldo_inicial", "saldo", "Saldo Inicial", "Saldo", "SALDO"],
    }
  },
  employees: {
    name: "Funcionários",
    fields: ["name", "email", "phone", "cpf", "position", "salary"],
    required: ["name"],
    aliases: {
      name: ["nome", "funcionario", "funcionário", "Nome", "Funcionário", "NOME", "FUNCIONÁRIO"],
      email: ["e-mail", "e_mail", "Email", "E-mail", "EMAIL"],
      phone: ["telefone", "tel", "celular", "fone", "Telefone", "Celular", "TELEFONE"],
      cpf: ["CPF", "documento", "Documento"],
      position: ["cargo", "funcao", "função", "Cargo", "Função", "CARGO"],
      salary: ["salario", "salário", "Salário", "Salario", "SALÁRIO"],
    }
  },
  transactions: {
    name: "Transações Financeiras",
    fields: ["description", "amount", "due_date", "type", "status", "category_id", "payment_method", "notes"],
    required: ["description", "amount", "due_date", "type"],
    aliases: {
      description: ["descricao", "descrição", "desc", "historico", "histórico", "Descrição", "Descricao", "DESCRIÇÃO", "Histórico", "Historico"],
      amount: ["valor", "montante", "quantia", "Valor", "VALOR", "Montante", "Quantia"],
      due_date: ["data_vencimento", "vencimento", "data", "Data Vencimento", "Vencimento", "DATA", "Data"],
      type: ["tipo", "Tipo", "TIPO"],
      status: ["situacao", "situação", "estado", "Status", "Situação", "SITUAÇÃO"],
      payment_method: ["forma_pagamento", "pagamento", "Forma de Pagamento", "Pagamento"],
      notes: ["observacoes", "observações", "obs", "Observações", "OBS"],
    }
  },
};

export function DataMigrationDialog({ open, onOpenChange }: DataMigrationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<keyof typeof MIGRATION_TEMPLATES>("clients");
  const [csvData, setCsvData] = useState("");
  const [jsonData, setJsonData] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
    const aliases = (template as any).aliases || {};
    
    return data.map((row) => {
      const mapped: Record<string, any> = {};
      
      template.fields.forEach((field) => {
        // Try direct match first (case insensitive)
        const rowKeys = Object.keys(row);
        const directMatch = rowKeys.find(k => k.toLowerCase() === field.toLowerCase());
        
        if (directMatch && row[directMatch] !== undefined && row[directMatch] !== "") {
          mapped[field] = row[directMatch];
          return;
        }
        
        // Try aliases from template
        const fieldAliases = aliases[field] || [];
        for (const alt of fieldAliases) {
          // Case-insensitive match for aliases
          const aliasMatch = rowKeys.find(k => k.toLowerCase() === alt.toLowerCase());
          if (aliasMatch && row[aliasMatch] !== undefined && row[aliasMatch] !== "") {
            mapped[field] = row[aliasMatch];
            break;
          }
        }
      });

      // Convert numeric fields - handle Brazilian number format (1.234,56)
      ["cost_price", "sale_price", "stock_quantity", "min_stock", "initial_balance", "salary", "estimated_hours", "amount", "fee_percentage"].forEach((numField) => {
        if (mapped[numField]) {
          let value = String(mapped[numField]);
          // Handle Brazilian format: 1.234,56 -> 1234.56
          if (value.includes(',') && value.includes('.')) {
            value = value.replace(/\./g, '').replace(',', '.');
          } else if (value.includes(',')) {
            value = value.replace(',', '.');
          }
          value = value.replace(/[^\d.-]/g, "");
          mapped[numField] = parseFloat(value) || 0;
        }
      });

      // Handle date fields - accept multiple formats
      ["due_date", "paid_date"].forEach((dateField) => {
        if (mapped[dateField]) {
          const dateValue = String(mapped[dateField]).trim();
          // Try to parse different date formats
          let parsedDate: Date | null = null;
          
          // DD/MM/YYYY format
          const brMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (brMatch) {
            parsedDate = new Date(parseInt(brMatch[3]), parseInt(brMatch[2]) - 1, parseInt(brMatch[1]));
          }
          
          // YYYY-MM-DD format
          const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (isoMatch) {
            parsedDate = new Date(dateValue);
          }
          
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            mapped[dateField] = parsedDate.toISOString().split('T')[0];
          } else {
            delete mapped[dateField];
          }
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
        mapped.current_balance = mapped.initial_balance;
      }

      if (type === "categories") {
        mapped.type = mapped.type || "expense";
      }

      if (type === "clients" || type === "suppliers") {
        mapped.document_type = mapped.cnpj ? "cnpj" : "cpf";
      }

      if (type === "transactions") {
        mapped.status = mapped.status || "pending";
        mapped.type = mapped.type || "expense";
      }

      return mapped;
    });
  };

  // Check for duplicates in database using REST API to avoid TypeScript issues
  const checkDuplicate = async (type: keyof typeof MIGRATION_TEMPLATES, record: any, userId: string): Promise<boolean> => {
    const duplicateFields: Record<string, string[]> = {
      clients: ["name", "cpf", "cnpj", "email"],
      suppliers: ["name", "cpf", "cnpj", "email"],
      products: ["name", "sku"],
      services: ["name"],
      categories: ["name"],
      payment_methods: ["name"],
      bank_accounts: ["name", "account_number"],
      employees: ["name", "cpf", "email"],
      transactions: ["description"],
    };

    const fields = duplicateFields[type] || ["name"];
    const tableName = type as string;
    
    for (const field of fields) {
      if (record[field] && record[field] !== "" && record[field] !== null) {
        try {
          const session = await supabase.auth.getSession();
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${tableName}?user_id=eq.${userId}&${field}=eq.${encodeURIComponent(String(record[field]))}&select=id&limit=1`,
            {
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                'Authorization': `Bearer ${session.data.session?.access_token}`
              }
            }
          );
          const result = await response.json();
          if (Array.isArray(result) && result.length > 0) {
            return true;
          }
        } catch {
          // Skip duplicate check if fetch fails
          continue;
        }
      }
    }
    return false;
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
      let duplicateCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < mappedData.length; i++) {
        const record = mappedData[i];
        
        // Check required fields
        const missingRequired = template.required.filter((field) => !record[field]);
        if (missingRequired.length > 0) {
          errors.push(`Linha ${i + 2}: campos obrigatórios faltando (${missingRequired.join(", ")})`);
          continue;
        }

        // Check for duplicates
        const isDuplicate = await checkDuplicate(selectedType, record, user.id);
        if (isDuplicate) {
          duplicateCount++;
          errors.push(`Linha ${i + 2}: registro duplicado (${record.name || record.description || 'sem nome'})`);
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
      if (duplicateCount > 0) {
        toast.info(`${duplicateCount} registros duplicados ignorados`);
      }
      if (errors.length > 0 && duplicateCount !== errors.length) {
        toast.warning(`${errors.length - duplicateCount} registros com outros erros`);
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
      let duplicateCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < mappedData.length; i++) {
        const record = mappedData[i];
        
        // Check required fields
        const missingRequired = template.required.filter((field) => !record[field]);
        if (missingRequired.length > 0) {
          errors.push(`Registro ${i + 1}: campos obrigatórios faltando (${missingRequired.join(", ")})`);
          continue;
        }

        // Check for duplicates
        const isDuplicate = await checkDuplicate(selectedType, record, user.id);
        if (isDuplicate) {
          duplicateCount++;
          errors.push(`Registro ${i + 1}: registro duplicado (${record.name || record.description || 'sem nome'})`);
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
      if (duplicateCount > 0) {
        toast.info(`${duplicateCount} registros duplicados ignorados`);
      }
      if (errors.length > 0 && duplicateCount !== errors.length) {
        toast.warning(`${errors.length - duplicateCount} registros com outros erros`);
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

  const handleDeleteImportedType = async () => {
    if (!selectedType) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error, count } = await supabase
        .from(selectedType)
        .delete({ count: 'exact' })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`${count || 0} registros de ${MIGRATION_TEMPLATES[selectedType].name} excluídos com sucesso!`);
      setImportResult(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir dados");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "csv" | "json") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcelFile = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    // Handle Excel files using xlsx library
    if (isExcelFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to CSV
          const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: delimiter });
          
          if (type === "csv") {
            setCsvData(csvContent);
            toast.success(`Arquivo Excel convertido com sucesso! ${workbook.SheetNames.length > 1 ? `(usando planilha "${sheetName}")` : ""}`);
          }
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          toast.error("Erro ao processar arquivo Excel. Verifique se o arquivo não está corrompido.");
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // Handle CSV/JSON files
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Check if content looks like binary/corrupted data
      const isBinaryContent = /[\x00-\x08\x0E-\x1F]/.test(content.substring(0, 100));
      if (isBinaryContent) {
        toast.error("O arquivo parece ser binário ou corrompido. Por favor, use um arquivo CSV ou TXT válido.");
        return;
      }
      
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
              <Label>Arquivo CSV/Excel</Label>
                <Input
                  type="file"
                  accept=".csv,.txt,.xls,.xlsx"
                  onChange={(e) => handleFileUpload(e, "csv")}
                  className="rounded-xl mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Aceita arquivos CSV, TXT ou planilhas salvas como CSV
                </p>
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
            <div className={`p-4 rounded-xl ${importResult.errors.length > 0 ? "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800" : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className={`h-5 w-5 ${importResult.errors.length > 0 ? "text-yellow-600" : "text-green-600"}`} />
                <p className="font-medium">
                  {importResult.success} registros importados com sucesso
                </p>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Erros ({importResult.errors.length}):</p>
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.errors.map((error, i) => (
                      <p key={i} className="text-xs text-yellow-700 dark:text-yellow-300">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Excluir Dados por Tipo
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Exclua todos os registros de {MIGRATION_TEMPLATES[selectedType].name} de uma vez. Esta ação não pode ser desfeita.
            </p>
            <Button 
              variant="destructive" 
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={loading}
              className="rounded-xl"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir todos os {MIGRATION_TEMPLATES[selectedType].name}
            </Button>
          </div>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Excluir todos os ${MIGRATION_TEMPLATES[selectedType].name}`}
        description={`Tem certeza que deseja excluir TODOS os registros de ${MIGRATION_TEMPLATES[selectedType].name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir Tudo"
        onConfirm={handleDeleteImportedType}
        variant="destructive"
      />
    </Dialog>
  );
}
