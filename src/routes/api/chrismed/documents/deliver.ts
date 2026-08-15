import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { getAuthorizedDriveDocumentForUser } from '@/lib/chrismed-drive-delivery.server';

export const Route=createFileRoute('/api/chrismed/documents/deliver')({server:{handlers:{POST:async({request})=>{
  const bearer=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')??'';
  if(!bearer)return Response.json({error:'unauthorized'},{status:401});
  const {data,error}=await supabaseAdmin.auth.getUser(bearer);if(error||!data.user)return Response.json({error:'unauthorized'},{status:401});
  const body=await request.json().catch(()=>({})) as {documentId?:string};const documentId=String(body.documentId??'');
  if(!/^[0-9a-f-]{36}$/i.test(documentId))return Response.json({error:'invalid_document_id'},{status:400});
  try{const delivered=await getAuthorizedDriveDocumentForUser(documentId,data.user.id);const safeName=delivered.fileName.replace(/[\r\n"\\]/g,'_');return new Response(delivered.bytes,{status:200,headers:{'content-type':delivered.contentType,'content-disposition':`attachment; filename="${safeName}"`,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});}catch(e){const message=e instanceof Error?e.message:'document_delivery_failed';const status=message==='document_not_authorized'?403:message==='document_not_found'?404:500;return Response.json({error:message},{status});}
}}}});
