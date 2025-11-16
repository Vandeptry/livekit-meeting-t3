// src/app/[id]/livekit-rom-client.tsx
"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import {
  Room,
  createLocalTracks,
  ConnectionState,
  type LocalTrack,
} from "livekit-client";
import { registerRoomEvents } from "./livekit-events";

const LIVEKIT_URL = "ws://192.168.1.6:7880";

interface LivekitRoomProps {
  roomName: string;
  token: string;
}

export function LivekitRoom({
  roomName,
  token,
}: LivekitRoomProps): JSX.Element {
  const [status, setStatus] = useState("Đang khởi tạo...");
  const localMediaRef = useRef<HTMLDivElement>(null!);
  const room = useRef<Room | null>(null);
  const publishedLocalTracks = useRef<LocalTrack[]>([]);
  const isConnected = useRef(false);

  const performDisconnect = (): void => {
    const r = room.current;
    if (r && r.state !== ConnectionState.Disconnected) {
      void r.disconnect();
      publishedLocalTracks.current.forEach((t) => {
        t.detach();
        t.stop();
      });
      publishedLocalTracks.current = [];
    }
    isConnected.current = false;
    if (localMediaRef.current) localMediaRef.current.innerHTML = "";
    setStatus("Đã ngắt kết nối");
  };

  useEffect(() => {
    const doConnect = async (): Promise<void> => {
      setStatus(`Đang kết nối vào phòng ${roomName}...`);

      try {
        room.current = new Room({
          dynacast: true,
          adaptiveStream: false,
        });

        const activeRoom = room.current;

        registerRoomEvents(activeRoom, {
          setStatus,
          localMediaRef,
          publishedLocalTracks,
          isConnected,
        });

        await activeRoom.connect(LIVEKIT_URL, token);
      } catch (err) {
        setStatus(`Failed: ${(err as Error).message}`);
      }
    };

    void doConnect();

    return () => {
      performDisconnect();
      room.current = null;
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
