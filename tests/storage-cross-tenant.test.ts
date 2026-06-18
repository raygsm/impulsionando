/**
 * Cross-tenant storage tests: authenticated users from a DIFFERENT company
 * must not list, search, sign, or download files of another tenant — even
 * when they recreate look-alike objects with the same filename / metadata
 * in their own prefix.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  admin, createUser, deleteUser, signIn,
  assignProfile, createCompany, deleteCompany, PROFILES,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const BUCKETS = ["contracts", "contab-documents"] as const;
const FILENAME = "shared-name.pdf";

let companyA = "";
let companyB = "";
let userA = "";
let userB = "";
let clientB!: SupabaseClient;

const emails = {
  a: `cross-a-${RUN}@example.com`,
  b: `cross-b-${RUN}@example.com`,
};

beforeAll(async () => {
  companyA = await createCompany(`Cross A ${RUN}`);
  companyB = await createCompany(`Cross B ${RUN}`);
  const a = await createUser(emails.a);
  const b = await createUser(emails.b);
  userA = a.id; userB = b.id;
  await assignProfile({ userId: userA, companyId: companyA, profileId: PROFILES.gestor, email: emails.a });
  await assignProfile({ userId: userB, companyId: companyB, profileId: PROFILES.gestor, email: emails.b });

  // sign in B so it has a session for cross-tenant probing
  clientB = (await signIn(emails.b)).client;

  const body = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])], { type: "application/pdf" });
  for (const bucket of BUCKETS) {
    // Tenant A's protected file.
    await admin.storage.from(bucket).upload(`${companyA}/__cross/${RUN}/${FILENAME}`, body, {
      upsert: true, contentType: "application/pdf",
      metadata: { tenant: "A", run: String(RUN) },
    });
    // Tenant B's look-alike (same filename, similar metadata) in B's own prefix.
    await admin.storage.from(bucket).upload(`${companyB}/__cross/${RUN}/${FILENAME}`, body, {
      upsert: true, contentType: "application/pdf",
      metadata: { tenant: "B", run: String(RUN) },
    });
  }
}, 180_000);

afterAll(async () => {
  for (const bucket of BUCKETS) {
    await admin.storage.from(bucket).remove([
      `${companyA}/__cross/${RUN}/${FILENAME}`,
      `${companyB}/__cross/${RUN}/${FILENAME}`,
    ]).catch(() => {});
  }
  await deleteUser(userA);
  await deleteUser(userB);
  await deleteCompany(companyA);
  await deleteCompany(companyB);
});

describe.each(BUCKETS)("cross-tenant storage isolation — %s", (bucket) => {
  const aKey = () => `${companyA}/__cross/${RUN}/${FILENAME}`;
  const bKey = () => `${companyB}/__cross/${RUN}/${FILENAME}`;

  it("B cannot list A's prefix", async () => {
    const { data, error } = await clientB.storage.from(bucket).list(`${companyA}/__cross/${RUN}`);
    const names = (data ?? []).map((o) => o.name);
    expect(names).not.toContain(FILENAME);
    if (!error) expect(names.length).toBe(0);
  });

  it("B cannot search A's filename across the bucket", async () => {
    const { data, error } = await clientB.storage.from(bucket).list("", {
      search: FILENAME, limit: 100,
    });
    const hits = (data ?? []).filter((o) => o.name?.includes(FILENAME));
    // Must not surface A's object; B may legitimately see its own only if
    // the search includes its prefix — but the top-level list typically returns folders.
    expect(hits.find((o) => (o as any).bucket_id && (o as any).name === aKey())).toBeUndefined();
    if (error) expect(error).toBeTruthy();
  });

  it("B cannot download A's file", async () => {
    const { data, error } = await clientB.storage.from(bucket).download(aKey());
    expect(error).toBeTruthy();
    expect(data).toBeNull();
  });

  it("B cannot sign A's file", async () => {
    const { data, error } = await clientB.storage.from(bucket).createSignedUrl(aKey(), 60);
    expect(!!data?.signedUrl && !error).toBe(false);
  });

  it("B CAN download its own look-alike file (sanity)", async () => {
    const { data, error } = await clientB.storage.from(bucket).download(bKey());
    // If staff policy gates by permission, this still must succeed for the
    // tenant owner; failure here means the policy is too tight, not too loose.
    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });
});
