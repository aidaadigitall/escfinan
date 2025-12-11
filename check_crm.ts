import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log('Checking leads table...');
  const { error: leadsError } = await supabase
    .from('leads')
    .select('id')
    .limit(1);

  if (leadsError) {
    console.error('Error accessing leads table:', leadsError.message);
  } else {
    console.log('Leads table exists!');
  }

  console.log('Checking pipeline_stages table...');
  const { error: stagesError } = await supabase
    .from('pipeline_stages')
    .select('id')
    .limit(1);

  if (stagesError) {
    console.error('Error accessing pipeline_stages table:', stagesError.message);
  } else {
    console.log('pipeline_stages table exists!');
  }
}

checkTable();
