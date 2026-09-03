import { describe, expect, it } from "vitest";
import {
  createOnceLogger,
  isSchemaOrRpcMissingError,
  schemaMissingErrorMessage,
} from "../../apps/worker/src/schema-missing";

describe("worker schema-missing degrade helpers", () => {
  it("detects PostgREST missing RPC / table codes", () => {
    expect(isSchemaOrRpcMissingError({ code: "PGRST202", message: "Could not find the function" })).toBe(
      true,
    );
    expect(isSchemaOrRpcMissingError({ code: "PGRST205", message: "Could not find the table" })).toBe(
      true,
    );
    expect(isSchemaOrRpcMissingError({ code: "42883", message: "function does not exist" })).toBe(true);
    expect(isSchemaOrRpcMissingError({ code: "42P01", message: 'relation "x" does not exist' })).toBe(
      true,
    );
  });

  it("does not treat transient / auth errors as schema-missing", () => {
    expect(isSchemaOrRpcMissingError({ code: "57014", message: "canceling statement" })).toBe(false);
    expect(isSchemaOrRpcMissingError({ code: "PGRST301", message: "JWT expired" })).toBe(false);
    expect(isSchemaOrRpcMissingError(new Error("fetch failed"))).toBe(false);
  });

  it("once-logger emits only the first call until reset", () => {
    const once = createOnceLogger("test_degrade_once");
    expect(once.log("first")).toBe(true);
    expect(once.log("second")).toBe(false);
    once.reset();
    expect(once.log("third")).toBe(true);
  });

  it("formats schema-missing message with code", () => {
    expect(
      schemaMissingErrorMessage({
        code: "PGRST202",
        message: "Could not find the function public.claim_reengineering_outbox_batch",
      }),
    ).toContain("PGRST202");
  });
});
