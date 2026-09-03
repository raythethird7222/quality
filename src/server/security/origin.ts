import { headers } from "next/headers";
import { AuthorizationError } from "@/server/security/errors";

export async function assertTrustedOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");
  const referer = headerStore.get("referer");

  // For same-origin requests, Origin may be absent (e.g. form POST from the
  // same host). Only reject when Origin IS present and doesn't match the host.
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (host && originHost !== host) {
        throw new AuthorizationError("Invalid origin");
      }
    } catch (e) {
      if (e instanceof AuthorizationError) throw e;
      throw new AuthorizationError("Invalid origin header");
    }
    return;
  }

  // If no Origin, fall back to Referer check.
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (host && refererHost !== host) {
        throw new AuthorizationError("Invalid referer");
      }
    } catch (e) {
      if (e instanceof AuthorizationError) throw e;
      // If referer is malformed, reject for safety.
      throw new AuthorizationError("Invalid referer header");
    }
  }
  // If neither Origin nor Referer is present, allow (could be server-to-server
  // or a direct fetch from the same host). Rate limiting provides the backstop.
}
