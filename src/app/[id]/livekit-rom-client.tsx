//src/app/[id]/livekit-rom-client.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Room,
  createLocalTracks,
  ConnectionState,
  type LocalTrack,
} from "livekit-client";
import { registerRoomEvents } from "./livekit-events";
import { useRouter } from "next/navigation";
import { startLocalAgent, stopLocalAgent } from "./agent";

const LIVEKIT_URL =
  process.env.NEXT_PUBLIC_LIVEKIT_URL ??
  "wss://meeting-t3-14zfyes1.livekit.cloud";

interface LivekitRoomProps {
  roomName: string;
  token: string;
}

export function LivekitRoom({ roomName, token }: LivekitRoomProps) {
  const router = useRouter();

  const [status, setStatus] = useState("Đang khởi tạo...");
  const localMediaRef = useRef<HTMLDivElement>(null!);
  const room = useRef<Room | null>(null);
  const publishedLocalTracks = useRef<LocalTrack[]>([]);
  const isConnected = useRef(false);
  const unmounted = useRef(false);

  const performDisconnect = async () => {
    if (unmounted.current) return;

    unmounted.current = true;
    stopLocalAgent();

    const r = room.current;
    if (r && r.state !== ConnectionState.Disconnected) {
      r.removeAllListeners();
      try {
        await r.disconnect();
      } catch {}
    }

    publishedLocalTracks.current.forEach((track) => {
      try {
        track.stop();
        track.detach?.();
      } catch {}
    });

    publishedLocalTracks.current = [];
    if (localMediaRef.current) localMediaRef.current.innerHTML = "";

    isConnected.current = false;
    setStatus("Đã ngắt kết nối");

    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  useEffect(() => {
    let cancelled = false;

    const doConnect = async () => {
      setStatus(`Đang kết nối vào phòng ${roomName}...`);

      try {
        const lkRoom = new Room({
          dynacast: true,
          adaptiveStream: false,
        });

        if (cancelled) return;

        room.current = lkRoom;

        registerRoomEvents(lkRoom, {
          setStatus,
          localMediaRef,
          publishedLocalTracks,
          isConnected,
        });

        await lkRoom.connect(LIVEKIT_URL, token);

        console.log("[CLIENT] Connected");
        isConnected.current = true;

        startLocalAgent((reply) => {
          lkRoom.localParticipant.publishData(
            new TextEncoder().encode(
              JSON.stringify({ type: "agent_message", text: reply }),
            ),
            { reliable: true }
          );
        });

        const tracks = await createLocalTracks({
          audio: true,
          video: false,
        });

        tracks.forEach((track) => {
          lkRoom.localParticipant.publishTrack(track);
          publishedLocalTracks.current.push(track);
        });
      } catch (err) {
        console.error(err);
        setStatus(`Failed: ${(err as Error).message}`);
      }
    };

    doConnect();

    return () => {
      cancelled = true;
      if (!isConnected.current || unmounted.current) return;

      unmounted.current = true;

      const r = room.current;
      if (r) {
        r.removeAllListeners();
        try {
          r.disconnect();
        } catch {}
      }

      publishedLocalTracks.current.forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      publishedLocalTracks.current = [];

      stopLocalAgent();
    };
  }, [roomName, token]);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center rounded-lg bg-gray-800 p-8 shadow-xl">
      <h1 className="mb-4 text-3xl font-bold">Phòng: {roomName}</h1>

      <p className="mb-6 text-lg">
        Trạng thái:{" "}
        <span className="font-semibold text-purple-400">{status}</span>
      </p>

      <div
        ref={localMediaRef}
        className="mb-6 flex h-80 w-full items-center justify-center overflow-hidden rounded-lg bg-black"
      />

      <button
        onClick={performDisconnect}
        className="rounded-lg bg-red-600 p-3 text-lg font-bold text-white hover:bg-red-700"
      >
        Rời khỏi Phòng
      </button>
    </div>
  );
}
