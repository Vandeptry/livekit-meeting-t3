// agent-service/index.ts
import {
  type JobContext,
  WorkerOptions,
  cli,
  defineAgent,
} from "@livekit/agents";
import { fileURLToPath } from "node:url";
import { RoomEvent } from "livekit-client";

const LIVEKIT_URL = "wss://38f31b36b3ee.ngrok-free.app";
const LIVEKIT_API_KEY = "devkey";
const LIVEKIT_API_SECRET = "phamdinhvan19022004quadeptrySUPER-SECRET-KEY-99999";

export default defineAgent({
  entry: async (ctx: JobContext) => {
    console.log("[AGENT] Job started in room:", ctx.job.room?.name);

    await ctx.connect();
    const room = ctx.room;
    if (!room) {
      console.log("[AGENT] No room found");
      return;
    }

    console.log("[AGENT] Agent connected to room:", room.name);

    // chào
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
  },
});

// Worker CLI
cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    wsURL: LIVEKIT_URL,
    apiKey: LIVEKIT_API_KEY,
    apiSecret: LIVEKIT_API_SECRET,
  }),
);
