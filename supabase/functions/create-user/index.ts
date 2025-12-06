import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { email, password, name, phone, role, is_active, owner_user_id, permissions } = await req.json()

    // Create user with admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        phone,
        role,
      },
    })

    if (authError) throw authError

    // Create profile in system_users table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('system_users')
      .insert({
        user_id: authData.user.id,
        email,
        name,
        phone,
        role,
        is_active,
        owner_user_id: owner_user_id || null,
      })
      .select()
      .single()

    if (profileError) throw profileError

    // Create user permissions if provided
    if (permissions && owner_user_id) {
      const { error: permError } = await supabaseAdmin
        .from('user_permissions')
        .insert({
          user_id: authData.user.id,
          owner_user_id: owner_user_id,
          ...permissions,
        })

      if (permError) {
        console.error('Error creating permissions:', permError)
        // Don't throw - user was created successfully
      }
    }

    // Create default data for the new user (categories, payment methods, etc.)
    // This ensures the user has data to work with
    const userId = authData.user.id

    // Insert default categories
    await supabaseAdmin.from('categories').insert([
      { user_id: userId, name: 'Licença ou aluguel de softwares', type: 'expense' },
      { user_id: userId, name: 'Pró Labore', type: 'expense' },
      { user_id: userId, name: 'Alimentação', type: 'expense' },
      { user_id: userId, name: 'Material para uso interno', type: 'expense' },
      { user_id: userId, name: 'Compras', type: 'expense' },
      { user_id: userId, name: 'Vendas', type: 'income' },
      { user_id: userId, name: 'Serviços', type: 'income' },
      { user_id: userId, name: 'Consultoria', type: 'income' },
    ])

    // Insert default payment methods
    await supabaseAdmin.from('payment_methods').insert([
      { user_id: userId, name: 'Pix', is_active: true },
      { user_id: userId, name: 'Cartão de Crédito', is_active: true },
      { user_id: userId, name: 'Cartão de Débito', is_active: true },
      { user_id: userId, name: 'Boleto Bancário', is_active: true },
      { user_id: userId, name: 'Dinheiro', is_active: true },
      { user_id: userId, name: 'Transferência Bancária', is_active: true },
    ])

    // Create profile entry
    await supabaseAdmin.from('profiles').insert({
      user_id: userId,
      full_name: name,
    })

    return new Response(
      JSON.stringify({ user: authData.user, profile: profileData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar usuário'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
