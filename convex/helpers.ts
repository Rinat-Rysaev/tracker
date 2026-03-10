import { getAuthUserId as _getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Get the authenticated user's ID or throw if not authenticated.
 * Wraps the library's getAuthUserId (which returns Id | null)
 * to always return a non-null Id<"users">.
 */
export async function getAuthUserId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const userId = await _getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
