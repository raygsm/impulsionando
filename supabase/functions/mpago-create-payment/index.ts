import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type RevshareEvent = 'sale' | 'rent' | 'recurring' | 'service' | 'subscription' | 'event' | 'product';
interface CreatePaymentBody {
  company_id: string;
  payment_method: 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'preference';