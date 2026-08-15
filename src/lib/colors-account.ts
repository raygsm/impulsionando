import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ColorsAccountProfile={id:string;name:string;email:string|null;whatsapp:string|null;lifecycle_stage:string;lead_score:number;next_best_action:string};
export type ColorsOrderItem={id:string;description:string;quantity:number;unit_price:number;total:number;metadata?:Record<string,unknown>};
export type ColorsOrder={id:string;number:string;status:string;currency:string;subtotal:number;discount:number;shipping:number;total:number;created_at:string;metadata?:Record<string,any>;items:ColorsOrderItem[]};
export type ColorsDashboard={profile:ColorsAccountProfile|null;orders:ColorsOrder[];group_access?:{status?:string;reason?:string;invited_at?:string;joined_at?:string}};

async function requireSession(){const{data,error}=await supabase.auth.getSession();if(error)throw error;if(!data.session)throw new Error("AUTH_REQUIRED");return data.session;}
export async function loadColorsDashboard():Promise<ColorsDashboard>{await requireSession();const{data,error}=await supabase.rpc("colors_my_dashboard" as never);if(error)throw error;return(data??{profile:null,orders:[]}) as unknown as ColorsDashboard;}
export async function loadColorsOrder(id:string):Promise<ColorsOrder>{await requireSession();const{data,error}=await supabase.rpc("colors_my_order" as never,{p_order_id:id} as never);if(error)throw error;return data as unknown as ColorsOrder;}
export function useColorsDashboard(){return useQuery({queryKey:["colors-my-dashboard"],queryFn:loadColorsDashboard,staleTime:30_000,refetchInterval:60_000,retry:(count,error:any)=>error?.message!=="AUTH_REQUIRED"&&count<1});}
export function useColorsOrder(id:string){return useQuery({queryKey:["colors-my-order",id],queryFn:()=>loadColorsOrder(id),enabled:!!id,staleTime:30_000,retry:false});}
export function formatBRL(v:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v||0));}
export function formatDatePt(v:string,withTime=false){return new Intl.DateTimeFormat("pt-BR",withTime?{dateStyle:"short",timeStyle:"short"}:{dateStyle:"short"}).format(new Date(v));}
export function trackingCode(order:ColorsOrder){return String(order.metadata?.tracking_code??order.metadata?.trackingCode??"").trim();}
export function carrierName(order:ColorsOrder){return String(order.metadata?.carrier??order.metadata?.shipping_provider??order.metadata?.transportadora??"").trim();}
