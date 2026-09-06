/** Supabase Auth session helpers (#67). Tokens stay in SDK storage only. */

import type { User } from "@supabase/supabase-js";
import type { Owner } from "../types/models";

export function ownerFromAuthUser(user: User): Owner {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : undefined;
  return {
    ownerSub: user.id,
    email: user.email,
    displayName: fullName,
  };
}

/** Short UI copy only — never include tokens or emails. */
export const SESSION_EXPIRED_MESSAGE =
  "세션이 만료되었습니다. 다시 로그인해 주세요.";
