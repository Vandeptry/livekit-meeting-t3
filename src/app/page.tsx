// src/app/page.tsx
import { HydrateClient } from "~/trpc/server";
import { RoomList } from "./_components/RoomList";
import { api } from "~/trpc/server";

export default async function Home() {
  void api.livekit.getRooms.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[4.5rem]">
            LiveKit <span className="text-[hsl(280,100%,70%)]">Meeting</span>
          </h1>
          <RoomList />
        </div>
      </main>
    </HydrateClient>
  );
}