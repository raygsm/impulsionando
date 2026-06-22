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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_dedupe_threshold_audit: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_max_pct: number
          new_min_pct: number
          old_max_pct: number | null
          old_min_pct: number | null
          target_user: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_max_pct: number
          new_min_pct: number
          old_max_pct?: number | null
          old_min_pct?: number | null
          target_user: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_max_pct?: number
          new_min_pct?: number
          old_max_pct?: number | null
          old_min_pct?: number | null
          target_user?: string
        }
        Relationships: []
      }
      admin_dedupe_thresholds: {
        Row: {
          created_at: string
          max_pct: number
          min_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          max_pct?: number
          min_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          max_pct?: number
          min_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aff_affiliate_products: {
        Row: {
          affiliate_id: string
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          custom_commission_pct: number | null
          id: string
          product_id: string
          status: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          custom_commission_pct?: number | null
          id?: string
          product_id: string
          status?: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          custom_commission_pct?: number | null
          id?: string
          product_id?: string
          status?: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_affiliate_products_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "aff_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_affiliate_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_affiliate_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_affiliate_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_affiliate_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_affiliate_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "aff_products"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_affiliates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_data: Json | null
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          instagram: string | null
          is_lifetime: boolean
          lifetime_granted_at: string | null
          lifetime_granted_by: string | null
          main_channel: string | null
          manager_id: string | null
          name: string
          notes: string | null
          pix_key: string | null
          site: string | null
          state: string | null
          status: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at: string
          user_id: string | null
          wallet_balance: number
          wallet_last_movement_at: string | null
          wallet_pending: number
          whatsapp: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_data?: Json | null
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          is_lifetime?: boolean
          lifetime_granted_at?: string | null
          lifetime_granted_by?: string | null
          main_channel?: string | null
          manager_id?: string | null
          name: string
          notes?: string | null
          pix_key?: string | null
          site?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at?: string
          user_id?: string | null
          wallet_balance?: number
          wallet_last_movement_at?: string | null
          wallet_pending?: number
          whatsapp?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_data?: Json | null
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          is_lifetime?: boolean
          lifetime_granted_at?: string | null
          lifetime_granted_by?: string | null
          main_channel?: string | null
          manager_id?: string | null
          name?: string
          notes?: string | null
          pix_key?: string | null
          site?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at?: string
          user_id?: string | null
          wallet_balance?: number
          wallet_last_movement_at?: string | null
          wallet_pending?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aff_affiliates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_affiliates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_affiliates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_affiliates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_affiliates_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "aff_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_bumps: {
        Row: {
          affiliate_gets_commission: boolean
          bump_product_id: string | null
          commission_override: number | null
          company_id: string
          coproducer_participates: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_cents: number
          product_id: string
          updated_at: string
        }
        Insert: {
          affiliate_gets_commission?: boolean
          bump_product_id?: string | null
          commission_override?: number | null
          company_id: string
          coproducer_participates?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_cents?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          affiliate_gets_commission?: boolean
          bump_product_id?: string | null
          commission_override?: number | null
          company_id?: string
          coproducer_participates?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_cents?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_bumps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "aff_products"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_commissions: {
        Row: {
          affiliate_id: string | null
          amount: number
          company_id: string
          coproducer_id: string | null
          created_at: string
          id: string
          manager_id: string | null
          notes: string | null
          paid_at: string | null
          payout_id: string | null
          pct: number | null
          recipient_kind: Database["public"]["Enums"]["aff_commission_kind"]
          recipient_user_id: string | null
          release_at: string | null
          released_at: string | null
          sale_id: string
          status: Database["public"]["Enums"]["aff_sale_status"]
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          amount: number
          company_id: string
          coproducer_id?: string | null
          created_at?: string
          id?: string
          manager_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payout_id?: string | null
          pct?: number | null
          recipient_kind: Database["public"]["Enums"]["aff_commission_kind"]
          recipient_user_id?: string | null
          release_at?: string | null
          released_at?: string | null
          sale_id: string
          status?: Database["public"]["Enums"]["aff_sale_status"]
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          amount?: number
          company_id?: string
          coproducer_id?: string | null
          created_at?: string
          id?: string
          manager_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payout_id?: string | null
          pct?: number | null
          recipient_kind?: Database["public"]["Enums"]["aff_commission_kind"]
          recipient_user_id?: string | null
          release_at?: string | null
          released_at?: string | null
          sale_id?: string
          status?: Database["public"]["Enums"]["aff_sale_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "aff_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_commissions_coproducer_id_fkey"
            columns: ["coproducer_id"]
            isOneToOne: false
            referencedRelation: "aff_coproducers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_commissions_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "aff_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "aff_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_coproducers: {
        Row: {
          applies_to_affiliate_sales: boolean
          applies_to_upsell: boolean
          company_id: string
          created_at: string
          document: string | null
          email: string | null
          ends_at: string | null
          fixed_amount: number | null
          id: string
          name: string
          offer_id: string | null
          participation_pct: number | null
          product_id: string
          rules: Json
          scope: string
          starts_at: string
          status: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          applies_to_affiliate_sales?: boolean
          applies_to_upsell?: boolean
          company_id: string
          created_at?: string
          document?: string | null
          email?: string | null
          ends_at?: string | null
          fixed_amount?: number | null
          id?: string
          name: string
          offer_id?: string | null
          participation_pct?: number | null
          product_id: string
          rules?: Json
          scope?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          applies_to_affiliate_sales?: boolean
          applies_to_upsell?: boolean
          company_id?: string
          created_at?: string
          document?: string | null
          email?: string | null
          ends_at?: string | null
          fixed_amount?: number | null
          id?: string
          name?: string
          offer_id?: string | null
          participation_pct?: number | null
          product_id?: string
          rules?: Json
          scope?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aff_coproducers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_coproducers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_coproducers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_coproducers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_coproducers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "aff_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_coproducers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "aff_products"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_coupons: {
        Row: {
          affiliate_id: string | null
          code: string
          company_id: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          keep_commission: boolean
          max_per_customer: number | null
          max_uses: number | null
          offer_id: string | null
          product_id: string | null
          status: string
          updated_at: string
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          affiliate_id?: string | null
          code: string
          company_id: string
          created_at?: string
          discount_type: string
          discount_value: number
          id?: string
          keep_commission?: boolean
          max_per_customer?: number | null
          max_uses?: number | null
          offer_id?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          affiliate_id?: string | null
          code?: string
          company_id?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          keep_commission?: boolean
          max_per_customer?: number | null
          max_uses?: number | null
          offer_id?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      aff_crm_events: {
        Row: {
          channel: string | null
          company_id: string
          converted_at: string | null
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          flow_id: string
          id: string
          payload: Json | null
          sale_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          step_index: number
        }
        Insert: {
          channel?: string | null
          company_id: string
          converted_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          flow_id: string
          id?: string
          payload?: Json | null
          sale_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          step_index?: number
        }
        Update: {
          channel?: string | null
          company_id?: string
          converted_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          flow_id?: string
          id?: string
          payload?: Json | null
          sale_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          step_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "aff_crm_events_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "aff_crm_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_crm_flows: {
        Row: {
          affiliate_id: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          name: string
          product_id: string | null
          steps: Json
          stop_on_paid: boolean
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          name: string
          product_id?: string | null
          steps?: Json
          stop_on_paid?: boolean
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          product_id?: string | null
          steps?: Json
          stop_on_paid?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      aff_crosssells: {
        Row: {
          company_id: string
          created_at: string
          cross_product_id: string | null
          id: string
          is_active: boolean
          moment: string
          name: string
          product_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          cross_product_id?: string | null
          id?: string
          is_active?: boolean
          moment?: string
          name: string
          product_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          cross_product_id?: string | null
          id?: string
          is_active?: boolean
          moment?: string
          name?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_crosssells_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "aff_products"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_links: {
        Row: {
          affiliate_id: string | null
          campaign: string | null
          clicks: number
          commission_total: number
          company_id: string
          created_at: string
          destination_url: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["aff_link_kind"]
          leads: number
          offer_id: string | null
          product_id: string | null
          revenue: number
          sales: number
          slug: string
          updated_at: string
          utm: Json
        }
        Insert: {
          affiliate_id?: string | null
          campaign?: string | null
          clicks?: number
          commission_total?: number
          company_id: string
          created_at?: string
          destination_url?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["aff_link_kind"]
          leads?: number
          offer_id?: string | null
          product_id?: string | null
          revenue?: number
          sales?: number
          slug: string
          updated_at?: string
          utm?: Json
        }
        Update: {
          affiliate_id?: string | null
          campaign?: string | null
          clicks?: number
          commission_total?: number
          company_id?: string
          created_at?: string
          destination_url?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["aff_link_kind"]
          leads?: number
          offer_id?: string | null
          product_id?: string | null
          revenue?: number
          sales?: number
          slug?: string
          updated_at?: string
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "aff_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "aff_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "aff_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "aff_products"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_managers: {
        Row: {
          commission_fixed: number | null
          commission_pct: number
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          commission_fixed?: number | null
          commission_pct?: number
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          commission_fixed?: number | null
          commission_pct?: number
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["aff_affiliate_status"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aff_managers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_managers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_managers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_managers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      aff_offers: {
        Row: {
          allow_affiliate: boolean
          allow_coupon: boolean
          allow_installments: boolean | null
          billing: Database["public"]["Enums"]["aff_offer_billing"]
          checkout_url: string | null
          commission_pct: number | null
          company_id: string
          created_at: string
          id: string
          installments: number
          interest_paid_by: string | null
          landing_url: string | null
          max_installments: number | null
          metadata: Json
          name: string
          price: number
          product_id: string
          recurring_interval: string | null
          status: Database["public"]["Enums"]["aff_product_status"]
          trial_days: number
          updated_at: string
        }
        Insert: {
          allow_affiliate?: boolean
          allow_coupon?: boolean
          allow_installments?: boolean | null
          billing?: Database["public"]["Enums"]["aff_offer_billing"]
          checkout_url?: string | null
          commission_pct?: number | null
          company_id: string
          created_at?: string
          id?: string
          installments?: number
          interest_paid_by?: string | null
          landing_url?: string | null
          max_installments?: number | null
          metadata?: Json
          name: string
          price?: number
          product_id: string
          recurring_interval?: string | null
          status?: Database["public"]["Enums"]["aff_product_status"]
          trial_days?: number
          updated_at?: string
        }
        Update: {
          allow_affiliate?: boolean
          allow_coupon?: boolean
          allow_installments?: boolean | null
          billing?: Database["public"]["Enums"]["aff_offer_billing"]
          checkout_url?: string | null
          commission_pct?: number | null
          company_id?: string
          created_at?: string
          id?: string
          installments?: number
          interest_paid_by?: string | null
          landing_url?: string | null
          max_installments?: number | null
          metadata?: Json
          name?: string
          price?: number
          product_id?: string
          recurring_interval?: string | null
          status?: Database["public"]["Enums"]["aff_product_status"]
          trial_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "aff_products"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_payouts: {
        Row: {
          affiliate_id: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_data: Json | null
          company_id: string
          coproducer_id: string | null
          created_at: string
          external_payment_id: string | null
          id: string
          manager_id: string | null
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          pix_key: string | null
          recipient_kind: Database["public"]["Enums"]["aff_commission_kind"]
          recipient_user_id: string | null
          requested_at: string
          status: Database["public"]["Enums"]["aff_payout_status"]
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_data?: Json | null
          company_id: string
          coproducer_id?: string | null
          created_at?: string
          external_payment_id?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          pix_key?: string | null
          recipient_kind: Database["public"]["Enums"]["aff_commission_kind"]
          recipient_user_id?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["aff_payout_status"]
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_data?: Json | null
          company_id?: string
          coproducer_id?: string | null
          created_at?: string
          external_payment_id?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          pix_key?: string | null
          recipient_kind?: Database["public"]["Enums"]["aff_commission_kind"]
          recipient_user_id?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["aff_payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "aff_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_payouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_payouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_payouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_payouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_payouts_coproducer_id_fkey"
            columns: ["coproducer_id"]
            isOneToOne: false
            referencedRelation: "aff_coproducers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_payouts_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "aff_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_product_plans: {
        Row: {
          company_id: string
          consumption_days: number | null
          created_at: string
          followup_after_end_days: number | null
          followup_before_end_days: number | null
          followup_second_days_before: number | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          product_id: string
          quantity: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          consumption_days?: number | null
          created_at?: string
          followup_after_end_days?: number | null
          followup_before_end_days?: number | null
          followup_second_days_before?: number | null
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          product_id: string
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          consumption_days?: number | null
          created_at?: string
          followup_after_end_days?: number | null
          followup_before_end_days?: number | null
          followup_second_days_before?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          product_id?: string
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_product_plans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "aff_products"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_products: {
        Row: {
          allow_affiliate: boolean
          allow_coupon: boolean
          allow_installments: boolean | null
          allow_qrcode: boolean
          allow_unique_link: boolean
          base_price: number
          category: string | null
          checkout_url: string | null
          company_id: string
          consumption_days: number | null
          created_at: string
          created_by: string | null
          default_commission_pct: number
          description: string | null
          id: string
          image_url: string | null
          interest_paid_by: string | null
          is_recurring_consumption: boolean | null
          kind: Database["public"]["Enums"]["aff_product_kind"]
          max_installments: number | null
          metadata: Json
          name: string
          niche_slug: string | null
          producer_user_id: string | null
          require_affiliate_approval: boolean
          sales_page_url: string | null
          status: Database["public"]["Enums"]["aff_product_status"]
          updated_at: string
        }
        Insert: {
          allow_affiliate?: boolean
          allow_coupon?: boolean
          allow_installments?: boolean | null
          allow_qrcode?: boolean
          allow_unique_link?: boolean
          base_price?: number
          category?: string | null
          checkout_url?: string | null
          company_id: string
          consumption_days?: number | null
          created_at?: string
          created_by?: string | null
          default_commission_pct?: number
          description?: string | null
          id?: string
          image_url?: string | null
          interest_paid_by?: string | null
          is_recurring_consumption?: boolean | null
          kind?: Database["public"]["Enums"]["aff_product_kind"]
          max_installments?: number | null
          metadata?: Json
          name: string
          niche_slug?: string | null
          producer_user_id?: string | null
          require_affiliate_approval?: boolean
          sales_page_url?: string | null
          status?: Database["public"]["Enums"]["aff_product_status"]
          updated_at?: string
        }
        Update: {
          allow_affiliate?: boolean
          allow_coupon?: boolean
          allow_installments?: boolean | null
          allow_qrcode?: boolean
          allow_unique_link?: boolean
          base_price?: number
          category?: string | null
          checkout_url?: string | null
          company_id?: string
          consumption_days?: number | null
          created_at?: string
          created_by?: string | null
          default_commission_pct?: number
          description?: string | null
          id?: string
          image_url?: string | null
          interest_paid_by?: string | null
          is_recurring_consumption?: boolean | null
          kind?: Database["public"]["Enums"]["aff_product_kind"]
          max_installments?: number | null
          metadata?: Json
          name?: string
          niche_slug?: string | null
          producer_user_id?: string | null
          require_affiliate_approval?: boolean
          sales_page_url?: string | null
          status?: Database["public"]["Enums"]["aff_product_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      aff_sales: {
        Row: {
          affiliate_id: string | null
          approved_at: string | null
          available_at: string | null
          campaign: string | null
          chargeback_at: string | null
          company_id: string
          coupon_id: string | null
          created_at: string
          customer_doc: string | null
          customer_email: string | null
          customer_name: string | null
          external_id: string | null
          gateway_fee: number
          gateway_id: string | null
          gateway_provider: string | null
          gateway_release_at: string | null
          gross_amount: number
          id: string
          installment_interest: number | null
          interest_paid_by: string | null
          internal_release_at: string | null
          kind: string | null
          link_id: string | null
          manager_id: string | null
          metadata: Json
          net_amount: number
          offer_id: string | null
          parent_sale_id: string | null
          payment_method: string | null
          payment_status: string | null
          product_id: string
          recovery_status: string | null
          refunded_at: string | null
          sold_at: string
          status: Database["public"]["Enums"]["aff_sale_status"]
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          approved_at?: string | null
          available_at?: string | null
          campaign?: string | null
          chargeback_at?: string | null
          company_id: string
          coupon_id?: string | null
          created_at?: string
          customer_doc?: string | null
          customer_email?: string | null
          customer_name?: string | null
          external_id?: string | null
          gateway_fee?: number
          gateway_id?: string | null
          gateway_provider?: string | null
          gateway_release_at?: string | null
          gross_amount: number
          id?: string
          installment_interest?: number | null
          interest_paid_by?: string | null
          internal_release_at?: string | null
          kind?: string | null
          link_id?: string | null
          manager_id?: string | null
          metadata?: Json
          net_amount: number
          offer_id?: string | null
          parent_sale_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_id: string
          recovery_status?: string | null
          refunded_at?: string | null
          sold_at?: string
          status?: Database["public"]["Enums"]["aff_sale_status"]
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          approved_at?: string | null
          available_at?: string | null
          campaign?: string | null
          chargeback_at?: string | null
          company_id?: string
          coupon_id?: string | null
          created_at?: string
          customer_doc?: string | null
          customer_email?: string | null
          customer_name?: string | null
          external_id?: string | null
          gateway_fee?: number
          gateway_id?: string | null
          gateway_provider?: string | null
          gateway_release_at?: string | null
          gross_amount?: number
          id?: string
          installment_interest?: number | null
          interest_paid_by?: string | null
          internal_release_at?: string | null
          kind?: string | null
          link_id?: string | null
          manager_id?: string | null
          metadata?: Json
          net_amount?: number
          offer_id?: string | null
          parent_sale_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_id?: string
          recovery_status?: string | null
          refunded_at?: string | null
          sold_at?: string
          status?: Database["public"]["Enums"]["aff_sale_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_sales_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "aff_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aff_sales_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "aff_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_sales_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "aff_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_sales_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "aff_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aff_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "aff_products"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_upsells: {
        Row: {
          affiliate_gets_commission: boolean
          commission_override: number | null
          company_id: string
          coproducer_participates: boolean
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          product_id: string
          trigger: string
          updated_at: string
          upsell_product_id: string | null
        }
        Insert: {
          affiliate_gets_commission?: boolean
          commission_override?: number | null
          company_id: string
          coproducer_participates?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          product_id: string
          trigger?: string
          updated_at?: string
          upsell_product_id?: string | null
        }
        Update: {
          affiliate_gets_commission?: boolean
          commission_override?: number | null
          company_id?: string
          coproducer_participates?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          product_id?: string
          trigger?: string
          updated_at?: string
          upsell_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aff_upsells_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "aff_products"
            referencedColumns: ["id"]
          },
        ]
      }
      aff_wallet_alerts: {
        Row: {
          affiliate_id: string
          amount: number | null
          company_id: string
          created_at: string
          id: string
          is_read: boolean
          kind: string
          message: string | null
          read_at: string | null
          related_customer_id: string | null
          related_sale_id: string | null
          severity: string
          title: string
        }
        Insert: {
          affiliate_id: string
          amount?: number | null
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind: string
          message?: string | null
          read_at?: string | null
          related_customer_id?: string | null
          related_sale_id?: string | null
          severity?: string
          title: string
        }
        Update: {
          affiliate_id?: string
          amount?: number | null
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          message?: string | null
          read_at?: string | null
          related_customer_id?: string | null
          related_sale_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "aff_wallet_alerts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "aff_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_appointments: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          ends_at: string
          id: string
          lead_id: string | null
          notes: string | null
          price: number
          professional_id: string
          service_id: string
          starts_at: string
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          ends_at: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          price?: number
          professional_id: string
          service_id: string
          starts_at: string
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          ends_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          price?: number
          professional_id?: string
          service_id?: string
          starts_at?: string
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          company_id: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          company_id: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          company_id?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      agenda_blocks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          professional_id: string | null
          reason: string | null
          starts_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          starts_at: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          starts_at?: string
        }
        Relationships: []
      }
      agenda_locations: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          created_at: string
          geo_lat: number | null
          geo_lng: number | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          state: string | null
          timezone: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          state?: string | null
          timezone?: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          state?: string | null
          timezone?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      agenda_no_show_events: {
        Row: {
          appointment_id: string | null
          charged_amount: number
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          kind: string
          oncall_shift_id: string | null
          policy_applied: Json
          professional_id: string | null
          reason: string | null
        }
        Insert: {
          appointment_id?: string | null
          charged_amount?: number
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          kind: string
          oncall_shift_id?: string | null
          policy_applied?: Json
          professional_id?: string | null
          reason?: string | null
        }
        Update: {
          appointment_id?: string | null
          charged_amount?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          kind?: string
          oncall_shift_id?: string | null
          policy_applied?: Json
          professional_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_no_show_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "agenda_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_no_show_events_oncall_shift_id_fkey"
            columns: ["oncall_shift_id"]
            isOneToOne: false
            referencedRelation: "agenda_oncall_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_no_show_events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "agenda_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_oncall_shifts: {
        Row: {
          assigned_professional_id: string | null
          company_id: string
          created_at: string
          ends_at: string
          flat_rate: number | null
          hourly_rate: number | null
          id: string
          location_id: string | null
          metadata: Json
          notes: string | null
          room_id: string | null
          service_id: string | null
          specialty: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_professional_id?: string | null
          company_id: string
          created_at?: string
          ends_at: string
          flat_rate?: number | null
          hourly_rate?: number | null
          id?: string
          location_id?: string | null
          metadata?: Json
          notes?: string | null
          room_id?: string | null
          service_id?: string | null
          specialty?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_professional_id?: string | null
          company_id?: string
          created_at?: string
          ends_at?: string
          flat_rate?: number | null
          hourly_rate?: number | null
          id?: string
          location_id?: string | null
          metadata?: Json
          notes?: string | null
          room_id?: string | null
          service_id?: string | null
          specialty?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_oncall_shifts_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "agenda_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_oncall_shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "agenda_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_oncall_shifts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "agenda_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_open_slots: {
        Row: {
          appointment_id: string | null
          claimed_at: string | null
          claimed_by_professional_id: string | null
          claimed_ip: string | null
          claimed_user_agent: string | null
          company_id: string
          created_at: string
          created_by: string | null
          current_wave: number
          distribution: Json
          ends_at: string
          expires_at: string | null
          id: string
          location_id: string | null
          metadata: Json
          oncall_shift_id: string | null
          origin: string
          payout_amount: number | null
          room_id: string | null
          service_id: string | null
          specialty: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          claimed_at?: string | null
          claimed_by_professional_id?: string | null
          claimed_ip?: string | null
          claimed_user_agent?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          current_wave?: number
          distribution?: Json
          ends_at: string
          expires_at?: string | null
          id?: string
          location_id?: string | null
          metadata?: Json
          oncall_shift_id?: string | null
          origin: string
          payout_amount?: number | null
          room_id?: string | null
          service_id?: string | null
          specialty?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          claimed_at?: string | null
          claimed_by_professional_id?: string | null
          claimed_ip?: string | null
          claimed_user_agent?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_wave?: number
          distribution?: Json
          ends_at?: string
          expires_at?: string | null
          id?: string
          location_id?: string | null
          metadata?: Json
          oncall_shift_id?: string | null
          origin?: string
          payout_amount?: number | null
          room_id?: string | null
          service_id?: string | null
          specialty?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_open_slots_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "agenda_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_open_slots_claimed_by_professional_id_fkey"
            columns: ["claimed_by_professional_id"]
            isOneToOne: false
            referencedRelation: "agenda_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_open_slots_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "agenda_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_open_slots_oncall_shift_id_fkey"
            columns: ["oncall_shift_id"]
            isOneToOne: false
            referencedRelation: "agenda_oncall_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_open_slots_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "agenda_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_penalties: {
        Row: {
          amount: number | null
          company_id: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          kind: string
          metadata: Json
          reason: string | null
          starts_at: string
          subject_id: string
          subject_type: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          kind: string
          metadata?: Json
          reason?: string | null
          starts_at?: string
          subject_id: string
          subject_type: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          metadata?: Json
          reason?: string | null
          starts_at?: string
          subject_id?: string
          subject_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      agenda_professional_availability: {
        Row: {
          accepts_emergency: boolean
          accepts_home: boolean
          accepts_in_person: boolean
          accepts_oncall: boolean
          accepts_substitution: boolean
          accepts_telehealth: boolean
          accepts_walkin: boolean
          company_id: string
          created_at: string
          id: string
          max_response_minutes: number
          metadata: Json
          min_notice_minutes: number
          professional_id: string
          served_regions: string[]
          travel_radius_km: number | null
          updated_at: string
        }
        Insert: {
          accepts_emergency?: boolean
          accepts_home?: boolean
          accepts_in_person?: boolean
          accepts_oncall?: boolean
          accepts_substitution?: boolean
          accepts_telehealth?: boolean
          accepts_walkin?: boolean
          company_id: string
          created_at?: string
          id?: string
          max_response_minutes?: number
          metadata?: Json
          min_notice_minutes?: number
          professional_id: string
          served_regions?: string[]
          travel_radius_km?: number | null
          updated_at?: string
        }
        Update: {
          accepts_emergency?: boolean
          accepts_home?: boolean
          accepts_in_person?: boolean
          accepts_oncall?: boolean
          accepts_substitution?: boolean
          accepts_telehealth?: boolean
          accepts_walkin?: boolean
          company_id?: string
          created_at?: string
          id?: string
          max_response_minutes?: number
          metadata?: Json
          min_notice_minutes?: number
          professional_id?: string
          served_regions?: string[]
          travel_radius_km?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "agenda_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_professional_eligibility: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          location_id: string | null
          no_show_rate: number
          performance_score: number
          priority: number
          professional_id: string
          service_id: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          no_show_rate?: number
          performance_score?: number
          priority?: number
          professional_id: string
          service_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          no_show_rate?: number
          performance_score?: number
          priority?: number
          professional_id?: string
          service_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_professional_eligibility_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "agenda_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_professional_eligibility_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "agenda_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_professional_services: {
        Row: {
          company_id: string
          created_at: string
          id: string
          professional_id: string
          service_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          professional_id: string
          service_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          professional_id?: string
          service_id?: string
        }
        Relationships: []
      }
      agenda_professional_terms: {
        Row: {
          accepted_at: string
          company_id: string
          created_at: string
          id: string
          ip: string | null
          professional_id: string
          terms_version: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          company_id: string
          created_at?: string
          id?: string
          ip?: string | null
          professional_id: string
          terms_version: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          company_id?: string
          created_at?: string
          id?: string
          ip?: string | null
          professional_id?: string
          terms_version?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_professional_terms_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "agenda_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_professionals: {
        Row: {
          bio: string | null
          color: string
          commission_pct: number
          company_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          unit_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          color?: string
          commission_pct?: number
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          color?: string
          commission_pct?: number
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agenda_rooms: {
        Row: {
          capacity: number
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          location_id: string | null
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          location_id?: string | null
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          location_id?: string | null
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_rooms_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "agenda_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_rules: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          rule: Json
          scope_plan: string | null
          scope_service_id: string | null
          scope_specialty: string | null
          updated_at: string
          version: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          rule?: Json
          scope_plan?: string | null
          scope_service_id?: string | null
          scope_specialty?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          rule?: Json
          scope_plan?: string | null
          scope_service_id?: string | null
          scope_specialty?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      agenda_schedules: {
        Row: {
          company_id: string
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          professional_id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          company_id: string
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          professional_id: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          company_id?: string
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          professional_id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      agenda_services: {
        Row: {
          color: string
          company_id: string
          created_at: string
          description: string | null
          duration_min: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      agenda_settings: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      agenda_shifts: {
        Row: {
          company_id: string
          created_at: string
          ends_time: string
          id: string
          is_active: boolean
          name: string
          starts_time: string
          updated_at: string
          weekdays: number[]
        }
        Insert: {
          company_id: string
          created_at?: string
          ends_time: string
          id?: string
          is_active?: boolean
          name: string
          starts_time: string
          updated_at?: string
          weekdays?: number[]
        }
        Update: {
          company_id?: string
          created_at?: string
          ends_time?: string
          id?: string
          is_active?: boolean
          name?: string
          starts_time?: string
          updated_at?: string
          weekdays?: number[]
        }
        Relationships: []
      }
      agenda_slot_offers: {
        Row: {
          channel: string[]
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json
          open_slot_id: string
          professional_id: string
          responded_at: string | null
          seen_at: string | null
          sent_at: string
          status: string
          updated_at: string
          wave: number
        }
        Insert: {
          channel?: string[]
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          open_slot_id: string
          professional_id: string
          responded_at?: string | null
          seen_at?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
          wave?: number
        }
        Update: {
          channel?: string[]
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          open_slot_id?: string
          professional_id?: string
          responded_at?: string | null
          seen_at?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
          wave?: number
        }
        Relationships: [
          {
            foreignKeyName: "agenda_slot_offers_open_slot_id_fkey"
            columns: ["open_slot_id"]
            isOneToOne: false
            referencedRelation: "agenda_open_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_slot_offers_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "agenda_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_waitlist: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          position: number
          preferred_date: string | null
          professional_id: string | null
          service_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          position?: number
          preferred_date?: string | null
          professional_id?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          position?: number
          preferred_date?: string | null
          professional_id?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_demands: {
        Row: {
          agentes_selecionados: string[] | null
          cliente: string | null
          contexto: string | null
          created_at: string
          created_by: string | null
          id: string
          objetivo: string | null
          projeto: string | null
          status: string
          tipo_entrega: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agentes_selecionados?: string[] | null
          cliente?: string | null
          contexto?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          objetivo?: string | null
          projeto?: string | null
          status?: string
          tipo_entrega?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agentes_selecionados?: string[] | null
          cliente?: string | null
          contexto?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          objetivo?: string | null
          projeto?: string | null
          status?: string
          tipo_entrega?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          created_at: string
          demand_id: string | null
          details: Json | null
          event: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          demand_id?: string | null
          details?: Json | null
          event: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          demand_id?: string | null
          details?: Json | null
          event?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "agent_demands"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_outputs: {
        Row: {
          agent_id: string | null
          content: Json | null
          created_at: string
          demand_id: string
          id: string
          is_final: boolean
          output_type: string | null
        }
        Insert: {
          agent_id?: string | null
          content?: Json | null
          created_at?: string
          demand_id: string
          id?: string
          is_final?: boolean
          output_type?: string | null
        }
        Update: {
          agent_id?: string | null
          content?: Json | null
          created_at?: string
          demand_id?: string
          id?: string
          is_final?: boolean
          output_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_outputs_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "agent_demands"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_project_files: {
        Row: {
          bucket_path: string
          created_at: string
          generation_id: string
          id: string
          kind: string
          mime_type: string | null
          original_name: string | null
          size_bytes: number | null
        }
        Insert: {
          bucket_path: string
          created_at?: string
          generation_id: string
          id?: string
          kind: string
          mime_type?: string | null
          original_name?: string | null
          size_bytes?: number | null
        }
        Update: {
          bucket_path?: string
          created_at?: string
          generation_id?: string
          id?: string
          kind?: string
          mime_type?: string | null
          original_name?: string | null
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_project_files_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_project_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_project_generations: {
        Row: {
          ai_analysis: Json | null
          ai_model: string | null
          approved_at: string | null
          approved_by: string | null
          client_data: Json
          company_id: string | null
          created_at: string
          created_by: string
          error_message: string | null
          id: string
          project_data: Json
          prompt: string
          provisioned_at: string | null
          provisioning_started_at: string | null
          provisioning_steps: Json
          status: string
          updated_at: string
          uploaded_files: Json
        }
        Insert: {
          ai_analysis?: Json | null
          ai_model?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_data?: Json
          company_id?: string | null
          created_at?: string
          created_by: string
          error_message?: string | null
          id?: string
          project_data?: Json
          prompt: string
          provisioned_at?: string | null
          provisioning_started_at?: string | null
          provisioning_steps?: Json
          status?: string
          updated_at?: string
          uploaded_files?: Json
        }
        Update: {
          ai_analysis?: Json | null
          ai_model?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_data?: Json
          company_id?: string | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          id?: string
          project_data?: Json
          prompt?: string
          provisioned_at?: string | null
          provisioning_started_at?: string | null
          provisioning_steps?: Json
          status?: string
          updated_at?: string
          uploaded_files?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_project_generations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_project_generations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ai_project_generations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ai_project_generations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_prompt_library: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          niche: string | null
          prompt: string
          purpose: string | null
          status: string
          updated_at: string
          usage_count: number
          variables: Json
          version: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          niche?: string | null
          prompt: string
          purpose?: string | null
          status?: string
          updated_at?: string
          usage_count?: number
          variables?: Json
          version?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          niche?: string | null
          prompt?: string
          purpose?: string | null
          status?: string
          updated_at?: string
          usage_count?: number
          variables?: Json
          version?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          after: Json | null
          before: Json | null
          company_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after?: Json | null
          before?: Json | null
          company_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after?: Json | null
          before?: Json | null
          company_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      billing_contracts: {
        Row: {
          company_id: string
          created_at: string
          due_day: number
          id: string
          last_paid_at: string | null
          next_due_date: string
          nfe_issued_at: string | null
          notes: string | null
          pix_copy_paste: string | null
          pix_key: string | null
          plan_id: string
          policy_id: string | null
          recurring_amount: number
          setup_amount: number
          setup_paid_at: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_day?: number
          id?: string
          last_paid_at?: string | null
          next_due_date: string
          nfe_issued_at?: string | null
          notes?: string | null
          pix_copy_paste?: string | null
          pix_key?: string | null
          plan_id: string
          policy_id?: string | null
          recurring_amount: number
          setup_amount?: number
          setup_paid_at?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_day?: number
          id?: string
          last_paid_at?: string | null
          next_due_date?: string
          nfe_issued_at?: string | null
          notes?: string | null
          pix_copy_paste?: string | null
          pix_key?: string | null
          plan_id?: string
          policy_id?: string | null
          recurring_amount?: number
          setup_amount?: number
          setup_paid_at?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_contracts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_contracts_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "billing_dunning_policy"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_dunning_policy: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          steps: Json
          suspend_offset_days: number
          suspend_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          steps?: Json
          suspend_offset_days?: number
          suspend_time?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          steps?: Json
          suspend_offset_days?: number
          suspend_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_dunning_runs: {
        Row: {
          channel: string
          detail: string | null
          id: string
          invoice_id: string
          sent_at: string
          status: string
          step: string
        }
        Insert: {
          channel: string
          detail?: string | null
          id?: string
          invoice_id: string
          sent_at?: string
          status?: string
          step: string
        }
        Update: {
          channel?: string
          detail?: string | null
          id?: string
          invoice_id?: string
          sent_at?: string
          status?: string
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_dunning_runs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount: number
          company_id: string
          contract_id: string
          created_at: string
          due_date: string
          fin_transaction_id: string | null
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          pix_copy_paste: string | null
          pix_key: string | null
          pix_qr_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          contract_id: string
          created_at?: string
          due_date: string
          fin_transaction_id?: string | null
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          pix_copy_paste?: string | null
          pix_key?: string | null
          pix_qr_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          contract_id?: string
          created_at?: string
          due_date?: string
          fin_transaction_id?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          pix_copy_paste?: string | null
          pix_key?: string | null
          pix_qr_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "billing_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_fin_transaction_id_fkey"
            columns: ["fin_transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_pix_charges: {
        Row: {
          base_amount_cents: number
          company_id: string | null
          confirmed_by: string | null
          contract_id: string | null
          created_at: string
          expires_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payer_doc: string | null
          payer_email: string | null
          payer_name: string | null
          payer_whatsapp: string | null
          pix_key: string
          pix_payload: string
          plan_code: string | null
          receipt_url: string | null
          status: string
          txid: string
          unique_amount_cents: number
          updated_at: string
        }
        Insert: {
          base_amount_cents: number
          company_id?: string | null
          confirmed_by?: string | null
          contract_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payer_doc?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_whatsapp?: string | null
          pix_key: string
          pix_payload: string
          plan_code?: string | null
          receipt_url?: string | null
          status?: string
          txid: string
          unique_amount_cents: number
          updated_at?: string
        }
        Update: {
          base_amount_cents?: number
          company_id?: string | null
          confirmed_by?: string | null
          contract_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payer_doc?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_whatsapp?: string | null
          pix_key?: string
          pix_payload?: string
          plan_code?: string | null
          receipt_url?: string | null
          status?: string
          txid?: string
          unique_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_pix_charges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_pix_charges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_pix_charges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_pix_charges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_pix_charges_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "billing_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          allow_direct_checkout: boolean
          code: string
          created_at: string
          cta: string | null
          cycle: string
          description: string | null
          discount_percent: number
          due_day: number
          extra_module_price: number
          id: string
          included_module_count: number
          included_modules: string[]
          internal_notes: string | null
          is_active: boolean
          is_default: boolean
          legal_text: string | null
          min_contract_days: number
          min_installments: number
          name: string
          recurring_amount: number
          route_to_quote: boolean
          route_to_whatsapp: boolean
          setup_fee: number
          show_in_checkout: boolean
          show_on_site: boolean
          sort_order: number
          status_comercial: string
          updated_at: string
        }
        Insert: {
          allow_direct_checkout?: boolean
          code: string
          created_at?: string
          cta?: string | null
          cycle?: string
          description?: string | null
          discount_percent?: number
          due_day?: number
          extra_module_price?: number
          id?: string
          included_module_count?: number
          included_modules?: string[]
          internal_notes?: string | null
          is_active?: boolean
          is_default?: boolean
          legal_text?: string | null
          min_contract_days?: number
          min_installments?: number
          name: string
          recurring_amount: number
          route_to_quote?: boolean
          route_to_whatsapp?: boolean
          setup_fee?: number
          show_in_checkout?: boolean
          show_on_site?: boolean
          sort_order?: number
          status_comercial?: string
          updated_at?: string
        }
        Update: {
          allow_direct_checkout?: boolean
          code?: string
          created_at?: string
          cta?: string | null
          cycle?: string
          description?: string | null
          discount_percent?: number
          due_day?: number
          extra_module_price?: number
          id?: string
          included_module_count?: number
          included_modules?: string[]
          internal_notes?: string | null
          is_active?: boolean
          is_default?: boolean
          legal_text?: string | null
          min_contract_days?: number
          min_installments?: number
          name?: string
          recurring_amount?: number
          route_to_quote?: boolean
          route_to_whatsapp?: boolean
          setup_fee?: number
          show_in_checkout?: boolean
          show_on_site?: boolean
          sort_order?: number
          status_comercial?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_suspensions: {
        Row: {
          company_id: string
          contract_id: string
          id: string
          invoice_id: string | null
          reactivated_at: string | null
          reactivated_reason: string | null
          reason: string | null
          suspended_at: string
        }
        Insert: {
          company_id: string
          contract_id: string
          id?: string
          invoice_id?: string | null
          reactivated_at?: string | null
          reactivated_reason?: string | null
          reason?: string | null
          suspended_at?: string
        }
        Update: {
          company_id?: string
          contract_id?: string
          id?: string
          invoice_id?: string | null
          reactivated_at?: string | null
          reactivated_reason?: string | null
          reason?: string | null
          suspended_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_suspensions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_suspensions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_suspensions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_suspensions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_suspensions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "billing_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_suspensions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      brewery_blasts: {
        Row: {
          audience_count: number
          audience_filter: Json
          body: string
          brand_id: string
          campaign_id: string | null
          channel: string
          created_at: string
          created_by: string | null
          enqueued_count: number
          id: string
          last_error: string | null
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string
          voucher_code: string | null
        }
        Insert: {
          audience_count?: number
          audience_filter?: Json
          body: string
          brand_id: string
          campaign_id?: string | null
          channel: string
          created_at?: string
          created_by?: string | null
          enqueued_count?: number
          id?: string
          last_error?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          voucher_code?: string | null
        }
        Update: {
          audience_count?: number
          audience_filter?: Json
          body?: string
          brand_id?: string
          campaign_id?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          enqueued_count?: number
          id?: string
          last_error?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          voucher_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brewery_blasts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brewery_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brewery_blasts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "brewery_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      brewery_brands: {
        Row: {
          bio: string | null
          brewer_name: string | null
          city: string | null
          cnpj: string | null
          company_id: string | null
          cover_url: string | null
          created_at: string
          founded_year: number | null
          id: string
          instagram: string | null
          is_active: boolean
          is_demo: boolean
          logo_url: string | null
          name: string
          owner_user_id: string | null
          slug: string
          state: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          brewer_name?: string | null
          city?: string | null
          cnpj?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          founded_year?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_demo?: boolean
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          slug: string
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          brewer_name?: string | null
          city?: string | null
          cnpj?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          founded_year?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_demo?: boolean
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          slug?: string
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brewery_brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brewery_brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "brewery_brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "brewery_brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      brewery_campaigns: {
        Row: {
          brand_id: string
          created_at: string
          ends_at: string
          goal: string | null
          id: string
          kpi_target_leads: number | null
          kpi_target_units: number | null
          name: string
          starts_at: string
          status: string
          target_pdv_ids: string[]
          updated_at: string
          voucher_code: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          ends_at: string
          goal?: string | null
          id?: string
          kpi_target_leads?: number | null
          kpi_target_units?: number | null
          name: string
          starts_at: string
          status?: string
          target_pdv_ids?: string[]
          updated_at?: string
          voucher_code?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          ends_at?: string
          goal?: string | null
          id?: string
          kpi_target_leads?: number | null
          kpi_target_units?: number | null
          name?: string
          starts_at?: string
          status?: string
          target_pdv_ids?: string[]
          updated_at?: string
          voucher_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brewery_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brewery_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brewery_lead_preferences: {
        Row: {
          brand_id: string | null
          consent_at: string | null
          consent_marketing: boolean
          consumer_user_id: string | null
          created_at: string
          favorite_brand_ids: string[]
          favorite_styles: string[]
          frequency: string | null
          id: string
          interests: string[]
          masked_name: string | null
          masked_whatsapp: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          consent_at?: string | null
          consent_marketing?: boolean
          consumer_user_id?: string | null
          created_at?: string
          favorite_brand_ids?: string[]
          favorite_styles?: string[]
          frequency?: string | null
          id?: string
          interests?: string[]
          masked_name?: string | null
          masked_whatsapp?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          consent_at?: string | null
          consent_marketing?: boolean
          consumer_user_id?: string | null
          created_at?: string
          favorite_brand_ids?: string[]
          favorite_styles?: string[]
          frequency?: string | null
          id?: string
          interests?: string[]
          masked_name?: string | null
          masked_whatsapp?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brewery_lead_preferences_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brewery_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brewery_pdv_links: {
        Row: {
          brand_id: string
          contact_name: string | null
          contact_phone: string | null
          contract_ended_at: string | null
          contract_started_at: string | null
          contract_status: string
          created_at: string
          id: string
          notes: string | null
          pdv_city: string | null
          pdv_company_id: string | null
          pdv_name: string
          pdv_state: string | null
          portal_token: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          contact_name?: string | null
          contact_phone?: string | null
          contract_ended_at?: string | null
          contract_started_at?: string | null
          contract_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          pdv_city?: string | null
          pdv_company_id?: string | null
          pdv_name: string
          pdv_state?: string | null
          portal_token?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          contact_name?: string | null
          contact_phone?: string | null
          contract_ended_at?: string | null
          contract_started_at?: string | null
          contract_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          pdv_city?: string | null
          pdv_company_id?: string | null
          pdv_name?: string
          pdv_state?: string | null
          portal_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brewery_pdv_links_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brewery_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brewery_pdv_links_pdv_company_id_fkey"
            columns: ["pdv_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brewery_pdv_links_pdv_company_id_fkey"
            columns: ["pdv_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "brewery_pdv_links_pdv_company_id_fkey"
            columns: ["pdv_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "brewery_pdv_links_pdv_company_id_fkey"
            columns: ["pdv_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      brewery_products: {
        Row: {
          abv: number | null
          brand_id: string
          created_at: string
          description: string | null
          ibu: number | null
          id: string
          is_active: boolean
          is_seasonal: boolean
          name: string
          package_type: string | null
          photo_url: string | null
          sku: string | null
          style: string
          updated_at: string
          volume_ml: number | null
        }
        Insert: {
          abv?: number | null
          brand_id: string
          created_at?: string
          description?: string | null
          ibu?: number | null
          id?: string
          is_active?: boolean
          is_seasonal?: boolean
          name: string
          package_type?: string | null
          photo_url?: string | null
          sku?: string | null
          style: string
          updated_at?: string
          volume_ml?: number | null
        }
        Update: {
          abv?: number | null
          brand_id?: string
          created_at?: string
          description?: string | null
          ibu?: number | null
          id?: string
          is_active?: boolean
          is_seasonal?: boolean
          name?: string
          package_type?: string | null
          photo_url?: string | null
          sku?: string | null
          style?: string
          updated_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brewery_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brewery_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brewery_sellouts: {
        Row: {
          avg_ticket_cents: number | null
          brand_id: string
          campaign_id: string | null
          coupon_redemptions: number
          created_at: string
          gross_revenue_cents: number
          id: string
          notes: string | null
          pdv_link_id: string | null
          period_end: string
          period_start: string
          product_id: string
          source: string
          units: number
          updated_at: string
          voucher_code: string | null
        }
        Insert: {
          avg_ticket_cents?: number | null
          brand_id: string
          campaign_id?: string | null
          coupon_redemptions?: number
          created_at?: string
          gross_revenue_cents?: number
          id?: string
          notes?: string | null
          pdv_link_id?: string | null
          period_end: string
          period_start: string
          product_id: string
          source?: string
          units?: number
          updated_at?: string
          voucher_code?: string | null
        }
        Update: {
          avg_ticket_cents?: number | null
          brand_id?: string
          campaign_id?: string | null
          coupon_redemptions?: number
          created_at?: string
          gross_revenue_cents?: number
          id?: string
          notes?: string | null
          pdv_link_id?: string | null
          period_end?: string
          period_start?: string
          product_id?: string
          source?: string
          units?: number
          updated_at?: string
          voucher_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brewery_sellouts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brewery_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brewery_sellouts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "brewery_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brewery_sellouts_pdv_link_id_fkey"
            columns: ["pdv_link_id"]
            isOneToOne: false
            referencedRelation: "brewery_pdv_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brewery_sellouts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "brewery_products"
            referencedColumns: ["id"]
          },
        ]
      }
      brewery_tastings: {
        Row: {
          brand_id: string
          created_at: string
          duration_minutes: number | null
          event_at: string
          id: string
          leads_captured: number
          notes: string | null
          participants: number
          pdv_link_id: string | null
          products_showcased: string[]
          units_sold: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          duration_minutes?: number | null
          event_at: string
          id?: string
          leads_captured?: number
          notes?: string | null
          participants?: number
          pdv_link_id?: string | null
          products_showcased?: string[]
          units_sold?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          duration_minutes?: number | null
          event_at?: string
          id?: string
          leads_captured?: number
          notes?: string | null
          participants?: number
          pdv_link_id?: string | null
          products_showcased?: string[]
          units_sold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brewery_tastings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brewery_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brewery_tastings_pdv_link_id_fkey"
            columns: ["pdv_link_id"]
            isOneToOne: false
            referencedRelation: "brewery_pdv_links"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          intent_id: string | null
          macro_slug: string | null
          metadata: Json | null
          plan_tier: string | null
          selected_modules: string[] | null
          session_token: string | null
          subnicho_slug: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          intent_id?: string | null
          macro_slug?: string | null
          metadata?: Json | null
          plan_tier?: string | null
          selected_modules?: string[] | null
          session_token?: string | null
          subnicho_slug?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          intent_id?: string | null
          macro_slug?: string | null
          metadata?: Json | null
          plan_tier?: string | null
          selected_modules?: string[] | null
          session_token?: string | null
          subnicho_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_events_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "catalog_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_intents: {
        Row: {
          consumed_at: string | null
          conversion_kind: string | null
          converted_at: string | null
          created_at: string
          expires_at: string
          id: string
          last_reuse_attempt_at: string | null
          macro_slug: string
          plan_tier: string
          reuse_attempts: number
          selected_modules: string[]
          session_token: string | null
          source: string
          subnicho_slug: string
          user_id: string | null
          validated_fields: Json | null
        }
        Insert: {
          consumed_at?: string | null
          conversion_kind?: string | null
          converted_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          last_reuse_attempt_at?: string | null
          macro_slug: string
          plan_tier: string
          reuse_attempts?: number
          selected_modules?: string[]
          session_token?: string | null
          source?: string
          subnicho_slug: string
          user_id?: string | null
          validated_fields?: Json | null
        }
        Update: {
          consumed_at?: string | null
          conversion_kind?: string | null
          converted_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          last_reuse_attempt_at?: string | null
          macro_slug?: string
          plan_tier?: string
          reuse_attempts?: number
          selected_modules?: string[]
          session_token?: string | null
          source?: string
          subnicho_slug?: string
          user_id?: string | null
          validated_fields?: Json | null
        }
        Relationships: []
      }
      chrismed_service_offerings: {
        Row: {
          active: boolean
          cid_categories: string[] | null
          company_id: string
          created_at: string
          description: string | null
          display_order: number
          duration_minutes: number
          id: string
          metadata: Json
          modality: string
          name: string
          price_cents: number
          refund_window_hours: number
          requires_prepayment: boolean
          reschedule_window_hours: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cid_categories?: string[] | null
          company_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          metadata?: Json
          modality: string
          name: string
          price_cents: number
          refund_window_hours?: number
          requires_prepayment?: boolean
          reschedule_window_hours?: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cid_categories?: string[] | null
          company_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          metadata?: Json
          modality?: string
          name?: string
          price_cents?: number
          refund_window_hours?: number
          requires_prepayment?: boolean
          reschedule_window_hours?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chrismed_service_offerings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chrismed_service_offerings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "chrismed_service_offerings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "chrismed_service_offerings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clube_alerts: {
        Row: {
          active: boolean
          channels: string[]
          city: string | null
          created_at: string
          id: string
          kind: string
          radius_km: number
          tag: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          channels?: string[]
          city?: string | null
          created_at?: string
          id?: string
          kind: string
          radius_km?: number
          tag: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          channels?: string[]
          city?: string | null
          created_at?: string
          id?: string
          kind?: string
          radius_km?: number
          tag?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clube_consumption: {
        Row: {
          company_id: string | null
          consumed_at: string
          created_at: string
          id: string
          items: Json
          payment_method: string | null
          receipt_url: string | null
          source: string
          total_cents: number
          user_id: string
          visibility: string
        }
        Insert: {
          company_id?: string | null
          consumed_at?: string
          created_at?: string
          id?: string
          items?: Json
          payment_method?: string | null
          receipt_url?: string | null
          source?: string
          total_cents?: number
          user_id: string
          visibility?: string
        }
        Update: {
          company_id?: string | null
          consumed_at?: string
          created_at?: string
          id?: string
          items?: Json
          payment_method?: string | null
          receipt_url?: string | null
          source?: string
          total_cents?: number
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "clube_consumption_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clube_consumption_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clube_consumption_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clube_consumption_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clube_cron_log: {
        Row: {
          details: Json
          enqueued: number
          error_count: number
          error_message: string | null
          finished_at: string
          id: string
          job: string
          skipped: number
          started_at: string
          status: string
        }
        Insert: {
          details?: Json
          enqueued?: number
          error_count?: number
          error_message?: string | null
          finished_at?: string
          id?: string
          job?: string
          skipped?: number
          started_at?: string
          status: string
        }
        Update: {
          details?: Json
          enqueued?: number
          error_count?: number
          error_message?: string | null
          finished_at?: string
          id?: string
          job?: string
          skipped?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      clube_journey_log: {
        Row: {
          enqueued_at: string
          id: string
          step_id: string
          user_id: string
        }
        Insert: {
          enqueued_at?: string
          id?: string
          step_id: string
          user_id: string
        }
        Update: {
          enqueued_at?: string
          id?: string
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clube_journey_log_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "clube_journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      clube_journey_steps: {
        Row: {
          active: boolean
          audience: string
          body: string
          channel: string
          created_at: string
          day_offset: number
          event_code: string
          id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience?: string
          body: string
          channel?: string
          created_at?: string
          day_offset: number
          event_code: string
          id?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: string
          body?: string
          channel?: string
          created_at?: string
          day_offset?: number
          event_code?: string
          id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clube_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clube_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "clube_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      clube_polls: {
        Row: {
          active: boolean
          audience: string
          city: string | null
          closes_at: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          opens_at: string
          options: Json
          question: string
        }
        Insert: {
          active?: boolean
          audience?: string
          city?: string | null
          closes_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          opens_at?: string
          options: Json
          question: string
        }
        Update: {
          active?: boolean
          audience?: string
          city?: string | null
          closes_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          opens_at?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "clube_polls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clube_polls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clube_polls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clube_polls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clube_receipts: {
        Row: {
          amount_cents: number
          company_id: string | null
          created_at: string
          id: string
          issued_at: string
          kind: string
          meta: Json
          receipt_url: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          company_id?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          kind?: string
          meta?: Json
          receipt_url?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          company_id?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          kind?: string
          meta?: Json
          receipt_url?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      clube_referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_user_id: string
          reward_cents: number
          reward_points: number
          source: string | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id: string
          reward_cents?: number
          reward_points?: number
          source?: string | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_cents?: number
          reward_points?: number
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      clube_rewards_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          kind: string
          metadata: Json
          reason: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          kind: string
          metadata?: Json
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          kind?: string
          metadata?: Json
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clube_visits: {
        Row: {
          company_id: string | null
          created_at: string
          event_id: string | null
          id: string
          notes: string | null
          rating: number | null
          source: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          source?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clube_visits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clube_visits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clube_visits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clube_visits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clube_visits_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "evt_events"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_attendance: {
        Row: {
          community_id: string
          company_id: string
          created_at: string
          created_by: string | null
          event_date: string
          event_name: string
          id: string
          member_id: string
          notes: string | null
          status: string
        }
        Insert: {
          community_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          event_date: string
          event_name: string
          id?: string
          member_id: string
          notes?: string | null
          status?: string
        }
        Update: {
          community_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_name?: string
          id?: string
          member_id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_attendance_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "comm_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "comm_members"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_communities: {
        Row: {
          accepts_donations: boolean
          company_id: string
          created_at: string
          description: string | null
          donation_purpose: string | null
          id: string
          is_active: boolean
          kind: string
          monthly_fee: number
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          accepts_donations?: boolean
          company_id: string
          created_at?: string
          description?: string | null
          donation_purpose?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          monthly_fee?: number
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          accepts_donations?: boolean
          company_id?: string
          created_at?: string
          description?: string | null
          donation_purpose?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          monthly_fee?: number
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_communities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_communities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_communities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_communities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      comm_donations: {
        Row: {
          amount: number
          community_id: string
          company_id: string
          created_at: string
          donor_email: string | null
          donor_name: string
          donor_phone: string | null
          fin_transaction_id: string | null
          id: string
          member_id: string | null
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          purpose: string | null
          received_at: string
        }
        Insert: {
          amount: number
          community_id: string
          company_id: string
          created_at?: string
          donor_email?: string | null
          donor_name: string
          donor_phone?: string | null
          fin_transaction_id?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          purpose?: string | null
          received_at?: string
        }
        Update: {
          amount?: number
          community_id?: string
          company_id?: string
          created_at?: string
          donor_email?: string | null
          donor_name?: string
          donor_phone?: string | null
          fin_transaction_id?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          purpose?: string | null
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_donations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "comm_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_donations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_donations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_donations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_donations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_donations_fin_transaction_id_fkey"
            columns: ["fin_transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_donations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "comm_members"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_members: {
        Row: {
          birthdate: string | null
          community_id: string
          company_id: string
          created_at: string
          customer_id: string | null
          document: string | null
          email: string | null
          id: string
          member_since: string
          member_user_id: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          birthdate?: string | null
          community_id: string
          company_id: string
          created_at?: string
          customer_id?: string | null
          document?: string | null
          email?: string | null
          id?: string
          member_since?: string
          member_user_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          birthdate?: string | null
          community_id?: string
          company_id?: string
          created_at?: string
          customer_id?: string | null
          document?: string | null
          email?: string | null
          id?: string
          member_since?: string
          member_user_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "comm_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_memberships: {
        Row: {
          amount: number
          community_id: string
          company_id: string
          created_at: string
          due_date: string
          fin_transaction_id: string | null
          id: string
          member_id: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          period_month: number
          period_year: number
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          community_id: string
          company_id: string
          created_at?: string
          due_date: string
          fin_transaction_id?: string | null
          id?: string
          member_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_month: number
          period_year: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          community_id?: string
          company_id?: string
          created_at?: string
          due_date?: string
          fin_transaction_id?: string | null
          id?: string
          member_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_month?: number
          period_year?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "comm_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "comm_memberships_fin_transaction_id_fkey"
            columns: ["fin_transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "comm_members"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_abandoned_carts: {
        Row: {
          abandoned_at: string
          cart_value: number
          company_id: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          items: Json
          metadata: Json
          recovered_at: string | null
          recovery_attempts: number
          recovery_order_id: string | null
          recovery_status: string
          updated_at: string
        }
        Insert: {
          abandoned_at?: string
          cart_value?: number
          company_id: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          metadata?: Json
          recovered_at?: string | null
          recovery_attempts?: number
          recovery_order_id?: string | null
          recovery_status?: string
          updated_at?: string
        }
        Update: {
          abandoned_at?: string
          cart_value?: number
          company_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          metadata?: Json
          recovered_at?: string | null
          recovery_attempts?: number
          recovery_order_id?: string | null
          recovery_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_abandoned_carts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_abandoned_carts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "commerce_abandoned_carts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "commerce_abandoned_carts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      companies: {
        Row: {
          address_city: string | null
          address_line: string | null
          address_neighborhood: string | null
          address_state: string | null
          address_zip: string | null
          commercial_email: string | null
          company_kind: string | null
          company_type: string | null
          consolidated_at: string | null
          consolidation_started_at: string | null
          created_at: string
          demo_expires_at: string | null
          demo_niche: string | null
          document: string | null
          domain: string | null
          email: string | null
          environment: Database["public"]["Enums"]["company_environment"]
          external_url: string | null
          facebook: string | null
          financial_email: string | null
          id: string
          instagram: string | null
          is_active: boolean
          is_demo: boolean
          is_master: boolean
          latitude: number | null
          legal_name: string | null
          logo_url: string | null
          longitude: number | null
          migration_source_project_id: string | null
          migration_status: string
          name: string
          niche_id: string | null
          owner_name: string | null
          phone: string | null
          primary_color: string | null
          public_slug: string | null
          rating_avg: number | null
          rating_count: number | null
          release_channel: string
          secondary_color: string | null
          segment: string | null
          service_radius_km: number | null
          status: string
          status_commercial: string | null
          status_financial: string | null
          status_technical: string | null
          subdomain: string | null
          subnicho_slug: string | null
          support_email: string | null
          trade_name: string | null
          updated_at: string
          vitrine_enabled: boolean
          vitrine_show_external: boolean
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_line?: string | null
          address_neighborhood?: string | null
          address_state?: string | null
          address_zip?: string | null
          commercial_email?: string | null
          company_kind?: string | null
          company_type?: string | null
          consolidated_at?: string | null
          consolidation_started_at?: string | null
          created_at?: string
          demo_expires_at?: string | null
          demo_niche?: string | null
          document?: string | null
          domain?: string | null
          email?: string | null
          environment?: Database["public"]["Enums"]["company_environment"]
          external_url?: string | null
          facebook?: string | null
          financial_email?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_demo?: boolean
          is_master?: boolean
          latitude?: number | null
          legal_name?: string | null
          logo_url?: string | null
          longitude?: number | null
          migration_source_project_id?: string | null
          migration_status?: string
          name: string
          niche_id?: string | null
          owner_name?: string | null
          phone?: string | null
          primary_color?: string | null
          public_slug?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          release_channel?: string
          secondary_color?: string | null
          segment?: string | null
          service_radius_km?: number | null
          status?: string
          status_commercial?: string | null
          status_financial?: string | null
          status_technical?: string | null
          subdomain?: string | null
          subnicho_slug?: string | null
          support_email?: string | null
          trade_name?: string | null
          updated_at?: string
          vitrine_enabled?: boolean
          vitrine_show_external?: boolean
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_line?: string | null
          address_neighborhood?: string | null
          address_state?: string | null
          address_zip?: string | null
          commercial_email?: string | null
          company_kind?: string | null
          company_type?: string | null
          consolidated_at?: string | null
          consolidation_started_at?: string | null
          created_at?: string
          demo_expires_at?: string | null
          demo_niche?: string | null
          document?: string | null
          domain?: string | null
          email?: string | null
          environment?: Database["public"]["Enums"]["company_environment"]
          external_url?: string | null
          facebook?: string | null
          financial_email?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_demo?: boolean
          is_master?: boolean
          latitude?: number | null
          legal_name?: string | null
          logo_url?: string | null
          longitude?: number | null
          migration_source_project_id?: string | null
          migration_status?: string
          name?: string
          niche_id?: string | null
          owner_name?: string | null
          phone?: string | null
          primary_color?: string | null
          public_slug?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          release_channel?: string
          secondary_color?: string | null
          segment?: string | null
          service_radius_km?: number | null
          status?: string
          status_commercial?: string | null
          status_financial?: string | null
          status_technical?: string | null
          subdomain?: string | null
          subnicho_slug?: string | null
          support_email?: string | null
          trade_name?: string | null
          updated_at?: string
          vitrine_enabled?: boolean
          vitrine_show_external?: boolean
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      companies_migration_log: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payload: Json | null
          status: string
          step: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payload?: Json | null
          status?: string
          step: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payload?: Json | null
          status?: string
          step?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_migration_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_migration_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "companies_migration_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "companies_migration_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      companies_vitrine_public: {
        Row: {
          address_city: string | null
          address_neighborhood: string | null
          address_state: string | null
          address_zip: string | null
          company_type: string | null
          facebook: string | null
          id: string
          instagram: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          primary_color: string | null
          public_slug: string
          rating_avg: number | null
          rating_count: number | null
          secondary_color: string | null
          segment: string | null
          trade_name: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_state?: string | null
          address_zip?: string | null
          company_type?: string | null
          facebook?: string | null
          id: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          primary_color?: string | null
          public_slug: string
          rating_avg?: number | null
          rating_count?: number | null
          secondary_color?: string | null
          segment?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_state?: string | null
          address_zip?: string | null
          company_type?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          primary_color?: string | null
          public_slug?: string
          rating_avg?: number | null
          rating_count?: number | null
          secondary_color?: string | null
          segment?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_vitrine_public_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_vitrine_public_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "companies_vitrine_public_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "companies_vitrine_public_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_modules: {
        Row: {
          company_id: string
          created_at: string
          enabled_at: string | null
          id: string
          installed_at: string | null
          installed_version: string | null
          is_enabled: boolean
          module_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          enabled_at?: string | null
          id?: string
          installed_at?: string | null
          installed_version?: string | null
          is_enabled?: boolean
          module_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          enabled_at?: string | null
          id?: string
          installed_at?: string | null
          installed_version?: string | null
          is_enabled?: boolean
          module_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          category: string
          company_id: string
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json | null
          value_type: string
        }
        Insert: {
          category?: string
          company_id: string
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
          value_type?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_units: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      consumer_favorites: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_favorites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_favorites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "consumer_favorites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "consumer_favorites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      consumer_membership_invoices: {
        Row: {
          amount_cents: number
          created_at: string
          due_date: string
          id: string
          membership_id: string
          paid_at: string | null
          period_end: string
          period_start: string
          pix_copy_paste: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          due_date: string
          id?: string
          membership_id: string
          paid_at?: string | null
          period_end: string
          period_start: string
          pix_copy_paste?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          due_date?: string
          id?: string
          membership_id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          pix_copy_paste?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_membership_invoices_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "consumer_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_memberships: {
        Row: {
          amount_cents: number
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          cycle: string
          id: string
          plan: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          cycle?: string
          id?: string
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          cycle?: string
          id?: string
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consumer_profiles: {
        Row: {
          birthdate: string | null
          cep: string | null
          city: string | null
          created_at: string
          current_level: string
          default_radius_km: number
          full_name: string | null
          id: string
          interests_tags: string[]
          lat: number | null
          lng: number | null
          marketing_optin: boolean
          neighborhood: string | null
          phone: string | null
          points_balance: number
          referral_code: string | null
          state: string | null
          total_savings_cents: number
          total_visits: number
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          birthdate?: string | null
          cep?: string | null
          city?: string | null
          created_at?: string
          current_level?: string
          default_radius_km?: number
          full_name?: string | null
          id?: string
          interests_tags?: string[]
          lat?: number | null
          lng?: number | null
          marketing_optin?: boolean
          neighborhood?: string | null
          phone?: string | null
          points_balance?: number
          referral_code?: string | null
          state?: string | null
          total_savings_cents?: number
          total_visits?: number
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          birthdate?: string | null
          cep?: string | null
          city?: string | null
          created_at?: string
          current_level?: string
          default_radius_km?: number
          full_name?: string | null
          id?: string
          interests_tags?: string[]
          lat?: number | null
          lng?: number | null
          marketing_optin?: boolean
          neighborhood?: string | null
          phone?: string | null
          points_balance?: number
          referral_code?: string | null
          state?: string | null
          total_savings_cents?: number
          total_visits?: number
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      contab_clients: {
        Row: {
          cnae: string | null
          company_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          document: string
          document_type: string
          id: string
          legal_name: string
          metadata: Json
          monthly_fee: number | null
          municipal_registration: string | null
          notes: string | null
          onboarding_step: number | null
          portal_token: string | null
          responsible_user_id: string | null
          state_registration: string | null
          status: string
          tax_regime: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          cnae?: string | null
          company_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          document: string
          document_type?: string
          id?: string
          legal_name: string
          metadata?: Json
          monthly_fee?: number | null
          municipal_registration?: string | null
          notes?: string | null
          onboarding_step?: number | null
          portal_token?: string | null
          responsible_user_id?: string | null
          state_registration?: string | null
          status?: string
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          cnae?: string | null
          company_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          document?: string
          document_type?: string
          id?: string
          legal_name?: string
          metadata?: Json
          monthly_fee?: number | null
          municipal_registration?: string | null
          notes?: string | null
          onboarding_step?: number | null
          portal_token?: string | null
          responsible_user_id?: string | null
          state_registration?: string | null
          status?: string
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contab_contracts: {
        Row: {
          client_id: string | null
          company_id: string
          content: string | null
          created_at: string
          end_date: string | null
          id: string
          monthly_fee: number | null
          notes: string | null
          signature_url: string | null
          signed_at: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          company_id: string
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          signature_url?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          company_id?: string
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          signature_url?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contab_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contab_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contab_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contab_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      contab_departments: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          lead_user_id: string | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
          whatsapp_keywords: string[] | null
          whatsapp_phone: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lead_user_id?: string | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
          whatsapp_keywords?: string[] | null
          whatsapp_phone?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lead_user_id?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
          whatsapp_keywords?: string[] | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      contab_documents: {
        Row: {
          client_id: string
          company_id: string
          competence: string | null
          created_at: string
          doc_type: string
          file_path: string | null
          file_size: number | null
          id: string
          metadata: Json
          mime_type: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          company_id: string
          competence?: string | null
          created_at?: string
          doc_type: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          company_id?: string
          competence?: string | null
          created_at?: string
          doc_type?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contab_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contab_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      contab_fiscal_calendar: {
        Row: {
          applies_to_regime: string[] | null
          city_code: string | null
          company_id: string
          created_at: string
          day_of_month: number | null
          description: string | null
          id: string
          is_active: boolean
          metadata: Json
          obligation_type: string
          recurrence: string
          scope: string
          state_code: string | null
          title: string
          updated_at: string
        }
        Insert: {
          applies_to_regime?: string[] | null
          city_code?: string | null
          company_id: string
          created_at?: string
          day_of_month?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          obligation_type: string
          recurrence?: string
          scope?: string
          state_code?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          applies_to_regime?: string[] | null
          city_code?: string | null
          company_id?: string
          created_at?: string
          day_of_month?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          obligation_type?: string
          recurrence?: string
          scope?: string
          state_code?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contab_irpf_journeys: {
        Row: {
          base_year: number
          client_id: string | null
          company_id: string
          created_at: string
          current_step: number
          fee_amount: number | null
          fee_paid: boolean | null
          id: string
          notes: string | null
          responsible_id: string | null
          result_amount: number | null
          result_type: string | null
          status: string
          taxpayer_cpf: string | null
          taxpayer_name: string
          updated_at: string
        }
        Insert: {
          base_year: number
          client_id?: string | null
          company_id: string
          created_at?: string
          current_step?: number
          fee_amount?: number | null
          fee_paid?: boolean | null
          id?: string
          notes?: string | null
          responsible_id?: string | null
          result_amount?: number | null
          result_type?: string | null
          status?: string
          taxpayer_cpf?: string | null
          taxpayer_name: string
          updated_at?: string
        }
        Update: {
          base_year?: number
          client_id?: string | null
          company_id?: string
          created_at?: string
          current_step?: number
          fee_amount?: number | null
          fee_paid?: boolean | null
          id?: string
          notes?: string | null
          responsible_id?: string | null
          result_amount?: number | null
          result_type?: string | null
          status?: string
          taxpayer_cpf?: string | null
          taxpayer_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contab_irpf_journeys_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contab_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_irpf_journeys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_irpf_journeys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contab_irpf_journeys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contab_irpf_journeys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      contab_irpf_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          journey_id: string
          notes: string | null
          status: string
          step_name: string
          step_number: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          journey_id: string
          notes?: string | null
          status?: string
          step_name: string
          step_number: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          journey_id?: string
          notes?: string | null
          status?: string
          step_name?: string
          step_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contab_irpf_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "contab_irpf_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      contab_obligations: {
        Row: {
          amount: number | null
          client_id: string
          company_id: string
          competence: string
          created_at: string
          due_date: string
          generated_at: string | null
          id: string
          metadata: Json
          notes: string | null
          obligation_type: string
          paid_at: string | null
          receipt_path: string | null
          responsible_user_id: string | null
          scope: string
          sent_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          client_id: string
          company_id: string
          competence: string
          created_at?: string
          due_date: string
          generated_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          obligation_type: string
          paid_at?: string | null
          receipt_path?: string | null
          responsible_user_id?: string | null
          scope?: string
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          client_id?: string
          company_id?: string
          competence?: string
          created_at?: string
          due_date?: string
          generated_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          obligation_type?: string
          paid_at?: string | null
          receipt_path?: string | null
          responsible_user_id?: string | null
          scope?: string
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contab_obligations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contab_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      contab_office_finance: {
        Row: {
          amount: number
          category: string | null
          client_id: string | null
          company_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          kind: string
          notes: string | null
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          kind: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          kind?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contab_office_finance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contab_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_office_finance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_office_finance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contab_office_finance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contab_office_finance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      contab_onboarding: {
        Row: {
          client_id: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          responsible_id: string | null
          status: string
          step_name: string
          step_order: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          responsible_id?: string | null
          status?: string
          step_name: string
          step_order?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          responsible_id?: string | null
          status?: string
          step_name?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contab_onboarding_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contab_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_onboarding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_onboarding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contab_onboarding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contab_onboarding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      contab_reminders: {
        Row: {
          channel: string
          client_id: string
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          obligation_id: string
          offset_days: number
          scheduled_for: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          client_id: string
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          obligation_id: string
          offset_days: number
          scheduled_for: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          client_id?: string
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          obligation_id?: string
          offset_days?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contab_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contab_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_reminders_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "contab_obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      contab_tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          document_id: string | null
          done_at: string | null
          due_date: string | null
          id: string
          metadata: Json
          obligation_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_id?: string | null
          done_at?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          obligation_id?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_id?: string | null
          done_at?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          obligation_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contab_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contab_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_tasks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "contab_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contab_tasks_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "contab_obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          billing_contract_id: string | null
          company_id: string
          contract_number: string
          created_at: string
          file_hash: string
          file_size_bytes: number
          generated_at: string
          generated_by: string | null
          id: string
          parent_document_id: string | null
          sent_at: string | null
          signed_at: string | null
          signed_file_hash: string | null
          signed_storage_path: string | null
          snapshot: Json
          status: string
          storage_path: string
          superseded_at: string | null
          superseded_by_id: string | null
          updated_at: string
          version: number
          white_label_id: string | null
        }
        Insert: {
          billing_contract_id?: string | null
          company_id: string
          contract_number: string
          created_at?: string
          file_hash: string
          file_size_bytes?: number
          generated_at?: string
          generated_by?: string | null
          id?: string
          parent_document_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signed_file_hash?: string | null
          signed_storage_path?: string | null
          snapshot?: Json
          status?: string
          storage_path: string
          superseded_at?: string | null
          superseded_by_id?: string | null
          updated_at?: string
          version?: number
          white_label_id?: string | null
        }
        Update: {
          billing_contract_id?: string | null
          company_id?: string
          contract_number?: string
          created_at?: string
          file_hash?: string
          file_size_bytes?: number
          generated_at?: string
          generated_by?: string | null
          id?: string
          parent_document_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signed_file_hash?: string | null
          signed_storage_path?: string | null
          snapshot?: Json
          status?: string
          storage_path?: string
          superseded_at?: string | null
          superseded_by_id?: string | null
          updated_at?: string
          version?: number
          white_label_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_billing_contract_id_fkey"
            columns: ["billing_contract_id"]
            isOneToOne: false
            referencedRelation: "billing_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contract_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contract_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contract_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "contract_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "contract_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          company_id: string
          contract_document_id: string
          created_at: string
          evidence: Json
          id: string
          ip_address: unknown
          signature_hash: string
          signed_at: string
          signer_doc: string | null
          signer_email: string
          signer_name: string
          signer_role: string | null
          signer_user_id: string | null
          status: string
          user_agent: string | null
          white_label_id: string | null
        }
        Insert: {
          company_id: string
          contract_document_id: string
          created_at?: string
          evidence?: Json
          id?: string
          ip_address?: unknown
          signature_hash: string
          signed_at?: string
          signer_doc?: string | null
          signer_email: string
          signer_name: string
          signer_role?: string | null
          signer_user_id?: string | null
          status?: string
          user_agent?: string | null
          white_label_id?: string | null
        }
        Update: {
          company_id?: string
          contract_document_id?: string
          created_at?: string
          evidence?: Json
          id?: string
          ip_address?: unknown
          signature_hash?: string
          signed_at?: string
          signer_doc?: string | null
          signer_email?: string
          signer_name?: string
          signer_role?: string | null
          signer_user_id?: string | null
          status?: string
          user_agent?: string | null
          white_label_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_signatures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contract_signatures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contract_signatures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contract_signatures_contract_document_id_fkey"
            columns: ["contract_document_id"]
            isOneToOne: false
            referencedRelation: "contract_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      core_admin_menu: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          group_key: string
          group_label: string
          group_order: number
          icon: string | null
          id: string
          item_key: string
          item_label: string
          item_order: number
          required_role: string | null
          route: string
          updated_at: string
          vertente: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          group_key: string
          group_label: string
          group_order?: number
          icon?: string | null
          id?: string
          item_key: string
          item_label: string
          item_order?: number
          required_role?: string | null
          route: string
          updated_at?: string
          vertente: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          group_key?: string
          group_label?: string
          group_order?: number
          icon?: string | null
          id?: string
          item_key?: string
          item_label?: string
          item_order?: number
          required_role?: string | null
          route?: string
          updated_at?: string
          vertente?: string
        }
        Relationships: []
      }
      core_briefings: {
        Row: {
          answers: Json
          assigned_to: string | null
          budget_range: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_whatsapp: string
          created_at: string
          current_tools: string | null
          goals: string | null
          id: string
          integrations_needed: string | null
          niche: string | null
          notes: string | null
          required_modules: string[] | null
          reviewed_at: string | null
          source: string | null
          status: string
          team_size: string | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          answers?: Json
          assigned_to?: string | null
          budget_range?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_whatsapp: string
          created_at?: string
          current_tools?: string | null
          goals?: string | null
          id?: string
          integrations_needed?: string | null
          niche?: string | null
          notes?: string | null
          required_modules?: string[] | null
          reviewed_at?: string | null
          source?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          answers?: Json
          assigned_to?: string | null
          budget_range?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_whatsapp?: string
          created_at?: string
          current_tools?: string | null
          goals?: string | null
          id?: string
          integrations_needed?: string | null
          niche?: string | null
          notes?: string | null
          required_modules?: string[] | null
          reviewed_at?: string | null
          source?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: []
      }
      core_company_feature_values: {
        Row: {
          company_id: string
          created_at: string
          flag_key: string
          id: string
          module_slug: string | null
          updated_at: string
          updated_by: string | null
          value: boolean
        }
        Insert: {
          company_id: string
          created_at?: string
          flag_key: string
          id?: string
          module_slug?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: boolean
        }
        Update: {
          company_id?: string
          created_at?: string
          flag_key?: string
          id?: string
          module_slug?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "core_company_feature_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_company_feature_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_company_feature_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_company_feature_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_company_plans: {
        Row: {
          ativo: boolean
          created_at: string
          features: Json
          id: string
          max_modulos: number | null
          nome: string
          ordem: number
          pontos_consumo: number
          preco_sm: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          features?: Json
          id?: string
          max_modulos?: number | null
          nome: string
          ordem?: number
          pontos_consumo: number
          preco_sm: number
          slug: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          features?: Json
          id?: string
          max_modulos?: number | null
          nome?: string
          ordem?: number
          pontos_consumo?: number
          preco_sm?: number
          slug?: string
        }
        Relationships: []
      }
      core_compliance_requirements: {
        Row: {
          active: boolean
          applies_to: string
          blocking: boolean
          company_id: string | null
          created_at: string
          document_kind: string
          id: string
          label: string
          min_version: string | null
          requirement_key: string
          scope: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          applies_to?: string
          blocking?: boolean
          company_id?: string | null
          created_at?: string
          document_kind: string
          id?: string
          label: string
          min_version?: string | null
          requirement_key: string
          scope?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          applies_to?: string
          blocking?: boolean
          company_id?: string | null
          created_at?: string
          document_kind?: string
          id?: string
          label?: string
          min_version?: string | null
          requirement_key?: string
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_compliance_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_compliance_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_compliance_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_compliance_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_dashboard_widgets: {
        Row: {
          audience: string[]
          config: Json
          created_at: string
          dashboard_key: string
          data_source: string | null
          description: string | null
          id: string
          is_visible: boolean
          niche_slugs: string[]
          required_module_slug: string | null
          sort_order: number
          title: string
          updated_at: string
          widget_key: string
          widget_type: string
        }
        Insert: {
          audience?: string[]
          config?: Json
          created_at?: string
          dashboard_key: string
          data_source?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean
          niche_slugs?: string[]
          required_module_slug?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          widget_key: string
          widget_type?: string
        }
        Update: {
          audience?: string[]
          config?: Json
          created_at?: string
          dashboard_key?: string
          data_source?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean
          niche_slugs?: string[]
          required_module_slug?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          widget_key?: string
          widget_type?: string
        }
        Relationships: []
      }
      core_export_logs: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          kind: string
          notes: string | null
          params: Json
          row_count: number
          scope: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          kind: string
          notes?: string | null
          params?: Json
          row_count?: number
          scope: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          params?: Json
          row_count?: number
          scope?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_export_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_export_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_export_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_export_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_feature_flags: {
        Row: {
          category: string
          created_at: string
          default_value: boolean
          description: string | null
          id: string
          is_active: boolean
          key: string
          label: string
          module_slug: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_value?: boolean
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          label: string
          module_slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_value?: boolean
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          module_slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_feature_flags_module_slug_fkey"
            columns: ["module_slug"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["slug"]
          },
        ]
      }
      core_fee_rules: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          fixed_cents: number
          id: string
          max_cents: number | null
          metadata: Json
          method: Database["public"]["Enums"]["payment_method_kind"] | null
          min_cents: number
          niche_id: string | null
          notes: string | null
          percent_bps: number
          priority: number
          product_id: string | null
          scope: Database["public"]["Enums"]["fee_rule_scope"]
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          fixed_cents?: number
          id?: string
          max_cents?: number | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method_kind"] | null
          min_cents?: number
          niche_id?: string | null
          notes?: string | null
          percent_bps?: number
          priority?: number
          product_id?: string | null
          scope: Database["public"]["Enums"]["fee_rule_scope"]
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          fixed_cents?: number
          id?: string
          max_cents?: number | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method_kind"] | null
          min_cents?: number
          niche_id?: string | null
          notes?: string | null
          percent_bps?: number
          priority?: number
          product_id?: string | null
          scope?: Database["public"]["Enums"]["fee_rule_scope"]
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_fee_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_fee_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_fee_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_fee_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_fiscal_invoice_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          invoice_id: string
          message: string | null
          payload: Json
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          invoice_id: string
          message?: string | null
          payload?: Json
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          invoice_id?: string
          message?: string | null
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "core_fiscal_invoice_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "core_fiscal_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_fiscal_invoice_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_fiscal_invoices_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      core_fiscal_invoices: {
        Row: {
          attempt_count: number
          beneficiary_address: Json
          beneficiary_cnpj: string | null
          beneficiary_company_id: string
          beneficiary_legal_name: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cofins_amount: number
          created_at: string
          csll_amount: number
          currency: string
          environment: string
          id: string
          ir_amount: number
          iss_amount: number
          iss_withheld: boolean
          issued_at: string | null
          issuer_id: string
          last_attempt_at: string | null
          metadata: Json
          net_amount: number
          nf_number: string | null
          nf_url: string | null
          nf_verification_code: string | null
          nf_xml_url: string | null
          pis_amount: number
          provider: string
          provider_response: Json
          reference_id: string | null
          reference_kind: string | null
          replaced_by_invoice_id: string | null
          revenue_calculation_id: string | null
          rps_number: number
          rps_serie: string
          service_amount: number
          service_code: string
          service_description: string
          status: string
          status_message: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          beneficiary_address?: Json
          beneficiary_cnpj?: string | null
          beneficiary_company_id: string
          beneficiary_legal_name: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cofins_amount?: number
          created_at?: string
          csll_amount?: number
          currency?: string
          environment: string
          id?: string
          ir_amount?: number
          iss_amount?: number
          iss_withheld?: boolean
          issued_at?: string | null
          issuer_id: string
          last_attempt_at?: string | null
          metadata?: Json
          net_amount: number
          nf_number?: string | null
          nf_url?: string | null
          nf_verification_code?: string | null
          nf_xml_url?: string | null
          pis_amount?: number
          provider: string
          provider_response?: Json
          reference_id?: string | null
          reference_kind?: string | null
          replaced_by_invoice_id?: string | null
          revenue_calculation_id?: string | null
          rps_number: number
          rps_serie: string
          service_amount: number
          service_code: string
          service_description: string
          status?: string
          status_message?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          beneficiary_address?: Json
          beneficiary_cnpj?: string | null
          beneficiary_company_id?: string
          beneficiary_legal_name?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cofins_amount?: number
          created_at?: string
          csll_amount?: number
          currency?: string
          environment?: string
          id?: string
          ir_amount?: number
          iss_amount?: number
          iss_withheld?: boolean
          issued_at?: string | null
          issuer_id?: string
          last_attempt_at?: string | null
          metadata?: Json
          net_amount?: number
          nf_number?: string | null
          nf_url?: string | null
          nf_verification_code?: string | null
          nf_xml_url?: string | null
          pis_amount?: number
          provider?: string
          provider_response?: Json
          reference_id?: string | null
          reference_kind?: string | null
          replaced_by_invoice_id?: string | null
          revenue_calculation_id?: string | null
          rps_number?: number
          rps_serie?: string
          service_amount?: number
          service_code?: string
          service_description?: string
          status?: string
          status_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_fiscal_invoices_beneficiary_company_id_fkey"
            columns: ["beneficiary_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_beneficiary_company_id_fkey"
            columns: ["beneficiary_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_beneficiary_company_id_fkey"
            columns: ["beneficiary_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_beneficiary_company_id_fkey"
            columns: ["beneficiary_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "core_fiscal_issuer_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_replaced_by_invoice_id_fkey"
            columns: ["replaced_by_invoice_id"]
            isOneToOne: false
            referencedRelation: "core_fiscal_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_replaced_by_invoice_id_fkey"
            columns: ["replaced_by_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_fiscal_invoices_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_revenue_calculation_id_fkey"
            columns: ["revenue_calculation_id"]
            isOneToOne: false
            referencedRelation: "core_revenue_calculations"
            referencedColumns: ["id"]
          },
        ]
      }
      core_fiscal_issuer_config: {
        Row: {
          address: Json
          cnae: string | null
          cnpj: string
          cofins_rate: number
          created_at: string
          csll_rate: number
          environment: string
          id: string
          ie: string | null
          im: string | null
          ir_rate: number
          is_active: boolean
          iss_rate: number
          iss_withheld_default: boolean
          legal_name: string
          metadata: Json
          next_rps_number: number
          pis_rate: number
          provider: string
          rps_serie: string
          service_code: string
          service_description: string
          tax_regime: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address?: Json
          cnae?: string | null
          cnpj: string
          cofins_rate?: number
          created_at?: string
          csll_rate?: number
          environment?: string
          id?: string
          ie?: string | null
          im?: string | null
          ir_rate?: number
          is_active?: boolean
          iss_rate?: number
          iss_withheld_default?: boolean
          legal_name: string
          metadata?: Json
          next_rps_number?: number
          pis_rate?: number
          provider?: string
          rps_serie?: string
          service_code: string
          service_description?: string
          tax_regime?: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json
          cnae?: string | null
          cnpj?: string
          cofins_rate?: number
          created_at?: string
          csll_rate?: number
          environment?: string
          id?: string
          ie?: string | null
          im?: string | null
          ir_rate?: number
          is_active?: boolean
          iss_rate?: number
          iss_withheld_default?: boolean
          legal_name?: string
          metadata?: Json
          next_rps_number?: number
          pis_rate?: number
          provider?: string
          rps_serie?: string
          service_code?: string
          service_description?: string
          tax_regime?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      core_funnel_dispatch_queue: {
        Row: {
          attempts: number
          company_id: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_name: string
          id: string
          last_error: string | null
          last_request_id: string | null
          lead_id: string | null
          niche_slug: string | null
          payload: Json
          rule_id: string
          scheduled_at: string
          sent_at: string | null
          stage: Database["public"]["Enums"]["core_funnel_stage"]
          status: string
          updated_at: string
          workflow_name: string
        }
        Insert: {
          attempts?: number
          company_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_name: string
          id?: string
          last_error?: string | null
          last_request_id?: string | null
          lead_id?: string | null
          niche_slug?: string | null
          payload?: Json
          rule_id: string
          scheduled_at?: string
          sent_at?: string | null
          stage: Database["public"]["Enums"]["core_funnel_stage"]
          status?: string
          updated_at?: string
          workflow_name: string
        }
        Update: {
          attempts?: number
          company_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_name?: string
          id?: string
          last_error?: string | null
          last_request_id?: string | null
          lead_id?: string | null
          niche_slug?: string | null
          payload?: Json
          rule_id?: string
          scheduled_at?: string
          sent_at?: string | null
          stage?: Database["public"]["Enums"]["core_funnel_stage"]
          status?: string
          updated_at?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_funnel_dispatch_queue_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "core_funnel_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      core_funnel_rules: {
        Row: {
          active: boolean
          created_at: string
          delay_minutes: number
          description: string | null
          event_name: string
          id: string
          niche_slug: string | null
          payload_template: Json
          stage: Database["public"]["Enums"]["core_funnel_stage"]
          updated_at: string
          workflow_name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delay_minutes?: number
          description?: string | null
          event_name: string
          id?: string
          niche_slug?: string | null
          payload_template?: Json
          stage: Database["public"]["Enums"]["core_funnel_stage"]
          updated_at?: string
          workflow_name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delay_minutes?: number
          description?: string | null
          event_name?: string
          id?: string
          niche_slug?: string | null
          payload_template?: Json
          stage?: Database["public"]["Enums"]["core_funnel_stage"]
          updated_at?: string
          workflow_name?: string
        }
        Relationships: []
      }
      core_incidents: {
        Row: {
          created_at: string
          description: string | null
          detected_at: string
          event_count: number
          id: string
          metadata: Json
          postmortem: string | null
          resolved_at: string | null
          runtime_scope: string | null
          scope: Database["public"]["Enums"]["core_slo_scope"]
          severity: Database["public"]["Enums"]["core_incident_severity"]
          source: string
          started_at: string
          status: Database["public"]["Enums"]["core_incident_status"]
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          detected_at?: string
          event_count?: number
          id?: string
          metadata?: Json
          postmortem?: string | null
          resolved_at?: string | null
          runtime_scope?: string | null
          scope: Database["public"]["Enums"]["core_slo_scope"]
          severity?: Database["public"]["Enums"]["core_incident_severity"]
          source?: string
          started_at?: string
          status?: Database["public"]["Enums"]["core_incident_status"]
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          detected_at?: string
          event_count?: number
          id?: string
          metadata?: Json
          postmortem?: string | null
          resolved_at?: string | null
          runtime_scope?: string | null
          scope?: Database["public"]["Enums"]["core_slo_scope"]
          severity?: Database["public"]["Enums"]["core_incident_severity"]
          source?: string
          started_at?: string
          status?: Database["public"]["Enums"]["core_incident_status"]
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      core_integration_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error: string | null
          event_type: string
          id: string
          integration_slug: string
          request: Json | null
          response: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          event_type: string
          id?: string
          integration_slug: string
          request?: Json | null
          response?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          event_type?: string
          id?: string
          integration_slug?: string
          request?: Json | null
          response?: Json | null
          status?: string
        }
        Relationships: []
      }
      core_integrations: {
        Row: {
          config: Json
          created_at: string
          environment: string
          id: string
          is_active: boolean
          last_error: string | null
          last_test_at: string | null
          name: string
          secret_refs: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_test_at?: string | null
          name: string
          secret_refs?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_test_at?: string | null
          name?: string
          secret_refs?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      core_macro_nichos: {
        Row: {
          created_at: string
          id: string
          nome: string
          ordem: number
          recommendation_slug: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          recommendation_slug: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          recommendation_slug?: string
          slug?: string
        }
        Relationships: []
      }
      core_master_data: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          domain: string
          id: string
          key: string
          label: string
          metadata: Json
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          domain: string
          id?: string
          key: string
          label: string
          metadata?: Json
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          domain?: string
          id?: string
          key?: string
          label?: string
          metadata?: Json
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_master_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_master_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_master_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_master_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_master_data_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "core_master_data"
            referencedColumns: ["id"]
          },
        ]
      }
      core_menu_items: {
        Row: {
          audience: string[]
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          is_visible: boolean
          label: string
          metadata: Json
          niche_slugs: string[]
          parent_id: string | null
          required_module_slug: string | null
          required_permission: string | null
          required_plan_codes: string[]
          route: string | null
          scope: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          audience?: string[]
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          is_visible?: boolean
          label: string
          metadata?: Json
          niche_slugs?: string[]
          parent_id?: string | null
          required_module_slug?: string | null
          required_permission?: string | null
          required_plan_codes?: string[]
          route?: string | null
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          audience?: string[]
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          is_visible?: boolean
          label?: string
          metadata?: Json
          niche_slugs?: string[]
          parent_id?: string | null
          required_module_slug?: string | null
          required_permission?: string | null
          required_plan_codes?: string[]
          route?: string | null
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "core_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      core_module_catalog: {
        Row: {
          active: boolean
          base_price_cents: number
          category: string
          created_at: string
          features: Json
          icon: string | null
          id: string
          long_description: string | null
          name: string
          niches: string[]
          recommended_with: string[]
          setup_price_cents: number
          short_description: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price_cents?: number
          category: string
          created_at?: string
          features?: Json
          icon?: string | null
          id?: string
          long_description?: string | null
          name: string
          niches?: string[]
          recommended_with?: string[]
          setup_price_cents?: number
          short_description: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price_cents?: number
          category?: string
          created_at?: string
          features?: Json
          icon?: string | null
          id?: string
          long_description?: string | null
          name?: string
          niches?: string[]
          recommended_with?: string[]
          setup_price_cents?: number
          short_description?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      core_monetization_models: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string
          covered_events: string[]
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          min_payout_cents: number
          model: string
          monthly_fee_cents: number
          notes: string | null
          payout_frequency: string
          setup_fee_cents: number
          signature_hash: string | null
          updated_at: string
          version: number
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id: string
          covered_events?: string[]
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          min_payout_cents?: number
          model: string
          monthly_fee_cents?: number
          notes?: string | null
          payout_frequency?: string
          setup_fee_cents?: number
          signature_hash?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string
          covered_events?: string[]
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          min_payout_cents?: number
          model?: string
          monthly_fee_cents?: number
          notes?: string | null
          payout_frequency?: string
          setup_fee_cents?: number
          signature_hash?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "core_monetization_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_monetization_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_monetization_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_monetization_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_niche_modules: {
        Row: {
          created_at: string
          id: string
          is_optional: boolean
          is_recommended: boolean
          module_slug: string
          niche_id: string
          notes: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_optional?: boolean
          is_recommended?: boolean
          module_slug: string
          niche_id: string
          notes?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_optional?: boolean
          is_recommended?: boolean
          module_slug?: string
          niche_id?: string
          notes?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_niche_modules_module_slug_fkey"
            columns: ["module_slug"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "core_niche_modules_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      core_niche_plan_modules: {
        Row: {
          base_price_label: string | null
          choose_limit: number
          created_at: string
          id: string
          macro_slug: string
          modules: string[]
          plan_tier: string
          updated_at: string
        }
        Insert: {
          base_price_label?: string | null
          choose_limit?: number
          created_at?: string
          id?: string
          macro_slug: string
          modules?: string[]
          plan_tier: string
          updated_at?: string
        }
        Update: {
          base_price_label?: string | null
          choose_limit?: number
          created_at?: string
          id?: string
          macro_slug?: string
          modules?: string[]
          plan_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      core_payout_events: {
        Row: {
          approved_at: string | null
          company_id: string
          created_at: string
          event_type: string
          fee_cents: number
          gross_cents: number
          id: string
          ledger_id: string | null
          metadata: Json
          model_id: string | null
          net_cents: number
          occurred_at: string
          percent_bps_applied: number
          provider: string
          provider_payment_id: string | null
          rate_id: string | null
          reference_id: string | null
          reference_table: string | null
          rule_version: number
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          company_id: string
          created_at?: string
          event_type: string
          fee_cents?: number
          gross_cents: number
          id?: string
          ledger_id?: string | null
          metadata?: Json
          model_id?: string | null
          net_cents?: number
          occurred_at?: string
          percent_bps_applied?: number
          provider?: string
          provider_payment_id?: string | null
          rate_id?: string | null
          reference_id?: string | null
          reference_table?: string | null
          rule_version?: number
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          company_id?: string
          created_at?: string
          event_type?: string
          fee_cents?: number
          gross_cents?: number
          id?: string
          ledger_id?: string | null
          metadata?: Json
          model_id?: string | null
          net_cents?: number
          occurred_at?: string
          percent_bps_applied?: number
          provider?: string
          provider_payment_id?: string | null
          rate_id?: string | null
          reference_id?: string | null
          reference_table?: string | null
          rule_version?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_payout_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_payout_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_payout_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_payout_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_payout_events_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "core_payout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_payout_events_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "core_monetization_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_payout_events_rate_id_fkey"
            columns: ["rate_id"]
            isOneToOne: false
            referencedRelation: "core_revshare_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      core_payout_ledger: {
        Row: {
          company_id: string
          created_at: string
          event_count: number
          fee_cents: number
          gross_cents: number
          id: string
          marked_paid_at: string | null
          metadata: Json
          net_cents: number
          paid_at: string | null
          paid_by: string | null
          period_end: string
          period_start: string
          provider: string
          provider_payout_id: string | null
          receipt_path: string | null
          receipt_url: string | null
          retention_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          event_count?: number
          fee_cents?: number
          gross_cents?: number
          id?: string
          marked_paid_at?: string | null
          metadata?: Json
          net_cents?: number
          paid_at?: string | null
          paid_by?: string | null
          period_end: string
          period_start: string
          provider?: string
          provider_payout_id?: string | null
          receipt_path?: string | null
          receipt_url?: string | null
          retention_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          event_count?: number
          fee_cents?: number
          gross_cents?: number
          id?: string
          marked_paid_at?: string | null
          metadata?: Json
          net_cents?: number
          paid_at?: string | null
          paid_by?: string | null
          period_end?: string
          period_start?: string
          provider?: string
          provider_payout_id?: string | null
          receipt_path?: string | null
          receipt_url?: string | null
          retention_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_payout_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_payout_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_payout_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_payout_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_payout_schedule_rules: {
        Row: {
          active: boolean
          basis: Database["public"]["Enums"]["payout_schedule_basis"]
          company_id: string | null
          created_at: string
          created_by: string | null
          delay_days: number
          ends_at: string | null
          id: string
          metadata: Json
          method: Database["public"]["Enums"]["payment_method_kind"] | null
          niche_id: string | null
          notes: string | null
          priority: number
          product_id: string | null
          reserve_bps: number
          scope: Database["public"]["Enums"]["fee_rule_scope"]
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          basis?: Database["public"]["Enums"]["payout_schedule_basis"]
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          delay_days: number
          ends_at?: string | null
          id?: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method_kind"] | null
          niche_id?: string | null
          notes?: string | null
          priority?: number
          product_id?: string | null
          reserve_bps?: number
          scope: Database["public"]["Enums"]["fee_rule_scope"]
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          basis?: Database["public"]["Enums"]["payout_schedule_basis"]
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          delay_days?: number
          ends_at?: string | null
          id?: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method_kind"] | null
          niche_id?: string | null
          notes?: string | null
          priority?: number
          product_id?: string | null
          reserve_bps?: number
          scope?: Database["public"]["Enums"]["fee_rule_scope"]
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_payout_schedule_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_payout_schedule_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_payout_schedule_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_payout_schedule_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_refund_rules: {
        Row: {
          accepted_reasons: string[]
          allow_full: boolean
          allow_partial: boolean
          auto_refund: boolean
          company_id: string
          created_at: string
          id: string
          manual_refund: boolean
          request_deadline_days: number
          requires_audit_log: boolean
          same_holder_required: boolean
          updated_at: string
          validate_card: boolean
          validate_cpf_cnpj: boolean
          validate_pix_payer: boolean
        }
        Insert: {
          accepted_reasons?: string[]
          allow_full?: boolean
          allow_partial?: boolean
          auto_refund?: boolean
          company_id: string
          created_at?: string
          id?: string
          manual_refund?: boolean
          request_deadline_days?: number
          requires_audit_log?: boolean
          same_holder_required?: boolean
          updated_at?: string
          validate_card?: boolean
          validate_cpf_cnpj?: boolean
          validate_pix_payer?: boolean
        }
        Update: {
          accepted_reasons?: string[]
          allow_full?: boolean
          allow_partial?: boolean
          auto_refund?: boolean
          company_id?: string
          created_at?: string
          id?: string
          manual_refund?: boolean
          request_deadline_days?: number
          requires_audit_log?: boolean
          same_holder_required?: boolean
          updated_at?: string
          validate_card?: boolean
          validate_cpf_cnpj?: boolean
          validate_pix_payer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "core_refund_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_refund_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_refund_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_refund_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_reschedule_rules: {
        Row: {
          auto_reschedule: boolean
          block_slot_until_approval: boolean
          company_id: string
          created_at: string
          fee_cents: number
          fee_enabled: boolean
          id: string
          max_hours_before: number
          max_reschedule_count: number
          min_hours_before: number
          notify_clinic: boolean
          notify_patient: boolean
          notify_professional: boolean
          release_old_slot_immediately: boolean
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          auto_reschedule?: boolean
          block_slot_until_approval?: boolean
          company_id: string
          created_at?: string
          fee_cents?: number
          fee_enabled?: boolean
          id?: string
          max_hours_before?: number
          max_reschedule_count?: number
          min_hours_before?: number
          notify_clinic?: boolean
          notify_patient?: boolean
          notify_professional?: boolean
          release_old_slot_immediately?: boolean
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          auto_reschedule?: boolean
          block_slot_until_approval?: boolean
          company_id?: string
          created_at?: string
          fee_cents?: number
          fee_enabled?: boolean
          id?: string
          max_hours_before?: number
          max_reschedule_count?: number
          min_hours_before?: number
          notify_clinic?: boolean
          notify_patient?: boolean
          notify_professional?: boolean
          release_old_slot_immediately?: boolean
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_reschedule_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_reschedule_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_reschedule_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_reschedule_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_revenue_calculations: {
        Row: {
          affiliate_commission_cents: number
          captured_at: string
          company_id: string
          coproducer_commission_cents: number
          coupon_cents: number
          created_at: string
          fee_rule_id: string | null
          gateway_fee_cents: number
          gross_cents: number
          id: string
          impulsionando_fee_cents: number
          input_hash: string
          legs: Json
          metadata: Json
          method: Database["public"]["Enums"]["payment_method_kind"]
          net_cents: number
          release_date: string
          reserve_cents: number
          schedule_rule_id: string | null
          source_id: string
          source_table: string
          status: Database["public"]["Enums"]["revenue_calc_status"]
          version: number
        }
        Insert: {
          affiliate_commission_cents?: number
          captured_at: string
          company_id: string
          coproducer_commission_cents?: number
          coupon_cents?: number
          created_at?: string
          fee_rule_id?: string | null
          gateway_fee_cents?: number
          gross_cents: number
          id?: string
          impulsionando_fee_cents?: number
          input_hash: string
          legs?: Json
          metadata?: Json
          method: Database["public"]["Enums"]["payment_method_kind"]
          net_cents: number
          release_date: string
          reserve_cents?: number
          schedule_rule_id?: string | null
          source_id: string
          source_table: string
          status?: Database["public"]["Enums"]["revenue_calc_status"]
          version?: number
        }
        Update: {
          affiliate_commission_cents?: number
          captured_at?: string
          company_id?: string
          coproducer_commission_cents?: number
          coupon_cents?: number
          created_at?: string
          fee_rule_id?: string | null
          gateway_fee_cents?: number
          gross_cents?: number
          id?: string
          impulsionando_fee_cents?: number
          input_hash?: string
          legs?: Json
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method_kind"]
          net_cents?: number
          release_date?: string
          reserve_cents?: number
          schedule_rule_id?: string | null
          source_id?: string
          source_table?: string
          status?: Database["public"]["Enums"]["revenue_calc_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "core_revenue_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_revenue_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_revenue_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_revenue_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_revenue_calculations_fee_rule_id_fkey"
            columns: ["fee_rule_id"]
            isOneToOne: false
            referencedRelation: "core_fee_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_revenue_calculations_schedule_rule_id_fkey"
            columns: ["schedule_rule_id"]
            isOneToOne: false
            referencedRelation: "core_payout_schedule_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      core_revshare_rates: {
        Row: {
          company_id: string
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          max_bps: number | null
          min_bps: number | null
          model_id: string
          percent_bps: number
          provider_account_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          max_bps?: number | null
          min_bps?: number | null
          model_id: string
          percent_bps: number
          provider_account_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          max_bps?: number | null
          min_bps?: number | null
          model_id?: string
          percent_bps?: number
          provider_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_revshare_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_revshare_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_revshare_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_revshare_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_revshare_rates_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "core_monetization_models"
            referencedColumns: ["id"]
          },
        ]
      }
      core_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          is_editable: boolean
          key: string
          label: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          is_editable?: boolean
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          is_editable?: boolean
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      core_slo_targets: {
        Row: {
          active: boolean
          availability_target_bps: number
          created_at: string
          id: string
          latency_p95_target_ms: number
          name: string
          notes: string | null
          runtime_scope: string | null
          scope: Database["public"]["Enums"]["core_slo_scope"]
          updated_at: string
          url: string | null
          window_days: number
        }
        Insert: {
          active?: boolean
          availability_target_bps?: number
          created_at?: string
          id?: string
          latency_p95_target_ms?: number
          name: string
          notes?: string | null
          runtime_scope?: string | null
          scope?: Database["public"]["Enums"]["core_slo_scope"]
          updated_at?: string
          url?: string | null
          window_days?: number
        }
        Update: {
          active?: boolean
          availability_target_bps?: number
          created_at?: string
          id?: string
          latency_p95_target_ms?: number
          name?: string
          notes?: string | null
          runtime_scope?: string | null
          scope?: Database["public"]["Enums"]["core_slo_scope"]
          updated_at?: string
          url?: string | null
          window_days?: number
        }
        Relationships: []
      }
      core_smoke_purge_log: {
        Row: {
          by_niche: Json
          by_status: Json
          created_at: string
          id: string
          ran_at: string
          removed_samples: Json
          retention_days: number
          total_removed: number
          trigger: string
          triggered_by: string | null
        }
        Insert: {
          by_niche?: Json
          by_status?: Json
          created_at?: string
          id?: string
          ran_at?: string
          removed_samples?: Json
          retention_days: number
          total_removed?: number
          trigger?: string
          triggered_by?: string | null
        }
        Update: {
          by_niche?: Json
          by_status?: Json
          created_at?: string
          id?: string
          ran_at?: string
          removed_samples?: Json
          retention_days?: number
          total_removed?: number
          trigger?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      core_smoke_runs: {
        Row: {
          batch_id: string | null
          created_at: string
          duration_ms: number
          error: string | null
          id: string
          ids: Json
          label: string | null
          niche_slug: string | null
          replay_of: string | null
          steps: Json
          success: boolean
          triggered_by: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          duration_ms?: number
          error?: string | null
          id?: string
          ids?: Json
          label?: string | null
          niche_slug?: string | null
          replay_of?: string | null
          steps?: Json
          success: boolean
          triggered_by?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          duration_ms?: number
          error?: string | null
          id?: string
          ids?: Json
          label?: string | null
          niche_slug?: string | null
          replay_of?: string | null
          steps?: Json
          success?: boolean
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_smoke_runs_replay_of_fkey"
            columns: ["replay_of"]
            isOneToOne: false
            referencedRelation: "core_smoke_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      core_subnichos: {
        Row: {
          created_at: string
          id: string
          macro_id: string
          nome: string
          ordem: number
          recommendation_slug: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          macro_id: string
          nome: string
          ordem?: number
          recommendation_slug: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          macro_id?: string
          nome?: string
          ordem?: number
          recommendation_slug?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_subnichos_macro_id_fkey"
            columns: ["macro_id"]
            isOneToOne: false
            referencedRelation: "core_macro_nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      core_templates: {
        Row: {
          created_at: string
          descricao: string | null
          destaque: boolean
          id: string
          modulos: string[]
          nome: string
          slug: string
          subnicho_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          id?: string
          modulos?: string[]
          nome: string
          slug: string
          subnicho_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          id?: string
          modulos?: string[]
          nome?: string
          slug?: string
          subnicho_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_templates_subnicho_id_fkey"
            columns: ["subnicho_id"]
            isOneToOne: false
            referencedRelation: "core_subnichos"
            referencedColumns: ["id"]
          },
        ]
      }
      core_tenant_email_aliases: {
        Row: {
          alias: string
          company_id: string
          created_at: string
          dns_status: string
          forward_to: string | null
          full_address: string
          id: string
          identity_id: string | null
          is_active: boolean
          is_default: boolean
          metadata: Json
          purpose: string
          updated_at: string
        }
        Insert: {
          alias: string
          company_id: string
          created_at?: string
          dns_status?: string
          forward_to?: string | null
          full_address: string
          id?: string
          identity_id?: string | null
          is_active?: boolean
          is_default?: boolean
          metadata?: Json
          purpose: string
          updated_at?: string
        }
        Update: {
          alias?: string
          company_id?: string
          created_at?: string
          dns_status?: string
          forward_to?: string | null
          full_address?: string
          id?: string
          identity_id?: string | null
          is_active?: boolean
          is_default?: boolean
          metadata?: Json
          purpose?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_tenant_email_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_tenant_email_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_tenant_email_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_tenant_email_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_tenant_email_aliases_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "core_tenant_identity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_tenant_email_aliases_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["identity_id"]
          },
        ]
      }
      core_tenant_identity: {
        Row: {
          company_id: string
          created_at: string
          custom_domain: string | null
          dns_error: string | null
          dns_last_checked_at: string | null
          dns_status: string
          full_domain: string | null
          id: string
          metadata: Json
          provisioned_at: string | null
          root_domain: string
          ssl_expires_at: string | null
          ssl_issued_at: string | null
          ssl_status: string
          subdomain: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_domain?: string | null
          dns_error?: string | null
          dns_last_checked_at?: string | null
          dns_status?: string
          full_domain?: string | null
          id?: string
          metadata?: Json
          provisioned_at?: string | null
          root_domain?: string
          ssl_expires_at?: string | null
          ssl_issued_at?: string | null
          ssl_status?: string
          subdomain: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_domain?: string | null
          dns_error?: string | null
          dns_last_checked_at?: string | null
          dns_status?: string
          full_domain?: string | null
          id?: string
          metadata?: Json
          provisioned_at?: string | null
          root_domain?: string
          ssl_expires_at?: string | null
          ssl_issued_at?: string | null
          ssl_status?: string
          subdomain?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_tenant_identity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_tenant_identity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_tenant_identity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_tenant_identity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_whatsapp_credentials: {
        Row: {
          access_token_encrypted: string | null
          api_base_url: string | null
          company_id: string
          created_at: string
          daily_quota: number | null
          display_name: string | null
          health_status: string
          id: string
          instance_id: string
          is_active: boolean
          is_verified: boolean
          label: string
          last_health_check_at: string | null
          metadata: Json
          monthly_quota: number | null
          provider: string
          purpose: string
          sender_number: string
          updated_at: string
          verified_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          api_base_url?: string | null
          company_id: string
          created_at?: string
          daily_quota?: number | null
          display_name?: string | null
          health_status?: string
          id?: string
          instance_id: string
          is_active?: boolean
          is_verified?: boolean
          label: string
          last_health_check_at?: string | null
          metadata?: Json
          monthly_quota?: number | null
          provider?: string
          purpose?: string
          sender_number: string
          updated_at?: string
          verified_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          api_base_url?: string | null
          company_id?: string
          created_at?: string
          daily_quota?: number | null
          display_name?: string | null
          health_status?: string
          id?: string
          instance_id?: string
          is_active?: boolean
          is_verified?: boolean
          label?: string
          last_health_check_at?: string | null
          metadata?: Json
          monthly_quota?: number | null
          provider?: string
          purpose?: string
          sender_number?: string
          updated_at?: string
          verified_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_whatsapp_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_whatsapp_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_whatsapp_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_whatsapp_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      core_whatsapp_fallback_config: {
        Row: {
          created_at: string
          credential_id: string
          id: string
          is_active: boolean
          metadata: Json
          niche_slug: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          id?: string
          is_active?: boolean
          metadata?: Json
          niche_slug?: string | null
          scope?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          niche_slug?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_whatsapp_fallback_config_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "core_whatsapp_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      core_whatsapp_routing_rules: {
        Row: {
          company_id: string | null
          created_at: string
          credential_id: string | null
          event_code_pattern: string
          id: string
          is_active: boolean
          metadata: Json
          priority: number
          purpose: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          credential_id?: string | null
          event_code_pattern: string
          id?: string
          is_active?: boolean
          metadata?: Json
          priority?: number
          purpose?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          credential_id?: string | null
          event_code_pattern?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          priority?: number
          purpose?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_whatsapp_routing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_whatsapp_routing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_whatsapp_routing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_whatsapp_routing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_whatsapp_routing_rules_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "core_whatsapp_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: string
          company_id: string
          content: string | null
          created_at: string
          created_by: string | null
          done_at: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          opportunity_id: string | null
          owner_user_id: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          company_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          owner_user_id?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          company_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          owner_user_id?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_routing_rules: {
        Row: {
          assign_strategy: string
          assign_to: string | null
          company_id: string
          conditions: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          pipeline_id: string | null
          priority: number
          updated_at: string
        }
        Insert: {
          assign_strategy?: string
          assign_to?: string | null
          company_id: string
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          pipeline_id?: string | null
          priority?: number
          updated_at?: string
        }
        Update: {
          assign_strategy?: string
          assign_to?: string | null
          company_id?: string
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pipeline_id?: string | null
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_routing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_routing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "crm_lead_routing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "crm_lead_routing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "crm_lead_routing_rules_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          owner_user_id: string | null
          phone: string | null
          score: number
          source: string | null
          status: string
          tags: string[]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          score?: number
          source?: string | null
          status?: string
          tags?: string[]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          score?: number
          source?: string | null
          status?: string
          tags?: string[]
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_opportunities: {
        Row: {
          closed_at: string | null
          company_id: string
          created_at: string
          currency: string
          expected_close_at: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          owner_user_id: string | null
          pipeline_id: string
          sort_order: number
          stage_id: string
          status: string
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          closed_at?: string | null
          company_id: string
          created_at?: string
          currency?: string
          expected_close_at?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          owner_user_id?: string | null
          pipeline_id: string
          sort_order?: number
          stage_id: string
          status?: string
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          closed_at?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          expected_close_at?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          owner_user_id?: string | null
          pipeline_id?: string
          sort_order?: number
          stage_id?: string
          status?: string
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      crm_stages: {
        Row: {
          color: string
          company_id: string
          created_at: string
          id: string
          name: string
          pipeline_id: string
          sort_order: number
          stage_type: string
          updated_at: string
          win_probability: number
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          sort_order?: number
          stage_type?: string
          updated_at?: string
          win_probability?: number
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          sort_order?: number
          stage_type?: string
          updated_at?: string
          win_probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_city: string | null
          address_line: string | null
          address_state: string | null
          address_zip: string | null
          anonymization_reason: string | null
          anonymized_at: string | null
          anonymized_by: string | null
          birthdate: string | null
          company_id: string
          created_at: string
          created_by: string | null
          document: string | null
          email: string | null
          gender: string | null
          id: string
          is_active: boolean
          lead_id: string | null
          name: string
          notes: string | null
          patient_activated_at: string | null
          patient_invited_at: string | null
          patient_user_id: string | null
          phone: string | null
          tags: string[]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_line?: string | null
          address_state?: string | null
          address_zip?: string | null
          anonymization_reason?: string | null
          anonymized_at?: string | null
          anonymized_by?: string | null
          birthdate?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          lead_id?: string | null
          name: string
          notes?: string | null
          patient_activated_at?: string | null
          patient_invited_at?: string | null
          patient_user_id?: string | null
          phone?: string | null
          tags?: string[]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_line?: string | null
          address_state?: string | null
          address_zip?: string | null
          anonymization_reason?: string | null
          anonymized_at?: string | null
          anonymized_by?: string | null
          birthdate?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          lead_id?: string | null
          name?: string
          notes?: string | null
          patient_activated_at?: string | null
          patient_invited_at?: string | null
          patient_user_id?: string | null
          phone?: string | null
          tags?: string[]
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      data_deletion_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          processed_at: string | null
          reason: string | null
          scheduled_for: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_export_requests: {
        Row: {
          created_at: string
          download_url: string | null
          expires_at: string | null
          id: string
          notes: string | null
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dedupe_threshold_events: {
        Row: {
          causes: Json
          created_at: string
          days_window: number
          dedupe_pct: number
          id: string
          max_pct: number
          min_pct: number
          prev_state: string | null
          samples: number
          state: string
          user_id: string
        }
        Insert: {
          causes?: Json
          created_at?: string
          days_window: number
          dedupe_pct: number
          id?: string
          max_pct: number
          min_pct: number
          prev_state?: string | null
          samples?: number
          state: string
          user_id: string
        }
        Update: {
          causes?: Json
          created_at?: string
          days_window?: number
          dedupe_pct?: number
          id?: string
          max_pct?: number
          min_pct?: number
          prev_state?: string | null
          samples?: number
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_actions: {
        Row: {
          action_key: string
          created_at: string
          id: string
          module: string
          niche_slug: string
          payload: Json
          session_id: string
          user_id: string | null
          weight: number
        }
        Insert: {
          action_key: string
          created_at?: string
          id?: string
          module: string
          niche_slug: string
          payload?: Json
          session_id: string
          user_id?: string | null
          weight?: number
        }
        Update: {
          action_key?: string
          created_at?: string
          id?: string
          module?: string
          niche_slug?: string
          payload?: Json
          session_id?: string
          user_id?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "demo_actions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "demo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_environments: {
        Row: {
          active: boolean
          capture_lead_when: string
          created_at: string
          description: string | null
          id: string
          name: string
          niche: string
          seed_volume: string
          template_company_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          capture_lead_when?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          niche: string
          seed_volume?: string
          template_company_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          capture_lead_when?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          niche?: string
          seed_volume?: string
          template_company_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_environments_template_company_id_fkey"
            columns: ["template_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_environments_template_company_id_fkey"
            columns: ["template_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "demo_environments_template_company_id_fkey"
            columns: ["template_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "demo_environments_template_company_id_fkey"
            columns: ["template_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      demo_leads: {
        Row: {
          created_at: string
          email: string
          environment_id: string | null
          id: string
          marketing_lead_id: string | null
          name: string
          niche: string | null
          notes: string | null
          origin: string
          phone: string
          selected_modules: string[]
          session_id: string | null
          status: string
          tags: string[]
          updated_at: string
          viewed_modules: string[]
        }
        Insert: {
          created_at?: string
          email: string
          environment_id?: string | null
          id?: string
          marketing_lead_id?: string | null
          name: string
          niche?: string | null
          notes?: string | null
          origin?: string
          phone: string
          selected_modules?: string[]
          session_id?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          viewed_modules?: string[]
        }
        Update: {
          created_at?: string
          email?: string
          environment_id?: string | null
          id?: string
          marketing_lead_id?: string | null
          name?: string
          niche?: string | null
          notes?: string | null
          origin?: string
          phone?: string
          selected_modules?: string[]
          session_id?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          viewed_modules?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "demo_leads_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "demo_environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_leads_marketing_lead_id_fkey"
            columns: ["marketing_lead_id"]
            isOneToOne: false
            referencedRelation: "marketing_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_leads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "demo_visit_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_resto_leads: {
        Row: {
          birthdate: string | null
          created_at: string
          id: string
          is_demo: boolean
          name: string
          preferences: Json
          scenario_id: string
          session_id: string | null
          whatsapp: string
        }
        Insert: {
          birthdate?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          preferences?: Json
          scenario_id: string
          session_id?: string | null
          whatsapp: string
        }
        Update: {
          birthdate?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          preferences?: Json
          scenario_id?: string
          session_id?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_resto_leads_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "demo_resto_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_resto_leads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "demo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_resto_menu_items: {
        Row: {
          category: string
          description: string | null
          harmony: string | null
          id: string
          is_bestseller: boolean
          name: string
          price_cents: number
          scenario_id: string
          sort_order: number
          tags: string[]
        }
        Insert: {
          category: string
          description?: string | null
          harmony?: string | null
          id?: string
          is_bestseller?: boolean
          name: string
          price_cents: number
          scenario_id: string
          sort_order?: number
          tags?: string[]
        }
        Update: {
          category?: string
          description?: string | null
          harmony?: string | null
          id?: string
          is_bestseller?: boolean
          name?: string
          price_cents?: number
          scenario_id?: string
          sort_order?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "demo_resto_menu_items_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "demo_resto_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_resto_qr_codes: {
        Row: {
          id: string
          instruction: string
          kind: string
          scenario_id: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          id?: string
          instruction: string
          kind: string
          scenario_id: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          id?: string
          instruction?: string
          kind?: string
          scenario_id?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_resto_qr_codes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "demo_resto_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_resto_scenarios: {
        Row: {
          created_at: string
          id: string
          name: string
          primary_color: string
          seed_version: number
          slug: string
          tagline: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          primary_color?: string
          seed_version?: number
          slug: string
          tagline?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          primary_color?: string
          seed_version?: number
          slug?: string
          tagline?: string | null
        }
        Relationships: []
      }
      demo_resto_vouchers: {
        Row: {
          audience: string | null
          channel: string | null
          code: string
          id: string
          name: string
          rule: string
          scenario_id: string
          status: string
          validity_label: string | null
        }
        Insert: {
          audience?: string | null
          channel?: string | null
          code: string
          id?: string
          name: string
          rule: string
          scenario_id: string
          status?: string
          validity_label?: string | null
        }
        Update: {
          audience?: string | null
          channel?: string | null
          code?: string
          id?: string
          name?: string
          rule?: string
          scenario_id?: string
          status?: string
          validity_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_resto_vouchers_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "demo_resto_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_sessions: {
        Row: {
          company_id: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          ip: unknown
          metadata: Json
          niche_slug: string
          score: number | null
          started_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip?: unknown
          metadata?: Json
          niche_slug: string
          score?: number | null
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip?: unknown
          metadata?: Json
          niche_slug?: string
          score?: number | null
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "demo_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "demo_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      demo_survey_responses: {
        Row: {
          created_at: string
          email: string
          id: string
          lead_id: string | null
          message: string
          name: string
          plan_interest: string | null
          source_path: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          lead_id?: string | null
          message: string
          name: string
          plan_interest?: string | null
          source_path?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lead_id?: string | null
          message?: string
          name?: string
          plan_interest?: string | null
          source_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_survey_responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "demo_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_visit_sessions: {
        Row: {
          abandoned: boolean
          attempted_contract: boolean
          converted_lead_id: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          environment_id: string | null
          id: string
          ip_hash: string | null
          niche: string
          selected_modules: string[]
          started_at: string
          user_agent: string | null
          viewed_modules: string[]
        }
        Insert: {
          abandoned?: boolean
          attempted_contract?: boolean
          converted_lead_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          environment_id?: string | null
          id?: string
          ip_hash?: string | null
          niche: string
          selected_modules?: string[]
          started_at?: string
          user_agent?: string | null
          viewed_modules?: string[]
        }
        Update: {
          abandoned?: boolean
          attempted_contract?: boolean
          converted_lead_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          environment_id?: string | null
          id?: string
          ip_hash?: string | null
          niche?: string
          selected_modules?: string[]
          started_at?: string
          user_agent?: string | null
          viewed_modules?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "demo_visit_sessions_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "demo_environments"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_legal_acceptances: {
        Row: {
          accepted_at: string
          company_id: string | null
          context: string
          document_hash: string
          document_id: string
          document_kind: string
          document_version: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          company_id?: string | null
          context: string
          document_hash: string
          document_id: string
          document_kind: string
          document_version: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          company_id?: string | null
          context?: string
          document_hash?: string
          document_id?: string
          document_kind?: string
          document_version?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eco_legal_acceptances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_legal_acceptances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_legal_acceptances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_legal_acceptances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_legal_acceptances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "eco_legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_legal_documents: {
        Row: {
          audience: string
          body_md: string
          created_at: string
          effective_at: string
          id: string
          is_current: boolean
          kind: string
          niche: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          audience?: string
          body_md: string
          created_at?: string
          effective_at?: string
          id?: string
          is_current?: boolean
          kind: string
          niche?: string | null
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          audience?: string
          body_md?: string
          created_at?: string
          effective_at?: string
          id?: string
          is_current?: boolean
          kind?: string
          niche?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      eco_marketplace_engagements: {
        Row: {
          completed_at: string | null
          contract_id: string | null
          created_at: string
          gmv_cents: number
          id: string
          intermediation_fee_bps: number
          intermediation_fee_cents: number
          nda_id: string | null
          provider_company_id: string
          quote_id: string
          request_id: string
          requester_company_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string
          gmv_cents: number
          id?: string
          intermediation_fee_bps?: number
          intermediation_fee_cents?: number
          nda_id?: string | null
          provider_company_id: string
          quote_id: string
          request_id: string
          requester_company_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string
          gmv_cents?: number
          id?: string
          intermediation_fee_bps?: number
          intermediation_fee_cents?: number
          nda_id?: string | null
          provider_company_id?: string
          quote_id?: string
          request_id?: string
          requester_company_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eco_marketplace_engagements_provider_company_id_fkey"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_provider_company_id_fkey"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_provider_company_id_fkey"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_provider_company_id_fkey"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "eco_marketplace_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "eco_marketplace_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_requester_company_id_fkey"
            columns: ["requester_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_requester_company_id_fkey"
            columns: ["requester_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_requester_company_id_fkey"
            columns: ["requester_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_requester_company_id_fkey"
            columns: ["requester_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      eco_marketplace_listings: {
        Row: {
          audience: string
          company_id: string
          coverage_area: string | null
          created_at: string
          currency: string
          description: string
          id: string
          max_price_cents: number | null
          min_price_cents: number | null
          niche: string
          pricing_model: string
          search_vector: unknown
          status: string
          subniche: string | null
          tags: string[] | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          audience?: string
          company_id: string
          coverage_area?: string | null
          created_at?: string
          currency?: string
          description: string
          id?: string
          max_price_cents?: number | null
          min_price_cents?: number | null
          niche: string
          pricing_model?: string
          search_vector?: unknown
          status?: string
          subniche?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          audience?: string
          company_id?: string
          coverage_area?: string | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          max_price_cents?: number | null
          min_price_cents?: number | null
          niche?: string
          pricing_model?: string
          search_vector?: unknown
          status?: string
          subniche?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "eco_marketplace_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      eco_marketplace_quotes: {
        Row: {
          amount_cents: number
          attachments: Json | null
          created_at: string
          currency: string
          delivery_days: number | null
          expires_at: string | null
          id: string
          message: string | null
          provider_company_id: string
          provider_user_id: string
          request_id: string
          scope_details: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          attachments?: Json | null
          created_at?: string
          currency?: string
          delivery_days?: number | null
          expires_at?: string | null
          id?: string
          message?: string | null
          provider_company_id: string
          provider_user_id: string
          request_id: string
          scope_details: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          attachments?: Json | null
          created_at?: string
          currency?: string
          delivery_days?: number | null
          expires_at?: string | null
          id?: string
          message?: string | null
          provider_company_id?: string
          provider_user_id?: string
          request_id?: string
          scope_details?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eco_marketplace_quotes_provider_company_id_fkey"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_quotes_provider_company_id_fkey"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_quotes_provider_company_id_fkey"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_quotes_provider_company_id_fkey"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "eco_marketplace_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      eco_marketplace_referrals: {
        Row: {
          context_note: string | null
          converted_engagement_id: string | null
          created_at: string
          id: string
          referred_company_id: string
          referrer_company_id: string
          referrer_user_id: string
          reward_cents: number | null
          status: string
          target_company_id: string | null
          target_email: string | null
          updated_at: string
        }
        Insert: {
          context_note?: string | null
          converted_engagement_id?: string | null
          created_at?: string
          id?: string
          referred_company_id: string
          referrer_company_id: string
          referrer_user_id: string
          reward_cents?: number | null
          status?: string
          target_company_id?: string | null
          target_email?: string | null
          updated_at?: string
        }
        Update: {
          context_note?: string | null
          converted_engagement_id?: string | null
          created_at?: string
          id?: string
          referred_company_id?: string
          referrer_company_id?: string
          referrer_user_id?: string
          reward_cents?: number | null
          status?: string
          target_company_id?: string | null
          target_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eco_marketplace_referrals_converted_engagement_id_fkey"
            columns: ["converted_engagement_id"]
            isOneToOne: false
            referencedRelation: "eco_marketplace_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_referred_company_id_fkey"
            columns: ["referred_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_referred_company_id_fkey"
            columns: ["referred_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_referred_company_id_fkey"
            columns: ["referred_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_referred_company_id_fkey"
            columns: ["referred_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_referrer_company_id_fkey"
            columns: ["referrer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_referrer_company_id_fkey"
            columns: ["referrer_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_referrer_company_id_fkey"
            columns: ["referrer_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_referrer_company_id_fkey"
            columns: ["referrer_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_referrals_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      eco_marketplace_requests: {
        Row: {
          budget_cents: number | null
          contract_required: boolean
          created_at: string
          deadline: string | null
          id: string
          invited_providers: string[] | null
          listing_id: string | null
          nda_required: boolean
          requester_company_id: string
          requester_user_id: string
          scope: string
          status: string
          target_niche: string | null
          title: string
          updated_at: string
        }
        Insert: {
          budget_cents?: number | null
          contract_required?: boolean
          created_at?: string
          deadline?: string | null
          id?: string
          invited_providers?: string[] | null
          listing_id?: string | null
          nda_required?: boolean
          requester_company_id: string
          requester_user_id: string
          scope: string
          status?: string
          target_niche?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          budget_cents?: number | null
          contract_required?: boolean
          created_at?: string
          deadline?: string | null
          id?: string
          invited_providers?: string[] | null
          listing_id?: string | null
          nda_required?: boolean
          requester_company_id?: string
          requester_user_id?: string
          scope?: string
          status?: string
          target_niche?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eco_marketplace_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "eco_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_requests_requester_company_id_fkey"
            columns: ["requester_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_requests_requester_company_id_fkey"
            columns: ["requester_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_requests_requester_company_id_fkey"
            columns: ["requester_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_requests_requester_company_id_fkey"
            columns: ["requester_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      eco_marketplace_reviews: {
        Row: {
          comment: string | null
          created_at: string
          engagement_id: string
          id: string
          rating: number
          rating_communication: number | null
          rating_deadline: number | null
          rating_price: number | null
          rating_quality: number | null
          reviewed_company_id: string
          reviewer_company_id: string
          reviewer_user_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          engagement_id: string
          id?: string
          rating: number
          rating_communication?: number | null
          rating_deadline?: number | null
          rating_price?: number | null
          rating_quality?: number | null
          reviewed_company_id: string
          reviewer_company_id: string
          reviewer_user_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          engagement_id?: string
          id?: string
          rating?: number
          rating_communication?: number | null
          rating_deadline?: number | null
          rating_price?: number | null
          rating_quality?: number | null
          reviewed_company_id?: string
          reviewer_company_id?: string
          reviewer_user_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "eco_marketplace_reviews_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "eco_marketplace_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_reviews_reviewed_company_id_fkey"
            columns: ["reviewed_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_reviews_reviewed_company_id_fkey"
            columns: ["reviewed_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_reviews_reviewed_company_id_fkey"
            columns: ["reviewed_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_reviews_reviewed_company_id_fkey"
            columns: ["reviewed_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_reviews_reviewer_company_id_fkey"
            columns: ["reviewer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_reviews_reviewer_company_id_fkey"
            columns: ["reviewer_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_reviews_reviewer_company_id_fkey"
            columns: ["reviewer_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_reviews_reviewer_company_id_fkey"
            columns: ["reviewer_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ecosystem_reviews: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          id: string
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          stars: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ecosystem_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ecosystem_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      educ_leads: {
        Row: {
          campanha: string | null
          company_id: string | null
          consultor_id: string | null
          created_at: string
          curso_interesse: string | null
          email: string | null
          id: string
          nome: string
          origem: string | null
          polo_id: string | null
          stage: string
          telefone: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          campanha?: string | null
          company_id?: string | null
          consultor_id?: string | null
          created_at?: string
          curso_interesse?: string | null
          email?: string | null
          id?: string
          nome: string
          origem?: string | null
          polo_id?: string | null
          stage?: string
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          campanha?: string | null
          company_id?: string | null
          consultor_id?: string | null
          created_at?: string
          curso_interesse?: string | null
          email?: string | null
          id?: string
          nome?: string
          origem?: string | null
          polo_id?: string | null
          stage?: string
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "educ_leads_polo_id_fkey"
            columns: ["polo_id"]
            isOneToOne: false
            referencedRelation: "educ_polos"
            referencedColumns: ["id"]
          },
        ]
      }
      educ_matriculas: {
        Row: {
          aluno_id: string | null
          company_id: string | null
          created_at: string
          curso: string
          evasao_em: string | null
          id: string
          lead_id: string | null
          matriculado_em: string
          polo_id: string | null
          status: string
          status_financeiro: string
          updated_at: string
          valor_mensalidade: number | null
        }
        Insert: {
          aluno_id?: string | null
          company_id?: string | null
          created_at?: string
          curso: string
          evasao_em?: string | null
          id?: string
          lead_id?: string | null
          matriculado_em?: string
          polo_id?: string | null
          status?: string
          status_financeiro?: string
          updated_at?: string
          valor_mensalidade?: number | null
        }
        Update: {
          aluno_id?: string | null
          company_id?: string | null
          created_at?: string
          curso?: string
          evasao_em?: string | null
          id?: string
          lead_id?: string | null
          matriculado_em?: string
          polo_id?: string | null
          status?: string
          status_financeiro?: string
          updated_at?: string
          valor_mensalidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "educ_matriculas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "educ_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "educ_matriculas_polo_id_fkey"
            columns: ["polo_id"]
            isOneToOne: false
            referencedRelation: "educ_polos"
            referencedColumns: ["id"]
          },
        ]
      }
      educ_polos: {
        Row: {
          bairro: string | null
          capacidade: number | null
          cidade: string | null
          codigo: string
          company_id: string | null
          created_at: string
          cursos_ofertados: string[]
          email: string | null
          estado: string | null
          id: string
          meta_matriculas_mes: number | null
          nome: string
          observacoes: string | null
          responsavel: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          capacidade?: number | null
          cidade?: string | null
          codigo: string
          company_id?: string | null
          created_at?: string
          cursos_ofertados?: string[]
          email?: string | null
          estado?: string | null
          id?: string
          meta_matriculas_mes?: number | null
          nome: string
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          capacidade?: number | null
          cidade?: string | null
          codigo?: string
          company_id?: string | null
          created_at?: string
          cursos_ofertados?: string[]
          email?: string | null
          estado?: string | null
          id?: string
          meta_matriculas_mes?: number | null
          nome?: string
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      educ_role_assignments: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          polo_id: string | null
          role: Database["public"]["Enums"]["educ_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          polo_id?: string | null
          role: Database["public"]["Enums"]["educ_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          polo_id?: string | null
          role?: Database["public"]["Enums"]["educ_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "educ_role_assignments_polo_id_fkey"
            columns: ["polo_id"]
            isOneToOne: false
            referencedRelation: "educ_polos"
            referencedColumns: ["id"]
          },
        ]
      }
      educ_white_label_branding: {
        Row: {
          ativo: boolean
          company_id: string | null
          cor_fundo: string
          cor_primaria: string
          cor_secundaria: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          dominio_personalizado: string | null
          favicon_url: string | null
          hero_subtitulo: string | null
          hero_titulo: string | null
          id: string
          logo_url: string | null
          nome_exibicao: string
          rodape_texto: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          company_id?: string | null
          cor_fundo?: string
          cor_primaria?: string
          cor_secundaria?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          dominio_personalizado?: string | null
          favicon_url?: string | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          id?: string
          logo_url?: string | null
          nome_exibicao: string
          rodape_texto?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          company_id?: string | null
          cor_fundo?: string
          cor_primaria?: string
          cor_secundaria?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          dominio_personalizado?: string | null
          favicon_url?: string | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          id?: string
          logo_url?: string | null
          nome_exibicao?: string
          rodape_texto?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ehr_documents: {
        Row: {
          ai_status: string
          ai_summary: string | null
          category: string
          company_id: string
          created_at: string
          id: string
          mime_type: string | null
          notes: string | null
          occurred_at: string | null
          record_id: string
          requires_review: boolean
          review_status: string
          size_bytes: number | null
          source: string
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
          visible_to_patient: boolean
        }
        Insert: {
          ai_status?: string
          ai_summary?: string | null
          category?: string
          company_id: string
          created_at?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          occurred_at?: string | null
          record_id: string
          requires_review?: boolean
          review_status?: string
          size_bytes?: number | null
          source?: string
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          visible_to_patient?: boolean
        }
        Update: {
          ai_status?: string
          ai_summary?: string | null
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          occurred_at?: string | null
          record_id?: string
          requires_review?: boolean
          review_status?: string
          size_bytes?: number | null
          source?: string
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          visible_to_patient?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ehr_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_documents_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "ehr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      ehr_evolutions: {
        Row: {
          chief_complaint: string | null
          clinical_history: string | null
          company_id: string
          conduct: string | null
          created_at: string
          created_by: string | null
          doctor_name: string | null
          doctor_user_id: string | null
          exams_requested: string | null
          follow_up: string | null
          hypothesis: string | null
          id: string
          notes: string | null
          occurred_at: string
          physical_exam: string | null
          prescription: string | null
          record_id: string
          released_to_patient: boolean
          signed_at: string | null
          updated_at: string
        }
        Insert: {
          chief_complaint?: string | null
          clinical_history?: string | null
          company_id: string
          conduct?: string | null
          created_at?: string
          created_by?: string | null
          doctor_name?: string | null
          doctor_user_id?: string | null
          exams_requested?: string | null
          follow_up?: string | null
          hypothesis?: string | null
          id?: string
          notes?: string | null
          occurred_at?: string
          physical_exam?: string | null
          prescription?: string | null
          record_id: string
          released_to_patient?: boolean
          signed_at?: string | null
          updated_at?: string
        }
        Update: {
          chief_complaint?: string | null
          clinical_history?: string | null
          company_id?: string
          conduct?: string | null
          created_at?: string
          created_by?: string | null
          doctor_name?: string | null
          doctor_user_id?: string | null
          exams_requested?: string | null
          follow_up?: string | null
          hypothesis?: string | null
          id?: string
          notes?: string | null
          occurred_at?: string
          physical_exam?: string | null
          prescription?: string | null
          record_id?: string
          released_to_patient?: boolean
          signed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ehr_evolutions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_evolutions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_evolutions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_evolutions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_evolutions_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "ehr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      ehr_opinions: {
        Row: {
          company_id: string
          conduct: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          doctor_name: string | null
          doctor_user_id: string | null
          document_id: string | null
          evolution_id: string | null
          id: string
          internal_notes: string | null
          interpretation: string | null
          record_id: string
          released_to_patient: boolean
          request_followup: boolean
          request_new_exam: boolean
          summary: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          conduct?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          doctor_name?: string | null
          doctor_user_id?: string | null
          document_id?: string | null
          evolution_id?: string | null
          id?: string
          internal_notes?: string | null
          interpretation?: string | null
          record_id: string
          released_to_patient?: boolean
          request_followup?: boolean
          request_new_exam?: boolean
          summary?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          conduct?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          doctor_name?: string | null
          doctor_user_id?: string | null
          document_id?: string | null
          evolution_id?: string | null
          id?: string
          internal_notes?: string | null
          interpretation?: string | null
          record_id?: string
          released_to_patient?: boolean
          request_followup?: boolean
          request_new_exam?: boolean
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ehr_opinions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_opinions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_opinions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_opinions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_opinions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ehr_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_opinions_evolution_id_fkey"
            columns: ["evolution_id"]
            isOneToOne: false
            referencedRelation: "ehr_evolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_opinions_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "ehr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      ehr_records: {
        Row: {
          alerts: string | null
          allergies: string | null
          chief_complaint: string | null
          company_id: string
          created_at: string
          created_by: string | null
          current_medications: string | null
          customer_id: string
          family_history: string | null
          id: string
          medical_history: string | null
          notes: string | null
          previous_diagnoses: string | null
          record_number: string | null
          responsible_user_id: string | null
          status: string
          surgeries: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          alerts?: string | null
          allergies?: string | null
          chief_complaint?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          current_medications?: string | null
          customer_id: string
          family_history?: string | null
          id?: string
          medical_history?: string | null
          notes?: string | null
          previous_diagnoses?: string | null
          record_number?: string | null
          responsible_user_id?: string | null
          status?: string
          surgeries?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          alerts?: string | null
          allergies?: string | null
          chief_complaint?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_medications?: string | null
          customer_id?: string
          family_history?: string | null
          id?: string
          medical_history?: string | null
          notes?: string | null
          previous_diagnoses?: string | null
          record_number?: string | null
          responsible_user_id?: string | null
          status?: string
          surgeries?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ehr_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ehr_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_records_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      evt_checkins: {
        Row: {
          checked_in_at: string
          company_id: string
          created_at: string
          event_id: string
          gate: string | null
          id: string
          notes: string | null
          operator_user_id: string | null
          ticket_id: string
        }
        Insert: {
          checked_in_at?: string
          company_id: string
          created_at?: string
          event_id: string
          gate?: string | null
          id?: string
          notes?: string | null
          operator_user_id?: string | null
          ticket_id: string
        }
        Update: {
          checked_in_at?: string
          company_id?: string
          created_at?: string
          event_id?: string
          gate?: string | null
          id?: string
          notes?: string | null
          operator_user_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evt_checkins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evt_checkins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_checkins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_checkins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "evt_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evt_checkins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "evt_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      evt_events: {
        Row: {
          capacity: number | null
          city: string | null
          company_id: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          is_published: boolean
          organizer_contact: string | null
          organizer_name: string | null
          refund_policy: string | null
          slug: string
          starts_at: string
          state: string | null
          status: string
          title: string
          transfer_deadline_hours: number | null
          transfer_fee_cents: number
          transfer_policy: string
          transfer_requires_document: boolean
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          company_id: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_published?: boolean
          organizer_contact?: string | null
          organizer_name?: string | null
          refund_policy?: string | null
          slug: string
          starts_at: string
          state?: string | null
          status?: string
          title: string
          transfer_deadline_hours?: number | null
          transfer_fee_cents?: number
          transfer_policy?: string
          transfer_requires_document?: boolean
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string | null
          company_id?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_published?: boolean
          organizer_contact?: string | null
          organizer_name?: string | null
          refund_policy?: string | null
          slug?: string
          starts_at?: string
          state?: string | null
          status?: string
          title?: string
          transfer_deadline_hours?: number | null
          transfer_fee_cents?: number
          transfer_policy?: string
          transfer_requires_document?: boolean
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evt_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evt_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      evt_ticket_transfers: {
        Row: {
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          decided_at: string | null
          fee_cents: number
          from_email: string
          from_name: string
          id: string
          reason: string | null
          status: string
          ticket_id: string
          to_document: string | null
          to_email: string
          to_name: string
          to_phone: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          fee_cents?: number
          from_email: string
          from_name: string
          id?: string
          reason?: string | null
          status?: string
          ticket_id: string
          to_document?: string | null
          to_email: string
          to_name: string
          to_phone?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          fee_cents?: number
          from_email?: string
          from_name?: string
          id?: string
          reason?: string | null
          status?: string
          ticket_id?: string
          to_document?: string | null
          to_email?: string
          to_name?: string
          to_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evt_ticket_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evt_ticket_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_ticket_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_ticket_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_ticket_transfers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "evt_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      evt_ticket_types: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          name: string
          per_person_limit: number
          price: number
          quantity: number
          quantity_sold: number
          sale_ends_at: string | null
          sale_starts_at: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          name: string
          per_person_limit?: number
          price?: number
          quantity: number
          quantity_sold?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
          per_person_limit?: number
          price?: number
          quantity?: number
          quantity_sold?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evt_ticket_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evt_ticket_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_ticket_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_ticket_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "evt_events"
            referencedColumns: ["id"]
          },
        ]
      }
      evt_tickets: {
        Row: {
          buyer_doc: string | null
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          cancelled_at: string | null
          code: string
          company_id: string
          created_at: string
          customer_id: string | null
          event_id: string
          holder_email: string
          holder_name: string
          holder_phone: string | null
          holder_user_id: string | null
          id: string
          issued_at: string
          payment_reference: string | null
          price_paid: number
          qr_token: string
          status: string
          ticket_type_id: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          buyer_doc?: string | null
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          cancelled_at?: string | null
          code: string
          company_id: string
          created_at?: string
          customer_id?: string | null
          event_id: string
          holder_email: string
          holder_name: string
          holder_phone?: string | null
          holder_user_id?: string | null
          id?: string
          issued_at?: string
          payment_reference?: string | null
          price_paid?: number
          qr_token: string
          status?: string
          ticket_type_id: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          buyer_doc?: string | null
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          cancelled_at?: string | null
          code?: string
          company_id?: string
          created_at?: string
          customer_id?: string | null
          event_id?: string
          holder_email?: string
          holder_name?: string
          holder_phone?: string | null
          holder_user_id?: string | null
          id?: string
          issued_at?: string
          payment_reference?: string | null
          price_paid?: number
          qr_token?: string
          status?: string
          ticket_type_id?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evt_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evt_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "evt_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evt_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "evt_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evt_tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "evt_ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_accounts: {
        Row: {
          company_id: string
          created_at: string
          current_balance: number
          id: string
          is_active: boolean
          name: string
          opening_balance: number
          type: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          name: string
          opening_balance?: number
          type: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          name?: string
          opening_balance?: number
          type?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_accounts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_categories: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      fin_commissions: {
        Row: {
          amount: number
          base_amount: number
          beneficiary_name: string
          beneficiary_user_id: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          percentage: number
          reference_id: string
          reference_type: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          base_amount: number
          beneficiary_name: string
          beneficiary_user_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          percentage?: number
          reference_id: string
          reference_type: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          base_amount?: number
          beneficiary_name?: string
          beneficiary_user_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          percentage?: number
          reference_id?: string
          reference_type?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_payment_methods: {
        Row: {
          code: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          provider: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          provider?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      fin_payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          id: string
          provider: string
          provider_payment_id: string | null
          raw_payload: Json | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          id?: string
          provider: string
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          provider?: string
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_doc: string | null
          customer_name: string | null
          description: string
          due_date: string
          fee: number
          id: string
          kind: string
          net_amount: number | null
          notes: string | null
          paid_at: string | null
          payment_method_id: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_doc?: string | null
          customer_name?: string | null
          description: string
          due_date: string
          fee?: number
          id?: string
          kind: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_doc?: string | null
          customer_name?: string | null
          description?: string
          due_date?: string
          fee?: number
          id?: string
          kind?: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fin_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "fin_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_email_runs: {
        Row: {
          attempt: number
          created_at: string
          csv_path: string | null
          email_mode: string
          error_message: string | null
          id: string
          message_id: string | null
          month: number
          recipient: string
          signed_url_expires_at: string | null
          status: string
          triggered_by: string
          updated_at: string
          user_id: string | null
          year: number
        }
        Insert: {
          attempt?: number
          created_at?: string
          csv_path?: string | null
          email_mode?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          month: number
          recipient: string
          signed_url_expires_at?: string | null
          status: string
          triggered_by: string
          updated_at?: string
          user_id?: string | null
          year: number
        }
        Update: {
          attempt?: number
          created_at?: string
          csv_path?: string | null
          email_mode?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          month?: number
          recipient?: string
          signed_url_expires_at?: string | null
          status?: string
          triggered_by?: string
          updated_at?: string
          user_id?: string | null
          year?: number
        }
        Relationships: []
      }
      generated_page_versions: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          page_id: string
          status: string
        }
        Insert: {
          content: Json
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          page_id: string
          status?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          page_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "generated_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_pages: {
        Row: {
          company_id: string | null
          content: Json
          created_at: string
          created_by: string | null
          generation_id: string | null
          id: string
          name: string
          prompt_used: string | null
          slug: string
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          generation_id?: string | null
          id?: string
          name: string
          prompt_used?: string | null
          slug: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          generation_id?: string | null
          id?: string
          name?: string
          prompt_used?: string | null
          slug?: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "generated_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "generated_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "generated_pages_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_project_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_pages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "site_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_applications: {
        Row: {
          affected_count: number
          applied_at: string
          applied_by: string
          applied_by_email: string | null
          created_at: string
          id: string
          kind: string
          payload: Json
          scope: string
          target_id: string | null
        }
        Insert: {
          affected_count?: number
          applied_at?: string
          applied_by: string
          applied_by_email?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          scope: string
          target_id?: string | null
        }
        Update: {
          affected_count?: number
          applied_at?: string
          applied_by?: string
          applied_by_email?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          scope?: string
          target_id?: string | null
        }
        Relationships: []
      }
      inv_categories: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      inv_movements: {
        Row: {
          company_id: string
          created_at: string
          id: string
          kind: string
          notes: string | null
          performed_by: string | null
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          unit_cost: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          kind: string
          notes?: string | null
          performed_by?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          unit_cost?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          performed_by?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inv_products"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_products: {
        Row: {
          allow_negative: boolean
          barcode: string | null
          category_id: string | null
          company_id: string
          cost_price: number
          created_at: string
          current_stock: number
          description: string | null
          id: string
          is_active: boolean
          max_stock: number | null
          min_stock: number
          name: string
          sale_price: number
          sku: string | null
          supplier_id: string | null
          track_stock: boolean
          unit: string
          updated_at: string
        }
        Insert: {
          allow_negative?: boolean
          barcode?: string | null
          category_id?: string | null
          company_id: string
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_stock?: number | null
          min_stock?: number
          name: string
          sale_price?: number
          sku?: string | null
          supplier_id?: string | null
          track_stock?: boolean
          unit?: string
          updated_at?: string
        }
        Update: {
          allow_negative?: boolean
          barcode?: string | null
          category_id?: string | null
          company_id?: string
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_stock?: number | null
          min_stock?: number
          name?: string
          sale_price?: number
          sku?: string | null
          supplier_id?: string | null
          track_stock?: boolean
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inv_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "inv_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_suppliers: {
        Row: {
          company_id: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          legal_name: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "inv_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      lgpd_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          revoked_at: string | null
          terms_version: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          terms_version?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          terms_version?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketing_leads: {
        Row: {
          answers: Json | null
          assigned_to: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          message: string | null
          name: string | null
          notes: string | null
          page_url: string | null
          phone: string | null
          recommended_modules: string[] | null
          recommended_plan: string | null
          source: string
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          answers?: Json | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          message?: string | null
          name?: string | null
          notes?: string | null
          page_url?: string | null
          phone?: string | null
          recommended_modules?: string[] | null
          recommended_plan?: string | null
          source: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          answers?: Json | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          message?: string | null
          name?: string | null
          notes?: string | null
          page_url?: string | null
          phone?: string | null
          recommended_modules?: string[] | null
          recommended_plan?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      marocas_apartments: {
        Row: {
          address: string | null
          amenities: Json | null
          area_m2: number | null
          bathrooms: number | null
          bedrooms: number | null
          building: string | null
          capacity: number | null
          city: string | null
          code: string
          cover_photo_url: string | null
          created_at: string
          daily_rate: number | null
          id: string
          marocas_commission_percent: number | null
          notes: string | null
          owner_id: string
          photos: Json | null
          state: string | null
          status: Database["public"]["Enums"]["marocas_apartment_status"]
          title: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          capacity?: number | null
          city?: string | null
          code: string
          cover_photo_url?: string | null
          created_at?: string
          daily_rate?: number | null
          id?: string
          marocas_commission_percent?: number | null
          notes?: string | null
          owner_id: string
          photos?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["marocas_apartment_status"]
          title: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          capacity?: number | null
          city?: string | null
          code?: string
          cover_photo_url?: string | null
          created_at?: string
          daily_rate?: number | null
          id?: string
          marocas_commission_percent?: number | null
          notes?: string | null
          owner_id?: string
          photos?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["marocas_apartment_status"]
          title?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marocas_apartments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "marocas_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      marocas_maintenance_quotes: {
        Row: {
          amount: number
          created_at: string
          estimated_hours: number | null
          id: string
          notes: string | null
          professional_id: string
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          professional_id: string
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          professional_id?: string
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marocas_maintenance_quotes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "marocas_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marocas_maintenance_quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "marocas_maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      marocas_maintenance_requests: {
        Row: {
          apartment_id: string
          approved_quote_id: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          opened_by: string | null
          photos: Json | null
          priority: Database["public"]["Enums"]["marocas_maintenance_priority"]
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          apartment_id: string
          approved_quote_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          opened_by?: string | null
          photos?: Json | null
          priority?: Database["public"]["Enums"]["marocas_maintenance_priority"]
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          approved_quote_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          opened_by?: string | null
          photos?: Json | null
          priority?: Database["public"]["Enums"]["marocas_maintenance_priority"]
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marocas_maintenance_requests_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "marocas_apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      marocas_owner_statements: {
        Row: {
          apartment_id: string
          breakdown: Json | null
          created_at: string
          expenses: number
          gross_revenue: number
          id: string
          marocas_fee: number
          net_payout: number
          owner_id: string
          paid_at: string | null
          pix_txid: string | null
          reference_month: string
          status: Database["public"]["Enums"]["marocas_payout_status"]
          updated_at: string
        }
        Insert: {
          apartment_id: string
          breakdown?: Json | null
          created_at?: string
          expenses?: number
          gross_revenue?: number
          id?: string
          marocas_fee?: number
          net_payout?: number
          owner_id: string
          paid_at?: string | null
          pix_txid?: string | null
          reference_month: string
          status?: Database["public"]["Enums"]["marocas_payout_status"]
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          breakdown?: Json | null
          created_at?: string
          expenses?: number
          gross_revenue?: number
          id?: string
          marocas_fee?: number
          net_payout?: number
          owner_id?: string
          paid_at?: string | null
          pix_txid?: string | null
          reference_month?: string
          status?: Database["public"]["Enums"]["marocas_payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marocas_owner_statements_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "marocas_apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marocas_owner_statements_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "marocas_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      marocas_owners: {
        Row: {
          bank_info: Json | null
          created_at: string
          document: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          pix_key: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bank_info?: Json | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bank_info?: Json | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marocas_professionals: {
        Row: {
          active: boolean
          created_at: string
          document: string | null
          email: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          notes: string | null
          per_service_rate: number | null
          phone: string | null
          pix_key: string | null
          rating: number | null
          role: Database["public"]["Enums"]["marocas_professional_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          document?: string | null
          email?: string | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          per_service_rate?: number | null
          phone?: string | null
          pix_key?: string | null
          rating?: number | null
          role: Database["public"]["Enums"]["marocas_professional_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          document?: string | null
          email?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          per_service_rate?: number | null
          phone?: string | null
          pix_key?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["marocas_professional_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marocas_report_runs: {
        Row: {
          channels: string[]
          created_at: string
          done: number
          error: string | null
          id: string
          late: number
          period: string
          range_from: string
          range_to: string
          schedule_id: string | null
          status: string
          total: number
          triggered_by: string
          user_id: string | null
        }
        Insert: {
          channels?: string[]
          created_at?: string
          done?: number
          error?: string | null
          id?: string
          late?: number
          period: string
          range_from: string
          range_to: string
          schedule_id?: string | null
          status: string
          total?: number
          triggered_by?: string
          user_id?: string | null
        }
        Update: {
          channels?: string[]
          created_at?: string
          done?: number
          error?: string | null
          id?: string
          late?: number
          period?: string
          range_from?: string
          range_to?: string
          schedule_id?: string | null
          status?: string
          total?: number
          triggered_by?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marocas_report_runs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "marocas_report_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      marocas_report_schedules: {
        Row: {
          channels: string[]
          created_at: string
          enabled: boolean
          hour: number
          id: string
          period: string
          updated_at: string
          user_id: string
          weekday: number | null
        }
        Insert: {
          channels?: string[]
          created_at?: string
          enabled?: boolean
          hour: number
          id?: string
          period: string
          updated_at?: string
          user_id: string
          weekday?: number | null
        }
        Update: {
          channels?: string[]
          created_at?: string
          enabled?: boolean
          hour?: number
          id?: string
          period?: string
          updated_at?: string
          user_id?: string
          weekday?: number | null
        }
        Relationships: []
      }
      marocas_services: {
        Row: {
          apartment_id: string
          checklist: Json | null
          completed_at: string | null
          cost: number | null
          created_at: string
          id: string
          notes: string | null
          photos_after: Json | null
          photos_before: Json | null
          priority:
            | Database["public"]["Enums"]["marocas_maintenance_priority"]
            | null
          professional_id: string | null
          scheduled_for: string
          service_type: Database["public"]["Enums"]["marocas_service_type"]
          started_at: string | null
          status: Database["public"]["Enums"]["marocas_service_status"]
          updated_at: string
        }
        Insert: {
          apartment_id: string
          checklist?: Json | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          photos_after?: Json | null
          photos_before?: Json | null
          priority?:
            | Database["public"]["Enums"]["marocas_maintenance_priority"]
            | null
          professional_id?: string | null
          scheduled_for: string
          service_type: Database["public"]["Enums"]["marocas_service_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["marocas_service_status"]
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          checklist?: Json | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          photos_after?: Json | null
          photos_before?: Json | null
          priority?:
            | Database["public"]["Enums"]["marocas_maintenance_priority"]
            | null
          professional_id?: string | null
          scheduled_for?: string
          service_type?: Database["public"]["Enums"]["marocas_service_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["marocas_service_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marocas_services_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "marocas_apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marocas_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "marocas_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      marocas_supplies: {
        Row: {
          apartment_id: string | null
          category: string
          created_at: string
          current_qty: number
          id: string
          item_name: string
          last_restocked_at: string | null
          min_qty: number
          notes: string | null
          unit: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          apartment_id?: string | null
          category: string
          created_at?: string
          current_qty?: number
          id?: string
          item_name: string
          last_restocked_at?: string | null
          min_qty?: number
          notes?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          apartment_id?: string | null
          category?: string
          created_at?: string
          current_qty?: number
          id?: string
          item_name?: string
          last_restocked_at?: string | null
          min_qty?: number
          notes?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marocas_supplies_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "marocas_apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      message_outbox: {
        Row: {
          attempts: number
          body: string
          channel: string
          company_id: string | null
          created_at: string
          event_code: string
          external_message_id: string | null
          id: string
          last_error: string | null
          max_attempts: number
          payload: Json
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          recipient_user_id: string | null
          reference_id: string | null
          reference_type: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          body: string
          channel: string
          company_id?: string | null
          created_at?: string
          event_code: string
          external_message_id?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_user_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          body?: string
          channel?: string
          company_id?: string | null
          created_at?: string
          event_code?: string
          external_message_id?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_user_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_outbox_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_outbox_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "message_outbox_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "message_outbox_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "message_outbox_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          channel: string
          company_id: string | null
          created_at: string
          event_code: string
          id: string
          is_active: boolean
          locale: string
          subject: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          body: string
          channel: string
          company_id?: string | null
          created_at?: string
          event_code: string
          id?: string
          is_active?: boolean
          locale?: string
          subject?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          body?: string
          channel?: string
          company_id?: string | null
          created_at?: string
          event_code?: string
          id?: string
          is_active?: boolean
          locale?: string
          subject?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      module_versions: {
        Row: {
          channel: string
          created_at: string
          id: string
          module_id: string
          notes: string | null
          released_at: string
          released_by: string | null
          updated_at: string
          version: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          module_id: string
          notes?: string | null
          released_at?: string
          released_by?: string | null
          updated_at?: string
          version: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          module_id?: string
          notes?: string | null
          released_at?: string
          released_by?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_versions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          allow_combo: boolean
          allow_standalone: boolean
          allow_trial: boolean
          allow_white_label: boolean
          category: string | null
          certified_at: string | null
          certified_by: string | null
          commercial_url: string | null
          created_at: string
          cta_primary: string | null
          cta_secondary: string | null
          current_version: string
          demo_url: string | null
          dependencies: string[]
          description: string | null
          description_long: string | null
          docs_url: string | null
          features: Json
          icon: string | null
          id: string
          internal_notes: string | null
          is_active: boolean
          is_core: boolean
          last_version_at: string
          limits: Json
          min_contract_days: number
          min_installments: number
          monthly_price: number
          name: string
          owner: string | null
          readiness_checklist: Json
          readiness_status: string
          segments: string[]
          setup_fee: number
          show_in_checkout: boolean
          show_in_demo: boolean
          show_in_plans: boolean
          show_on_site: boolean
          show_price: boolean
          slug: string
          sort_order: number
          status: string
          status_comercial: string
          status_tecnico: string
          updated_at: string
        }
        Insert: {
          allow_combo?: boolean
          allow_standalone?: boolean
          allow_trial?: boolean
          allow_white_label?: boolean
          category?: string | null
          certified_at?: string | null
          certified_by?: string | null
          commercial_url?: string | null
          created_at?: string
          cta_primary?: string | null
          cta_secondary?: string | null
          current_version?: string
          demo_url?: string | null
          dependencies?: string[]
          description?: string | null
          description_long?: string | null
          docs_url?: string | null
          features?: Json
          icon?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          is_core?: boolean
          last_version_at?: string
          limits?: Json
          min_contract_days?: number
          min_installments?: number
          monthly_price?: number
          name: string
          owner?: string | null
          readiness_checklist?: Json
          readiness_status?: string
          segments?: string[]
          setup_fee?: number
          show_in_checkout?: boolean
          show_in_demo?: boolean
          show_in_plans?: boolean
          show_on_site?: boolean
          show_price?: boolean
          slug: string
          sort_order?: number
          status?: string
          status_comercial?: string
          status_tecnico?: string
          updated_at?: string
        }
        Update: {
          allow_combo?: boolean
          allow_standalone?: boolean
          allow_trial?: boolean
          allow_white_label?: boolean
          category?: string | null
          certified_at?: string | null
          certified_by?: string | null
          commercial_url?: string | null
          created_at?: string
          cta_primary?: string | null
          cta_secondary?: string | null
          current_version?: string
          demo_url?: string | null
          dependencies?: string[]
          description?: string | null
          description_long?: string | null
          docs_url?: string | null
          features?: Json
          icon?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          is_core?: boolean
          last_version_at?: string
          limits?: Json
          min_contract_days?: number
          min_installments?: number
          monthly_price?: number
          name?: string
          owner?: string | null
          readiness_checklist?: Json
          readiness_status?: string
          segments?: string[]
          setup_fee?: number
          show_in_checkout?: boolean
          show_in_demo?: boolean
          show_in_plans?: boolean
          show_on_site?: boolean
          show_price?: boolean
          slug?: string
          sort_order?: number
          status?: string
          status_comercial?: string
          status_tecnico?: string
          updated_at?: string
        }
        Relationships: []
      }
      mp_buyers: {
        Row: {
          buyer_type: string
          company_id: string
          created_at: string
          delivery_address: Json | null
          display_name: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_type: string
          company_id: string
          created_at?: string
          delivery_address?: Json | null
          display_name: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_type?: string
          company_id?: string
          created_at?: string
          delivery_address?: Json | null
          display_name?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_buyers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mp_buyers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mp_buyers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mp_buyers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mp_catalog_items: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          min_order_qty: number
          name: string
          price_cents: number
          sku: string | null
          stock_qty: number | null
          supplier_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          min_order_qty?: number
          name: string
          price_cents: number
          sku?: string | null
          stock_qty?: number | null
          supplier_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          min_order_qty?: number
          name?: string
          price_cents?: number
          sku?: string | null
          stock_qty?: number | null
          supplier_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_catalog_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "mp_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_export_presets: {
        Row: {
          created_at: string
          filters: Json
          format: string
          id: string
          last_count: number | null
          last_run_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          format?: string
          id?: string
          last_count?: number | null
          last_run_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          format?: string
          id?: string
          last_count?: number | null
          last_run_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mp_fee_policies: {
        Row: {
          active: boolean
          created_at: string
          fee_pct: number
          id: string
          label: string
          niche_slug: string | null
          scope: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          fee_pct: number
          id?: string
          label: string
          niche_slug?: string | null
          scope: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          fee_pct?: number
          id?: string
          label?: string
          niche_slug?: string | null
          scope?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_fee_policies_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "mp_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_order_events: {
        Row: {
          actor_display_name: string | null
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          notes: string | null
          order_id: string
        }
        Insert: {
          actor_display_name?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          notes?: string | null
          order_id: string
        }
        Update: {
          actor_display_name?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "mp_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_order_items: {
        Row: {
          catalog_item_id: string | null
          created_at: string
          id: string
          line_total_cents: number
          name_snapshot: string
          order_id: string
          qty: number
          unit: string
          unit_price_cents: number
        }
        Insert: {
          catalog_item_id?: string | null
          created_at?: string
          id?: string
          line_total_cents: number
          name_snapshot: string
          order_id: string
          qty: number
          unit?: string
          unit_price_cents: number
        }
        Update: {
          catalog_item_id?: string | null
          created_at?: string
          id?: string
          line_total_cents?: number
          name_snapshot?: string
          order_id?: string
          qty?: number
          unit?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "mp_order_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "mp_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mp_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "mp_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_orders: {
        Row: {
          approved_at: string | null
          buyer_id: string
          completed_at: string | null
          created_at: string
          decision_notes: string | null
          fee_cents: number
          fee_pct: number
          id: string
          invoiced_at: string | null
          notes: string | null
          order_number: number
          placed_at: string
          rejected_at: string | null
          status: string
          subtotal_cents: number
          supplier_id: string
          supplier_net_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          decision_notes?: string | null
          fee_cents?: number
          fee_pct?: number
          id?: string
          invoiced_at?: string | null
          notes?: string | null
          order_number?: number
          placed_at?: string
          rejected_at?: string | null
          status?: string
          subtotal_cents?: number
          supplier_id: string
          supplier_net_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          decision_notes?: string | null
          fee_cents?: number
          fee_pct?: number
          id?: string
          invoiced_at?: string | null
          notes?: string | null
          order_number?: number
          placed_at?: string
          rejected_at?: string | null
          status?: string
          subtotal_cents?: number
          supplier_id?: string
          supplier_net_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "mp_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mp_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "mp_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_plans: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          display_order: number
          features: Json
          id: string
          interval: string
          name: string
          price_cents: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          interval?: string
          name: string
          price_cents?: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          interval?: string
          name?: string
          price_cents?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      mp_reminder_settings: {
        Row: {
          active: boolean
          id: number
          target_statuses: string[]
          threshold_hours: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          id?: number
          target_statuses?: string[]
          threshold_hours?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          id?: number
          target_statuses?: string[]
          threshold_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      mp_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          id: string
          mp_preapproval_id: string | null
          next_billing_at: string | null
          plan_id: string | null
          raw_response: Json | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          id?: string
          mp_preapproval_id?: string | null
          next_billing_at?: string | null
          plan_id?: string | null
          raw_response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          id?: string
          mp_preapproval_id?: string | null
          next_billing_at?: string | null
          plan_id?: string | null
          raw_response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mp_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mp_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_suppliers: {
        Row: {
          company_id: string
          created_at: string
          custom_fee_pct: number | null
          description: string | null
          display_name: string
          id: string
          regions_served: string[]
          status: string
          supplier_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_fee_pct?: number | null
          description?: string | null
          display_name: string
          id?: string
          regions_served?: string[]
          status?: string
          supplier_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_fee_pct?: number | null
          description?: string | null
          display_name?: string
          id?: string
          regions_served?: string[]
          status?: string
          supplier_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mp_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mp_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mp_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mp_transactions_ledger: {
        Row: {
          buyer_id: string
          fee_cents: number
          fee_pct: number
          gmv_cents: number
          id: string
          order_id: string
          period_month: string
          recorded_at: string
          supplier_id: string
          supplier_net_cents: number
        }
        Insert: {
          buyer_id: string
          fee_cents: number
          fee_pct: number
          gmv_cents: number
          id?: string
          order_id: string
          period_month: string
          recorded_at?: string
          supplier_id: string
          supplier_net_cents: number
        }
        Update: {
          buyer_id?: string
          fee_cents?: number
          fee_pct?: number
          gmv_cents?: number
          id?: string
          order_id?: string
          period_month?: string
          recorded_at?: string
          supplier_id?: string
          supplier_net_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "mp_transactions_ledger_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "mp_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mp_transactions_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "mp_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mp_transactions_ledger_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "mp_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_webhook_log: {
        Row: {
          error: string | null
          id: string
          payload: Json | null
          processed: boolean
          received_at: string
          resource_id: string | null
          topic: string | null
        }
        Insert: {
          error?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean
          received_at?: string
          resource_id?: string | null
          topic?: string | null
        }
        Update: {
          error?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean
          received_at?: string
          resource_id?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      mpago_credentials: {
        Row: {
          access_token_secret_name: string
          active: boolean
          company_id: string
          created_at: string
          environment: string
          id: string
          public_key: string
          updated_at: string
          user_id_mp: string | null
          webhook_secret_name: string | null
        }
        Insert: {
          access_token_secret_name: string
          active?: boolean
          company_id: string
          created_at?: string
          environment?: string
          id?: string
          public_key: string
          updated_at?: string
          user_id_mp?: string | null
          webhook_secret_name?: string | null
        }
        Update: {
          access_token_secret_name?: string
          active?: boolean
          company_id?: string
          created_at?: string
          environment?: string
          id?: string
          public_key?: string
          updated_at?: string
          user_id_mp?: string | null
          webhook_secret_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpago_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpago_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mpago_payments: {
        Row: {
          amount_cents: number
          approved_at: string | null
          card_last4: string | null
          company_id: string
          context_id: string | null
          context_type: string | null
          created_at: string
          currency: string
          customer_phone: string | null
          description: string | null
          empresa_id: string | null
          environment: string
          external_reference: string
          id: string
          installments: number | null
          metadata: Json
          module_slugs: string[] | null
          modulo_id: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          payer_doc: string | null
          payer_email: string | null
          payer_name: string | null
          payment_method: string
          pix_expires_at: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          plano_id: string | null
          provisioned_at: string | null
          provisioning_log: Json
          provisioning_status: string
          refunded_at: string | null
          rejected_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          approved_at?: string | null
          card_last4?: string | null
          company_id: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          currency?: string
          customer_phone?: string | null
          description?: string | null
          empresa_id?: string | null
          environment?: string
          external_reference: string
          id?: string
          installments?: number | null
          metadata?: Json
          module_slugs?: string[] | null
          modulo_id?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payer_doc?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_method: string
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          plano_id?: string | null
          provisioned_at?: string | null
          provisioning_log?: Json
          provisioning_status?: string
          refunded_at?: string | null
          rejected_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          card_last4?: string | null
          company_id?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          currency?: string
          customer_phone?: string | null
          description?: string | null
          empresa_id?: string | null
          environment?: string
          external_reference?: string
          id?: string
          installments?: number | null
          metadata?: Json
          module_slugs?: string[] | null
          modulo_id?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payer_doc?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_method?: string
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          plano_id?: string | null
          provisioned_at?: string | null
          provisioning_log?: Json
          provisioning_status?: string
          refunded_at?: string | null
          rejected_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpago_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpago_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mpago_refunds: {
        Row: {
          amount_cents: number
          company_id: string
          created_at: string
          id: string
          mp_refund_id: string | null
          payment_id: string
          reason: string | null
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          company_id: string
          created_at?: string
          id?: string
          mp_refund_id?: string | null
          payment_id: string
          reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          company_id?: string
          created_at?: string
          id?: string
          mp_refund_id?: string | null
          payment_id?: string
          reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpago_refunds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpago_refunds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_refunds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_refunds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "mpago_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      mpago_subscriptions: {
        Row: {
          amount_cents: number
          cancelled_at: string | null
          company_id: string
          created_at: string
          external_reference: string
          frequency: string
          id: string
          metadata: Json
          mp_preapproval_id: string | null
          next_payment_date: string | null
          payer_email: string
          payer_id: string | null
          plan_slug: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          cancelled_at?: string | null
          company_id: string
          created_at?: string
          external_reference: string
          frequency?: string
          id?: string
          metadata?: Json
          mp_preapproval_id?: string | null
          next_payment_date?: string | null
          payer_email: string
          payer_id?: string | null
          plan_slug: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          cancelled_at?: string | null
          company_id?: string
          created_at?: string
          external_reference?: string
          frequency?: string
          id?: string
          metadata?: Json
          mp_preapproval_id?: string | null
          next_payment_date?: string | null
          payer_email?: string
          payer_id?: string | null
          plan_slug?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpago_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpago_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mpago_webhook_events: {
        Row: {
          action: string | null
          company_id: string | null
          event_type: string
          id: string
          mp_event_id: string | null
          mp_resource_id: string | null
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          raw_payload: Json
          received_at: string
          signature_valid: boolean | null
        }
        Insert: {
          action?: string | null
          company_id?: string | null
          event_type: string
          id?: string
          mp_event_id?: string | null
          mp_resource_id?: string | null
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          raw_payload: Json
          received_at?: string
          signature_valid?: boolean | null
        }
        Update: {
          action?: string | null
          company_id?: string | null
          event_type?: string
          id?: string
          mp_event_id?: string | null
          mp_resource_id?: string | null
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          raw_payload?: Json
          received_at?: string
          signature_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mpago_webhook_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpago_webhook_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_webhook_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mpago_webhook_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      n8n_workflow_runs: {
        Row: {
          channel: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          error: string | null
          event_name: string
          finished_at: string | null
          http_status: number | null
          id: string
          idempotency_key: string | null
          latency_ms: number | null
          lead_id: string | null
          payload: Json
          regua: string
          started_at: string
          status: string
          step: string
          tenant_id: string | null
          workflow_name: string
          workflow_version: string | null
        }
        Insert: {
          channel?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          event_name: string
          finished_at?: string | null
          http_status?: number | null
          id?: string
          idempotency_key?: string | null
          latency_ms?: number | null
          lead_id?: string | null
          payload?: Json
          regua: string
          started_at?: string
          status: string
          step: string
          tenant_id?: string | null
          workflow_name: string
          workflow_version?: string | null
        }
        Update: {
          channel?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          event_name?: string
          finished_at?: string | null
          http_status?: number | null
          id?: string
          idempotency_key?: string | null
          latency_ms?: number | null
          lead_id?: string | null
          payload?: Json
          regua?: string
          started_at?: string
          status?: string
          step?: string
          tenant_id?: string | null
          workflow_name?: string
          workflow_version?: string | null
        }
        Relationships: []
      }
      niches: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          macro_slug: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          macro_slug?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          macro_slug?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "niches_macro_slug_fkey"
            columns: ["macro_slug"]
            isOneToOne: false
            referencedRelation: "core_macro_nichos"
            referencedColumns: ["slug"]
          },
        ]
      }
      notification_attempt_log: {
        Row: {
          channel: string
          company_id: string | null
          created_at: string
          event: string
          id: string
          idempotency_key: string | null
          metadata: Json
          niche: string | null
          reason: string | null
          recipient: string | null
          request_id: string | null
          status: string
        }
        Insert: {
          channel: string
          company_id?: string | null
          created_at?: string
          event: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          niche?: string | null
          reason?: string | null
          recipient?: string | null
          request_id?: string | null
          status: string
        }
        Update: {
          channel?: string
          company_id?: string | null
          created_at?: string
          event?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          niche?: string | null
          reason?: string | null
          recipient?: string | null
          request_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_attempt_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_attempt_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notification_attempt_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notification_attempt_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: string
          channel: string
          company_id: string | null
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          channel: string
          company_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          channel?: string
          company_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notification_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notification_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      notification_retention_audit: {
        Row: {
          changed_by: string | null
          changed_by_email: string | null
          created_at: string
          id: string
          metadata: Json
          new_days: number
          previous_days: number | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          new_days: number
          previous_days?: number | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          new_days?: number
          previous_days?: number | null
          reason?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          category: string
          company_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          read_at: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      onboarding_checklist: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          item_key: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          item_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          item_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "onboarding_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "onboarding_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      onboarding_domain_requests: {
        Row: {
          alternatives: string | null
          company_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          mode: string
          notes: string | null
          requested_value: string | null
          status: string
          updated_at: string
        }
        Insert: {
          alternatives?: string | null
          company_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          mode: string
          notes?: string | null
          requested_value?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          alternatives?: string | null
          company_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          mode?: string
          notes?: string | null
          requested_value?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_domain_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_domain_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "onboarding_domain_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "onboarding_domain_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      onboarding_email_requests: {
        Row: {
          address_prefix: string
          company_id: string
          created_at: string
          full_address: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address_prefix: string
          company_id: string
          created_at?: string
          full_address?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address_prefix?: string
          company_id?: string
          created_at?: string
          full_address?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_email_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_email_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "onboarding_email_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "onboarding_email_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          customer_id: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          plan_id: string | null
          raw_response: Json | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string | null
          webhook_received_at: string | null
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          plan_id?: string | null
          raw_response?: Json | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_received_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          plan_id?: string | null
          raw_response?: Json | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mp_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          module: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      profile_permissions: {
        Row: {
          permission_id: string
          profile_id: string
        }
        Insert: {
          permission_id: string
          profile_id: string
        }
        Update: {
          permission_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_master_profile: boolean
          is_system: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_master_profile?: boolean
          is_system?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_master_profile?: boolean
          is_system?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          accepted_at: string | null
          accepted_ip: string | null
          accepted_terms: Json | null
          accepted_user_agent: string | null
          category: string | null
          company_legal_name: string | null
          company_name: string | null
          company_tax_id: string | null
          created_at: string
          discount_cents: number
          discount_pct: number
          id: string
          lead_city: string | null
          lead_email: string | null
          lead_name: string
          lead_role: string | null
          lead_state: string | null
          lead_whatsapp: string
          modules: string[]
          origin: string | null
          public_token: string
          quote_number: string
          segment: string | null
          setup_cents: number
          status: string
          subtotal_cents: number
          total_cents: number
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_ip?: string | null
          accepted_terms?: Json | null
          accepted_user_agent?: string | null
          category?: string | null
          company_legal_name?: string | null
          company_name?: string | null
          company_tax_id?: string | null
          created_at?: string
          discount_cents?: number
          discount_pct?: number
          id?: string
          lead_city?: string | null
          lead_email?: string | null
          lead_name: string
          lead_role?: string | null
          lead_state?: string | null
          lead_whatsapp: string
          modules?: string[]
          origin?: string | null
          public_token?: string
          quote_number: string
          segment?: string | null
          setup_cents?: number
          status?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_ip?: string | null
          accepted_terms?: Json | null
          accepted_user_agent?: string | null
          category?: string | null
          company_legal_name?: string | null
          company_name?: string | null
          company_tax_id?: string | null
          created_at?: string
          discount_cents?: number
          discount_pct?: number
          id?: string
          lead_city?: string | null
          lead_email?: string | null
          lead_name?: string
          lead_role?: string | null
          lead_state?: string | null
          lead_whatsapp?: string
          modules?: string[]
          origin?: string | null
          public_token?: string
          quote_number?: string
          segment?: string | null
          setup_cents?: number
          status?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      realestate_blasts: {
        Row: {
          audience_count: number
          body: string
          channel: string
          company_id: string
          created_at: string
          created_by: string | null
          enqueued_count: number
          failed_count: number
          filter: Json
          id: string
          property_id: string | null
          sent_count: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience_count?: number
          body: string
          channel: string
          company_id: string
          created_at?: string
          created_by?: string | null
          enqueued_count?: number
          failed_count?: number
          filter?: Json
          id?: string
          property_id?: string | null
          sent_count?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience_count?: number
          body?: string
          channel?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          enqueued_count?: number
          failed_count?: number
          filter?: Json
          id?: string
          property_id?: string | null
          sent_count?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "realestate_blasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_blasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_blasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_blasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_blasts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_contracts: {
        Row: {
          client_document: string | null
          client_name: string
          company_id: string
          contract_type: string
          created_at: string
          created_by: string | null
          document_url: string | null
          end_date: string | null
          id: string
          notes: string | null
          owner_id: string | null
          property_id: string | null
          signed_at: string | null
          start_date: string | null
          status: string
          updated_at: string
          value: number | null
        }
        Insert: {
          client_document?: string | null
          client_name: string
          company_id: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          property_id?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_document?: string | null
          client_name?: string
          company_id?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          property_id?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "realestate_contracts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "realestate_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_distribution_rules: {
        Row: {
          company_id: string
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          strategy: string
          updated_at: string
        }
        Insert: {
          company_id: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          strategy?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          strategy?: string
          updated_at?: string
        }
        Relationships: []
      }
      realestate_documents: {
        Row: {
          company_id: string
          contract_id: string | null
          created_at: string
          created_by: string | null
          doc_type: string
          expires_at: string | null
          file_url: string | null
          id: string
          notes: string | null
          owner_id: string | null
          property_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          doc_type?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          property_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          doc_type?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          property_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "realestate_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "realestate_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "realestate_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_financings: {
        Row: {
          approved_at: string | null
          bank: string | null
          client_document: string | null
          client_name: string
          company_id: string
          contract_id: string | null
          created_at: string
          created_by: string | null
          denied_reason: string | null
          down_payment: number | null
          financed_value: number | null
          id: string
          interest_rate: number | null
          monthly_installment: number | null
          notes: string | null
          property_id: string | null
          property_value: number | null
          status: string
          submitted_at: string | null
          term_months: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          bank?: string | null
          client_document?: string | null
          client_name: string
          company_id: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          denied_reason?: string | null
          down_payment?: number | null
          financed_value?: number | null
          id?: string
          interest_rate?: number | null
          monthly_installment?: number | null
          notes?: string | null
          property_id?: string | null
          property_value?: number | null
          status?: string
          submitted_at?: string | null
          term_months?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          bank?: string | null
          client_document?: string | null
          client_name?: string
          company_id?: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          denied_reason?: string | null
          down_payment?: number | null
          financed_value?: number | null
          id?: string
          interest_rate?: number | null
          monthly_installment?: number | null
          notes?: string | null
          property_id?: string | null
          property_value?: number | null
          status?: string
          submitted_at?: string | null
          term_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "realestate_financings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "realestate_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_financings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_interests: {
        Row: {
          broker_user_id: string | null
          company_id: string
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          created_by: string | null
          id: string
          ip: string | null
          kind: string
          last_action_at: string | null
          lead_id: string | null
          message: string | null
          property_id: string
          responded_at: string | null
          source: string
          status: string
          updated_at: string
          user_agent: string | null
          utm: Json
        }
        Insert: {
          broker_user_id?: string | null
          company_id: string
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip?: string | null
          kind?: string
          last_action_at?: string | null
          lead_id?: string | null
          message?: string | null
          property_id: string
          responded_at?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm?: Json
        }
        Update: {
          broker_user_id?: string | null
          company_id?: string
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip?: string | null
          kind?: string
          last_action_at?: string | null
          lead_id?: string | null
          message?: string | null
          property_id?: string
          responded_at?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "realestate_interests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_interests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_interests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_interests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_interests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_interests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_internal_messages: {
        Row: {
          assigned_user_id: string | null
          body: string
          channel: string
          company_id: string
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          intent_id: string | null
          interest_id: string | null
          last_reply_at: string | null
          lead_id: string | null
          property_id: string | null
          replies_count: number
          request_kind: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          body: string
          channel?: string
          company_id: string
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          intent_id?: string | null
          interest_id?: string | null
          last_reply_at?: string | null
          lead_id?: string | null
          property_id?: string | null
          replies_count?: number
          request_kind?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          body?: string
          channel?: string
          company_id?: string
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          intent_id?: string | null
          interest_id?: string | null
          last_reply_at?: string | null
          lead_id?: string | null
          property_id?: string | null
          replies_count?: number
          request_kind?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "realestate_internal_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_internal_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_internal_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_internal_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_internal_messages_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "realestate_search_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_internal_messages_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "realestate_interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_internal_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_internal_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_lead_assignments: {
        Row: {
          assigned_by: string | null
          broker_user_id: string | null
          company_id: string
          created_at: string
          id: string
          lead_id: string
          strategy: string
          team_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          broker_user_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          lead_id: string
          strategy?: string
          team_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          broker_user_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          strategy?: string
          team_id?: string | null
        }
        Relationships: []
      }
      realestate_owners: {
        Row: {
          address: Json | null
          bank_account: Json | null
          company_id: string
          created_at: string
          document: string | null
          document_type: string | null
          email: string | null
          full_name: string
          id: string
          metadata: Json
          notes: string | null
          phone: string | null
          portal_invited_at: string | null
          portal_last_login_at: string | null
          portal_token: string | null
          preferred_contact: string | null
          status: string
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: Json | null
          bank_account?: Json | null
          company_id: string
          created_at?: string
          document?: string | null
          document_type?: string | null
          email?: string | null
          full_name: string
          id?: string
          metadata?: Json
          notes?: string | null
          phone?: string | null
          portal_invited_at?: string | null
          portal_last_login_at?: string | null
          portal_token?: string | null
          preferred_contact?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: Json | null
          bank_account?: Json | null
          company_id?: string
          created_at?: string
          document?: string | null
          document_type?: string | null
          email?: string | null
          full_name?: string
          id?: string
          metadata?: Json
          notes?: string | null
          phone?: string | null
          portal_invited_at?: string | null
          portal_last_login_at?: string | null
          portal_token?: string | null
          preferred_contact?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realestate_owners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_owners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_owners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_owners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      realestate_partner_brokers: {
        Row: {
          broker_name: string
          company_id: string
          contract_started_at: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          portal_token: string
          status: string
          updated_at: string
        }
        Insert: {
          broker_name: string
          company_id: string
          contract_started_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          portal_token?: string
          status?: string
          updated_at?: string
        }
        Update: {
          broker_name?: string
          company_id?: string
          contract_started_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          portal_token?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "realestate_partner_brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_partner_brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_partner_brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_partner_brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      realestate_properties: {
        Row: {
          address_line: string | null
          approval_status: Database["public"]["Enums"]["realestate_approval_status"]
          area_total: number | null
          area_useful: number | null
          bathrooms: number
          bedrooms: number
          broker_user_id: string | null
          city: string | null
          company_id: string
          condo_fee: number | null
          created_at: string
          created_by: string | null
          description: string | null
          features: Json
          id: string
          iptu: number | null
          is_published: boolean
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          operation: Database["public"]["Enums"]["realestate_operation"]
          owner_id: string | null
          parking_spots: number
          photos: Json
          property_type: Database["public"]["Enums"]["realestate_property_type"]
          reference_code: string | null
          rent_price: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sale_price: number | null
          state: string | null
          status: Database["public"]["Enums"]["realestate_property_status"]
          submitted_by: string | null
          submitted_for_review_at: string | null
          suites: number
          title: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line?: string | null
          approval_status?: Database["public"]["Enums"]["realestate_approval_status"]
          area_total?: number | null
          area_useful?: number | null
          bathrooms?: number
          bedrooms?: number
          broker_user_id?: string | null
          city?: string | null
          company_id: string
          condo_fee?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          features?: Json
          id?: string
          iptu?: number | null
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          operation?: Database["public"]["Enums"]["realestate_operation"]
          owner_id?: string | null
          parking_spots?: number
          photos?: Json
          property_type?: Database["public"]["Enums"]["realestate_property_type"]
          reference_code?: string | null
          rent_price?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_price?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["realestate_property_status"]
          submitted_by?: string | null
          submitted_for_review_at?: string | null
          suites?: number
          title: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line?: string | null
          approval_status?: Database["public"]["Enums"]["realestate_approval_status"]
          area_total?: number | null
          area_useful?: number | null
          bathrooms?: number
          bedrooms?: number
          broker_user_id?: string | null
          city?: string | null
          company_id?: string
          condo_fee?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          features?: Json
          id?: string
          iptu?: number | null
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          operation?: Database["public"]["Enums"]["realestate_operation"]
          owner_id?: string | null
          parking_spots?: number
          photos?: Json
          property_type?: Database["public"]["Enums"]["realestate_property_type"]
          reference_code?: string | null
          rent_price?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_price?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["realestate_property_status"]
          submitted_by?: string | null
          submitted_for_review_at?: string | null
          suites?: number
          title?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realestate_properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "realestate_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_property_history: {
        Row: {
          actor_lead_id: string | null
          actor_user_id: string | null
          company_id: string
          created_at: string
          description: string
          event_code: string
          id: string
          payload: Json
          property_id: string
        }
        Insert: {
          actor_lead_id?: string | null
          actor_user_id?: string | null
          company_id: string
          created_at?: string
          description: string
          event_code: string
          id?: string
          payload?: Json
          property_id: string
        }
        Update: {
          actor_lead_id?: string | null
          actor_user_id?: string | null
          company_id?: string
          created_at?: string
          description?: string
          event_code?: string
          id?: string
          payload?: Json
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "realestate_property_history_actor_lead_id_fkey"
            columns: ["actor_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_property_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_property_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_property_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_property_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_property_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_property_matches: {
        Row: {
          company_id: string
          created_at: string
          id: string
          intent_id: string
          notified_at: string
          property_id: string
          score: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          intent_id: string
          notified_at?: string
          property_id: string
          score?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          intent_id?: string
          notified_at?: string
          property_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "realestate_property_matches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_property_matches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_property_matches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_property_matches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_property_matches_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "realestate_search_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_property_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_property_reviews: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string
          created_at: string
          id: string
          metadata: Json
          new_status: string | null
          notes: string | null
          previous_status: string | null
          property_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          metadata?: Json
          new_status?: string | null
          notes?: string | null
          previous_status?: string | null
          property_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          new_status?: string | null
          notes?: string | null
          previous_status?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "realestate_property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_search_intents: {
        Row: {
          area_min: number | null
          bathrooms_min: number
          bedrooms_min: number
          cities: string[]
          company_id: string
          consent_marketing: boolean
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          ip: string | null
          last_blast_at: string | null
          lead_id: string | null
          neighborhoods: string[]
          notes: string | null
          operation: Database["public"]["Enums"]["realestate_operation"]
          parking_min: number
          price_max: number | null
          price_min: number | null
          property_types: Database["public"]["Enums"]["realestate_property_type"][]
          source: string | null
          status: Database["public"]["Enums"]["realestate_intent_status"]
          updated_at: string
          user_agent: string | null
          utm: Json
          whatsapp: string | null
        }
        Insert: {
          area_min?: number | null
          bathrooms_min?: number
          bedrooms_min?: number
          cities?: string[]
          company_id: string
          consent_marketing?: boolean
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          ip?: string | null
          last_blast_at?: string | null
          lead_id?: string | null
          neighborhoods?: string[]
          notes?: string | null
          operation?: Database["public"]["Enums"]["realestate_operation"]
          parking_min?: number
          price_max?: number | null
          price_min?: number | null
          property_types?: Database["public"]["Enums"]["realestate_property_type"][]
          source?: string | null
          status?: Database["public"]["Enums"]["realestate_intent_status"]
          updated_at?: string
          user_agent?: string | null
          utm?: Json
          whatsapp?: string | null
        }
        Update: {
          area_min?: number | null
          bathrooms_min?: number
          bedrooms_min?: number
          cities?: string[]
          company_id?: string
          consent_marketing?: boolean
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          ip?: string | null
          last_blast_at?: string | null
          lead_id?: string | null
          neighborhoods?: string[]
          notes?: string | null
          operation?: Database["public"]["Enums"]["realestate_operation"]
          parking_min?: number
          price_max?: number | null
          price_min?: number | null
          property_types?: Database["public"]["Enums"]["realestate_property_type"][]
          source?: string | null
          status?: Database["public"]["Enums"]["realestate_intent_status"]
          updated_at?: string
          user_agent?: string | null
          utm?: Json
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realestate_search_intents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_search_intents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_search_intents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_search_intents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "realestate_search_intents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realestate_search_intents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_team_members: {
        Row: {
          created_at: string
          id: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "realestate_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "realestate_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      realestate_teams: {
        Row: {
          company_id: string
          created_at: string
          goal_monthly: number | null
          id: string
          leader_user_id: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          goal_monthly?: number | null
          id?: string
          leader_user_id?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          goal_monthly?: number | null
          id?: string
          leader_user_id?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      realestate_visits: {
        Row: {
          broker_user_id: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          company_id: string
          created_at: string
          created_by: string | null
          duration_minutes: number
          feedback: string | null
          id: string
          notes: string | null
          property_id: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          broker_user_id?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          feedback?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          broker_user_id?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          feedback?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "realestate_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "realestate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_assets: {
        Row: {
          acquisition_cost: number | null
          asset_code: string
          brand: string | null
          category: string | null
          company_id: string
          created_at: string
          daily_rate: number | null
          id: string
          metadata: Json
          model: string | null
          monthly_rate: number | null
          name: string
          notes: string | null
          serial_number: string | null
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          acquisition_cost?: number | null
          asset_code: string
          brand?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          daily_rate?: number | null
          id?: string
          metadata?: Json
          model?: string | null
          monthly_rate?: number | null
          name: string
          notes?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          acquisition_cost?: number | null
          asset_code?: string
          brand?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          daily_rate?: number | null
          id?: string
          metadata?: Json
          model?: string | null
          monthly_rate?: number | null
          name?: string
          notes?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "rental_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "rental_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      rental_contract_items: {
        Row: {
          asset_id: string | null
          contract_id: string
          created_at: string
          description: string
          id: string
          quantity: number
          total: number
          unit_rate: number
        }
        Insert: {
          asset_id?: string | null
          contract_id: string
          created_at?: string
          description: string
          id?: string
          quantity?: number
          total?: number
          unit_rate?: number
        }
        Update: {
          asset_id?: string | null
          contract_id?: string
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          total?: number
          unit_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "rental_contract_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "rental_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contract_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_contracts: {
        Row: {
          billing_cycle: string
          company_id: string
          contract_number: string
          created_at: string
          customer_document: string | null
          customer_id: string | null
          customer_name: string
          delivery_address: string | null
          end_date: string | null
          id: string
          metadata: Json
          notes: string | null
          start_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          company_id: string
          contract_number: string
          created_at?: string
          customer_document?: string | null
          customer_id?: string | null
          customer_name: string
          delivery_address?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          start_date: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          company_id?: string
          contract_number?: string
          created_at?: string
          customer_document?: string | null
          customer_id?: string | null
          customer_name?: string
          delivery_address?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "rental_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "rental_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      restaurant_menu_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menu_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_menu_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_menu_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_menu_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      restaurant_menu_items: {
        Row: {
          category_id: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_available: boolean
          name: string
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          name: string
          price_cents: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "restaurant_menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_menu_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_menu_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_menu_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_menu_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      restaurant_table_invoices: {
        Row: {
          amount_cents: number
          attempt_number: number
          company_id: string
          created_at: string
          expires_at: string | null
          failed_at: string | null
          id: string
          last_error: string | null
          order_nsu: string
          paid_at: string | null
          pix_copy_paste: string | null
          pix_url: string | null
          session_id: string
          status: string
        }
        Insert: {
          amount_cents: number
          attempt_number?: number
          company_id: string
          created_at?: string
          expires_at?: string | null
          failed_at?: string | null
          id?: string
          last_error?: string | null
          order_nsu: string
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_url?: string | null
          session_id: string
          status?: string
        }
        Update: {
          amount_cents?: number
          attempt_number?: number
          company_id?: string
          created_at?: string
          expires_at?: string | null
          failed_at?: string | null
          id?: string
          last_error?: string | null
          order_nsu?: string
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_url?: string | null
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_table_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_table_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_table_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_table_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_table_invoices_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "restaurant_table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_table_sessions: {
        Row: {
          bill_notified_at: string | null
          bill_notified_sms_at: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string | null
          party_size: number
          sales_order_id: string | null
          status: string
          table_id: string
          total: number
          updated_at: string
        }
        Insert: {
          bill_notified_at?: string | null
          bill_notified_sms_at?: string | null
          closed_at?: string | null
          company_id: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          party_size?: number
          sales_order_id?: string | null
          status?: string
          table_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          bill_notified_at?: string | null
          bill_notified_sms_at?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          party_size?: number
          sales_order_id?: string | null
          status?: string
          table_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_table_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_table_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_table_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_table_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_table_sessions_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          area: string | null
          capacity: number
          company_id: string
          created_at: string
          current_session_id: string | null
          id: string
          is_active: boolean
          label: string | null
          notes: string | null
          number: number
          qr_token: string
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          capacity?: number
          company_id: string
          created_at?: string
          current_session_id?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          number: number
          qr_token?: string
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          capacity?: number
          company_id?: string
          created_at?: string
          current_session_id?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          number?: number
          qr_token?: string
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_tables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_tables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restaurant_tables_session_fk"
            columns: ["current_session_id"]
            isOneToOne: false
            referencedRelation: "restaurant_table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      runtime_events: {
        Row: {
          company_id: string | null
          context: Json
          id: string
          level: string
          message: string
          occurred_at: string
          request_id: string | null
          route: string | null
          scope: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          context?: Json
          id?: string
          level: string
          message: string
          occurred_at?: string
          request_id?: string | null
          route?: string | null
          scope: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          context?: Json
          id?: string
          level?: string
          message?: string
          occurred_at?: string
          request_id?: string | null
          route?: string | null
          scope?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sales_cash_session_counts: {
        Row: {
          counted_amount: number
          created_at: string
          difference: number
          expected_amount: number
          id: string
          payment_method_id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          counted_amount?: number
          created_at?: string
          difference?: number
          expected_amount?: number
          id?: string
          payment_method_id: string
          session_id: string
          updated_at?: string
        }
        Update: {
          counted_amount?: number
          created_at?: string
          difference?: number
          expected_amount?: number
          id?: string
          payment_method_id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_cash_session_counts_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "fin_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cash_session_counts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sales_cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_cash_sessions: {
        Row: {
          account_id: string
          closed_at: string | null
          closed_by: string | null
          closing_amount: number | null
          company_id: string
          created_at: string
          difference_total: number | null
          expected_total: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_amount: number
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          company_id: string
          created_at?: string
          difference_total?: number | null
          expected_total?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_amount?: number
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          company_id?: string
          created_at?: string
          difference_total?: number | null
          expected_total?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_amount?: number
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_cash_sessions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cash_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cash_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_cash_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_cash_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_cash_sessions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          company_id: string
          created_at: string
          description: string
          discount: number
          id: string
          kitchen_status: string
          kitchen_updated_at: string
          notified_ready_at: string | null
          notified_ready_sms_at: string | null
          order_id: string
          product_id: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          discount?: number
          id?: string
          kitchen_status?: string
          kitchen_updated_at?: string
          notified_ready_at?: string | null
          notified_ready_sms_at?: string | null
          order_id: string
          product_id?: string | null
          quantity: number
          total?: number
          unit_price?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          discount?: number
          id?: string
          kitchen_status?: string
          kitchen_updated_at?: string
          notified_ready_at?: string | null
          notified_ready_sms_at?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inv_products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          cancelled_at: string | null
          company_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          customer_doc: string | null
          customer_id: string | null
          customer_lead_id: string | null
          customer_name: string | null
          discount: number
          id: string
          notes: string | null
          number: number
          status: string
          subtotal: number
          total: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          company_id: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_doc?: string | null
          customer_id?: string | null
          customer_lead_id?: string | null
          customer_name?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number?: number
          status?: string
          subtotal?: number
          total?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          company_id?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_doc?: string | null
          customer_id?: string | null
          customer_lead_id?: string | null
          customer_name?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number?: number
          status?: string
          subtotal?: number
          total?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_lead_id_fkey"
            columns: ["customer_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_payments: {
        Row: {
          account_id: string | null
          amount: number
          company_id: string
          created_at: string
          fin_transaction_id: string | null
          id: string
          order_id: string
          payment_method_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          company_id: string
          created_at?: string
          fin_transaction_id?: string | null
          id?: string
          order_id: string
          payment_method_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          company_id?: string
          created_at?: string
          fin_transaction_id?: string | null
          id?: string
          order_id?: string
          payment_method_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sales_payments_fin_transaction_id_fkey"
            columns: ["fin_transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "fin_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sectors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sectors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sectors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sectors_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json
          order_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json
          order_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          customer_id: string | null
          customer_name: string
          diagnosis: string | null
          equipment_description: string
          equipment_serial: string | null
          id: string
          labor_cost: number | null
          metadata: Json
          opened_at: string
          order_number: string
          parts_cost: number | null
          priority: string
          resolution: string | null
          service_type: string
          sla_due_at: string | null
          status: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          company_id: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          diagnosis?: string | null
          equipment_description: string
          equipment_serial?: string | null
          id?: string
          labor_cost?: number | null
          metadata?: Json
          opened_at?: string
          order_number: string
          parts_cost?: number | null
          priority?: string
          resolution?: string | null
          service_type?: string
          sla_due_at?: string | null
          status?: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          diagnosis?: string | null
          equipment_description?: string
          equipment_serial?: string | null
          id?: string
          labor_cost?: number | null
          metadata?: Json
          opened_at?: string
          order_number?: string
          parts_cost?: number | null
          priority?: string
          resolution?: string | null
          service_type?: string
          sla_due_at?: string | null
          status?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "service_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "service_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      setting_definitions: {
        Row: {
          category: string
          created_at: string
          default_value: Json | null
          description: string | null
          id: string
          is_company_editable: boolean
          key: string
          label: string
          sort_order: number
          updated_at: string
          value_type: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_value?: Json | null
          description?: string | null
          id?: string
          is_company_editable?: boolean
          key: string
          label: string
          sort_order?: number
          updated_at?: string
          value_type: string
        }
        Update: {
          category?: string
          created_at?: string
          default_value?: Json | null
          description?: string | null
          id?: string
          is_company_editable?: boolean
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
          value_type?: string
        }
        Relationships: []
      }
      site_templates: {
        Row: {
          created_at: string
          created_by: string | null
          default_colors: Json
          description: string | null
          id: string
          name: string
          niche: string | null
          pages: Json
          sections: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_colors?: Json
          description?: string | null
          id?: string
          name: string
          niche?: string | null
          pages?: Json
          sections?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_colors?: Json
          description?: string | null
          id?: string
          name?: string
          niche?: string | null
          pages?: Json
          sections?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          past_due_since: string | null
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          past_due_since?: string | null
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          past_due_since?: string | null
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_email_inbox: {
        Row: {
          body_html: string | null
          body_text: string | null
          error: string | null
          from_email: string
          from_name: string | null
          headers: Json | null
          id: string
          mailbox: string
          processed: boolean
          received_at: string
          subject: string | null
          ticket_id: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          error?: string | null
          from_email: string
          from_name?: string | null
          headers?: Json | null
          id?: string
          mailbox: string
          processed?: boolean
          received_at?: string
          subject?: string | null
          ticket_id?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          error?: string | null
          from_email?: string
          from_name?: string | null
          headers?: Json | null
          id?: string
          mailbox?: string
          processed?: boolean
          received_at?: string
          subject?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_email_inbox_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_sessions: {
        Row: {
          company_id: string
          created_at: string
          ended_at: string | null
          id: string
          reason: string | null
          started_at: string
          super_user_email: string | null
          super_user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          super_user_email?: string | null
          super_user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          super_user_email?: string | null
          super_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "support_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "support_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          attachments: Json
          author_role: string
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          author_role: string
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          attachments?: Json
          author_role?: string
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          company_id: string | null
          consumer_user_id: string | null
          created_at: string
          description: string
          first_response_at: string | null
          id: string
          metadata: Json
          origin: Database["public"]["Enums"]["support_ticket_origin"]
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          protocol: string
          rating: number | null
          rating_comment: string | null
          requester_email: string | null
          requester_name: string | null
          requester_user_id: string | null
          resolved_at: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          type: Database["public"]["Enums"]["support_ticket_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          company_id?: string | null
          consumer_user_id?: string | null
          created_at?: string
          description: string
          first_response_at?: string | null
          id?: string
          metadata?: Json
          origin?: Database["public"]["Enums"]["support_ticket_origin"]
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          protocol?: string
          rating?: number | null
          rating_comment?: string | null
          requester_email?: string | null
          requester_name?: string | null
          requester_user_id?: string | null
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          type?: Database["public"]["Enums"]["support_ticket_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          company_id?: string | null
          consumer_user_id?: string | null
          created_at?: string
          description?: string
          first_response_at?: string | null
          id?: string
          metadata?: Json
          origin?: Database["public"]["Enums"]["support_ticket_origin"]
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          protocol?: string
          rating?: number | null
          rating_comment?: string | null
          requester_email?: string | null
          requester_name?: string | null
          requester_user_id?: string | null
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          type?: Database["public"]["Enums"]["support_ticket_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      talentos_candidatos: {
        Row: {
          ativo: boolean
          bairro: string | null
          cargo_desejado: string
          cep: string
          cidade: string | null
          created_at: string
          cursando: string | null
          cursando_instituicao: string | null
          cursando_previsao: string | null
          curso_superior: string | null
          disponibilidade: string | null
          email: string
          escolaridade: string | null
          estado: string | null
          experiencia: string | null
          faixa_etaria:
            | Database["public"]["Enums"]["talentos_faixa_etaria"]
            | null
          foto_url: string | null
          habilidades: string[]
          id: string
          idiomas: string[]
          instituicao: string | null
          modelo_trabalho: string | null
          nicho: string | null
          nome: string
          pretensao_salarial: string | null
          tags: string[]
          updated_at: string
          user_id: string | null
          video_url: string | null
          visivel_rede: boolean
          whatsapp: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cargo_desejado: string
          cep: string
          cidade?: string | null
          created_at?: string
          cursando?: string | null
          cursando_instituicao?: string | null
          cursando_previsao?: string | null
          curso_superior?: string | null
          disponibilidade?: string | null
          email: string
          escolaridade?: string | null
          estado?: string | null
          experiencia?: string | null
          faixa_etaria?:
            | Database["public"]["Enums"]["talentos_faixa_etaria"]
            | null
          foto_url?: string | null
          habilidades?: string[]
          id?: string
          idiomas?: string[]
          instituicao?: string | null
          modelo_trabalho?: string | null
          nicho?: string | null
          nome: string
          pretensao_salarial?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          visivel_rede?: boolean
          whatsapp: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cargo_desejado?: string
          cep?: string
          cidade?: string | null
          created_at?: string
          cursando?: string | null
          cursando_instituicao?: string | null
          cursando_previsao?: string | null
          curso_superior?: string | null
          disponibilidade?: string | null
          email?: string
          escolaridade?: string | null
          estado?: string | null
          experiencia?: string | null
          faixa_etaria?:
            | Database["public"]["Enums"]["talentos_faixa_etaria"]
            | null
          foto_url?: string | null
          habilidades?: string[]
          id?: string
          idiomas?: string[]
          instituicao?: string | null
          modelo_trabalho?: string | null
          nicho?: string | null
          nome?: string
          pretensao_salarial?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          visivel_rede?: boolean
          whatsapp?: string
        }
        Relationships: []
      }
      talentos_company_settings: {
        Row: {
          bairros_interesse: string[]
          cidades_interesse: string[]
          company_id: string
          created_at: string
          id: string
          nicho: string | null
          participa: boolean
          raio_km: number | null
          receber_automatico: boolean
          updated_at: string
        }
        Insert: {
          bairros_interesse?: string[]
          cidades_interesse?: string[]
          company_id: string
          created_at?: string
          id?: string
          nicho?: string | null
          participa?: boolean
          raio_km?: number | null
          receber_automatico?: boolean
          updated_at?: string
        }
        Update: {
          bairros_interesse?: string[]
          cidades_interesse?: string[]
          company_id?: string
          created_at?: string
          id?: string
          nicho?: string | null
          participa?: boolean
          raio_km?: number | null
          receber_automatico?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      talentos_curriculos: {
        Row: {
          arquivo_url: string
          candidato_id: string
          created_at: string
          extracao: Json | null
          formato: string | null
          id: string
          processado_em: string | null
          texto_bruto: string | null
        }
        Insert: {
          arquivo_url: string
          candidato_id: string
          created_at?: string
          extracao?: Json | null
          formato?: string | null
          id?: string
          processado_em?: string | null
          texto_bruto?: string | null
        }
        Update: {
          arquivo_url?: string
          candidato_id?: string
          created_at?: string
          extracao?: Json | null
          formato?: string | null
          id?: string
          processado_em?: string | null
          texto_bruto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talentos_curriculos_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "talentos_candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      talentos_matches: {
        Row: {
          candidato_id: string
          company_id: string
          contratado_em: string | null
          created_at: string
          desligado_em: string | null
          id: string
          motivos: string[]
          observacoes: string | null
          score: number
          stage: Database["public"]["Enums"]["talentos_stage"]
          updated_at: string
          vaga_id: string | null
        }
        Insert: {
          candidato_id: string
          company_id: string
          contratado_em?: string | null
          created_at?: string
          desligado_em?: string | null
          id?: string
          motivos?: string[]
          observacoes?: string | null
          score?: number
          stage?: Database["public"]["Enums"]["talentos_stage"]
          updated_at?: string
          vaga_id?: string | null
        }
        Update: {
          candidato_id?: string
          company_id?: string
          contratado_em?: string | null
          created_at?: string
          desligado_em?: string | null
          id?: string
          motivos?: string[]
          observacoes?: string | null
          score?: number
          stage?: Database["public"]["Enums"]["talentos_stage"]
          updated_at?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talentos_matches_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "talentos_candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talentos_matches_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "talentos_vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      talentos_vagas: {
        Row: {
          ativa: boolean
          bairro: string | null
          cargo: string
          cidade: string | null
          company_id: string
          created_at: string
          descricao: string | null
          escolaridade_minima: string | null
          experiencia_minima: string | null
          faixa_salarial: string | null
          habilidades_desejadas: string[]
          id: string
          modelo_trabalho: string | null
          nicho: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          bairro?: string | null
          cargo: string
          cidade?: string | null
          company_id: string
          created_at?: string
          descricao?: string | null
          escolaridade_minima?: string | null
          experiencia_minima?: string | null
          faixa_salarial?: string | null
          habilidades_desejadas?: string[]
          id?: string
          modelo_trabalho?: string | null
          nicho?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          bairro?: string | null
          cargo?: string
          cidade?: string | null
          company_id?: string
          created_at?: string
          descricao?: string | null
          escolaridade_minima?: string | null
          experiencia_minima?: string | null
          faixa_salarial?: string | null
          habilidades_desejadas?: string[]
          id?: string
          modelo_trabalho?: string | null
          nicho?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      trial_abuse_index: {
        Row: {
          company_hash: string | null
          created_at: string
          doc_hash: string | null
          email_hash: string | null
          id: string
          trial_id: string
          whatsapp_hash: string | null
        }
        Insert: {
          company_hash?: string | null
          created_at?: string
          doc_hash?: string | null
          email_hash?: string | null
          id?: string
          trial_id: string
          whatsapp_hash?: string | null
        }
        Update: {
          company_hash?: string | null
          created_at?: string
          doc_hash?: string | null
          email_hash?: string | null
          id?: string
          trial_id?: string
          whatsapp_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_abuse_index_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "trial_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          trial_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          trial_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          trial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_events_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "trial_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_settings: {
        Row: {
          allow_custom_domain: boolean
          allow_export: boolean
          allow_extension: boolean
          allow_real_credentials: boolean
          allow_real_integrations: boolean
          allow_real_publish: boolean
          apply_setup_on_convert: boolean
          block_repeat_company: boolean
          block_repeat_doc: boolean
          block_repeat_email: boolean
          block_repeat_whatsapp: boolean
          charge_setup_after: boolean
          charge_setup_before: boolean
          created_at: string
          duration_days: number
          extension_requires_reason: boolean
          id: string
          max_customers: number
          max_events: number
          max_extension_days: number
          max_products: number
          max_simulated_messages: number
          max_simulated_payments: number
          max_tickets: number
          max_users: number
          updated_at: string
          waive_setup_on_trial: boolean
        }
        Insert: {
          allow_custom_domain?: boolean
          allow_export?: boolean
          allow_extension?: boolean
          allow_real_credentials?: boolean
          allow_real_integrations?: boolean
          allow_real_publish?: boolean
          apply_setup_on_convert?: boolean
          block_repeat_company?: boolean
          block_repeat_doc?: boolean
          block_repeat_email?: boolean
          block_repeat_whatsapp?: boolean
          charge_setup_after?: boolean
          charge_setup_before?: boolean
          created_at?: string
          duration_days?: number
          extension_requires_reason?: boolean
          id?: string
          max_customers?: number
          max_events?: number
          max_extension_days?: number
          max_products?: number
          max_simulated_messages?: number
          max_simulated_payments?: number
          max_tickets?: number
          max_users?: number
          updated_at?: string
          waive_setup_on_trial?: boolean
        }
        Update: {
          allow_custom_domain?: boolean
          allow_export?: boolean
          allow_extension?: boolean
          allow_real_credentials?: boolean
          allow_real_integrations?: boolean
          allow_real_publish?: boolean
          apply_setup_on_convert?: boolean
          block_repeat_company?: boolean
          block_repeat_doc?: boolean
          block_repeat_email?: boolean
          block_repeat_whatsapp?: boolean
          charge_setup_after?: boolean
          charge_setup_before?: boolean
          created_at?: string
          duration_days?: number
          extension_requires_reason?: boolean
          id?: string
          max_customers?: number
          max_events?: number
          max_extension_days?: number
          max_products?: number
          max_simulated_messages?: number
          max_simulated_payments?: number
          max_tickets?: number
          max_users?: number
          updated_at?: string
          waive_setup_on_trial?: boolean
        }
        Relationships: []
      }
      trial_subscriptions: {
        Row: {
          cancelled_at: string | null
          chosen_plan: Database["public"]["Enums"]["trial_plan_choice"]
          company_id: string | null
          contact_company: string
          contact_doc: string | null
          contact_email: string
          contact_name: string
          contact_whatsapp: string
          converted_at: string | null
          created_at: string
          ends_at: string | null
          extended_by: string | null
          extended_days: number
          extension_reason: string | null
          id: string
          lead_id: string | null
          paddle_subscription_id: string | null
          paddle_transaction_id: string | null
          regularized_at: string | null
          setup_charged: boolean
          source: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["trial_status"]
          suspended_at: string | null
          terms_accepted_at: string
          terms_ip: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          chosen_plan?: Database["public"]["Enums"]["trial_plan_choice"]
          company_id?: string | null
          contact_company: string
          contact_doc?: string | null
          contact_email: string
          contact_name: string
          contact_whatsapp: string
          converted_at?: string | null
          created_at?: string
          ends_at?: string | null
          extended_by?: string | null
          extended_days?: number
          extension_reason?: string | null
          id?: string
          lead_id?: string | null
          paddle_subscription_id?: string | null
          paddle_transaction_id?: string | null
          regularized_at?: string | null
          setup_charged?: boolean
          source?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["trial_status"]
          suspended_at?: string | null
          terms_accepted_at?: string
          terms_ip?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          chosen_plan?: Database["public"]["Enums"]["trial_plan_choice"]
          company_id?: string | null
          contact_company?: string
          contact_doc?: string | null
          contact_email?: string
          contact_name?: string
          contact_whatsapp?: string
          converted_at?: string | null
          created_at?: string
          ends_at?: string | null
          extended_by?: string | null
          extended_days?: number
          extension_reason?: string | null
          id?: string
          lead_id?: string | null
          paddle_subscription_id?: string | null
          paddle_transaction_id?: string | null
          regularized_at?: string | null
          setup_charged?: boolean
          source?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["trial_status"]
          suspended_at?: string | null
          terms_accepted_at?: string
          terms_ip?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trial_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trial_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trial_subscriptions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "marketing_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      uptime_checks: {
        Row: {
          checked_at: string
          error_message: string | null
          http_status: number | null
          id: string
          is_up: boolean
          response_ms: number | null
          url: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          is_up: boolean
          response_ms?: number | null
          url: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          is_up?: boolean
          response_ms?: number | null
          url?: string
        }
        Relationships: []
      }
      uptime_state: {
        Row: {
          alert_after_seconds: number
          alert_emails: string[]
          alert_whatsapps: string[]
          consecutive_failures: number
          first_failure_at: string | null
          is_up: boolean
          last_alert_at: string | null
          last_check_at: string
          last_error: string | null
          since: string
          url: string
        }
        Insert: {
          alert_after_seconds?: number
          alert_emails?: string[]
          alert_whatsapps?: string[]
          consecutive_failures?: number
          first_failure_at?: string | null
          is_up: boolean
          last_alert_at?: string | null
          last_check_at?: string
          last_error?: string | null
          since?: string
          url: string
        }
        Update: {
          alert_after_seconds?: number
          alert_emails?: string[]
          alert_whatsapps?: string[]
          consecutive_failures?: number
          first_failure_at?: string | null
          is_up?: boolean
          last_alert_at?: string | null
          last_check_at?: string
          last_error?: string | null
          since?: string
          url?: string
        }
        Relationships: []
      }
      user_permission_overrides: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          effect: string
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          effect: string
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          effect?: string
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          company_id: string
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          profile_id: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          profile_id: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          profile_id?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vitrine_export_logs: {
        Row: {
          batches_done: number
          company_id: string
          created_at: string
          dataset: string
          date_from: string | null
          date_to: string | null
          email_from: string | null
          email_to: string | null
          error_message: string | null
          export_id: string
          finished_at: string | null
          format: string
          id: string
          search_term: string | null
          started_at: string
          status: string
          status_filter: string | null
          total_expected: number | null
          total_exported: number
          updated_at: string
          user_id: string
        }
        Insert: {
          batches_done?: number
          company_id: string
          created_at?: string
          dataset: string
          date_from?: string | null
          date_to?: string | null
          email_from?: string | null
          email_to?: string | null
          error_message?: string | null
          export_id: string
          finished_at?: string | null
          format?: string
          id?: string
          search_term?: string | null
          started_at?: string
          status?: string
          status_filter?: string | null
          total_expected?: number | null
          total_exported?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          batches_done?: number
          company_id?: string
          created_at?: string
          dataset?: string
          date_from?: string | null
          date_to?: string | null
          email_from?: string | null
          email_to?: string | null
          error_message?: string | null
          export_id?: string
          finished_at?: string | null
          format?: string
          id?: string
          search_term?: string | null
          started_at?: string
          status?: string
          status_filter?: string | null
          total_expected?: number | null
          total_exported?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_event_log: {
        Row: {
          error: string | null
          event_id: string
          id: string
          payload: Json | null
          processed_at: string
          replay_count: number
          replay_reason: string | null
          replayed_at: string | null
          replayed_by: string | null
          result: Json | null
          source: string
          status: string
          target_id: string | null
          target_kind: string | null
        }
        Insert: {
          error?: string | null
          event_id: string
          id?: string
          payload?: Json | null
          processed_at?: string
          replay_count?: number
          replay_reason?: string | null
          replayed_at?: string | null
          replayed_by?: string | null
          result?: Json | null
          source: string
          status?: string
          target_id?: string | null
          target_kind?: string | null
        }
        Update: {
          error?: string | null
          event_id?: string
          id?: string
          payload?: Json | null
          processed_at?: string
          replay_count?: number
          replay_reason?: string | null
          replayed_at?: string | null
          replayed_by?: string | null
          result?: Json | null
          source?: string
          status?: string
          target_id?: string | null
          target_kind?: string | null
        }
        Relationships: []
      }
      webhook_runs: {
        Row: {
          attempts: number
          company_id: string | null
          created_at: string
          event: string
          finished_at: string | null
          http_method: string | null
          id: string
          idempotency_key: string | null
          last_error: string | null
          next_retry_at: string | null
          request_payload: Json
          response_body: string | null
          response_status: number | null
          started_at: string | null
          status: string
          target_url: string | null
          triggered_by: string | null
          updated_at: string
          white_label_id: string | null
          workflow: string
        }
        Insert: {
          attempts?: number
          company_id?: string | null
          created_at?: string
          event: string
          finished_at?: string | null
          http_method?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          next_retry_at?: string | null
          request_payload?: Json
          response_body?: string | null
          response_status?: number | null
          started_at?: string | null
          status?: string
          target_url?: string | null
          triggered_by?: string | null
          updated_at?: string
          white_label_id?: string | null
          workflow: string
        }
        Update: {
          attempts?: number
          company_id?: string | null
          created_at?: string
          event?: string
          finished_at?: string | null
          http_method?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          next_retry_at?: string | null
          request_payload?: Json
          response_body?: string | null
          response_status?: number | null
          started_at?: string | null
          status?: string
          target_url?: string | null
          triggered_by?: string | null
          updated_at?: string
          white_label_id?: string | null
          workflow?: string
        }
        Relationships: []
      }
      whatsapp_message_events: {
        Row: {
          error_code: string | null
          error_message: string | null
          external_id: string
          id: string
          instance_id: string | null
          momment: string | null
          outbox_id: string | null
          phone: string | null
          raw: Json
          received_at: string
          status: string
        }
        Insert: {
          error_code?: string | null
          error_message?: string | null
          external_id: string
          id?: string
          instance_id?: string | null
          momment?: string | null
          outbox_id?: string | null
          phone?: string | null
          raw?: Json
          received_at?: string
          status: string
        }
        Update: {
          error_code?: string | null
          error_message?: string | null
          external_id?: string
          id?: string
          instance_id?: string | null
          momment?: string | null
          outbox_id?: string | null
          phone?: string | null
          raw?: Json
          received_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_events_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "message_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      wl_company_links: {
        Row: {
          company_id: string
          created_at: string
          id: string
          plan_slug: string
          pontos_consumidos: number
          status: string
          wl_owner_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          plan_slug: string
          pontos_consumidos: number
          status?: string
          wl_owner_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          plan_slug?: string
          pontos_consumidos?: number
          status?: string
          wl_owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wl_company_links_plan_slug_fkey"
            columns: ["plan_slug"]
            isOneToOne: false
            referencedRelation: "core_company_plans"
            referencedColumns: ["slug"]
          },
        ]
      }
      wl_plans: {
        Row: {
          created_at: string
          id: string
          mensalidade_sm: number
          nome: string
          ordem: number
          pontos_adicionais: number
          pontos_capacidade: number
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensalidade_sm: number
          nome: string
          ordem?: number
          pontos_adicionais: number
          pontos_capacidade: number
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          mensalidade_sm?: number
          nome?: string
          ordem?: number
          pontos_adicionais?: number
          pontos_capacidade?: number
          slug?: string
        }
        Relationships: []
      }
      wl_subscriptions: {
        Row: {
          auto_downgrade: boolean
          auto_upgrade: boolean
          capacidade_pontos: number
          created_at: string
          id: string
          owner_id: string
          plan_slug: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_downgrade?: boolean
          auto_upgrade?: boolean
          capacidade_pontos: number
          created_at?: string
          id?: string
          owner_id: string
          plan_slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_downgrade?: boolean
          auto_upgrade?: boolean
          capacidade_pontos?: number
          created_at?: string
          id?: string
          owner_id?: string
          plan_slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wl_subscriptions_plan_slug_fkey"
            columns: ["plan_slug"]
            isOneToOne: false
            referencedRelation: "wl_plans"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Views: {
      core_monetization_dashboard: {
        Row: {
          approved_count: number | null
          company_id: string | null
          event_type: string | null
          fee_cents: number | null
          gross_cents: number | null
          net_cents: number | null
          period_month: string | null
          reversed_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "core_payout_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_payout_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_payout_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_payout_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      n8n_lead_journey: {
        Row: {
          contact_email: string | null
          events: number | null
          failures: number | null
          first_seen_at: string | null
          last_seen_at: string | null
          reguas: string[] | null
          successes: number | null
          timeline: Json | null
          workflows: string[] | null
        }
        Relationships: []
      }
      n8n_runs_by_company: {
        Row: {
          company_id: string | null
          day: string | null
          failures: number | null
          oks: number | null
          regua: string | null
          status: string | null
          total: number | null
          workflow_name: string | null
        }
        Relationships: []
      }
      v_company_compliance_status: {
        Row: {
          applies_to: string | null
          blocking: boolean | null
          company_id: string | null
          document_kind: string | null
          label: string | null
          requirement_key: string | null
          satisfied: boolean | null
          satisfied_at: string | null
        }
        Relationships: []
      }
      v_company_macro: {
        Row: {
          company_id: string | null
          macro_nome: string | null
          macro_slug: string | null
          name: string | null
          niche_id: string | null
          niche_slug: string | null
          public_slug: string | null
          subdomain: string | null
          subnicho_nome: string | null
          subnicho_slug: string | null
          subnicho_slug_canonical: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "niches_macro_slug_fkey"
            columns: ["macro_slug"]
            isOneToOne: false
            referencedRelation: "core_macro_nichos"
            referencedColumns: ["slug"]
          },
        ]
      }
      v_company_whatsapp_status: {
        Row: {
          company_id: string | null
          company_name: string | null
          effective_credential_id: string | null
          has_verified_own: boolean | null
          own_credentials_count: number | null
          routing_mode: string | null
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          effective_credential_id?: never
          has_verified_own?: never
          own_credentials_count?: never
          routing_mode?: never
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          effective_credential_id?: never
          has_verified_own?: never
          own_credentials_count?: never
          routing_mode?: never
        }
        Relationships: []
      }
      v_core_slo_status: {
        Row: {
          availability_bps_24h: number | null
          availability_bps_7d: number | null
          availability_target_bps: number | null
          checks_24h: number | null
          checks_7d: number | null
          consecutive_failures: number | null
          currently_up: boolean | null
          error_budget_bps_left_7d: number | null
          latency_p95_target_ms: number | null
          p95_ms_24h: number | null
          since: string | null
          up_24h: number | null
          up_7d: number | null
          url: string | null
        }
        Relationships: []
      }
      v_fiscal_invoices_summary: {
        Row: {
          beneficiary_cnpj: string | null
          beneficiary_company_id: string | null
          beneficiary_name: string | null
          cancelled_at: string | null
          created_at: string | null
          environment: string | null
          id: string | null
          iss_amount: number | null
          issued_at: string | null
          net_amount: number | null
          nf_number: string | null
          nf_url: string | null
          provider: string | null
          rps: string | null
          service_amount: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_fiscal_invoices_beneficiary_company_id_fkey"
            columns: ["beneficiary_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_beneficiary_company_id_fkey"
            columns: ["beneficiary_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_beneficiary_company_id_fkey"
            columns: ["beneficiary_company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "core_fiscal_invoices_beneficiary_company_id_fkey"
            columns: ["beneficiary_company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_funnel_conversion: {
        Row: {
          capture: number | null
          capture_to_convert_pct: number | null
          convert: number | null
          convert_to_retain_pct: number | null
          expand: number | null
          niche_slug: string | null
          relate: number | null
          retain: number | null
        }
        Relationships: []
      }
      v_funnel_dispatch_stats: {
        Row: {
          avg_latency_seconds: number | null
          cancelled: number | null
          delivery_rate_pct: number | null
          failed: number | null
          last_activity_at: string | null
          niche_slug: string | null
          queued: number | null
          sent: number | null
          skipped: number | null
          stage: Database["public"]["Enums"]["core_funnel_stage"] | null
          total: number | null
          workflow_name: string | null
        }
        Relationships: []
      }
      v_funnel_recent_failures: {
        Row: {
          attempts: number | null
          entity_id: string | null
          entity_type: string | null
          event_name: string | null
          id: string | null
          last_error: string | null
          niche_slug: string | null
          scheduled_at: string | null
          stage: Database["public"]["Enums"]["core_funnel_stage"] | null
          updated_at: string | null
          workflow_name: string | null
        }
        Relationships: []
      }
      v_marketplace_gmv_summary: {
        Row: {
          company_id: string | null
          company_name: string | null
          completed_count: number | null
          effective_bps: number | null
          engagements_count: number | null
          gmv_cents: number | null
          intermediation_fee_cents: number | null
          niche_id: string | null
          period_month: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_provider_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_provider_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_macro"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_provider_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_whatsapp_status"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eco_marketplace_engagements_provider_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_identity_status"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_tenant_identity_status: {
        Row: {
          active_aliases_count: number | null
          aliases: Json | null
          company_id: string | null
          company_name: string | null
          company_slug: string | null
          custom_domain: string | null
          dns_status: string | null
          full_domain: string | null
          identity_id: string | null
          provisioned_at: string | null
          root_domain: string | null
          ssl_status: string | null
          subdomain: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _restaurant_session_total_cents: {
        Args: { _session_id: string }
        Returns: number
      }
      _seed_menu_item: {
        Args: {
          _audience: string[]
          _icon: string
          _label: string
          _niche_slugs: string[]
          _route: string
          _scope: string
          _seed_key: string
          _sort: number
        }
        Returns: undefined
      }
      _trial_norm: { Args: { _v: string }; Returns: string }
      add_business_days: {
        Args: { n_days: number; start_ts: string }
        Returns: string
      }
      add_table_order_item: {
        Args: {
          _item_id: string
          _notes?: string
          _quantity?: number
          _token: string
        }
        Returns: Json
      }
      admin_mark_invoice_paid: {
        Args: { _invoice_id: string; _kind: string }
        Returns: Json
      }
      aff_payout_request: {
        Args: {
          _amount: number
          _bank_data?: Json
          _company_id: string
          _pix_key?: string
        }
        Returns: string
      }
      agenda_claim_open_slot: {
        Args: {
          _ip?: string
          _professional_id: string
          _slot_id: string
          _user_agent?: string
        }
        Returns: {
          appointment_id: string | null
          claimed_at: string | null
          claimed_by_professional_id: string | null
          claimed_ip: string | null
          claimed_user_agent: string | null
          company_id: string
          created_at: string
          created_by: string | null
          current_wave: number
          distribution: Json
          ends_at: string
          expires_at: string | null
          id: string
          location_id: string | null
          metadata: Json
          oncall_shift_id: string | null
          origin: string
          payout_amount: number | null
          room_id: string | null
          service_id: string | null
          specialty: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "agenda_open_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_niche_template: {
        Args: { p_company_id: string; p_niche_slug: string }
        Returns: Json
      }
      assert_billing_finance_rls: { Args: never; Returns: undefined }
      assert_company_can_transact: {
        Args: { _company_id: string }
        Returns: undefined
      }
      assert_quotes_no_anon_update: { Args: never; Returns: undefined }
      assert_whatsapp_ready: { Args: { _company_id: string }; Returns: boolean }
      billing_check_company_status: {
        Args: { _company: string }
        Returns: {
          contract_id: string
          next_due_date: string
          overdue_invoice_id: string
          status: string
        }[]
      }
      billing_mark_paid: {
        Args: { _invoice_id: string; _paid_at?: string }
        Returns: string
      }
      billing_run_cycle: { Args: never; Returns: Json }
      calc_transaction_split: {
        Args: { _source_id: string; _source_table: string }
        Returns: string
      }
      company_can_transact: { Args: { _company_id: string }; Returns: boolean }
      company_identity_payload: { Args: { _company_id: string }; Returns: Json }
      compute_payout_release_date: {
        Args: {
          _captured_at: string
          _company_id: string
          _method: Database["public"]["Enums"]["payment_method_kind"]
          _niche_id: string
          _product_id: string
        }
        Returns: string
      }
      consumer_premium_overview: { Args: never; Returns: Json }
      consumer_upgrade_to_premium: {
        Args: never
        Returns: {
          amount_cents: number
          invoice_id: string
          membership_id: string
        }[]
      }
      core_schedule_cron: {
        Args: { p_job_name: string; p_path: string; p_schedule: string }
        Returns: undefined
      }
      core_user_belongs_to_company: {
        Args: { _company_id: string; _uid: string }
        Returns: boolean
      }
      current_company_macro: { Args: never; Returns: string }
      current_user_company_ids: { Args: never; Returns: string[] }
      customer_anonymize: {
        Args: { _customer_id: string; _reason?: string }
        Returns: string
      }
      dblink: { Args: { "": string }; Returns: Record<string, unknown>[] }
      dblink_cancel_query: { Args: { "": string }; Returns: string }
      dblink_close: { Args: { "": string }; Returns: string }
      dblink_connect: { Args: { "": string }; Returns: string }
      dblink_connect_u: { Args: { "": string }; Returns: string }
      dblink_current_query: { Args: never; Returns: string }
      dblink_disconnect:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      dblink_error_message: { Args: { "": string }; Returns: string }
      dblink_exec: { Args: { "": string }; Returns: string }
      dblink_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      dblink_get_connections: { Args: never; Returns: string[] }
      dblink_get_notify:
        | { Args: { conname: string }; Returns: Record<string, unknown>[] }
        | { Args: never; Returns: Record<string, unknown>[] }
      dblink_get_pkey: {
        Args: { "": string }
        Returns: Database["public"]["CompositeTypes"]["dblink_pkey_results"][]
        SetofOptions: {
          from: "*"
          to: "dblink_pkey_results"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      dblink_get_result: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      dblink_is_busy: { Args: { "": string }; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      demo_feira_overview: {
        Args: never
        Returns: {
          avg_modules_viewed: number
          by_niche: Json
          leads_24h: number
          leads_7d: number
          sessions_converted: number
          total_leads: number
          total_sessions: number
        }[]
      }
      demo_score: { Args: { _session_id: string }; Returns: number }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_fiscal_invoice: { Args: { _calc_id: string }; Returns: string }
      enqueue_funnel_event: {
        Args: {
          _company_id?: string
          _contact_email?: string
          _contact_phone?: string
          _entity_id?: string
          _entity_type?: string
          _event_name: string
          _lead_id?: string
          _niche_slug?: string
          _payload?: Json
          _stage: Database["public"]["Enums"]["core_funnel_stage"]
        }
        Returns: number
      }
      enqueue_marketplace_intermediation: {
        Args: { _engagement_id: string }
        Returns: string
      }
      enqueue_message: {
        Args: {
          _channels?: string[]
          _company_id: string
          _event_code: string
          _payload?: Json
          _recipient_email: string
          _recipient_name: string
          _recipient_phone: string
          _recipient_user_id: string
          _reference_id?: string
          _reference_type?: string
        }
        Returns: number
      }
      ensure_impulsionando_test_customer: {
        Args: { _company_id: string }
        Returns: string
      }
      evt_checkin_by_qr: {
        Args: { _gate?: string; _qr_token: string }
        Returns: Json
      }
      evt_decide_transfer: {
        Args: { _decision: string; _transfer_id: string }
        Returns: string
      }
      evt_transfer_ticket:
        | {
            Args: {
              _reason?: string
              _ticket_id: string
              _to_email: string
              _to_name: string
              _to_phone?: string
            }
            Returns: string
          }
        | {
            Args: {
              _reason?: string
              _ticket_id: string
              _to_document?: string
              _to_email: string
              _to_name: string
              _to_phone?: string
            }
            Returns: string
          }
      finalize_revenue_calculation: {
        Args: { _calc_id: string }
        Returns: string
      }
      get_catalog_intent_by_token: {
        Args: { p_token: string }
        Returns: {
          consumed_at: string | null
          conversion_kind: string | null
          converted_at: string | null
          created_at: string
          expires_at: string
          id: string
          last_reuse_attempt_at: string | null
          macro_slug: string
          plan_tier: string
          reuse_attempts: number
          selected_modules: string[]
          session_token: string | null
          source: string
          subnicho_slug: string
          user_id: string | null
          validated_fields: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "catalog_intents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_contab_portal_data: { Args: { _token: string }; Returns: Json }
      get_menu_for_audience: {
        Args: { _audience: string; _niche_slug?: string }
        Returns: {
          icon: string
          id: string
          label: string
          route: string
          scope: string
          sort_order: number
        }[]
      }
      get_niche_template: {
        Args: { p_niche_slug: string }
        Returns: {
          is_optional: boolean
          is_recommended: boolean
          module_name: string
          module_slug: string
          sort_order: number
        }[]
      }
      get_owner_portal_data: { Args: { _token: string }; Returns: Json }
      get_smoke_retention_info: { Args: never; Returns: Json }
      get_table_menu: { Args: { _token: string }; Returns: Json }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_brewery_access: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
      has_educ_role: {
        Args: {
          _polo_id?: string
          _role: Database["public"]["Enums"]["educ_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ecosystem_member: { Args: { _user_id: string }; Returns: boolean }
      is_impulsionando_staff: { Args: { _user: string }; Returns: boolean }
      is_marocas_authorized: { Args: { _user_id: string }; Returns: boolean }
      is_patient_of_record:
        | { Args: { _record: string; _user: string }; Returns: boolean }
        | {
            Args: { _company?: string; _record: string; _user: string }
            Returns: boolean
          }
      is_super_admin: { Args: { _user: string }; Returns: boolean }
      log_security_event: {
        Args: {
          _action: string
          _company?: string
          _entity: string
          _entity_id?: string
          _metadata?: Json
        }
        Returns: string
      }
      mark_billing_invoice_paid: {
        Args: { _invoice_id: string }
        Returns: Json
      }
      mark_membership_invoice_paid: {
        Args: { _invoice_id: string }
        Returns: Json
      }
      master_company_id: { Args: never; Returns: string }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      mp_send_pending_reminders: { Args: never; Returns: Json }
      mp_user_in_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      normalize_subdomain: { Args: { _input: string }; Returns: string }
      notify_user: {
        Args: {
          _action_label?: string
          _action_url?: string
          _category: string
          _company_id: string
          _message?: string
          _severity: string
          _title: string
          _user_id: string
        }
        Returns: string
      }
      open_incident: {
        Args: {
          _description?: string
          _metadata?: Json
          _runtime_scope?: string
          _scope: Database["public"]["Enums"]["core_slo_scope"]
          _severity?: Database["public"]["Enums"]["core_incident_severity"]
          _source?: string
          _title: string
          _url?: string
        }
        Returns: string
      }
      permission_matrix: {
        Args: never
        Returns: {
          granted: boolean
          is_master_profile: boolean
          permission_code: string
          permission_id: string
          permission_module: string
          profile_id: string
          profile_name: string
          profile_slug: string
        }[]
      }
      permission_matrix_toggle: {
        Args: { _granted: boolean; _permission_id: string; _profile_id: string }
        Returns: undefined
      }
      provision_tenant_identity: {
        Args: { _company_id: string }
        Returns: string
      }
      public_vitrine_list: {
        Args: { p_city?: string; p_limit?: number; p_segment?: string }
        Returns: {
          address_city: string
          address_state: string
          id: string
          logo_url: string
          name: string
          public_slug: string
          segment: string
          trade_name: string
        }[]
      }
      purge_smoke_runs: { Args: { days?: number }; Returns: number }
      purge_smoke_runs_detailed: {
        Args: {
          days?: number
          trigger_source?: string
          triggered_by_user?: string
        }
        Returns: Json
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      realestate_run_match_for_intent: {
        Args: { _intent_id: string }
        Returns: number
      }
      realestate_run_match_for_property: {
        Args: { _property_id: string }
        Returns: number
      }
      record_realestate_rate_limit_event: {
        Args: {
          _company_id: string
          _contact_email?: string
          _ip?: string
          _limit: number
          _observed_count: number
          _reason: string
        }
        Returns: string
      }
      render_template: {
        Args: { _payload: Json; _template: string }
        Returns: string
      }
      resolve_brewery_portal_token: {
        Args: { _token: string }
        Returns: {
          brand_id: string
          brand_logo_url: string
          brand_name: string
          brand_slug: string
          contact_name: string
          contract_status: string
          pdv_city: string
          pdv_link_id: string
          pdv_name: string
          pdv_state: string
        }[]
      }
      resolve_fee_rule: {
        Args: {
          _at?: string
          _company_id: string
          _method: Database["public"]["Enums"]["payment_method_kind"]
          _niche_id: string
          _product_id: string
        }
        Returns: {
          active: boolean
          company_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          fixed_cents: number
          id: string
          max_cents: number | null
          metadata: Json
          method: Database["public"]["Enums"]["payment_method_kind"] | null
          min_cents: number
          niche_id: string | null
          notes: string | null
          percent_bps: number
          priority: number
          product_id: string | null
          scope: Database["public"]["Enums"]["fee_rule_scope"]
          starts_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "core_fee_rules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_incident: {
        Args: {
          _note?: string
          _runtime_scope?: string
          _scope: Database["public"]["Enums"]["core_slo_scope"]
          _url?: string
        }
        Returns: string
      }
      resolve_intermediation_bps: {
        Args: { _niche_id?: string; _provider_company_id: string }
        Returns: number
      }
      resolve_payout_schedule: {
        Args: {
          _at?: string
          _company_id: string
          _method: Database["public"]["Enums"]["payment_method_kind"]
          _niche_id: string
          _product_id: string
        }
        Returns: {
          active: boolean
          basis: Database["public"]["Enums"]["payout_schedule_basis"]
          company_id: string | null
          created_at: string
          created_by: string | null
          delay_days: number
          ends_at: string | null
          id: string
          metadata: Json
          method: Database["public"]["Enums"]["payment_method_kind"] | null
          niche_id: string | null
          notes: string | null
          priority: number
          product_id: string | null
          reserve_bps: number
          scope: Database["public"]["Enums"]["fee_rule_scope"]
          starts_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "core_payout_schedule_rules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_realestate_partner_token: {
        Args: { _token: string }
        Returns: Json
      }
      resolve_table_qr: { Args: { _token: string }; Returns: Json }
      resolve_tenant_by_host: {
        Args: { _host: string }
        Returns: {
          domain: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          primary_color: string
          secondary_color: string
          subdomain: string
        }[]
      }
      resolve_whatsapp_credential: {
        Args: { _company_id: string; _event_code?: string }
        Returns: string
      }
      restaurant_create_table_invoice: {
        Args: { _token: string }
        Returns: Json
      }
      restaurant_force_new_table_invoice: {
        Args: { _token: string }
        Returns: Json
      }
      restaurant_get_table_invoice: {
        Args: { _invoice_id: string; _token: string }
        Returns: Json
      }
      restaurant_kitchen_board: { Args: never; Returns: Json }
      restaurant_list_table_invoices: {
        Args: { _token: string }
        Returns: Json
      }
      restaurant_mark_table_invoice_failed: {
        Args: { _invoice_id: string; _new_status?: string; _reason: string }
        Returns: Json
      }
      restaurant_mark_table_invoice_paid: {
        Args: { _invoice_id: string }
        Returns: Json
      }
      restaurant_set_item_status: {
        Args: { _item_id: string; _status: string }
        Returns: Json
      }
      restaurant_table_checkin: {
        Args: {
          _email?: string
          _name: string
          _party_size?: number
          _phone?: string
          _token: string
        }
        Returns: Json
      }
      sales_cash_session_close: {
        Args: { _counts: Json; _notes?: string; _session_id: string }
        Returns: string
      }
      set_tenant_subdomain: {
        Args: { _company_id: string; _new_subdomain: string }
        Returns: {
          company_id: string
          created_at: string
          custom_domain: string | null
          dns_error: string | null
          dns_last_checked_at: string | null
          dns_status: string
          full_domain: string | null
          id: string
          metadata: Json
          provisioned_at: string | null
          root_domain: string
          ssl_expires_at: string | null
          ssl_issued_at: string | null
          ssl_status: string
          subdomain: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "core_tenant_identity"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      subscription_suspend_overdue: { Args: never; Returns: number }
      trial_advance_status: { Args: never; Returns: number }
      trial_cancel: {
        Args: { _reason?: string; _trial_id: string }
        Returns: string
      }
      trial_check_abuse: {
        Args: {
          _company: string
          _doc: string
          _email: string
          _whatsapp: string
        }
        Returns: Json
      }
      trial_convert: {
        Args: { _paddle_sub?: string; _trial_id: string }
        Returns: string
      }
      trial_create: {
        Args: {
          _chosen_plan: Database["public"]["Enums"]["trial_plan_choice"]
          _contact_company: string
          _contact_doc: string
          _contact_email: string
          _contact_name: string
          _contact_whatsapp: string
          _link_acesso?: string
          _source?: string
          _terms_ip?: string
          _user_id?: string
        }
        Returns: string
      }
      trial_extend: {
        Args: { _days: number; _reason: string; _trial_id: string }
        Returns: string
      }
      trial_regularize: { Args: { _trial_id: string }; Returns: string }
      trigger_smoke_purge: { Args: { days?: number }; Returns: Json }
      user_belongs_to_company: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      user_has_company_module: {
        Args: { _module_slug: string; _user: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { _company: string; _perm: string; _user: string }
        Returns: boolean
      }
      webhook_log_register_replay: {
        Args: { _id: string; _reason: string; _user: string }
        Returns: Json
      }
    }
    Enums: {
      aff_affiliate_status:
        | "pendente"
        | "aprovado"
        | "reprovado"
        | "suspenso"
        | "bloqueado"
        | "inativo"
      aff_commission_kind:
        | "produtor"
        | "coprodutor"
        | "afiliado"
        | "gerente"
        | "plataforma"
      aff_link_kind: "link" | "cupom" | "qrcode"
      aff_offer_billing: "a_vista" | "parcelado" | "recorrente" | "assinatura"
      aff_payout_status:
        | "solicitado"
        | "aprovado"
        | "pago"
        | "rejeitado"
        | "cancelado"
      aff_product_kind:
        | "fisico"
        | "digital"
        | "servico"
        | "evento"
        | "assinatura"
        | "plano"
        | "consulta"
        | "agenda"
        | "curso"
        | "experiencia"
      aff_product_status: "draft" | "active" | "paused" | "blocked" | "closed"
      aff_sale_status:
        | "venda_registrada"
        | "pagto_pendente"
        | "aprovado"
        | "aguardando_gateway"
        | "aguardando_prazo_interno"
        | "disponivel"
        | "saque_solicitado"
        | "saque_aprovado"
        | "pago"
        | "cancelado"
        | "estornado"
        | "chargeback"
        | "bloqueado"
      app_role:
        | "admin"
        | "white_label"
        | "gestor"
        | "operador"
        | "profissional"
        | "consumidor"
      company_environment: "demo" | "teste" | "real"
      core_funnel_stage: "capture" | "convert" | "relate" | "retain" | "expand"
      core_incident_severity: "sev1" | "sev2" | "sev3" | "sev4"
      core_incident_status: "open" | "monitoring" | "resolved"
      core_slo_scope: "global" | "uptime_url" | "runtime_scope"
      educ_role: "mantenedora" | "polo" | "coordenador" | "consultor" | "aluno"
      fee_rule_scope:
        | "global"
        | "niche"
        | "company"
        | "product"
        | "service"
        | "subscription"
        | "affiliate"
        | "coproducer"
      marocas_apartment_status:
        | "disponivel"
        | "ocupado"
        | "manutencao"
        | "bloqueado"
      marocas_maintenance_priority: "baixa" | "media" | "alta" | "urgente"
      marocas_payment_status: "pendente" | "pago" | "atrasado" | "estornado"
      marocas_payout_status: "previsto" | "liberado" | "pago" | "contestado"
      marocas_professional_role:
        | "camareira"
        | "lavanderia"
        | "manutencao"
        | "vistoriador"
        | "gerente"
      marocas_service_status:
        | "agendado"
        | "em_andamento"
        | "concluido"
        | "cancelado"
        | "atrasado"
      marocas_service_type:
        | "limpeza"
        | "reposicao"
        | "enxoval"
        | "lavanderia"
        | "manutencao"
        | "vistoria"
      payment_method_kind:
        | "pix"
        | "credit_card"
        | "boleto"
        | "debit_card"
        | "wallet"
        | "other"
      payout_schedule_basis: "business_days" | "calendar_days"
      realestate_approval_status:
        | "pending"
        | "approved"
        | "changes_requested"
        | "rejected"
      realestate_intent_status: "ativo" | "pausado" | "atendido" | "arquivado"
      realestate_operation: "venda" | "locacao" | "venda_ou_locacao"
      realestate_property_status:
        | "rascunho"
        | "ativo"
        | "reservado"
        | "vendido"
        | "locado"
        | "inativo"
      realestate_property_type:
        | "apartamento"
        | "casa"
        | "casa_condominio"
        | "terreno"
        | "sala_comercial"
        | "loja"
        | "galpao"
        | "sitio"
        | "chacara"
        | "cobertura"
        | "kitnet"
        | "studio"
        | "outro"
      revenue_calc_status: "draft" | "final" | "recalculated" | "voided"
      support_ticket_origin:
        | "form"
        | "email"
        | "whatsapp"
        | "manual"
        | "system_error"
        | "payment_failure"
        | "integration_failure"
        | "webhook_failure"
      support_ticket_priority: "low" | "medium" | "high" | "critical"
      support_ticket_status:
        | "new"
        | "received"
        | "in_review"
        | "waiting_customer"
        | "waiting_core"
        | "waiting_third_party"
        | "in_development"
        | "resolved"
        | "closed"
        | "reopened"
        | "cancelled"
      support_ticket_type:
        | "financial"
        | "payment"
        | "payout"
        | "commission"
        | "contract"
        | "access"
        | "technical"
        | "whatsapp"
        | "email"
        | "mercadopago"
        | "dashboard"
        | "permission"
        | "registration"
        | "marketplace"
        | "clube"
        | "consumer"
        | "lgpd"
        | "suggestion"
        | "question"
        | "commercial"
        | "other"
      talentos_faixa_etaria:
        | "18-25"
        | "26-35"
        | "36-45"
        | "46-55"
        | "56-65"
        | "66-75"
        | "76+"
      talentos_stage:
        | "novo"
        | "favorito"
        | "entrevista"
        | "contratado"
        | "descartado"
      trial_plan_choice: "essencial" | "integrado" | "avancado" | "sob_medida"
      trial_status:
        | "solicitado"
        | "ativo"
        | "vence_3d"
        | "vence_1d"
        | "vence_hoje"
        | "encerrado"
        | "cobranca_gerada"
        | "pagamento_pendente"
        | "convertido"
        | "suspenso"
        | "regularizado"
        | "cancelado"
        | "expirado_sem_conversao"
    }
    CompositeTypes: {
      dblink_pkey_results: {
        position: number | null
        colname: string | null
      }
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
      aff_affiliate_status: [
        "pendente",
        "aprovado",
        "reprovado",
        "suspenso",
        "bloqueado",
        "inativo",
      ],
      aff_commission_kind: [
        "produtor",
        "coprodutor",
        "afiliado",
        "gerente",
        "plataforma",
      ],
      aff_link_kind: ["link", "cupom", "qrcode"],
      aff_offer_billing: ["a_vista", "parcelado", "recorrente", "assinatura"],
      aff_payout_status: [
        "solicitado",
        "aprovado",
        "pago",
        "rejeitado",
        "cancelado",
      ],
      aff_product_kind: [
        "fisico",
        "digital",
        "servico",
        "evento",
        "assinatura",
        "plano",
        "consulta",
        "agenda",
        "curso",
        "experiencia",
      ],
      aff_product_status: ["draft", "active", "paused", "blocked", "closed"],
      aff_sale_status: [
        "venda_registrada",
        "pagto_pendente",
        "aprovado",
        "aguardando_gateway",
        "aguardando_prazo_interno",
        "disponivel",
        "saque_solicitado",
        "saque_aprovado",
        "pago",
        "cancelado",
        "estornado",
        "chargeback",
        "bloqueado",
      ],
      app_role: [
        "admin",
        "white_label",
        "gestor",
        "operador",
        "profissional",
        "consumidor",
      ],
      company_environment: ["demo", "teste", "real"],
      core_funnel_stage: ["capture", "convert", "relate", "retain", "expand"],
      core_incident_severity: ["sev1", "sev2", "sev3", "sev4"],
      core_incident_status: ["open", "monitoring", "resolved"],
      core_slo_scope: ["global", "uptime_url", "runtime_scope"],
      educ_role: ["mantenedora", "polo", "coordenador", "consultor", "aluno"],
      fee_rule_scope: [
        "global",
        "niche",
        "company",
        "product",
        "service",
        "subscription",
        "affiliate",
        "coproducer",
      ],
      marocas_apartment_status: [
        "disponivel",
        "ocupado",
        "manutencao",
        "bloqueado",
      ],
      marocas_maintenance_priority: ["baixa", "media", "alta", "urgente"],
      marocas_payment_status: ["pendente", "pago", "atrasado", "estornado"],
      marocas_payout_status: ["previsto", "liberado", "pago", "contestado"],
      marocas_professional_role: [
        "camareira",
        "lavanderia",
        "manutencao",
        "vistoriador",
        "gerente",
      ],
      marocas_service_status: [
        "agendado",
        "em_andamento",
        "concluido",
        "cancelado",
        "atrasado",
      ],
      marocas_service_type: [
        "limpeza",
        "reposicao",
        "enxoval",
        "lavanderia",
        "manutencao",
        "vistoria",
      ],
      payment_method_kind: [
        "pix",
        "credit_card",
        "boleto",
        "debit_card",
        "wallet",
        "other",
      ],
      payout_schedule_basis: ["business_days", "calendar_days"],
      realestate_approval_status: [
        "pending",
        "approved",
        "changes_requested",
        "rejected",
      ],
      realestate_intent_status: ["ativo", "pausado", "atendido", "arquivado"],
      realestate_operation: ["venda", "locacao", "venda_ou_locacao"],
      realestate_property_status: [
        "rascunho",
        "ativo",
        "reservado",
        "vendido",
        "locado",
        "inativo",
      ],
      realestate_property_type: [
        "apartamento",
        "casa",
        "casa_condominio",
        "terreno",
        "sala_comercial",
        "loja",
        "galpao",
        "sitio",
        "chacara",
        "cobertura",
        "kitnet",
        "studio",
        "outro",
      ],
      revenue_calc_status: ["draft", "final", "recalculated", "voided"],
      support_ticket_origin: [
        "form",
        "email",
        "whatsapp",
        "manual",
        "system_error",
        "payment_failure",
        "integration_failure",
        "webhook_failure",
      ],
      support_ticket_priority: ["low", "medium", "high", "critical"],
      support_ticket_status: [
        "new",
        "received",
        "in_review",
        "waiting_customer",
        "waiting_core",
        "waiting_third_party",
        "in_development",
        "resolved",
        "closed",
        "reopened",
        "cancelled",
      ],
      support_ticket_type: [
        "financial",
        "payment",
        "payout",
        "commission",
        "contract",
        "access",
        "technical",
        "whatsapp",
        "email",
        "mercadopago",
        "dashboard",
        "permission",
        "registration",
        "marketplace",
        "clube",
        "consumer",
        "lgpd",
        "suggestion",
        "question",
        "commercial",
        "other",
      ],
      talentos_faixa_etaria: [
        "18-25",
        "26-35",
        "36-45",
        "46-55",
        "56-65",
        "66-75",
        "76+",
      ],
      talentos_stage: [
        "novo",
        "favorito",
        "entrevista",
        "contratado",
        "descartado",
      ],
      trial_plan_choice: ["essencial", "integrado", "avancado", "sob_medida"],
      trial_status: [
        "solicitado",
        "ativo",
        "vence_3d",
        "vence_1d",
        "vence_hoje",
        "encerrado",
        "cobranca_gerada",
        "pagamento_pendente",
        "convertido",
        "suspenso",
        "regularizado",
        "cancelado",
        "expirado_sem_conversao",
      ],
    },
  },
} as const
