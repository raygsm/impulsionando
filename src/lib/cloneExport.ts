import JSZip from "jszip";
import {
  buildCloneExportPayload,
  cloneStore,
  importCloneExportPayload,
  safeFileName,
  type CloneExportPayload,
  type CloneImportResult,
  type CloneInstance,
} from "@/lib/cloneCentral";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildReadme(payload: CloneExportPayload) {
  const i = payload.instance;
  return `Impulsionando — Export de Módulo Clonado
=========================================

Projeto/Cliente: ${i.targetName}${i.fantasy ? ` (${i.fantasy})` : ""}
Módulo-base:     ${payload.base?.name ?? i.baseId} — v${payload.base?.version ?? "?"}
Nicho / Preset:  ${i.niche ?? "—"} / ${i.preset ?? "—"}
Ambiente:        ${i.environment ?? "—"}
Integrações:     ${(i.integrations ?? []).join(", ") || "Nenhuma"}
Responsável:     ${i.responsibleName ?? "—"}${i.responsibleEmail ? ` <${i.responsibleEmail}>` : ""}
Exportado em:    ${new Date(payload.exportedAt).toLocaleString("pt-BR")}${
    payload.exportedBy ? ` por ${payload.exportedBy}` : ""
  }
Versão export:   ${payload.exportVersion}

Como importar:
1. Acesse "Central Interna de Clonagem" no projeto de destino.
2. Use o botão "Importar módulo" e selecione o arquivo .json (ou .zip).
3. A nova instância será criada com novo ID. Credenciais e dados sensíveis
   não acompanham o arquivo e devem ser configurados no destino.

Conteúdo:
- clone.json   → payload estrutural (instância + módulo-base + integrações + preset)
- README.txt   → este arquivo
`;
}

export function exportCloneAsJSON(instance: CloneInstance, exportedBy?: string) {
  const payload = buildCloneExportPayload(instance, exportedBy);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const name = `clone-${safeFileName(instance.targetName)}-${safeFileName(
    payload.base?.slug ?? instance.baseId,
  )}.json`;
  triggerDownload(blob, name);
  cloneStore.pushLog({
    actor: exportedBy ?? "interno",
    action: "duplicou",
    detail: `Exportou clone "${instance.targetName}" como JSON.`,
    instanceId: instance.id,
    status: "concluido",
  });
}

export async function exportCloneAsZIP(instance: CloneInstance, exportedBy?: string) {
  const payload = buildCloneExportPayload(instance, exportedBy);
  const zip = new JSZip();
  zip.file("clone.json", JSON.stringify(payload, null, 2));
  zip.file("README.txt", buildReadme(payload));
  const blob = await zip.generateAsync({ type: "blob" });
  const name = `clone-${safeFileName(instance.targetName)}-${safeFileName(
    payload.base?.slug ?? instance.baseId,
  )}.zip`;
  triggerDownload(blob, name);
  cloneStore.pushLog({
    actor: exportedBy ?? "interno",
    action: "duplicou",
    detail: `Exportou clone "${instance.targetName}" como ZIP.`,
    instanceId: instance.id,
    status: "concluido",
  });
}

export async function importCloneFromFile(
  file: File,
  actor: string,
): Promise<CloneImportResult> {
  const name = file.name.toLowerCase();
  let jsonText: string;
  if (name.endsWith(".zip")) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = zip.file("clone.json") ?? zip.file(/clone\.json$/i)[0];
    if (!entry) throw new Error("ZIP não contém clone.json.");
    jsonText = await entry.async("string");
  } else if (name.endsWith(".json")) {
    jsonText = await file.text();
  } else {
    throw new Error("Formato não suportado. Use .json ou .zip.");
  }
  let payload: CloneExportPayload;
  try {
    payload = JSON.parse(jsonText) as CloneExportPayload;
  } catch {
    throw new Error("Arquivo JSON inválido.");
  }
  return importCloneExportPayload(payload, { actor });
}
