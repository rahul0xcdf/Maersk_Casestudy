import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export type Database = {
  public: {
    Tables: {
      // Add your table types here based on your schema
      orders: {
        Row: {
          id: string
          order_id: string
          customer_id: string
          order_status: string
          order_purchase_timestamp: string
          order_approved_at: string
          order_delivered_carrier_date: string
          order_delivered_customer_date: string
          order_estimated_delivery_date: string
          price: number
          freight_value: number
          payment_type: string
          payment_installments: number
          payment_value: number
          review_score: number
          product_category_name: string
          customer_city: string
          customer_state: string
          seller_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['orders']['Row']>
      }
    }
  }
}