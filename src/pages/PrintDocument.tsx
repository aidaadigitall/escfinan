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

        // Fetch main document data with relations
        const { data: docData, error: docError } = await supabase
          .from(tableName)
          .select(`
            *,
            client:clients(name, fantasy_name, document, address, city, state, zip_code, phone, email),
            technician:employees!technician_id(name),
            seller:employees!seller_id(name)
          `)
          .eq("id", id)
          .single();

        if (docError) throw docError;

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
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
    solution: data.technical_report, // Map technical_report to solution
    technician: data.technician, // Supabase returns object or array depending on relation, assuming object here
    seller: data.seller,
    client: data.client,
  };

  // Fallback for company settings if not loaded yet
  const company = companySettings || {
    name: "Minha Empresa",
    address: "Endereço da Empresa",
    phone: "(00) 0000-0000",
    email: "contato@empresa.com",
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-8 print:bg-white print:py-0">
      <DocumentTemplate
        type={type as "os" | "budget" | "sale"}
        data={templateData}
        items={items}
        company={company}
      />
    </div>
  );
};

export default PrintDocument;
