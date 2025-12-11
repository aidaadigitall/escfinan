import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  to: string;
  message: string;
  templateName?: string;
  templateParams?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate user with Supabase auth
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Invalid authentication:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`WhatsApp request from authenticated user: ${user.id}`);

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('WhatsApp credentials not configured');
    }

    const { to, message, templateName, templateParams }: WhatsAppRequest = await req.json();

    if (!to) {
      throw new Error('Phone number is required');
    }

    // Format phone number (remove special characters, ensure country code)
    const formattedPhone = to.replace(/\D/g, '').replace(/^0+/, '');
    const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

    console.log(`Sending WhatsApp message to: ${phoneWithCountryCode}`);

    let requestBody: any;

    if (templateName) {
      // Send template message
      requestBody = {
        messaging_product: "whatsapp",
        to: phoneWithCountryCode,
        type: "template",
        template: {
          name: templateName,
          language: { code: "pt_BR" },
          components: templateParams ? [{
            type: "body",
            parameters: templateParams.map(param => ({ type: "text", text: param }))
          }] : []
        }
      };
    } else {
      // Send text message
      requestBody = {
        messaging_product: "whatsapp",
        to: phoneWithCountryCode,
        type: "text",
        text: { body: message || "Notificação do sistema" }
      };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseData = await response.json();
    console.log('WhatsApp API response:', JSON.stringify(responseData));

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(responseData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
