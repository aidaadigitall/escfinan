import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DocumentTemplate } from "@/components/DocumentTemplate";
import { supabase } from "@/integrations/supabase/client";

const PrintDocument = () => {
  const { type, id } = useParams();
  const [data, setData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
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

        // Fetch main document data with relations
        const { data: docData, error: docError } = await (supabase as any)
          .from(tableName)
          .select("*, clients(*)")
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
          .eq(itemsForeignKey, id)
          .order("created_at", { ascending: true });

        if (itemsError) {
          console.error("Error fetching items:", itemsError);
        }

        console.log("Document data:", docData);
        console.log("Items data:", itemsData);

        // Fetch company settings using the document's user_id
        const { data: settings, error: settingsError } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", docData.user_id)
          .maybeSingle();

        if (settingsError) {
          console.error("Error fetching company settings:", settingsError);
        }

        console.log("Company settings:", settings);

        setData(docData);
        setItems(itemsData || []);
        setCompanySettings(settings);
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-white text-black">Carregando documento...</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-screen bg-white text-black">Documento não encontrado.</div>;
  }

  // Map data to DocumentTemplate format
  const templateData = {
    ...data,
    number: data.order_number || data.quote_number || data.sale_number || data.number,
    solution: data.technical_report,
    technician: data.technician,
    seller: data.seller,
    client: data.clients || data.client,
  };

  // Map items with proper item_type
  const mappedItems = items.map((item: any) => ({
    ...item,
    item_type: item.item_type || (item.product_id ? "product" : "service"),
    subtotal: item.subtotal ?? (item.quantity * item.unit_price - (item.discount || 0)),
  }));

  // Build company object for PDF
  const company = companySettings ? {
    name: companySettings.company_name || companySettings.trading_name || "Minha Empresa",
    cnpj: companySettings.cnpj || "",
    address: `${companySettings.address || ""} ${companySettings.city || ""}/${companySettings.state || ""}`.trim(),
    phone: companySettings.phone || "",
    phone2: companySettings.phone2 || "",
    email: companySettings.email || "",
    website: companySettings.website || "",
    logo_url: companySettings.logo_header_url || "",
  } : {
    name: "Minha Empresa",
    cnpj: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
  };

  return (
    <div className="min-h-screen bg-white">
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
