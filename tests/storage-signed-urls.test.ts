/**
 * Signed URL lifecycle tests for `contracts` and `contab-documents` buckets.
 *
 * Verifies:
 *  - Staff (tenant owner) can create a signed URL and download it.
 *  - The signed URL stops working after its TTL elapses.
 *  - An object that has been removed cannot be downloaded via a previously
 *    issued signed URL — i.e. revocation by delete is effective.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  admin, anonClient, createUser, deleteUser, signIn,
  assignProfile, createCompany, deleteCompany, PROFILES,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const FIXTURES = [
  { bucket: "contracts",        path: `__signed-test/${RUN}/contract.pdf` },
  { bucket: "contab-documents", path: `__signed-test/${RUN}/doc.pdf` },
] as const;

let companyId = "";
let staffId = "";
let staff!: SupabaseClient;

const email = `signed-staff-${RUN}@example.com`;

beforeAll(async () => {
  companyId = await createCompany(`Signed URL Co ${RUN}`);
  const u = await createUser(email);
  staffId = u.id;
  await assignProfile({ userId: staffId, companyId, profileId: PROFILES.gestor, email });
  staff = (await signIn(email)).client;

  const body = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])], { type: "application/pdf" });
  for (const f of FIXTURES) {
    const key = `${companyId}/${f.path}`;
    const { error } = await admin.storage.from(f.bucket).upload(key, body, { upsert: true });
    if (error) throw new Error(`seed ${f.bucket}/${key}: ${error.message}`);
  }
}, 180_000);

afterAll(async () => {
  for (const f of FIXTURES) {
    await admin.storage.from(f.bucket).remove([`${companyId}/${f.path}`]).catch(() => {});
  }
  await deleteUser(staffId);
  await deleteCompany(companyId);
});

describe.each(FIXTURES)("signed URL lifecycle — $bucket", ({ bucket, path }) => {
  const key = () => `${companyId}/${path}`;

  it("staff can sign and download via the signed URL", async () => {
    const { data, error } = await staff.storage.from(bucket).createSignedUrl(key(), 60);
    expect(error).toBeNull();
    expect(data?.signedUrl).toMatch(/^https?:\/\//);

    const res = await fetch(data!.signedUrl);
    expect(res.status).toBe(200);
  });

  it("expired signed URL (ttl=1s) stops returning the file", async () => {
    const { data, error } = await staff.storage.from(bucket).createSignedUrl(key(), 1);
    expect(error).toBeNull();

    // Wait past the 1s TTL.
    await new Promise((r) => setTimeout(r, 3000));

    const res = await fetch(data!.signedUrl);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  }, 15_000);

  it("revocation by object delete invalidates a previously issued signed URL", async () => {
    // Seed a one-off object so we don't disturb the shared fixture.
    const tmpKey = `${companyId}/__signed-test/${RUN}/revoke-${bucket}.pdf`;
    const body = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])], { type: "application/pdf" });
    {
      const { error } = await admin.storage.from(bucket).upload(tmpKey, body, { upsert: true });
      expect(error).toBeNull();
    }

    const { data, error } = await staff.storage.from(bucket).createSignedUrl(tmpKey, 600);
    expect(error).toBeNull();

    // Confirm it works before revocation.
    const ok = await fetch(data!.signedUrl);
    expect(ok.status).toBe(200);

    // Revoke by deleting the underlying object.
    const del = await admin.storage.from(bucket).remove([tmpKey]);
    expect(del.error).toBeNull();

    const gone = await fetch(data!.signedUrl);
    expect(gone.status).toBeGreaterThanOrEqual(400);
    expect(gone.status).toBeLessThan(500);
  }, 20_000);

  it("anonymous client cannot mint a signed URL even knowing the exact path", async () => {
    const anon = anonClient();
    const { data, error } = await anon.storage.from(bucket).createSignedUrl(key(), 60);
    expect(!!data?.signedUrl && !error).toBe(false);
  });
});
