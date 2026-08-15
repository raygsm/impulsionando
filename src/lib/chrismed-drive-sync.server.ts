import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';
const EXPECTED_ACCOUNT = 'chrissalencar@gmail.com';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

function requiredEnv(name: 'GOOGLE_DRIVE_CLIENT_ID' | 'GOOGLE_DRIVE_CLIENT_SECRET') {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

async function getRefreshToken() {
  const { data, error } = await (supabaseAdmin as any).rpc('client_drive_get_google_refresh_token', {
    p_company_id: CHRISMED_COMPANY_ID,
  });
  if (error) throw new Error(`drive_refresh_token_failed:${error.message}`);
  if (!data) throw new Error('drive_not_connected');
  return String(data);
}

async function getAccessToken() {
  const refreshToken = await getRefreshToken();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: requiredEnv('GOOGLE_DRIVE_CLIENT_ID'),
      client_secret: requiredEnv('GOOGLE_DRIVE_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const json = (await response.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !json.access_token) throw new Error(json.error_description || json.error || 'drive_access_token_failed');
  return json.access_token;
}

async function driveFetch(accessToken: string, url: string) {
  return fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
}

function classify(name: string, mimeType: string) {
  const value = `${name} ${mimeType}`.toLowerCase();
  if (/nota fiscal|nfse|nfs-e|invoice|fatura/.test(value)) return 'invoice';
  if (/contrato|contract/.test(value)) return 'contract';
  if (/laudo|relatorio medico|relatório médico/.test(value)) return 'clinical_report';
  if (/receita|prescricao|prescrição/.test(value)) return 'prescription';
  if (/exame|laboratorial|laboratory/.test(value)) return 'exam';
  if (/aso|ocupacional/.test(value)) return 'occupational';
  return 'unknown';
}

function textExportUrl(fileId: string, mimeType: string) {
  const id = encodeURIComponent(fileId);
  if (mimeType === 'application/vnd.google-apps.document') return `${DRIVE_FILES_URL}/${id}/export?mimeType=text%2Fplain`;
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return `${DRIVE_FILES_URL}/${id}/export?mimeType=text%2Fcsv`;
  if (mimeType === 'application/vnd.google-apps.presentation') return `${DRIVE_FILES_URL}/${id}/export?mimeType=text%2Fplain`;
  if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'text/csv') return `${DRIVE_FILES_URL}/${id}?alt=media`;
  return null;
}

async function extractSafeText(accessToken: string, fileId: string, mimeType: string) {
  const url = textExportUrl(fileId, mimeType);
  if (!url) return null;
  const response = await driveFetch(accessToken, url);
  if (!response.ok) return null;
  const text = await response.text();
  return text.replace(/\u0000/g, '').slice(0, 30000);
}

export async function syncChrismedGoogleDrive() {
  const { data: connection, error: connectionError } = await (supabaseAdmin as any)
    .from('client_drive_connections')
    .select('id,provider_account_email,status,root_folder_id')
    .eq('company_id', CHRISMED_COMPANY_ID)
    .eq('provider', 'google_drive')
    .maybeSingle();
  if (connectionError || !connection || connection.status !== 'connected') throw new Error('drive_not_connected');
  if (String(connection.provider_account_email ?? '').toLowerCase() !== EXPECTED_ACCOUNT) throw new Error('unexpected_drive_account');

  const accessToken = await getAccessToken();
  let pageToken: string | undefined;
  let indexed = 0;
  let withText = 0;
  let pages = 0;

  do {
    const params = new URLSearchParams({
      pageSize: '100',
      spaces: 'drive',
      orderBy: 'modifiedTime desc',
      q: "trashed = false",
      fields: 'nextPageToken,files(id,name,mimeType,parents,modifiedTime,size,md5Checksum,webViewLink,description,createdTime)',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const response = await driveFetch(accessToken, `${DRIVE_FILES_URL}?${params.toString()}`);
    const json = (await response.json().catch(() => ({}))) as { nextPageToken?: string; files?: Array<Record<string, any>>; error?: { message?: string } };
    if (!response.ok) throw new Error(json.error?.message || 'drive_files_list_failed');
    pages += 1;

    for (const file of json.files ?? []) {
      const mimeType = String(file.mimeType ?? '');
      if (mimeType === 'application/vnd.google-apps.folder') continue;
      const safeText = await extractSafeText(accessToken, String(file.id), mimeType);
      if (safeText) withText += 1;
      const docType = classify(String(file.name ?? ''), mimeType);
      const metadata = {
        drive_description: file.description ?? null,
        created_time: file.createdTime ?? null,
        text_excerpt: safeText,
        text_indexed: Boolean(safeText),
        sync_source: 'google_drive_readonly',
      };
      const { error } = await (supabaseAdmin as any).from('client_drive_documents').upsert({
        company_id: CHRISMED_COMPANY_ID,
        drive_connection_id: connection.id,
        drive_file_id: String(file.id),
        drive_parent_id: Array.isArray(file.parents) ? file.parents[0] ?? null : null,
        file_name: String(file.name ?? 'Arquivo sem nome'),
        mime_type: mimeType || null,
        web_view_url: file.webViewLink ?? null,
        modified_time: file.modifiedTime ?? null,
        size_bytes: file.size ? Number(file.size) : null,
        checksum: file.md5Checksum ?? null,
        document_type: docType,
        release_policy: 'restricted',
        indexed_by: 'oliver',
        status: 'active',
        metadata,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,drive_file_id' });
      if (error) throw new Error(`drive_document_upsert_failed:${error.message}`);
      indexed += 1;
    }
    pageToken = json.nextPageToken;
  } while (pageToken && pages < 50);

  const now = new Date().toISOString();
  await (supabaseAdmin as any).from('client_drive_connections').update({ last_sync: now, last_error: null, updated_at: now }).eq('id', connection.id);
  await (supabaseAdmin as any).from('client_drive_audit_log').insert({
    company_id: CHRISMED_COMPANY_ID,
    actor_type: 'system',
    action: 'google_drive_sync',
    result: 'success',
    metadata: { indexed, with_text: withText, pages, account_email: EXPECTED_ACCOUNT },
  });
  return { indexed, withText, pages, accountEmail: EXPECTED_ACCOUNT, syncedAt: now };
}

export async function searchChrismedTenantKnowledge(query: string, limit = 8) {
  const term = query.trim().slice(0, 500);
  if (!term) return { articles: [], driveDocuments: [] };
  const safeLimit = Math.min(Math.max(limit, 1), 12);
  const [articlesResult, driveResult] = await Promise.all([
    (supabaseAdmin as any).from('knowledge_articles')
      .select('slug,title,summary,body_markdown,category,audience,version')
      .eq('company_id', CHRISMED_COMPANY_ID).eq('status', 'published')
      .or(`title.ilike.%${term.replace(/[%_,]/g, '')}%,summary.ilike.%${term.replace(/[%_,]/g, '')}%,body_markdown.ilike.%${term.replace(/[%_,]/g, '')}%`)
      .limit(safeLimit),
    (supabaseAdmin as any).from('client_drive_documents')
      .select('id,file_name,mime_type,document_type,release_policy,metadata,modified_time')
      .eq('company_id', CHRISMED_COMPANY_ID).eq('status', 'active')
      .or(`file_name.ilike.%${term.replace(/[%_,]/g, '')}%,metadata->>text_excerpt.ilike.%${term.replace(/[%_,]/g, '')}%`)
      .limit(safeLimit),
  ]);
  return {
    articles: articlesResult.data ?? [],
    driveDocuments: (driveResult.data ?? []).map((doc: any) => ({
      id: doc.id,
      file_name: doc.file_name,
      mime_type: doc.mime_type,
      document_type: doc.document_type,
      release_policy: doc.release_policy,
      modified_time: doc.modified_time,
      text_excerpt: String(doc.metadata?.text_excerpt ?? '').slice(0, 12000),
    })),
  };
}
