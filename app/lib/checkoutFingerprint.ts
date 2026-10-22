import { createHash } from "node:crypto";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function checkoutIdentity(owner: string, details: object & { idempotencyKey?: string; origin?: string }) {
  const { idempotencyKey, origin: _origin, ...request } = details;
  void _origin;
  const hash = (input: string) => createHash("sha256").update(input).digest("hex");
  return {
    requestKey: idempotencyKey ? hash(`${owner}:${idempotencyKey}`) : undefined,
    requestFingerprint: hash(`${owner}:${canonical(request)}`),
  };
}
