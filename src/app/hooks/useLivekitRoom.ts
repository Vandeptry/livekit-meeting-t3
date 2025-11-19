// src/app/hooks/useLivekitRoom.ts
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  LocalTrack,
  createLocalAudioTrack,
  Track,
} from "livekit-client";

export function useLivekitRoom(roomName: string, token: string) {
  const [status, setStatus] = useState("Đang kết nối...");
  const roomRef = useRef<Room | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const agentAudioRef = useRef<HTMLAudioElement>(null);

  const agentAudioTrack = useRef<Track | null>(null);
  const userAudioTrack = useRef<Track | null>(null);

  const disconnect = () => {
    try {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      setStatus("Đã rời phòng");
    } catch {}
  };

  useEffect(() => {
    if (roomRef.current) return;

    const room = new Room();
    roomRef.current = room;

    let localMic: LocalTrack | null = null;

    const connectRoom = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!url) {
          setStatus("Thiếu URL LiveKit");
          return;
        }

        await room.connect(url, token);
        setStatus("Đã kết nối vào phòng");

        localMic = await createLocalAudioTrack();
        await room.localParticipant.publishTrack(localMic);
        userAudioTrack.current = localMic;
      } catch (error: any) {
        const msg = error?.message || "";
        if (msg.includes("Client initiated disconnect")) return;
        setStatus("Lỗi kết nối");
      }
    };

    connectRoom();

    room.on(RoomEvent.ParticipantConnected, (p) => {
      console.log("[LiveKit] Participant connected:", p.identity);
    });

    room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
      if (pub.kind === Track.Kind.Audio &&
          participant.identity.toLowerCase().includes("agent")) {

        agentAudioTrack.current = track;

        if (agentAudioRef.current) {
          const el = track.attach();
          agentAudioRef.current.srcObject = el.srcObject;
        }
      }
    });

    return () => {
      if (roomRef.current?.state === "connected") {
        roomRef.current.disconnect();
      }
      localMic?.stop();
    };
  }, []);

  return {
    status,
    localVideoRef,
    agentAudioRef,
    userAudioTrack,
    agentAudioTrack,
    disconnect,
  };
}
