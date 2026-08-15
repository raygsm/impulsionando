import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CHRISMED_COMPANY_ID='642096b5-a9ff-4521-a82a-c004f6d2e2d2';
const TOKEN_URL='https://oauth2.googleapis.com/token';
const FILES_URL='https://www.googleapis.com/drive/v3/files';

function env(name:'GOOGLE_DRIVE_CLIENT_ID'|'GOOGLE_DRIVE_CLIENT_SECRET'){const value=process.env[name]?.trim();if(!value)throw new Error(`missing_${name.toLowerCase()}`);return value;}
async function accessToken(){const {data:refresh,error}=await (supabaseAdmin as any).rpc('client_drive_get_google_refresh_token',{p_company_id:CHRISMED_COMPANY_ID});if(error||!refresh)throw new Error('drive_not_connected');const r=await fetch(TOKEN_URL,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env('GOOGLE_DRIVE_CLIENT_ID'),client_secret:env('GOOGLE_DRIVE_CLIENT_SECRET'),refresh_token:String(refresh),grant_type:'refresh_token'})});const j=await r.json().catch(()=>({})) as any;if(!r.ok||!j.access_token)throw new Error('drive_token_refresh_failed');return String(j.access_token);}

export async function getAuthorizedDriveDocumentForUser(documentId:string,userId:string){
  const {data:doc,error}=await (supabaseAdmin as any).from('client_drive_documents').select('id,drive_file_id,file_name,mime_type,release_policy,status').eq('id',documentId).eq('company_id',CHRISMED_COMPANY_ID).eq('status','active').maybeSingle();
  if(error||!doc)throw new Error('document_not_found');
  const {data:links,error:linkError}=await (supabaseAdmin as any).from('client_drive_document_links').select('id,entity_type,entity_id,release_to_entity').eq('company_id',CHRISMED_COMPANY_ID).eq('drive_document_id',documentId).eq('release_to_entity',true);
  if(linkError)throw new Error('document_authorization_failed');
  let authorized=false;let entityType='';let entityId='';
  for(const link of links??[]){
    if(link.entity_type==='patient'&&String(link.entity_id)===userId){authorized=true;entityType='patient';entityId=String(link.entity_id);break;}
    if(link.entity_type==='company'){
      const {data:membership}=await (supabaseAdmin as any).from('chrismed_occ_company_users').select('id').eq('user_id',userId).eq('client_company_id',link.entity_id).eq('active',true).maybeSingle();
      if(membership){authorized=true;entityType='company';entityId=String(link.entity_id);break;}
    }
  }
  if(!authorized)throw new Error('document_not_authorized');
  const token=await accessToken();
  const mime=String(doc.mime_type??'application/octet-stream');
  const google=mime.startsWith('application/vnd.google-apps.');
  const exportMime=mime==='application/vnd.google-apps.document'?'application/pdf':mime==='application/vnd.google-apps.spreadsheet'?'application/pdf':mime==='application/vnd.google-apps.presentation'?'application/pdf':null;
  if(google&&!exportMime)throw new Error('unsupported_google_document_type');
  const url=google?`${FILES_URL}/${encodeURIComponent(doc.drive_file_id)}/export?mimeType=${encodeURIComponent(exportMime!)}`:`${FILES_URL}/${encodeURIComponent(doc.drive_file_id)}?alt=media`;
  const response=await fetch(url,{headers:{authorization:`Bearer ${token}`}});if(!response.ok)throw new Error('drive_document_read_failed');
  const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.byteLength>25*1024*1024)throw new Error('document_too_large');
  const deliveredType=google?'application/pdf':response.headers.get('content-type')||mime;
  await (supabaseAdmin as any).from('client_drive_audit_log').insert({company_id:CHRISMED_COMPANY_ID,drive_document_id:doc.id,actor_user_id:userId,actor_type:'user',action:'authorized_document_delivery',result:'success',metadata:{entity_type:entityType,entity_id:entityId,file_name:doc.file_name,release_policy:doc.release_policy}});
  return{bytes,contentType:deliveredType,fileName:String(doc.file_name||'documento')};
}
