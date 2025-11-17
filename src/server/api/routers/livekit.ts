// src/server/api/routers/livekit.ts

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createToken } from "~/lib/livekit-token";
import { RoomServiceClient } from "livekit-server-sdk";

const ROOMS = [
  { id: "dev-room-1", name: "Phòng 1: Demo Agent" },
  { id: "dev-room-2", name: "Phòng 2: Team Meeting" },
  { id: "dev-room-3", name: "Phòng 3: Khách hàng" },
];

const livekitHost = "https://38f31b36b3ee.ngrok-free.app";
// const livekitHost = "http://192.168.1.43:7880";
const apiKey = "devkey";
const apiSecret = "phamdinhvan19022004quadeptrySUPER-SECRET-KEY-99999";

const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

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
      const room = ROOMS.find((r) => r.id === input.roomId);
      if (!room) {
        throw new Error("Phòng không tồn tại.");
      }

      // Token cho user
      const userToken = await createToken(room.id, input.identity, false, 3600);

      console.log(
        `[BACKEND] User ${input.identity} requested to join ${room.id}`,
      );

      // agent tự join
      const agentIdentity = "meeting-agent";

      const agentToken = await createToken(room.id, agentIdentity, true, 3600);

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
