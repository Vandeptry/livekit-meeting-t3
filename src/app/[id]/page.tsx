//src/app/[id]/page.tsx
import { LivekitRoom } from "./livekit-room";
import { api } from "~/trpc/server";
import { createToken } from "~/lib/livekit-token";

export default async function RoomPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomName } = await props.params;

  const { roomName: validatedRoom } = await api.livekit.joinRoom({
    roomId: roomName,
    identity: "Van",
  });

  const userToken = await createToken(validatedRoom, "Van", false, 3600);

  return (
    <LivekitRoom
      roomName={validatedRoom}
      token={userToken}
    />
  );
}
