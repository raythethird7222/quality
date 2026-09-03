type AuditLevel = "info" | "warn" | "error";

export function auditLog(event: string, details: Record<string, unknown>, level: AuditLevel = "info") {
  console[level](
    JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...details,
    })
  );
}
