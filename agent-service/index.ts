// agent-service/index.ts
import {
  type JobContext,
  WorkerOptions,
  cli,
  defineAgent,
} from "@livekit/agents";
import { fileURLToPath } from "node:url";
import { RoomEvent } from "livekit-client";

const LIVEKIT_URL = "wss://meeting-t3-e6pf3j9k.livekit.cloud";
const LIVEKIT_API_KEY = "APIxzUTEitj83AJ";
const LIVEKIT_API_SECRET = "u0EIcDhAkaLP7vRAIpYWAyH7rK9q1HOKf6ZPB7Ngt3Z";

const agent = defineAgent({
  entry: async (ctx: JobContext) => {
    console.log("[AGENT] Job started in room:", ctx.job.room?.name);

    await ctx.connect();
    const room = ctx.room;
    if (!room) return;

    console.log("[AGENT] Agent connected to room:", room.name);

    // Gửi lời chào
    if (room.localParticipant) {
      await room.localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({
            type: "agent_message",
            text: "Xin chào! Agent đã có mặt.",
          }),
        ),
        { reliable: true },
      );
    }

    console.log("[AGENT] Greeting sent");

    room.on(RoomEvent.ParticipantConnected, (p) =>
      console.log("[AGENT] Joined:", p.identity),
    );

    room.on(RoomEvent.ParticipantDisconnected, (p) =>
      console.log("[AGENT] Left:", p.identity),
    );
    room.on(RoomEvent.TrackSubscribed, async (track, pub, participant) => {
      if (typeof track.kind === 'string' && track.kind === "audio") {
        console.log("[AGENT] Receiving audio from:", participant.identity);

        const mediaStreamTrack = (track as any).mediaStreamTrack;
        if (mediaStreamTrack) {
          // todo
        }
      }
    });
  },
});

export default agent;

// === WORKER ===
cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    wsURL: LIVEKIT_URL,
    apiKey: LIVEKIT_API_KEY,
    apiSecret: LIVEKIT_API_SECRET,
  }),
);
