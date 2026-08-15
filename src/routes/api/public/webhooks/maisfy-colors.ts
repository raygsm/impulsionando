/**
 * Maisfy -> Colors webhook.
 * Produção: https://colors.impulsionando.com.br/api/public/webhooks/maisfy-colors
 *
 * Contrato baseado no webhook oficial Maisfy: order.created, order.paid, order.canceled.
 * Autenticação aceita HMAC quando o emissor/bridge enviar assinatura, ou token secreto
 * na URL (?token=...) quando o painel permitir apenas URL de destino.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function safeEqual(a:string,b:string){try{const aa=Buffer.from(a);const bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}catch{return false;}}
function verifyHmac(secret:string,body:string,header:string|null){if(!header)return false;const provided=header.startsWith("sha256=")?header.slice(7):header;const expected=createHmac("sha256",secret).update(body).digest("hex");return safeEqual(expected,provided);}
function authorized(request:Request,body:string){const hmacSecret=process.env.COLORS_MAISFY_WEBHOOK_SECRET??"";const tokenSecret=process.env.COLORS_MAISFY_WEBHOOK_TOKEN??"";const sig=request.headers.get("x-signature")??request.headers.get("x-hub-signature-256");if(hmacSecret&&verifyHmac(hmacSecret,body,sig))return true;if(tokenSecret){const supplied=new URL(request.url).searchParams.get("token")??"";if(supplied&&safeEqual(tokenSecret,supplied))return true;}return false;}
function int(v:unknown,fallback?:number){const n=typeof v==="number"?v:Number(v);return Number.isFinite(n)?Math.round(n):(fallback??0);}
function eventStatus(event:string,financial?:string){const f=(financial??"").toUpperCase();if(event==="order.paid"||f==="APPROVED")return"approved";if(event==="order.canceled"||f==="CANCELED")return"canceled";return"pending";}

export const Route=createFileRoute("/api/public/webhooks/maisfy-colors")({server:{handlers:{
  GET:async()=>Response.json({ok:true,provider:"maisfy",events:["order.created","order.paid","order.canceled"],auth:"HMAC or secret URL token"}),
  POST:async({request})=>{
    const body=await request.text();if(!process.env.COLORS_MAISFY_WEBHOOK_SECRET&&!process.env.COLORS_MAISFY_WEBHOOK_TOKEN)return new Response("Webhook authentication not configured",{status:424});if(!authorized(request,body))return new Response("Invalid webhook authentication",{status:401});
    let payload:any;try{payload=JSON.parse(body);}catch{return new Response("Invalid JSON",{status:400});}
    const event=String(payload?.event??"");if(!["order.created","order.paid","order.canceled"].includes(event))return Response.json({ok:true,ignored:true,event});
    const d=payload?.data??{};const externalSaleId=String(d.order??d.id??payload.id??"");if(!externalSaleId)return new Response("Missing order id",{status:400});
    const customer=d.customer??{};const address=customer.address??{};const parameters=d.parameters??{};const product=d.product??{};
    const {supabaseAdmin}=await import("@/integrations/supabase/client.server");const {reconcileColorsSale}=await import("@/lib/colors-reconcile.server");
    try{
      const result=await reconcileColorsSale(supabaseAdmin as any,{platform:"maisfy",external_sale_id:externalSaleId,external_order_id:String(d.order??externalSaleId),colors_checkout_id:parameters.colors_checkout_id??parameters.sub_id??parameters.ref??d.ca??undefined,external_status:eventStatus(event,d.financial_status),customer_name:customer.name,customer_email:customer.email??d.email,customer_whatsapp:customer.cellphone,product_slug:parameters.prod??d.product_code,product_name:product.name,quantity:1,kit_size:1,unit_price_cents:int(product.price)||undefined,total_price_cents:int(d.total_amount)||int(d.checkout_price)||undefined,coupon:Array.isArray(d.coupons)?d.coupons.join(","):undefined,affiliate_code:d.affiliate??d.ca??undefined,approved_at:event==="order.paid"?payload.creation_date:undefined,raw:payload,source:"webhook"});
      const eventId=String(payload.id??`maisfy:${event}:${externalSaleId}`);
      await(supabaseAdmin as any).from("colors_event_bus").upsert({event_id:eventId,event_type:event==="order.paid"?"PAYMENT_APPROVED":event==="order.canceled"?"ORDER_CANCELED":"PAYMENT_PENDING",aggregate_type:"order",aggregate_id:externalSaleId,payload:{provider:"maisfy",event,order:externalSaleId,utm:{utm_source:parameters.utm_source??null,utm_medium:parameters.utm_medium??null,utm_campaign:parameters.utm_campaign??null,utm_content:parameters.utm_content??null,utm_term:parameters.utm_term??null},payment_type:d.payment_type??null,installments:d.installments??null,affiliate:d.affiliate??d.ca??null}}, {onConflict:"event_id",ignoreDuplicates:true});
      return Response.json({ok:true,event,...result});
    }catch(error){console.error("[maisfy-colors] reconcile failed",error);return new Response("Reconciliation failed",{status:500});}
  }
}}});
