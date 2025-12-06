import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Phone, Mail, MapPin, Calendar, Clock, Monitor, Wrench, Package, CreditCard, CheckCircle2, AlertTriangle, Loader, Building2 } from "lucide-react";

type DocumentType = "quote" | "sale" | "service_order";

interface CompanyInfo {
  company_name: string | null;
  trading_name: string | null;
  cnpj: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  logo_header_url: string | null;
}

interface DocumentData {
  id: string;
  number: number;
  type: DocumentType;
  status: string;
  created_at: string;
  entry_date?: string;
  exit_date?: string;
  sale_date?: string;
  delivery_date?: string;
  payment_method?: string;
  notes?: string;
  warranty_terms?: string;
  equipment_name?: string;
  equipment_brand?: string;
  equipment_model?: string;
  equipment_serial?: string;
  defects?: string;
  technical_report?: string;
  products_total: number;
  services_total: number;
  discount_total: number;
  total_amount: number;
  client: {
    name: string;
    company_name?: string;
    cnpj?: string;
    cpf?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  items: {
    name: string;
    unit?: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    subtotal: number;
    item_type: "product" | "service";
  }[];
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  approved: "Aprovado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  in_progress: "Em Andamento",
  waiting_parts: "Aguardando Peças",
  completed: "Concluída",
  draft: "Rascunho",
  sent: "Enviado",
  rejected: "Rejeitado",
  expired: "Expirado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  delivered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  waiting_parts: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const PublicBilling = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!type || !id) {
        setError("Documento não encontrado");
        setLoading(false);
        return;
      }

      try {
        let documentData: any = null;
        let items: any[] = [];
        let userId: string | null = null;

        // Fetch document based on type
        if (type === "os" || type === "service_order") {
          const { data, error: fetchError } = await supabase
            .from("service_orders")
            .select(`
              *,
              clients (*)
            `)
            .eq("id", id)
            .single();

          if (fetchError) throw fetchError;
          
          documentData = {
            id: data.id,
            number: data.order_number,
            type: "service_order" as DocumentType,
            status: data.status,
            created_at: data.created_at,
            entry_date: data.entry_date,
            exit_date: data.exit_date,
            equipment_name: data.equipment_name,
            equipment_brand: data.equipment_brand,
            equipment_model: data.equipment_model,
            equipment_serial: data.equipment_serial,
            defects: data.defects,
            technical_report: data.technical_report,
            warranty_terms: data.warranty_terms,
            notes: data.notes,
            products_total: data.products_total || 0,
            services_total: data.services_total || 0,
            discount_total: data.discount_total || 0,
            total_amount: data.total_amount || 0,
            client: data.clients || {},
          };
          userId = data.user_id;

          // Fetch items
          const { data: orderItems } = await supabase
            .from("service_order_items")
            .select("*")
            .eq("service_order_id", id);
          items = orderItems || [];
        } else if (type === "sale" || type === "venda") {
          const { data, error: fetchError } = await supabase
            .from("sales")
            .select(`
              *,
              clients (*)
            `)
            .eq("id", id)
            .single();

          if (fetchError) throw fetchError;
          
          documentData = {
            id: data.id,
            number: data.sale_number,
            type: "sale" as DocumentType,
            status: data.status,
            created_at: data.created_at,
            sale_date: data.sale_date,
            delivery_date: data.delivery_date,
            payment_method: data.payment_method,
            warranty_terms: data.warranty_terms,
            notes: data.notes,
            products_total: data.products_total || 0,
            services_total: data.services_total || 0,
            discount_total: data.discount_total || 0,
            total_amount: data.total_amount || 0,
            client: data.clients || {},
          };
          userId = data.user_id;

          // Fetch items
          const { data: saleItems } = await supabase
            .from("sale_items")
            .select("*")
            .eq("sale_id", id);
          items = saleItems || [];
        } else if (type === "quote" || type === "orcamento") {
          const { data, error: fetchError } = await supabase
            .from("quotes")
            .select(`
              *,
              clients (*)
            `)
            .eq("id", id)
            .single();

          if (fetchError) throw fetchError;
          
          documentData = {
            id: data.id,
            number: data.quote_number,
            type: "quote" as DocumentType,
            status: data.status,
            created_at: data.created_at,
            delivery_date: data.delivery_date,
            notes: data.notes,
            products_total: data.products_total || 0,
            services_total: data.services_total || 0,
            discount_total: data.discount_total || 0,
            total_amount: data.total_amount || 0,
            client: data.clients || {},
          };
          userId = data.user_id;

          // Fetch items
          const { data: quoteItems } = await supabase
            .from("quote_items")
            .select("*")
            .eq("quote_id", id);
          items = quoteItems || [];
        } else {
          throw new Error("Tipo de documento inválido");
        }

        if (!documentData) {
          throw new Error("Documento não encontrado");
        }

        // Format items
        documentData.items = items.map((item: any) => ({
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          subtotal: item.subtotal,
          item_type: item.item_type,
        }));

        setDocument(documentData);

        // Fetch company settings
        if (userId) {
          const { data: companyData } = await supabase
            .from("company_settings")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();
          
          setCompany(companyData);
        }
      } catch (err: any) {
        console.error("Error fetching document:", err);
        setError(err.message || "Erro ao carregar documento");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();

    // Set up real-time subscription for status updates
    if (id && (type === "os" || type === "service_order")) {
      const channel = supabase
        .channel(`os-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "service_orders",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            if (payload.new) {
              setDocument((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  status: (payload.new as any).status,
                  technical_report: (payload.new as any).technical_report,
                  exit_date: (payload.new as any).exit_date,
                };
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [type, id]);

  const getDocumentTitle = () => {
    if (!document) return "Documento";
    switch (document.type) {
      case "service_order":
        return `Ordem de Serviço #${document.number}`;
      case "sale":
        return `Pedido de Venda #${document.number}`;
      case "quote":
        return `Orçamento #${document.number}`;
      default:
        return `Documento #${document.number}`;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando documento...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Documento não encontrado</h2>
            <p className="text-muted-foreground">{error || "O documento solicitado não existe ou foi removido."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const services = document.items.filter((i) => i.item_type === "service");
  const products = document.items.filter((i) => i.item_type === "product");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 print:py-0 print:bg-white">
      <div className="container max-w-4xl mx-auto px-4 print:px-0">
        {/* Header */}
        <Card className="mb-6 print:shadow-none print:border-b print:rounded-none">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                {company?.logo_header_url ? (
                  <img
                    src={company.logo_header_url}
                    alt="Logo"
                    className="h-16 w-auto object-contain"
                  />
                ) : (
                  <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold">{company?.company_name || company?.trading_name || "Empresa"}</h1>
                  {company?.cnpj && <p className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</p>}
                  {company?.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {company.address}, {company.city}/{company.state} - CEP: {company.zipcode}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right space-y-1 print:hidden">
                {company?.phone && (
                  <p className="text-sm flex items-center gap-1 justify-end">
                    <Phone className="h-3 w-3" />
                    {company.phone}
                  </p>
                )}
                {company?.email && (
                  <p className="text-sm flex items-center gap-1 justify-end">
                    <Mail className="h-3 w-3" />
                    {company.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Info */}
        <Card className="mb-6 print:shadow-none">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{getDocumentTitle()}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Emitido em: {format(new Date(document.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <Badge className={statusColors[document.status]}>
                {statusLabels[document.status] || document.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Period (for service orders) */}
            {document.type === "service_order" && (
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Entrada:</strong>{" "}
                    {document.entry_date
                      ? format(new Date(document.entry_date), "dd/MM/yyyy - HH:mm", { locale: ptBR })
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Saída:</strong>{" "}
                    {document.exit_date
                      ? format(new Date(document.exit_date), "dd/MM/yyyy - HH:mm", { locale: ptBR })
                      : "-"}
                  </span>
                </div>
              </div>
            )}

            {/* Client Info */}
            <div className="p-4 border rounded-lg mb-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><strong>Nome:</strong> {document.client.company_name || document.client.name}</p>
                <p><strong>CNPJ/CPF:</strong> {document.client.cnpj || document.client.cpf || "-"}</p>
                {document.client.phone && <p><strong>Telefone:</strong> {document.client.phone}</p>}
                {document.client.email && <p><strong>E-mail:</strong> {document.client.email}</p>}
                {document.client.address && (
                  <p className="col-span-2">
                    <strong>Endereço:</strong> {document.client.address}, {document.client.city}/{document.client.state} - CEP: {document.client.zipcode}
                  </p>
                )}
              </div>
            </div>

            {/* Equipment (for service orders) */}
            {document.type === "service_order" && document.equipment_name && (
              <div className="p-4 border rounded-lg mb-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Equipamento
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <p><strong>Equipamento:</strong> {document.equipment_name}</p>
                  {document.equipment_brand && <p><strong>Marca:</strong> {document.equipment_brand}</p>}
                  {document.equipment_model && <p><strong>Modelo:</strong> {document.equipment_model}</p>}
                  {document.equipment_serial && <p><strong>Serial:</strong> {document.equipment_serial}</p>}
                </div>
                {document.defects && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <p className="text-sm"><strong>Defeitos:</strong> {document.defects}</p>
                  </div>
                )}
                {document.technical_report && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-sm"><strong>Laudo Técnico:</strong> {document.technical_report}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        {services.length > 0 && (
          <Card className="mb-6 print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qtd.</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-center">{item.quantity.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={3}>Total Serviços</TableCell>
                    <TableCell className="text-right">{formatCurrency(document.services_total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Products */}
        {products.length > 0 && (
          <Card className="mb-6 print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Und.</TableHead>
                    <TableHead className="text-center">Qtd.</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-center">{item.unit || "UN"}</TableCell>
                      <TableCell className="text-center">{item.quantity.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={4}>Total Produtos</TableCell>
                    <TableCell className="text-right">{formatCurrency(document.products_total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Payment Info */}
        {document.payment_method && (
          <Card className="mb-6 print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Dados do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      {document.delivery_date
                        ? format(new Date(document.delivery_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell>{formatCurrency(document.total_amount)}</TableCell>
                    <TableCell>{document.payment_method}</TableCell>
                    <TableCell>{document.notes || "-"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Totals */}
        <Card className="mb-6 print:shadow-none">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Produtos:</span>
                <span>{formatCurrency(document.products_total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Serviços:</span>
                <span>{formatCurrency(document.services_total)}</span>
              </div>
              {document.discount_total > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(document.discount_total)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(document.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Terms */}
        {document.warranty_terms && (
          <Card className="mb-6 print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Termos de Garantia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{document.warranty_terms}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 print:hidden">
          <Button onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar/Imprimir PDF
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground print:mt-16">
          <Separator className="mb-4" />
          <p>Documento emitido por {company?.company_name || "Sistema"}</p>
          {company?.email && <p>{company.email}</p>}
        </div>
      </div>
    </div>
  );
};

export default PublicBilling;
