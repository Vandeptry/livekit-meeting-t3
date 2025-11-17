// src/server/api/routers/livekit.ts

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createToken } from "~/lib/livekit-token";
import { RoomServiceClient } from "livekit-server-sdk";
import { env } from "~/env";

const ROOMS = [
  { id: "dev-room-1", name: "Phòng 1: Demo Agent" },
  { id: "dev-room-2", name: "Phòng 2: Team Meeting" },
  { id: "dev-room-3", name: "Phòng 3: Khách hàng" },
];

const livekitHost = env.LIVEKIT_URL;
const apiKey = env.LIVEKIT_API_KEY;
const apiSecret = env.LIVEKIT_API_SECRET;

console.log(`[LIVEKIT_ROUTER] LIVEKIT_URL: ${livekitHost ? 'Loaded' : 'MISSING'}`);
console.log(`[LIVEKIT_ROUTER] API_KEY: ${apiKey ? 'Loaded' : 'MISSING'} (Length: ${apiKey?.length})`);

const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
console.log("[LIVEKIT_ROUTER] RoomServiceClient initialized.");

export const livekitRouter = createTRPCRouter({
  getRooms: publicProcedure.query(() => ROOMS),

  joinRoom: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        identity: z.string().min(1, "Tên không được để trống"),
      }),
    )
    .mutation(async ({ input }) => {
      console.log(`[LIVEKIT_ROUTER] Request to join room: ${input.roomId} by ${input.identity}`);
      const room = ROOMS.find((r) => r.id === input.roomId);
      if (!room) {
        console.error(`[LIVEKIT_ROUTER] Room not found: ${input.roomId}`);
        throw new Error("Phòng không tồn tại.");
      }

      const userToken = await createToken(
        room.id,
        input.identity,
        false,
        3600,
      );
      console.log(`[LIVEKIT_ROUTER] User token generated for ${input.identity}`);

      console.log(
        `[BACKEND] User ${input.identity} requested to join ${room.id}`,
      );

      const agentIdentity = "meeting-agent";
      const agentToken = await createToken(room.id, agentIdentity, true, 3600);
      console.log(`[LIVEKIT_ROUTER] Agent token generated for ${agentIdentity}`);

      console.log(
        `[BACKEND] Agent should auto-join room ${room.id} (token generated).`,
      );

      return {
        roomName: room.id,
        userToken,
        agentToken,
        agentTokenForWorker: agentToken,
      };
    }),
});