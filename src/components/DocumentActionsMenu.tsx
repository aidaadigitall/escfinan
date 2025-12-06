import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Link2, 
  Printer, 
  FileText, 
  Receipt, 
  Tag,
  Factory,
  RefreshCw,
  Share2,
  Mail,
  MessageCircle,
  Send,
  FileOutput,
  PiggyBank,
  Search
} from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { 
  generateA4PDF, 
  generateCouponPDF, 
  generateServiceOrderPDF,
  openPrintWindow, 
  openViewWindow,
  generateWhatsAppMessage,
  generateEmailContent,
  generateQRCodeDataURL,
  type DocumentType
} from "@/utils/documentPdfGenerator";

interface DocumentActionsMenuProps {
  document: any;
  documentType: DocumentType;
  onView?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: () => void;
  client?: any;
  items?: any[];
}

export const DocumentActionsMenu = ({
  document,
  documentType,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  client,
  items = [],
}: DocumentActionsMenuProps) => {
  const navigate = useNavigate();
  const { companySettings } = useCompanySettings();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getDocumentNumber = () => {
    switch (documentType) {
      case "quote":
        return document.quote_number;
      case "sale":
        return document.sale_number;
      case "service_order":
        return document.order_number;
      default:
        return document.id;
    }
  };

  const prepareDocumentData = () => ({
    id: document.id,
    number: getDocumentNumber(),
    type: documentType,
    status: document.status,
    created_at: document.created_at,
    entry_date: document.entry_date,
    exit_date: document.exit_date,
    sale_date: document.sale_date,
    delivery_date: document.delivery_date,
    payment_method: document.payment_method,
    notes: document.notes,
    warranty_terms: document.warranty_terms,
    equipment_name: document.equipment_name,
    equipment_brand: document.equipment_brand,
    equipment_model: document.equipment_model,
    equipment_serial: document.equipment_serial,
    equipment_memory: document.equipment_memory,
    equipment_storage: document.equipment_storage,
    equipment_processor: document.equipment_processor,
    defects: document.defects,
    technical_report: document.technical_report,
    products_total: document.products_total,
    services_total: document.services_total,
    discount_total: document.discount_total,
    total_amount: document.total_amount,
    client: client || document.clients,
    items: items,
  });

  const getPublicUrl = () => {
    const typeSlug = documentType === "service_order" ? "os" : documentType === "sale" ? "venda" : "orcamento";
    return `${window.location.origin}/cobranca/${typeSlug}/${document.id}`;
  };

  const handleViewDocument = async () => {
    const docData = prepareDocumentData();
    const publicUrl = getPublicUrl();
    const qrCode = await generateQRCodeDataURL(publicUrl);
    
    // Use specific format for service orders
    let html: string;
    if (documentType === "service_order") {
      html = generateServiceOrderPDF(docData, companySettings || {});
    } else {
      html = generateA4PDF(docData, companySettings || {}, qrCode);
    }
    openViewWindow(html);
  };

  const handlePrintA4 = async () => {
    const docData = prepareDocumentData();
    const publicUrl = getPublicUrl();
    const qrCode = await generateQRCodeDataURL(publicUrl);
    
    // Use specific format for service orders
    let html: string;
    if (documentType === "service_order") {
      html = generateServiceOrderPDF(docData, companySettings || {});
    } else {
      html = generateA4PDF(docData, companySettings || {}, qrCode);
    }
    openPrintWindow(html, "a4");
  };

  const handlePrintCoupon = () => {
    const docData = prepareDocumentData();
    const html = generateCouponPDF(docData, companySettings || {});
    openPrintWindow(html, "coupon");
  };

  const handlePrintLabel = () => {
    toast.info("Funcionalidade de etiqueta em desenvolvimento");
  };

  const handleBillingLink = () => {
    const publicUrl = getPublicUrl();
    window.open(publicUrl, "_blank");
    toast.success("Link de cobrança aberto em nova aba");
  };

  const handleProduction = () => {
    toast.info("Funcionalidade de produção em desenvolvimento");
  };

  const handleShareWhatsApp = () => {
    const docData = prepareDocumentData();
    const message = generateWhatsAppMessage(docData, companySettings || {});
    const phone = client?.phone || document.clients?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  const handleShareWhatsAppWithPDF = async () => {
    const docData = prepareDocumentData();
    
    // First open the PDF with QR code
    const publicUrl = getPublicUrl();
    const qrCode = await generateQRCodeDataURL(publicUrl);
    
    // Use specific format for service orders
    let html: string;
    if (documentType === "service_order") {
      html = generateServiceOrderPDF(docData, companySettings || {});
    } else {
      html = generateA4PDF(docData, companySettings || {}, qrCode);
    }
    openViewWindow(html);
    
    // Then open WhatsApp
    const message = generateWhatsAppMessage(docData, companySettings || {}, publicUrl);
    const phone = client?.phone || document.clients?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    
    setTimeout(() => {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
    }, 500);
    
    toast.success("PDF aberto. Você pode salvar e enviar manualmente pelo WhatsApp.");
  };

  const handleShareEmail = () => {
    setEmailDialogOpen(true);
  };

  const handleConfirmEmail = () => {
    const docData = prepareDocumentData();
    const { subject, body } = generateEmailContent(docData, companySettings || {});
    const email = client?.email || document.clients?.email || "";
    
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    setEmailDialogOpen(false);
    toast.success("Cliente de email aberto");
  };

  const handleEmit = () => {
    toast.info("Funcionalidade de emissão em desenvolvimento");
  };

  const handleGenerate = () => {
    toast.info("Funcionalidade de geração em desenvolvimento");
  };

  const handleViewFinancial = () => {
    navigate("/receitas");
  };

  const handleConfirmDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex gap-1">
        {/* View Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleViewDocument}
          title="Visualizar"
          className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Edit Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onEdit}
          title="Editar"
          className="h-8 w-8 bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          <Edit className="h-4 w-4" />
        </Button>

        {/* Delete Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setDeleteDialogOpen(true)}
          title="Excluir"
          className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              title="Mais ações"
              className="h-8 w-8 bg-gray-500 hover:bg-gray-600 text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Link de cobrança */}
            <DropdownMenuItem onClick={handleBillingLink}>
              <Link2 className="mr-2 h-4 w-4 text-blue-500" />
              Link de cobrança
            </DropdownMenuItem>

            {/* Imprimir submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handlePrintA4}>
                  <FileText className="mr-2 h-4 w-4" />
                  Formato A4
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintCoupon}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Cupom
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintLabel}>
                  <Tag className="mr-2 h-4 w-4" />
                  Etiqueta
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Produção */}
            <DropdownMenuItem onClick={handleProduction}>
              <Factory className="mr-2 h-4 w-4" />
              Produção
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Alterar situação */}
            {onStatusChange && (
              <DropdownMenuItem onClick={onStatusChange}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Alterar situação
              </DropdownMenuItem>
            )}

            {/* Compartilhar submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleShareEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Via E-mail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareWhatsApp}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Via WhatsApp (Texto)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareWhatsAppWithPDF}>
                  <FileOutput className="mr-2 h-4 w-4" />
                  Via WhatsApp (PDF)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Emitir */}
            <DropdownMenuItem onClick={handleEmit}>
              <Send className="mr-2 h-4 w-4" />
              Emitir
            </DropdownMenuItem>

            {/* Gerar */}
            <DropdownMenuItem onClick={handleGenerate}>
              <FileOutput className="mr-2 h-4 w-4" />
              Gerar
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Ver no financeiro */}
            <DropdownMenuItem onClick={handleViewFinancial}>
              <PiggyBank className="mr-2 h-4 w-4 text-green-500" />
              Ver no financeiro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Email Confirmation Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar envio de e-mail</DialogTitle>
            <DialogDescription>
              Deseja enviar este documento por e-mail para o cliente?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p><strong>Cliente:</strong> {client?.name || document.clients?.name || '-'}</p>
            <p><strong>E-mail:</strong> {client?.email || document.clients?.email || 'Não cadastrado'}</p>
            <p><strong>Documento:</strong> {documentType === 'quote' ? 'Orçamento' : documentType === 'sale' ? 'Venda' : 'Ordem de Serviço'} #{getDocumentNumber()}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmEmail}>
              Confirmar envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
