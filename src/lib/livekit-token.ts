//src/lib/livekit-token.ts
import { AccessToken } from "livekit-server-sdk";
import { env } from "~/env";

export function createToken(
  room: string,
  identity: string,
  isAgent: boolean,
  ttl: number,
) {
  console.log(`[LIVEKIT_TOKEN] Creating token for identity: ${identity}, room: ${room}`);

  if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      console.error("[LIVEKIT_TOKEN] API Keys are NOT loaded from environment.");
  }

  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity,
    ttl,
  });

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  console.log("[LIVEKIT_TOKEN] AccessToken created successfully.");
  return at.toJwt();
}