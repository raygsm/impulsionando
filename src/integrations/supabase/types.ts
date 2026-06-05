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
      companies: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          is_master: boolean
          legal_name: string | null
          logo_url: string | null
          name: string
          niche_id: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_master?: boolean
          legal_name?: string | null
          logo_url?: string | null
          name: string
          niche_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_master?: boolean
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          niche_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
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
          is_enabled: boolean
          module_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          enabled_at?: string | null
          id?: string
          is_enabled?: boolean
          module_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          enabled_at?: string | null
          id?: string
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
      modules: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_core: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_core?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_core?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_company_ids: { Args: never; Returns: string[] }
      customer_anonymize: {
        Args: { _customer_id: string; _reason?: string }
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
      is_impulsionando_staff: { Args: { _user: string }; Returns: boolean }
      is_patient_of_record: {
        Args: { _record: string; _user: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user: string }; Returns: boolean }
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
      render_template: {
        Args: { _payload: Json; _template: string }
        Returns: string
      }
      sales_cash_session_close: {
        Args: { _counts: Json; _notes?: string; _session_id: string }
        Returns: string
      }
      user_belongs_to_company: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { _company: string; _perm: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
