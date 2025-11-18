// src/app/hooks/useLivekit.ts
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Room,
  createLocalTracks,
  type LocalTrack,
  RoomEvent,
  type RemoteParticipant,
  type RemoteTrackPublication,
} from "livekit-client";
import { registerRoomEvents } from "../[id]/livekit-events";

const LIVEKIT_URL =
  process.env.NEXT_PUBLIC_LIVEKIT_URL ??
  "wss://meeting-t3-14zfyes1.livekit.cloud";

export function useLivekitConnection(roomName: string, token: string) {
  const [status, setStatus] = useState("Đang khởi tạo...");

  const localMediaRef = useRef<HTMLDivElement>(null!);
  const agentAudioRef = useRef<HTMLAudioElement>(null!);

  const room = useRef<Room | null>(null);
  const publishedLocalTracks = useRef<LocalTrack[]>([]);
  const isConnected = useRef(false);
  const unmounted = useRef(false);

  const performDisconnect = async () => {
    if (unmounted.current) return;
    unmounted.current = true;

    const r = room.current;
    if (r) {
      r.removeAllListeners();
      try {
        await r.disconnect();
      } catch {}
    }

    publishedLocalTracks.current.forEach((t) => {
      try {
        t.stop();
        t.detach?.();
      } catch {}
    });
    publishedLocalTracks.current = [];

    if (localMediaRef.current) localMediaRef.current.innerHTML = "";

    isConnected.current = false;
    setStatus("Đã ngắt kết nối");
  };

  useEffect(() => {
    const connect = async () => {
      setStatus(`Đang kết nối vào phòng ${roomName}...`);

      try {
        const lkRoom = new Room({
          dynacast: true,
          adaptiveStream: false,
          // @ts-expect-error
          rtcConfig: {
            iceTransportPolicy: "relay",
          },
        });

        room.current = lkRoom;

        registerRoomEvents(lkRoom, {
          setStatus,
          localMediaRef,
          publishedLocalTracks,
          isConnected,
        });

        lkRoom.on(
          RoomEvent.TrackSubscribed,
          (track, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (track.kind === "audio" && participant.isAgent) {
              track.attach(agentAudioRef.current);
            }
          }
        );

        await lkRoom.connect(LIVEKIT_URL, token);
        isConnected.current = true;

        const tracks = await createLocalTracks({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
            channelCount: 1,
          },
          video: false,
        });

        for (const t of tracks) {
          await lkRoom.localParticipant.publishTrack(t);
          publishedLocalTracks.current.push(t);
        }

        setStatus("Đã kết nối");
      } catch (err: any) {
        setStatus("Lỗi: " + err.message);
      }
    };

    connect();

    return () => {
      void performDisconnect();
    };
  }, [roomName, token]);

  return {
    status,
    localMediaRef,
    agentAudioRef,
    performDisconnect,
    isConnected,
  };
}
