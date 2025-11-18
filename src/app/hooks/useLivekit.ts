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
  const agentAudioTrack = useRef<MediaStreamTrack | null>(null);

  const hardDisconnect = async () => {
    const r = room.current;
    if (!r) return;

    try {
      r.removeAllListeners();
      await r.disconnect();
    } catch {}

    publishedLocalTracks.current.forEach((t) => {
      try {
        t.stop();
        t.detach?.();
      } catch {}
    });

    publishedLocalTracks.current = [];
    isConnected.current = false;

    if (localMediaRef.current) localMediaRef.current.innerHTML = "";
    setStatus("Đã ngắt kết nối");
  };

  useEffect(() => {
    let isUnmounted = false;

    const connect = async () => {
      setStatus(`Đang kết nối vào phòng ${roomName}...`);

      try {
        const lkRoom = new Room({
          dynacast: true,
          adaptiveStream: false,
          //@ts-expect-error
          peerConnectionConfiguration: {
            iceTransportPolicy: "all",
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
          (track, pub, participant) => {
            if (track.kind === "audio" && participant.identity.includes("agent")) {
              track.attach(agentAudioRef.current);
              agentAudioTrack.current = track.mediaStreamTrack;
            }
          }
        );          

        await lkRoom.connect(LIVEKIT_URL, token);

        if (isUnmounted) return; // tránh disconnect sớm
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
        if (!isUnmounted) setStatus("Lỗi: " + err.message);
      }
    };

    connect();

    return () => {
      isUnmounted = true;
    };
  }, []);

  return {
    status,
    localMediaRef,
    agentAudioRef,
    agentAudioTrack,
    performDisconnect: hardDisconnect,
    isConnected,
  };
}
