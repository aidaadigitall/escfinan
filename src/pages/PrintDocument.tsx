import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DocumentTemplate } from "@/components/DocumentTemplate";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings } from "@/hooks/useCompanySettings";

const PrintDocument = () => {
  const { type, id } = useParams();
  const { companySettings } = useCompanySettings();
  const [data, setData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !type) return;

      try {
        let tableName = "";
        let itemsTableName = "";
        let itemsForeignKey = "";

        switch (type) {
          case "os":
            tableName = "service_orders";
            itemsTableName = "service_order_items";
            itemsForeignKey = "service_order_id";
            break;
          case "budget":
            tableName = "quotes";
            itemsTableName = "quote_items";
            itemsForeignKey = "quote_id";
            break;
          case "sale":
            tableName = "sales";
            itemsTableName = "sale_items";
            itemsForeignKey = "sale_id";
            break;
          default:
            return;
        }

        // Fetch main document data with relations - use simpler query
        let selectQuery = "*, clients(*)";
        if (type === "os") {
          selectQuery = "*, clients(*)";
        }
        
        const { data: docData, error: docError } = await (supabase as any)
          .from(tableName)
          .select(selectQuery)
          .eq("id", id)
          .maybeSingle();

        if (docError) {
          console.error("Error fetching document:", docError);
          throw docError;
        }
        
        if (!docData) {
          console.log("Document not found for id:", id);
          setLoading(false);
          return;
        }

        // Fetch items
        const { data: itemsData, error: itemsError } = await (supabase as any)
          .from(itemsTableName)
          .select("*")
          .eq(itemsForeignKey, id);

        if (itemsError) throw itemsError;

        setData(docData);
        setItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id]);

  useEffect(() => {
    if (!loading && data) {
      // Auto-print when ready
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, data]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando documento...</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-screen">Documento não encontrado.</div>;
  }

  // Map data to DocumentTemplate format
  const templateData = {
    ...data,
    number: data.order_number || data.quote_number || data.sale_number || data.number,
    solution: data.technical_report,
    technician: data.technician,
    seller: data.seller,
    client: data.clients || data.client, // clients is the relation name from Supabase
  };

  // Map items with proper item_type
  const mappedItems = items.map((item: any) => ({
    ...item,
    item_type: item.item_type || (item.product_id ? "product" : "service"),
    subtotal: item.subtotal ?? (item.quantity * item.unit_price - (item.discount || 0)),
  }));

  // Fallback for company settings if not loaded yet - use logo_header_url for PDF
  const company = companySettings ? {
    name: companySettings.company_name || companySettings.trading_name || "Minha Empresa",
    cnpj: companySettings.cnpj,
    address: `${companySettings.address || ""} ${companySettings.city || ""}/${companySettings.state || ""}`,
    phone: companySettings.phone,
    email: companySettings.email,
    website: companySettings.website,
    logo_url: companySettings.logo_header_url, // Use logo from settings
  } : {
    name: "Minha Empresa",
    address: "Endereço da Empresa",
    phone: "(00) 0000-0000",
    email: "contato@empresa.com",
  } as any;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center print:bg-white print:p-0 print:min-h-0">
      <DocumentTemplate
        type={type as "os" | "budget" | "sale"}
        data={templateData}
        items={mappedItems}
        company={company}
      />
    </div>
  );
};

export default PrintDocument;
