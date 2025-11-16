// src/lib/livekit-token.ts
import { AccessToken, type VideoGrant } from "livekit-server-sdk";
// KEY TĨNH
const LIVEKIT_API_KEY = "devkey";
const LIVEKIT_API_SECRET = "phamdinhvan19022004quadeptrySUPER-SECRET-KEY-99999";

// Validate
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  throw new Error("LIVEKIT API KEY/SECRET is missing");
}

export async function createToken(
  roomName: string,
  identity: string,
  isAgent = false,
  ttl = 3600,
): Promise<string> {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    ttl,
  });

  const grant: VideoGrant = {
    roomJoin: true,
    room: roomName,
    canPublish: !isAgent,
    canPublishData: true,
    canSubscribe: true,
  };

  token.addGrant(grant);
  return token.toJwt();
}
