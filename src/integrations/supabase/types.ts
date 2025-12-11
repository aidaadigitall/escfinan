export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency: string | null
          bank_name: string | null
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_balance_audit: {
        Row: {
          balance_change: number
          bank_account_id: string
          created_at: string
          description: string | null
          id: string
          new_balance: number
          old_balance: number | null
          operation: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          balance_change: number
          bank_account_id: string
          created_at?: string
          description?: string | null
          id?: string
          new_balance: number
          old_balance?: number | null
          operation: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          balance_change?: number
          bank_account_id?: string
          created_at?: string
          description?: string | null
          id?: string
          new_balance?: number
          old_balance?: number | null
          operation?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_balance_audit_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_balance_audit_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_type: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          cpf: string | null
          created_at: string
          document_type: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string
          document_type?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string
          document_type?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zipcode?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          created_at: string
          email: string | null
          favicon_url: string | null
          id: string
          ie: string | null
          im: string | null
          logo_header_url: string | null
          logo_sidebar_url: string | null
          next_quote_number: number | null
          next_sale_number: number | null
          next_service_order_number: number | null
          phone: string | null
          phone2: string | null
          state: string | null
          trading_name: string | null
          updated_at: string
          user_id: string
          warranty_terms: string | null
          website: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          logo_header_url?: string | null
          logo_sidebar_url?: string | null
          next_quote_number?: number | null
          next_sale_number?: number | null
          next_service_order_number?: number | null
          phone?: string | null
          phone2?: string | null
          state?: string | null
          trading_name?: string | null
          updated_at?: string
          user_id: string
          warranty_terms?: string | null
          website?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          logo_header_url?: string | null
          logo_sidebar_url?: string | null
          next_quote_number?: number | null
          next_sale_number?: number | null
          next_service_order_number?: number | null
          phone?: string | null
          phone2?: string | null
          state?: string | null
          trading_name?: string | null
          updated_at?: string
          user_id?: string
          warranty_terms?: string | null
          website?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      company_settings_audit: {
        Row: {
          changed_at: string
          changed_field: string
          company_settings_id: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          changed_at?: string
          changed_field: string
          company_settings_id: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          changed_at?: string
          changed_field?: string
          company_settings_id?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_card_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          credit_card_id: string
          current_installment: number | null
          description: string
          id: string
          installments: number | null
          is_synced: boolean
          operator_transaction_id: string | null
          transaction_date: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          credit_card_id: string
          current_installment?: number | null
          description: string
          id?: string
          installments?: number | null
          is_synced?: boolean
          operator_transaction_id?: string | null
          transaction_date: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          credit_card_id?: string
          current_installment?: number | null
          description?: string
          id?: string
          installments?: number | null
          is_synced?: boolean
          operator_transaction_id?: string | null
          transaction_date?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          available_credit: number
          card_brand: string
          card_name: string
          card_number: string
          cardholder_name: string
          closing_day: number
          created_at: string
          credit_limit: number
          due_day: number
          id: string
          is_active: boolean
          last_sync_at: string | null
          operator_card_id: string | null
          operator_integration: string | null
          sync_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          available_credit?: number
          card_brand: string
          card_name: string
          card_number: string
          cardholder_name: string
          closing_day: number
          created_at?: string
          credit_limit?: number
          due_day: number
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          operator_card_id?: string | null
          operator_integration?: string | null
          sync_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          available_credit?: number
          card_brand?: string
          card_name?: string
          card_number?: string
          cardholder_name?: string
          closing_day?: number
          created_at?: string
          credit_limit?: number
          due_day?: number
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          operator_card_id?: string | null
          operator_integration?: string | null
          sync_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          position: string | null
          salary: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_sources: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          company: string | null
          converted_at: string | null
          converted_to_client: boolean | null
          created_at: string
          created_by: string | null
          email: string | null
          expected_close_date: string | null
          expected_value: number | null
          first_contact_date: string | null
          id: string
          last_activity_date: string | null
          last_contact_date: string | null
          lost_date: string | null
          lost_reason: string | null
          name: string
          notes: string | null
          owner_user_id: string | null
          phone: string | null
          pipeline_stage_id: string | null
          position: string | null
          probability: number | null
          score: number | null
          source: string | null
          source_details: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          company?: string | null
          converted_at?: string | null
          converted_to_client?: boolean | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expected_close_date?: string | null
          expected_value?: number | null
          first_contact_date?: string | null
          id?: string
          last_activity_date?: string | null
          last_contact_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          name: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          pipeline_stage_id?: string | null
          position?: string | null
          probability?: number | null
          score?: number | null
          source?: string | null
          source_details?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          company?: string | null
          converted_at?: string | null
          converted_to_client?: boolean | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expected_close_date?: string | null
          expected_value?: number | null
          first_contact_date?: string | null
          id?: string
          last_activity_date?: string | null
          last_contact_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          pipeline_stage_id?: string | null
          position?: string | null
          probability?: number | null
          score?: number | null
          source?: string | null
          source_details?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          transaction_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          transaction_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          transaction_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          fee_percentage: number | null
          fee_type: string | null
          id: string
          is_active: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fee_percentage?: number | null
          fee_type?: string | null
          id?: string
          is_active?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          fee_percentage?: number | null
          fee_type?: string | null
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          markup: number | null
          min_stock: number | null
          name: string
          profit_amount: number | null
          profit_margin: number | null
          sale_price: number
          sku: string | null
          stock_quantity: number
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          markup?: number | null
          min_stock?: number | null
          name: string
          profit_amount?: number | null
          profit_margin?: number | null
          sale_price?: number
          sku?: string | null
          stock_quantity?: number
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          markup?: number | null
          min_stock?: number | null
          name?: string
          profit_amount?: number | null
          profit_margin?: number | null
          sale_price?: number
          sku?: string | null
          stock_quantity?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          item_type: string
          name: string
          product_id: string | null
          quantity: number
          quote_id: string
          service_id: string | null
          subtotal: number | null
          unit: string | null
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          item_type: string
          name: string
          product_id?: string | null
          quantity?: number
          quote_id: string
          service_id?: string | null
          subtotal?: number | null
          unit?: string | null
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          item_type?: string
          name?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          service_id?: string | null
          subtotal?: number | null
          unit?: string | null
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string | null
          created_at: string
          delivery_date: string | null
          discount_total: number | null
          id: string
          internal_notes: string | null
          notes: string | null
          products_total: number | null
          quote_number: number
          seller_id: string | null
          services_total: number | null
          status: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
          validity_days: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          delivery_date?: string | null
          discount_total?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          products_total?: number | null
          quote_number?: number
          seller_id?: string | null
          services_total?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          validity_days?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          delivery_date?: string | null
          discount_total?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          products_total?: number | null
          quote_number?: number
          seller_id?: string | null
          services_total?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_bills: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string | null
          cost_center_id: string | null
          created_at: string
          description: string
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          payment_method_id: string | null
          recurrence_day: number | null
          recurrence_type: string
          start_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_method_id?: string | null
          recurrence_day?: number | null
          recurrence_type: string
          start_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_method_id?: string | null
          recurrence_day?: number | null
          recurrence_type?: string
          start_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bills_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          item_type: string
          name: string
          product_id: string | null
          quantity: number
          sale_id: string
          service_id: string | null
          subtotal: number | null
          unit: string | null
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          item_type: string
          name: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          service_id?: string | null
          subtotal?: number | null
          unit?: string | null
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          item_type?: string
          name?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          service_id?: string | null
          subtotal?: number | null
          unit?: string | null
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          created_at: string
          delivery_date: string | null
          discount_total: number | null
          id: string
          notes: string | null
          payment_method: string | null
          products_total: number | null
          quote_id: string | null
          sale_date: string | null
          sale_number: number
          seller_id: string | null
          services_total: number | null
          status: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
          warranty_terms: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          delivery_date?: string | null
          discount_total?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          products_total?: number | null
          quote_id?: string | null
          sale_date?: string | null
          sale_number?: number
          seller_id?: string | null
          services_total?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          warranty_terms?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          delivery_date?: string | null
          discount_total?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          products_total?: number | null
          quote_id?: string | null
          sale_date?: string | null
          sale_number?: number
          seller_id?: string | null
          services_total?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          warranty_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_items: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          item_type: string
          name: string
          product_id: string | null
          quantity: number
          service_id: string | null
          service_order_id: string
          subtotal: number | null
          unit: string | null
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          item_type: string
          name: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          service_order_id: string
          subtotal?: number | null
          unit?: string | null
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          item_type?: string
          name?: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          service_order_id?: string
          subtotal?: number | null
          unit?: string | null
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          client_id: string | null
          created_at: string
          defects: string | null
          discount_total: number | null
          entry_date: string | null
          equipment_brand: string | null
          equipment_memory: string | null
          equipment_model: string | null
          equipment_name: string | null
          equipment_processor: string | null
          equipment_serial: string | null
          equipment_storage: string | null
          exit_date: string | null
          id: string
          notes: string | null
          order_number: number
          priority: string | null
          products_total: number | null
          responsible_id: string | null
          services_total: number | null
          status: string | null
          technical_report: string | null
          technician_id: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
          warranty_terms: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          defects?: string | null
          discount_total?: number | null
          entry_date?: string | null
          equipment_brand?: string | null
          equipment_memory?: string | null
          equipment_model?: string | null
          equipment_name?: string | null
          equipment_processor?: string | null
          equipment_serial?: string | null
          equipment_storage?: string | null
          exit_date?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          priority?: string | null
          products_total?: number | null
          responsible_id?: string | null
          services_total?: number | null
          status?: string | null
          technical_report?: string | null
          technician_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          warranty_terms?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          defects?: string | null
          discount_total?: number | null
          entry_date?: string | null
          equipment_brand?: string | null
          equipment_memory?: string | null
          equipment_model?: string | null
          equipment_name?: string | null
          equipment_processor?: string | null
          equipment_serial?: string | null
          equipment_storage?: string | null
          exit_date?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          priority?: string | null
          products_total?: number | null
          responsible_id?: string | null
          services_total?: number | null
          status?: string | null
          technical_report?: string | null
          technician_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          warranty_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          cost_price: number
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          is_active: boolean
          name: string
          sale_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          name: string
          sale_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          name?: string
          sale_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      statuses: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          cpf: string | null
          created_at: string
          document_type: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string
          document_type?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string
          document_type?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zipcode?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          system_name: string | null
          system_subtitle: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          system_name?: string | null
          system_subtitle?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          system_name?: string | null
          system_subtitle?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          owner_user_id: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          owner_user_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          mentions: string[] | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_labels: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_users: string[] | null
          attachments: Json | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          is_recurring: boolean | null
          labels: string[] | null
          parent_task_id: string | null
          priority: string | null
          recurrence_type: string | null
          reminder_date: string | null
          responsible_id: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_users?: string[] | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_recurring?: boolean | null
          labels?: string[] | null
          parent_task_id?: string | null
          priority?: string | null
          recurrence_type?: string | null
          reminder_date?: string | null
          responsible_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_users?: string[] | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_recurring?: boolean | null
          labels?: string[] | null
          parent_task_id?: string | null
          priority?: string | null
          recurrence_type?: string | null
          reminder_date?: string | null
          responsible_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          break_end: string | null
          break_start: string | null
          clock_in: string
          clock_out: string | null
          created_at: string
          id: string
          location: string | null
          notes: string | null
          status: string
          total_break_minutes: number | null
          total_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          total_break_minutes?: number | null
          total_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          total_break_minutes?: number | null
          total_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_status_history: {
        Row: {
          created_at: string
          created_by_name: string | null
          id: string
          new_status: string
          observation: string | null
          old_status: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by_name?: string | null
          id?: string
          new_status: string
          observation?: string | null
          old_status?: string | null
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by_name?: string | null
          id?: string
          new_status?: string
          observation?: string | null
          old_status?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_status_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account: string | null
          amount: number
          bank_account_id: string | null
          category_id: string | null
          client: string | null
          created_at: string
          description: string
          due_date: string
          entity: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account?: string | null
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          client?: string | null
          created_at?: string
          description: string
          due_date: string
          entity?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string | null
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          client?: string | null
          created_at?: string
          description?: string
          due_date?: string
          entity?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_manage_bank_accounts: boolean | null
          can_manage_cash: boolean | null
          can_manage_categories: boolean | null
          can_manage_chart_of_accounts: boolean | null
          can_manage_clients: boolean | null
          can_manage_cost_centers: boolean | null
          can_manage_credit_cards: boolean | null
          can_manage_daily_entries: boolean | null
          can_manage_employees: boolean | null
          can_manage_fixed_expenses: boolean | null
          can_manage_fixed_income: boolean | null
          can_manage_others_tasks: boolean | null
          can_manage_payables: boolean | null
          can_manage_payment_methods: boolean | null
          can_manage_products: boolean | null
          can_manage_quotes: boolean | null
          can_manage_receivables: boolean | null
          can_manage_sales: boolean | null
          can_manage_service_orders: boolean | null
          can_manage_services: boolean | null
          can_manage_settings: boolean | null
          can_manage_stock: boolean | null
          can_manage_stock_movements: boolean | null
          can_manage_suppliers: boolean | null
          can_manage_tasks: boolean | null
          can_manage_transfers: boolean | null
          can_manage_users: boolean | null
          can_view_bank_accounts: boolean | null
          can_view_calendar: boolean | null
          can_view_cash: boolean | null
          can_view_cashflow: boolean | null
          can_view_categories: boolean | null
          can_view_chart_of_accounts: boolean | null
          can_view_clients: boolean | null
          can_view_cost_centers: boolean | null
          can_view_credit_cards: boolean | null
          can_view_daily_entries: boolean | null
          can_view_dashboard_values: boolean | null
          can_view_dre: boolean | null
          can_view_employees: boolean | null
          can_view_fixed_expenses: boolean | null
          can_view_fixed_income: boolean | null
          can_view_payables: boolean | null
          can_view_payment_methods: boolean | null
          can_view_products: boolean | null
          can_view_quotes: boolean | null
          can_view_receivables: boolean | null
          can_view_reports: boolean | null
          can_view_sales: boolean | null
          can_view_service_orders: boolean | null
          can_view_services: boolean | null
          can_view_settings: boolean | null
          can_view_stock: boolean | null
          can_view_stock_movements: boolean | null
          can_view_suppliers: boolean | null
          can_view_task_reports: boolean | null
          can_view_tasks: boolean | null
          can_view_transfers: boolean | null
          can_view_users: boolean | null
          created_at: string
          id: string
          owner_user_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_manage_bank_accounts?: boolean | null
          can_manage_cash?: boolean | null
          can_manage_categories?: boolean | null
          can_manage_chart_of_accounts?: boolean | null
          can_manage_clients?: boolean | null
          can_manage_cost_centers?: boolean | null
          can_manage_credit_cards?: boolean | null
          can_manage_daily_entries?: boolean | null
          can_manage_employees?: boolean | null
          can_manage_fixed_expenses?: boolean | null
          can_manage_fixed_income?: boolean | null
          can_manage_others_tasks?: boolean | null
          can_manage_payables?: boolean | null
          can_manage_payment_methods?: boolean | null
          can_manage_products?: boolean | null
          can_manage_quotes?: boolean | null
          can_manage_receivables?: boolean | null
          can_manage_sales?: boolean | null
          can_manage_service_orders?: boolean | null
          can_manage_services?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_stock?: boolean | null
          can_manage_stock_movements?: boolean | null
          can_manage_suppliers?: boolean | null
          can_manage_tasks?: boolean | null
          can_manage_transfers?: boolean | null
          can_manage_users?: boolean | null
          can_view_bank_accounts?: boolean | null
          can_view_calendar?: boolean | null
          can_view_cash?: boolean | null
          can_view_cashflow?: boolean | null
          can_view_categories?: boolean | null
          can_view_chart_of_accounts?: boolean | null
          can_view_clients?: boolean | null
          can_view_cost_centers?: boolean | null
          can_view_credit_cards?: boolean | null
          can_view_daily_entries?: boolean | null
          can_view_dashboard_values?: boolean | null
          can_view_dre?: boolean | null
          can_view_employees?: boolean | null
          can_view_fixed_expenses?: boolean | null
          can_view_fixed_income?: boolean | null
          can_view_payables?: boolean | null
          can_view_payment_methods?: boolean | null
          can_view_products?: boolean | null
          can_view_quotes?: boolean | null
          can_view_receivables?: boolean | null
          can_view_reports?: boolean | null
          can_view_sales?: boolean | null
          can_view_service_orders?: boolean | null
          can_view_services?: boolean | null
          can_view_settings?: boolean | null
          can_view_stock?: boolean | null
          can_view_stock_movements?: boolean | null
          can_view_suppliers?: boolean | null
          can_view_task_reports?: boolean | null
          can_view_tasks?: boolean | null
          can_view_transfers?: boolean | null
          can_view_users?: boolean | null
          created_at?: string
          id?: string
          owner_user_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_manage_bank_accounts?: boolean | null
          can_manage_cash?: boolean | null
          can_manage_categories?: boolean | null
          can_manage_chart_of_accounts?: boolean | null
          can_manage_clients?: boolean | null
          can_manage_cost_centers?: boolean | null
          can_manage_credit_cards?: boolean | null
          can_manage_daily_entries?: boolean | null
          can_manage_employees?: boolean | null
          can_manage_fixed_expenses?: boolean | null
          can_manage_fixed_income?: boolean | null
          can_manage_others_tasks?: boolean | null
          can_manage_payables?: boolean | null
          can_manage_payment_methods?: boolean | null
          can_manage_products?: boolean | null
          can_manage_quotes?: boolean | null
          can_manage_receivables?: boolean | null
          can_manage_sales?: boolean | null
          can_manage_service_orders?: boolean | null
          can_manage_services?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_stock?: boolean | null
          can_manage_stock_movements?: boolean | null
          can_manage_suppliers?: boolean | null
          can_manage_tasks?: boolean | null
          can_manage_transfers?: boolean | null
          can_manage_users?: boolean | null
          can_view_bank_accounts?: boolean | null
          can_view_calendar?: boolean | null
          can_view_cash?: boolean | null
          can_view_cashflow?: boolean | null
          can_view_categories?: boolean | null
          can_view_chart_of_accounts?: boolean | null
          can_view_clients?: boolean | null
          can_view_cost_centers?: boolean | null
          can_view_credit_cards?: boolean | null
          can_view_daily_entries?: boolean | null
          can_view_dashboard_values?: boolean | null
          can_view_dre?: boolean | null
          can_view_employees?: boolean | null
          can_view_fixed_expenses?: boolean | null
          can_view_fixed_income?: boolean | null
          can_view_payables?: boolean | null
          can_view_payment_methods?: boolean | null
          can_view_products?: boolean | null
          can_view_quotes?: boolean | null
          can_view_receivables?: boolean | null
          can_view_reports?: boolean | null
          can_view_sales?: boolean | null
          can_view_service_orders?: boolean | null
          can_view_services?: boolean | null
          can_view_settings?: boolean | null
          can_view_stock?: boolean | null
          can_view_stock_movements?: boolean | null
          can_view_suppliers?: boolean | null
          can_view_task_reports?: boolean | null
          can_view_tasks?: boolean | null
          can_view_transfers?: boolean | null
          can_view_users?: boolean | null
          created_at?: string
          id?: string
          owner_user_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_user_data: {
        Args: { _data_user_id: string }
        Returns: boolean
      }
      check_due_transactions: { Args: never; Returns: undefined }
      get_effective_owner_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gerente" | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gerente", "usuario"],
    },
  },
} as const
