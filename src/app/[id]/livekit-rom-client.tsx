//src/app/[id]/livekit-rom-client.tsx
"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import {
  Room,
  ConnectionState,
  type LocalTrack,
  RoomEvent,
} from "livekit-client";
import { registerRoomEvents } from "./livekit-events";

const LIVEKIT_URL = "wss://95d3de070559.ngrok-free.app";

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

  const roomRef = useRef<Room | null>(null);
  const publishedLocalTracks = useRef<LocalTrack[]>([]);
  const isConnectedOnce = useRef(false);

  const performDisconnect = (): void => {
    const room = roomRef.current;

    if (room && room.state !== ConnectionState.Disconnected) {
      void room.disconnect();

      publishedLocalTracks.current.forEach((t) => {
        t.detach();
        t.stop();
      });

      publishedLocalTracks.current = [];
    }

    if (localMediaRef.current) {
      localMediaRef.current.innerHTML = "";
    }

    setStatus("Đã ngắt kết nối");
  };

  useEffect(() => {
    const doConnect = async (): Promise<void> => {
      setStatus(`Đang kết nối vào phòng ${roomName}...`);

      const room = new Room({
        dynacast: true,
        adaptiveStream: false,
      });

      roomRef.current = room;

      registerRoomEvents(room, {
        setStatus,
        localMediaRef,
        publishedLocalTracks,
        isConnected: isConnectedOnce,
      });

      room.on(RoomEvent.Connected, () => {
        isConnectedOnce.current = true;
        setStatus("Bạn đã vào phòng — Agent đang xử lý...");
      });

      try {
        await room.connect(LIVEKIT_URL, token);
      } catch (err) {
        if (!isConnectedOnce.current) {
          setStatus("Không thể kết nối vào phòng.");
        } else {
          setStatus("Phiên đã kết thúc, kết nối thành công");
        }
      }
    };

    void doConnect();

    return () => {
      performDisconnect();
      roomRef.current = null;
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
