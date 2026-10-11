// Hand-written subset of the Supabase Database type.
// Keep in sync with supabase/migrations/0001_init.sql.
// Replace with `supabase gen types typescript` output once the local CLI is wired.

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          parent_id: string | null
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          parent_id?: string | null
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          medusa_product_id: string | null
          category_id: string | null
          name: string
          slug: string
          description: string | null
          material: string | null
          care_instructions: string | null
          base_price: number
          compare_price: number | null
          tags: string[]
          is_active: boolean
          is_featured: boolean
          is_just_in: boolean
          is_gift_packable: boolean
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          medusa_product_id?: string | null
          category_id?: string | null
          name: string
          slug: string
          description?: string | null
          material?: string | null
          care_instructions?: string | null
          base_price: number
          compare_price?: number | null
          tags?: string[]
          is_active?: boolean
          is_featured?: boolean
          is_just_in?: boolean
          is_gift_packable?: boolean
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          medusa_variant_id: string | null
          sku: string
          color: string | null
          size: string | null
          price: number
          compare_price: number | null
          weight_grams: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          medusa_variant_id?: string | null
          sku: string
          color?: string | null
          size?: string | null
          price: number
          compare_price?: number | null
          weight_grams?: number
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          storage_path: string
          url: string
          alt_text: string | null
          is_primary: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          product_id: string
          variant_id?: string | null
          storage_path: string
          url: string
          alt_text?: string | null
          is_primary?: boolean
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          variant_id: string
          qty_available: number
          qty_reserved: number
          qty_sold: number
          reorder_level: number
          updated_at: string
        }
        Insert: {
          id?: string
          variant_id: string
          qty_available?: number
          qty_reserved?: number
          qty_sold?: number
          reorder_level?: number
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['inventory']['Insert']>
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          variant_id: string
          quantity: number
          gift_wrap: boolean
          gift_message: string | null
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          variant_id: string
          quantity?: number
          gift_wrap?: boolean
          gift_message?: string | null
          added_at?: string
        }
        Update: {
          quantity?: number
          gift_wrap?: boolean
          gift_message?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'customer' | 'admin' | 'staff'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'admin' | 'staff'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type { Json }
