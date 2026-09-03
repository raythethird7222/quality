import { describe, it, expect } from "vitest";
import { tokenizeForRedaction, redactSensitiveData } from "./redaction";

describe("AI data redaction (protect employee/customer data)", () => {
  it("redacts email addresses", () => {
    const text = "Contact john.doe@example.com for details";
    expect(redactSensitiveData(text)).not.toContain("john.doe@example.com");
    expect(redactSensitiveData(text)).toContain("[EMAIL]");
  });

  it("redacts employee codes", () => {
    const text = "Employee code is EMP00123";
    expect(redactSensitiveData(text)).not.toContain("EMP00123");
  });

  it("redacts phone numbers", () => {
    const text = "Call 0917-555-1234 now";
    const redacted = redactSensitiveData(text);
    expect(redacted).not.toContain("0917-555-1234");
  });

  it("redacts VICI links and URLs with credentials", () => {
    const text = "Click https://vici.example:agent10@sip.example call";
    const redacted = redactSensitiveData(text);
    expect(redacted).not.toContain("agent10");
  });

  it("returns empty string for empty input", () => {
    expect(redactSensitiveData("")).toBe("");
  });

  it("leaves normal text unchanged", () => {
    const text = "The average QA score is 92% for this week";
    expect(redactSensitiveData(text)).toBe(text);
  });
});

describe("tokenization helper", () => {
  it("is deterministic for the same input", () => {
    expect(tokenizeForRedaction("EMP12345")).toBe(tokenizeForRedaction("EMP12345"));
  });

  it("produces different tokens for different inputs", () => {
    expect(tokenizeForRedaction("EMP12345")).not.toBe(tokenizeForRedaction("EMP67890"));
  });
});
