// Sensitive-data redaction for the AI agent.
// Before sending tool results / user messages to external AI providers,
// redact employee-specific and customer-specific data that the LLM doesn't
// need to answer the user's question.

import { createHash } from "node:crypto";

// Replaces matched sensitive values with a stable derived placeholder.
export function tokenizeForRedaction(value: string): string {
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 8);
  return `[REDACTED:${hash}]`;
}

export function redactSensitiveData(text: string): string {
  if (!text) return "";

  let out = text;

  // Email addresses
  out = out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]");

  // Phone numbers (Philippine + international formats)
  out = out.replace(
    /(?:\+?63[-\s.]?|0)[0-9]{2,3}[-\s.]?[0-9]{3,4}[-\s.]?[0-9]{3,4}/g,
    "[PHONE]"
  );

  // Employee codes (EMP followed by digits)
  out = out.replace(/\b(?:EMP|CTN|QA)[-]?\d{3,10}\b/gi, (m) => tokenizeForRedaction(m));

  // VICI / SIP URIs with credentials: user:pass@host
  out = out.replace(
    /[a-zA-Z0-9._%+-]+:[^@\s]+@/g,
    "[CREDS]@"
  );

  return out;
}
