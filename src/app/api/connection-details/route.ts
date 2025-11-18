//src/app/api/connection-details/route.ts
import { NextResponse } from "next/server";
import { AccessToken, type VideoGrant } from "livekit-server-sdk";
import { env } from "~/env";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const roomName: string = body.roomName;
    const identity: string =
      body.identity ?? `user-${Math.random().toString(36).slice(2, 8)}`;

    if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { error: "LIVEKIT_URL / API_KEY / API_SECRET missing" },
        { status: 500 },
      );
    }

    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity,
      ttl: 3600,
    });

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      roomCreate: false,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };

    at.addGrant(grant);

    const participantToken = await at.toJwt();

    const connectionDetails = {
      serverUrl: env.LIVEKIT_URL,
      roomName,
      participantName: identity,
      participantToken,
    };

    return NextResponse.json(connectionDetails);
  } catch (err) {
    console.error("connection-details error:", err);
    return NextResponse.json({ error: "failed to create token" }, { status: 500 });
  }
}
