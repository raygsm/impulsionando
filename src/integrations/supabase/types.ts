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
      companies: {
        Row: {
          address_city: string | null
          address_line: string | null
          address_state: string | null
          address_zip: string | null
          commercial_email: string | null
          company_kind: string | null
          company_type: string | null
          created_at: string
          demo_expires_at: string | null
          demo_niche: string | null
          document: string | null
          domain: string | null
          email: string | null
          environment: Database["public"]["Enums"]["company_environment"]
          facebook: string | null
          financial_email: string | null
          id: string
          instagram: string | null
          is_active: boolean
          is_demo: boolean
          is_master: boolean
          legal_name: string | null
          logo_url: string | null
          name: string
          niche_id: string | null
          owner_name: string | null
          phone: string | null
          primary_color: string | null
          public_slug: string | null
          secondary_color: string | null
          segment: string | null
          status: string
          status_commercial: string | null
          status_financial: string | null
          status_technical: string | null
          subdomain: string | null
          support_email: string | null
          trade_name: string | null
          updated_at: string
          vitrine_enabled: boolean
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_line?: string | null
          address_state?: string | null
          address_zip?: string | null
          commercial_email?: string | null
          company_kind?: string | null
          company_type?: string | null
          created_at?: string
          demo_expires_at?: string | null
          demo_niche?: string | null
          document?: string | null
          domain?: string | null
          email?: string | null
          environment?: Database["public"]["Enums"]["company_environment"]
          facebook?: string | null
          financial_email?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_demo?: boolean
          is_master?: boolean
          legal_name?: string | null
          logo_url?: string | null
          name: string
          niche_id?: string | null
          owner_name?: string | null
          phone?: string | null
          primary_color?: string | null
          public_slug?: string | null
          secondary_color?: string | null
          segment?: string | null
          status?: string
          status_commercial?: string | null
          status_financial?: string | null
          status_technical?: string | null
          subdomain?: string | null
          support_email?: string | null
          trade_name?: string | null
          updated_at?: string
          vitrine_enabled?: boolean
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_line?: string | null
          address_state?: string | null
          address_zip?: string | null
          commercial_email?: string | null
          company_kind?: string | null
          company_type?: string | null
          created_at?: string
          demo_expires_at?: string | null
          demo_niche?: string | null
          document?: string | null
          domain?: string | null
          email?: string | null
          environment?: Database["public"]["Enums"]["company_environment"]
          facebook?: string | null
          financial_email?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_demo?: boolean
          is_master?: boolean
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          niche_id?: string | null
          owner_name?: string | null
          phone?: string | null
          primary_color?: string | null
          public_slug?: string | null
          secondary_color?: string | null
          segment?: string | null
          status?: string
          status_commercial?: string | null
          status_financial?: string | null
          status_technical?: string | null
          subdomain?: string | null
          support_email?: string | null
          trade_name?: string | null
          updated_at?: string
          vitrine_enabled?: boolean
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
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          marketing_optin: boolean
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          birthdate?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          marketing_optin?: boolean
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          birthdate?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          marketing_optin?: boolean
          phone?: string | null
          state?: string | null
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
            foreignKeyName: "contract_signatures_contract_document_id_fkey"
            columns: ["contract_document_id"]
            isOneToOne: false
            referencedRelation: "contract_documents"
            referencedColumns: ["id"]
          },
        ]
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
      infinitepay_payments: {
        Row: {
          amount: number
          capture_method: string | null
          checkout_url: string | null
          cliente_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          empresa_id: string | null
          environment: string
          id: string
          installments: number | null
          invoice_slug: string | null
          module_slugs: string[]
          modulo_id: string | null
          order_nsu: string
          paid_amount: number | null
          paid_at: string | null
          plano_id: string | null
          provider: string
          provisioned_at: string | null
          provisioning_log: Json
          provisioning_status: string
          raw_request: Json | null
          raw_response: Json | null
          receipt_url: string | null
          status: string
          transaction_nsu: string | null
          updated_at: string
          user_id: string | null
          webhook_payload: Json | null
        }
        Insert: {
          amount: number
          capture_method?: string | null
          checkout_url?: string | null
          cliente_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          empresa_id?: string | null
          environment?: string
          id?: string
          installments?: number | null
          invoice_slug?: string | null
          module_slugs?: string[]
          modulo_id?: string | null
          order_nsu: string
          paid_amount?: number | null
          paid_at?: string | null
          plano_id?: string | null
          provider?: string
          provisioned_at?: string | null
          provisioning_log?: Json
          provisioning_status?: string
          raw_request?: Json | null
          raw_response?: Json | null
          receipt_url?: string | null
          status?: string
          transaction_nsu?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_payload?: Json | null
        }
        Update: {
          amount?: number
          capture_method?: string | null
          checkout_url?: string | null
          cliente_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          empresa_id?: string | null
          environment?: string
          id?: string
          installments?: number | null
          invoice_slug?: string | null
          module_slugs?: string[]
          modulo_id?: string | null
          order_nsu?: string
          paid_amount?: number | null
          paid_at?: string | null
          plano_id?: string | null
          provider?: string
          provisioned_at?: string | null
          provisioning_log?: Json
          provisioning_status?: string
          raw_request?: Json | null
          raw_response?: Json | null
          receipt_url?: string | null
          status?: string
          transaction_nsu?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_payload?: Json | null
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
        ]
      }
      module_versions: {
        Row: {
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
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
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
        ]
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
      realestate_interests: {
        Row: {
          broker_user_id: string | null
          company_id: string
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
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
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          ip: string | null
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
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          ip?: string | null
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
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          ip?: string | null
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
            foreignKeyName: "sectors_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
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
          alert_emails: string[]
          alert_whatsapps: string[]
          consecutive_failures: number
          is_up: boolean
          last_alert_at: string | null
          last_check_at: string
          last_error: string | null
          since: string
          url: string
        }
        Insert: {
          alert_emails?: string[]
          alert_whatsapps?: string[]
          consecutive_failures?: number
          is_up: boolean
          last_alert_at?: string | null
          last_check_at?: string
          last_error?: string | null
          since?: string
          url: string
        }
        Update: {
          alert_emails?: string[]
          alert_whatsapps?: string[]
          consecutive_failures?: number
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
    }
    Views: {
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
      apply_niche_template: {
        Args: { p_company_id: string; p_niche_slug: string }
        Returns: Json
      }
      assert_billing_finance_rls: { Args: never; Returns: undefined }
      assert_quotes_no_anon_update: { Args: never; Returns: undefined }
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
      company_identity_payload: { Args: { _company_id: string }; Returns: Json }
      consumer_premium_overview: { Args: never; Returns: Json }
      consumer_upgrade_to_premium: {
        Args: never
        Returns: {
          amount_cents: number
          invoice_id: string
          membership_id: string
        }[]
      }
      core_user_belongs_to_company: {
        Args: { _company_id: string; _uid: string }
        Returns: boolean
      }
      current_user_company_ids: { Args: never; Returns: string[] }
      customer_anonymize: {
        Args: { _customer_id: string; _reason?: string }
        Returns: string
      }
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
      get_smoke_retention_info: { Args: never; Returns: Json }
      get_table_menu: { Args: { _token: string }; Returns: Json }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_impulsionando_staff: { Args: { _user: string }; Returns: boolean }
      is_patient_of_record:
        | { Args: { _record: string; _user: string }; Returns: boolean }
        | {
            Args: { _company?: string; _record: string; _user: string }
            Returns: boolean
          }
      is_super_admin: { Args: { _user: string }; Returns: boolean }
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
      render_template: {
        Args: { _payload: Json; _template: string }
        Returns: string
      }
      resolve_table_qr: { Args: { _token: string }; Returns: Json }
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
