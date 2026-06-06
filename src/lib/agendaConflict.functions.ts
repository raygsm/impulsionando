import { createServerFn } from "@tanstack/react-start";

export type ConflictAgd = {
  id: string;
  profId: string;
  cliente: string;
  data: string;
  hora: string;
  status: "confirmado" | "pendente" | "cancelado" | "concluido";
  servicoNome?: string;
};

export function findConflicts(
  agds: ConflictAgd[],
  profId: string,
  data: string,
  hora: string,
): ConflictAgd[] {
  return agds.filter(
    (a) =>
      a.profId === profId &&
      a.data === data &&
      a.hora === hora &&
      a.status !== "cancelado",
  );
}

export function formatConflictMessage(
  conflicts: ConflictAgd[],
  profNome: string,
  data: string,
  hora: string,
): string {
  if (conflicts.length === 0) return "";
  const lista = conflicts
    .map(
      (c, i) =>
        `${i + 1}. ${c.cliente}${c.servicoNome ? ` — ${c.servicoNome}` : ""} (${c.status})`,
    )
    .join("\n");
  return `Conflito de horário\nProfissional: ${profNome}\nData: ${data}\nHorário: ${hora}\nClientes já agendados (${conflicts.length}):\n${lista}`;
}

/**
 * Server-side validation: throws if there is a conflict and the caller did not
 * explicitly request a double-booking. This runs even if the UI bypasses confirm().
 */
export const validateAgendamento = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      agds: ConflictAgd[];
      profId: string;
      profNome: string;
      data: string;
      hora: string;
      allowDoubleBooking?: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
    const conflicts = findConflicts(data.agds, data.profId, data.data, data.hora);
    if (conflicts.length > 0 && !data.allowDoubleBooking) {
      throw new Error(
        formatConflictMessage(conflicts, data.profNome, data.data, data.hora),
      );
    }
    return { ok: true, conflicts };
  });
