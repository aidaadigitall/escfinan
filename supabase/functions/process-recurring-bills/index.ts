import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting recurring bills processing...');

    // Buscar todas as contas recorrentes ativas
    const { data: recurringBills, error: fetchError } = await supabase
      .from('recurring_bills')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching recurring bills:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringBills?.length || 0} active recurring bills`);

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let processedCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    for (const bill of recurringBills || []) {
      try {
        // Verificar se deve processar hoje
        const shouldProcess = checkIfShouldProcess(bill, today);
        
        if (!shouldProcess) {
          skippedCount++;
          continue;
        }

        // Calcular data de vencimento
        let dueDate = calculateDueDate(bill, today);

        // Verificar se já existe uma transação para este período
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', bill.user_id)
          .eq('description', bill.description)
          .gte('due_date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`)
          .lte('due_date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`)
          .limit(1);

        if (existingTransaction && existingTransaction.length > 0) {
          console.log(`Transaction already exists for bill ${bill.id}`);
          skippedCount++;
          continue;
        }

        // Criar nova transação
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id: bill.user_id,
            description: bill.description,
            amount: bill.amount,
            type: bill.type,
            category_id: bill.category_id,
            bank_account_id: bill.bank_account_id,
            status: 'pending',
            due_date: dueDate,
            notes: bill.notes ? `${bill.notes} (Gerada automaticamente)` : 'Gerada automaticamente pela conta recorrente',
          });

        if (insertError) {
          console.error(`Error inserting transaction for bill ${bill.id}:`, insertError);
          errors.push({ billId: bill.id, error: insertError.message });
          continue;
        }

        processedCount++;
        console.log(`Processed bill ${bill.id} - ${bill.description}`);

      } catch (error: any) {
        console.error(`Error processing bill ${bill.id}:`, error);
        errors.push({ billId: bill.id, error: error.message });
      }
    }

    const result = {
      success: true,
      message: 'Recurring bills processed successfully',
      stats: {
        total: recurringBills?.length || 0,
        processed: processedCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Processing complete:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function checkIfShouldProcess(bill: any, today: Date): boolean {
  const startDate = new Date(bill.start_date);
  
  // Verificar se já passou da data de início
  if (today < startDate) {
    return false;
  }

  // Verificar se já passou da data de término
  if (bill.end_date) {
    const endDate = new Date(bill.end_date);
    if (today > endDate) {
      return false;
    }
  }

  const currentDay = today.getDate();

  // Verificar baseado no tipo de recorrência
  switch (bill.recurrence_type) {
    case 'daily':
      return true;
    case 'weekly':
      // Processar no dia da semana definido
      return today.getDay() === (bill.recurrence_day || 0);
    case 'monthly':
      // Processar no dia do mês definido
      return currentDay === (bill.recurrence_day || 1);
    case 'yearly':
      // Processar no dia e mês definidos
      const billDate = new Date(bill.start_date);
      return today.getDate() === billDate.getDate() && today.getMonth() === billDate.getMonth();
    default:
      return false;
  }
}

function calculateDueDate(bill: any, today: Date): string {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  switch (bill.recurrence_type) {
    case 'daily':
      return today.toISOString().split('T')[0];
    case 'weekly':
      return today.toISOString().split('T')[0];
    case 'monthly':
      const day = bill.recurrence_day || 1;
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const actualDay = Math.min(day, lastDayOfMonth);
      return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
    case 'yearly':
      const billDate = new Date(bill.start_date);
      return `${currentYear}-${String(billDate.getMonth() + 1).padStart(2, '0')}-${String(billDate.getDate()).padStart(2, '0')}`;
    default:
      return today.toISOString().split('T')[0];
  }
}
