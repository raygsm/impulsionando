import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
  md5Checksum?: string;
  parents?: string[];
  trashed?: boolean;
};

type InstitutionalKnowledgeHit = {
  driveFileId: string;
  fileName: string;
  documentType: string;
  modifiedTime: string | null;
  content?: string;
};

function requiredEnv(name: 'GOOGLE_DRIVE_CLIENT_ID' | 'GOOGLE_DRIVE_CLIENT_SECRET') {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

async function refreshAccessToken() {
  const { data: refreshToken, error } = await (supabaseAdmin as any).rpc('client_drive_get_google_refresh_token', { p_company_id: CHRISMED_COMPANY_ID });
  if (error || !refreshToken) throw new Error('google_drive_refresh_token_unavailable');
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: requiredEnv('GOOGLE_DRIVE_CLIENT_ID'),
      client_secret: requiredEnv('GOOGLE_DRIVE_CLIENT_SECRET'),
      refresh_token: String(refreshToken),
      grant_type: 'refresh_token',
    }),
  });
  const payload = await response.json().catch(() => ({})) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || 'google_drive_token_refresh_failed');
  return payload.access_token;
}

function classifyByName(name: string, mimeType: string) {
  const lower = name.toLowerCase();
  if (/nota.?fiscal|nfse|nfs-e|invoice|fatura/.test(lower)) return 'invoice';
  if (/contrato|contract/.test(lower)) return 'contract';
  if (/laudo|parecer/.test(lower)) return 'report';
  if (/termo|consent|consentimento/.test(lower)) return 'term';
  if (/prontuario|prontuário|evolucao|evolução/.test(lower)) return 'clinical';
  if (mimeType === 'application/vnd.google-apps.folder') return 'folder';
  return 'document';
}

export async function getChrismedDriveStatus() {
  const [{ data: connection }, { count: documentCount }, { count: linkedCount }] = await Promise.all([
    (supabaseAdmin as any).from('client_drive_connections').select('id,provider_account_email,status,connected_at,last_sync_at,last_error,scopes,metadata').eq('company_id', CHRISMED_COMPANY_ID).eq('provider', 'google_drive').maybeSingle(),
    (supabaseAdmin as any).from('client_drive_documents').select('id', { count: 'exact', head: true }).eq('company_id', CHRISMED_COMPANY_ID),
    (supabaseAdmin as any).from('client_drive_document_links').select('id', { count: 'exact', head: true }).eq('company_id', CHRISMED_COMPANY_ID).eq('release_to_entity', true),
  ]);
  return { connection: connection ?? null, documentCount: documentCount ?? 0, releasedLinks: linkedCount ?? 0 };
}

export async function syncChrismedDriveMetadata(actorUserId?: string | null) {
  const { data: connection, error: connectionError } = await (supabaseAdmin as any)
    .from('client_drive_connections')
    .select('id,status,provider_account_email')
    .eq('company_id', CHRISMED_COMPANY_ID)
    .eq('provider', 'google_drive')
    .eq('status', 'connected')
    .maybeSingle();
  if (connectionError || !connection) throw new Error('google_drive_not_connected');

  const accessToken = await refreshAccessToken();
  const allFiles: DriveFile[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      pageSize: '1000',
      fields: 'nextPageToken,files(id,name,mimeType,webViewLink,modifiedTime,size,md5Checksum,parents,trashed)',
      orderBy: 'modifiedTime desc',
      q: 'trashed = false',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const response = await fetch(`${DRIVE_FILES_URL}?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
    const payload = await response.json().catch(() => ({})) as { files?: DriveFile[]; nextPageToken?: string; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message || 'google_drive_files_list_failed');
    allFiles.push(...(payload.files ?? []));
    pageToken = payload.nextPageToken ?? '';
    if (allFiles.length >= 10000) break;
  } while (pageToken);

  const now = new Date().toISOString();
  for (const file of allFiles) {
    const documentType = classifyByName(file.name, file.mimeType);
    const record = {
      company_id: CHRISMED_COMPANY_ID,
      drive_connection_id: connection.id,
      drive_file_id: file.id,
      drive_parent_id: file.parents?.[0] ?? null,
      file_name: file.name,
      mime_type: file.mimeType,
      web_view_url: file.webViewLink ?? null,
      modified_time: file.modifiedTime ?? null,
      size_bytes: file.size ? Number(file.size) : null,
      checksum: file.md5Checksum ?? null,
      document_type: documentType,
      release_policy: documentType === 'clinical' ? 'care_team_only' : 'restricted',
      indexed_by: 'google_drive_metadata_sync',
      status: 'indexed',
      metadata: { source: 'google_drive', metadata_only: true, synced_at: now },
      updated_at: now,
    };
    const { error } = await (supabaseAdmin as any).from('client_drive_documents').upsert(record, { onConflict: 'company_id,drive_file_id' });
    if (error) throw error;
  }

  await Promise.all([
    (supabaseAdmin as any).from('client_drive_connections').update({ last_sync_at: now, last_error: null, updated_at: now, metadata: { file_count: allFiles.length, last_sync_mode: 'metadata' } }).eq('id', connection.id),
    (supabaseAdmin as any).from('client_drive_audit_log').insert({ company_id: CHRISMED_COMPANY_ID, actor_user_id: actorUserId ?? null, actor_type: actorUserId ? 'admin' : 'system', action: 'google_drive_metadata_sync', result: 'success', metadata: { files_seen: allFiles.length, account_email: connection.provider_account_email } }),
  ]);

  return { filesSeen: allFiles.length, syncedAt: now };
}

export async function fetchChrismedDriveFileContent(driveFileId: string) {
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(driveFileId)) throw new Error('invalid_drive_file_id');
  const { data: doc } = await (supabaseAdmin as any).from('client_drive_documents').select('id,mime_type,file_name,release_policy').eq('company_id', CHRISMED_COMPANY_ID).eq('drive_file_id', driveFileId).maybeSingle();
  if (!doc) throw new Error('drive_document_not_indexed');
  const accessToken = await refreshAccessToken();
  const isGoogleDoc = String(doc.mime_type).startsWith('application/vnd.google-apps.');
  const exportMime = doc.mime_type === 'application/vnd.google-apps.document' ? 'text/plain' : doc.mime_type === 'application/vnd.google-apps.spreadsheet' ? 'text/csv' : doc.mime_type === 'application/vnd.google-apps.presentation' ? 'text/plain' : null;
  const url = isGoogleDoc && exportMime
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}/export?mimeType=${encodeURIComponent(exportMime)}`
    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}?alt=media`;
  const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error('google_drive_file_read_failed');
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 15 * 1024 * 1024) throw new Error('drive_file_too_large_for_context');
  await (supabaseAdmin as any).from('client_drive_audit_log').insert({ company_id: CHRISMED_COMPANY_ID, drive_document_id: doc.id, actor_type: 'oliver', action: 'document_read_for_context', result: 'success', metadata: { drive_file_id: driveFileId, file_name: doc.file_name, release_policy: doc.release_policy } });
  return { document: doc, contentType, bytes };
}

function knowledgeTerms(query: string) {
  return Array.from(new Set(query.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((term) => term.length >= 4))).slice(0, 8);
}

/**
 * Busca segura para o chat público do Oliver.
 * Nunca inclui documentos clínicos, notas fiscais, laudos individuais ou qualquer
 * arquivo associado a CPF/CNPJ/titular. Conteúdo bruto não é retornado ao browser.
 */
export async function searchChrismedInstitutionalDriveKnowledge(query: string, limit = 4): Promise<InstitutionalKnowledgeHit[]> {
  const terms = knowledgeTerms(query);
  if (!terms.length) return [];
  const safeLimit = Math.min(Math.max(limit, 1), 6);

  let request = (supabaseAdmin as any)
    .from('client_drive_documents')
    .select('drive_file_id,file_name,mime_type,document_type,modified_time,party_document,party_name,release_policy,status')
    .eq('company_id', CHRISMED_COMPANY_ID)
    .eq('status', 'indexed')
    .is('party_document', null)
    .is('party_name', null)
    .in('document_type', ['document','contract','term'])
    .order('modified_time', { ascending: false })
    .limit(30);

  const { data, error } = await request;
  if (error) throw new Error(`drive_knowledge_search_failed:${error.message}`);

  const candidates = ((data ?? []) as Array<any>)
    .map((doc) => {
      const haystack = `${doc.file_name ?? ''} ${doc.document_type ?? ''}`.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { doc, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit);

  const hits: InstitutionalKnowledgeHit[] = [];
  for (const { doc } of candidates) {
    const hit: InstitutionalKnowledgeHit = {
      driveFileId: String(doc.drive_file_id),
      fileName: String(doc.file_name ?? 'Documento institucional'),
      documentType: String(doc.document_type ?? 'document'),
      modifiedTime: doc.modified_time ?? null,
    };
    const textReadable = ['application/vnd.google-apps.document','application/vnd.google-apps.spreadsheet','application/vnd.google-apps.presentation','text/plain','text/csv','text/markdown'].includes(String(doc.mime_type));
    if (textReadable) {
      try {
        const file = await fetchChrismedDriveFileContent(hit.driveFileId);
        if (file.contentType.startsWith('text/') || String(doc.mime_type).startsWith('application/vnd.google-apps.')) {
          const decoded = new TextDecoder('utf-8', { fatal: false }).decode(file.bytes);
          hit.content = decoded.replace(/\u0000/g, '').slice(0, 6000);
        }
      } catch (error) {
        console.error('[CHRISMED Drive knowledge read] metadata-only fallback', error);
      }
    }
    hits.push(hit);
  }

  if (hits.length) {
    await (supabaseAdmin as any).from('client_drive_audit_log').insert({
      company_id: CHRISMED_COMPANY_ID,
      actor_type: 'oliver',
      action: 'institutional_knowledge_search',
      result: 'success',
      metadata: { terms, result_count: hits.length, public_chat_safe_filter: true },
    });
  }
  return hits;
}

export { CHRISMED_COMPANY_ID };
