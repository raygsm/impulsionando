import { createFileRoute } from '@tanstack/react-router';
import { authenticateChrismedDriveAdmin } from '@/lib/chrismed-google-drive.server';
import { validateChrismedFocusCredential } from '@/lib/chrismed-focus-nfse.server';

export const Route=createFileRoute('/api/chrismed/fiscal/focus/validate')({server:{handlers:{POST:async({request})=>{
  const user=await authenticateChrismedDriveAdmin(request);
  if(!user)return Response.json({error:'unauthorized'},{status:401});
  try{return Response.json({ok:true,...await validateChrismedFocusCredential(user.id)});}catch(error){const message=error instanceof Error?error.message:'focus_validation_failed';const status=message==='focus_token_not_configured'?409:message==='focus_credential_rejected'?422:500;return Response.json({error:message},{status});}
}}}});
