//src/server/api/routers/livekit.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createToken } from "~/lib/livekit-token";

const ROOMS = [
    { id: 'dev-room-1', name: 'Phòng 1: Demo Agent' },
    { id: 'dev-room-2', name: 'Phòng 2: Team Meeting' },
    { id: 'dev-room-3', name: 'Phòng 3: Khách hàng' },
];

export const livekitRouter = createTRPCRouter({
    getRooms: publicProcedure
        .query(() => {
            return ROOMS;
        }),

    joinRoom: publicProcedure
        .input(z.object({ 
            roomId: z.string(), 
            identity: z.string().min(1, "Tên không được để trống") 
        }))
        .mutation(async ({ input }) => {
            const room = ROOMS.find(r => r.id === input.roomId);
            
            if (!room) {
                throw new Error('Phòng không tồn tại.');
            }

            const userToken = await createToken(room.id, input.identity, false, 3600);
            
            console.log(`[BACKEND_LOG] User '${input.identity}' đã lấy token cho phòng '${room.id}'.`);
            
            return {
                roomName: room.id,
                userToken,
            };
        }),
});