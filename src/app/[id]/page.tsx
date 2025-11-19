// src/app/[id]/page.tsx
import { LivekitRoom } from "./livekit-room";

export default async function RoomPage(props: {
  searchParams: Promise<{ token?: string; identity?: string }>;
  params: Promise<{ id: string }>;
}) {
  const searchParamsResolved = await props.searchParams;
  const paramsResolved = await props.params;

  const token = searchParamsResolved.token;
  const roomName = paramsResolved.id;

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Thiếu token.
      </div>
    );
  }

  return <LivekitRoom roomName={roomName} token={token} />;
}