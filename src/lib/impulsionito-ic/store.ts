import { useCallback, useEffect, useState } from "react";
import type {
  HistoryEntry,
  ICItem,
  ICSectionKey,
  Learning,
  PromptVersion,
} from "./types";
import {
  SEED_HISTORY,
  SEED_ITEMS,
  SEED_LEARNINGS,
  SEED_PROMPT_VERSIONS,
} from "./seed";

const NS = "impulsionito-ic-v1";
const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(`${NS}:${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

const CURRENT_USER = "raygs@hotmail.com";
const nowIso = () => new Date().toISOString();

function ensureSeeded(section: ICSectionKey): ICItem[] {
  const key = `items:${section}`;
  const current = read<ICItem[] | null>(key, null);
  if (current && Array.isArray(current)) return current;
  const seed = SEED_ITEMS[section] ?? [];
  write(key, seed);
  return seed;
}

export function useICItems(section: ICSectionKey) {
  const [items, setItems] = useState<ICItem[]>(() => ensureSeeded(section));

  useEffect(() => {
    setItems(ensureSeeded(section));
  }, [section]);

  const persist = useCallback(
    (next: ICItem[]) => {
      write(`items:${section}`, next);
      setItems(next);
    },
    [section],
  );

  const upsert = useCallback(
    (draft: Partial<ICItem> & { id?: string; title: string; body: string }) => {
      const existing = draft.id ? items.find((i) => i.id === draft.id) : undefined;
      if (existing) {
        const newVersion = existing.version + 1;
        const updated: ICItem = {
          ...existing,
          title: draft.title,
          body: draft.body,
          tags: draft.tags ?? existing.tags,
          status: draft.status ?? existing.status,
          version: newVersion,
          updatedAt: nowIso(),
          updatedBy: CURRENT_USER,
          history: [
            ...existing.history,
            {
              version: newVersion,
              updatedAt: nowIso(),
              updatedBy: CURRENT_USER,
              note: "Edição manual",
              snapshot: {
                title: draft.title,
                body: draft.body,
                tags: draft.tags ?? existing.tags,
                status: draft.status ?? existing.status,
              },
            },
          ],
        };
        persist(items.map((i) => (i.id === existing.id ? updated : i)));
        return updated;
      }
      const created: ICItem = {
        id: `${section}-${Math.random().toString(36).slice(2, 8)}`,
        title: draft.title,
        body: draft.body,
        tags: draft.tags ?? [],
        status: draft.status ?? "rascunho",
        version: 1,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        updatedBy: CURRENT_USER,
        history: [
          {
            version: 1,
            updatedAt: nowIso(),
            updatedBy: CURRENT_USER,
            note: "Criado",
            snapshot: {
              title: draft.title,
              body: draft.body,
              tags: draft.tags ?? [],
              status: draft.status ?? "rascunho",
            },
          },
        ],
      };
      persist([created, ...items]);
      return created;
    },
    [items, persist, section],
  );

  const setStatus = useCallback(
    (id: string, status: ICItem["status"]) => {
      persist(
        items.map((i) =>
          i.id === id
            ? {
                ...i,
                status,
                updatedAt: nowIso(),
                updatedBy: CURRENT_USER,
                history: [
                  ...i.history,
                  {
                    version: i.version,
                    updatedAt: nowIso(),
                    updatedBy: CURRENT_USER,
                    note: `Status → ${status}`,
                    snapshot: { status },
                  },
                ],
              }
            : i,
        ),
      );
    },
    [items, persist],
  );

  const remove = useCallback(
    (id: string) => persist(items.filter((i) => i.id !== id)),
    [items, persist],
  );

  return { items, upsert, setStatus, remove };
}

// Learnings ---------------------------------------------------------------
export function useLearnings() {
  const [items, setItems] = useState<Learning[]>(() => {
    const cur = read<Learning[] | null>("learnings", null);
    if (cur) return cur;
    write("learnings", SEED_LEARNINGS);
    return SEED_LEARNINGS;
  });
  const persist = useCallback((next: Learning[]) => {
    write("learnings", next);
    setItems(next);
  }, []);
  const update = useCallback(
    (id: string, patch: Partial<Learning>) =>
      persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [items, persist],
  );
  return { items, update };
}

// Histórico ---------------------------------------------------------------
export function useHistory() {
  const [items] = useState<HistoryEntry[]>(() => {
    const cur = read<HistoryEntry[] | null>("history", null);
    if (cur) return cur;
    write("history", SEED_HISTORY);
    return SEED_HISTORY;
  });
  return { items };
}

// Prompt versions ---------------------------------------------------------
export function usePromptVersions() {
  const [items, setItems] = useState<PromptVersion[]>(() => {
    const cur = read<PromptVersion[] | null>("prompt-versions", null);
    if (cur) return cur;
    write("prompt-versions", SEED_PROMPT_VERSIONS);
    return SEED_PROMPT_VERSIONS;
  });
  const persist = useCallback((next: PromptVersion[]) => {
    write("prompt-versions", next);
    setItems(next);
  }, []);
  const activate = useCallback(
    (id: string) =>
      persist(items.map((v) => ({ ...v, activated: v.id === id }))),
    [items, persist],
  );
  const publish = useCallback(
    (note: string, composition: string[]) => {
      const nextVersion = items.reduce((m, v) => Math.max(m, v.version), 0) + 1;
      const created: PromptVersion = {
        id: `pv-${nextVersion}`,
        version: nextVersion,
        createdAt: nowIso(),
        createdBy: CURRENT_USER,
        note,
        composition,
        activated: true,
      };
      persist([created, ...items.map((v) => ({ ...v, activated: false }))]);
      return created;
    },
    [items, persist],
  );
  return { items, activate, publish };
}
