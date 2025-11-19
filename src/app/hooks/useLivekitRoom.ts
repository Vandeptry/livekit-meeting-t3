// src/app/hooks/useLivekitRoom.ts
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  LocalTrack,
  createLocalVideoTrack,
  createLocalAudioTrack,
  Track,
} from "livekit-client";
import { env } from "process";

export function useLivekitRoom(roomName: string, token: string) {
  const [status, setStatus] = useState("Đang kết nối...");
  const roomRef = useRef<Room | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const agentAudioRef = useRef<HTMLAudioElement>(null);

  const agentAudioTrack = useRef<Track | null>(null);
  const userAudioTrack = useRef<Track | null>(null);

  const disconnect = () => {
    try {
      roomRef.current?.disconnect();
      setStatus("Đã rời phòng");
    } catch (e) {
      console.error("Disconnect error:", e);
    }
  };

  useEffect(() => {
    const room = new Room();
    roomRef.current = room;

    let localCam: LocalTrack | null = null;
    let localMic: LocalTrack | null = null;

    const connectRoom = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!url) {
          console.error("NEXT_PUBLIC_LIVEKIT_URL missing");
          setStatus("Thiếu URL LiveKit");
          return;
        }

        await room.connect(url, token);
        setStatus("Đã kết nối vào phòng");

        // Local cam + mic
        localCam = await createLocalVideoTrack();
        localMic = await createLocalAudioTrack();

        await room.localParticipant.publishTrack(localCam);
        await room.localParticipant.publishTrack(localMic);

        userAudioTrack.current = localMic;

        // Attach local preview
        if (localVideoRef.current && localCam) {
          const videoEl = localCam.attach();
          videoEl.style.width = "100%";
          videoEl.style.height = "100%";
          localVideoRef.current.appendChild(videoEl);
        }

      } catch (error) {
        console.error("Connect error:", error);
        setStatus("Lỗi kết nối");
      }
    };

    connectRoom();

    // EVENT: participant join
    room.on(RoomEvent.ParticipantConnected, (p) => {
      console.log("[LiveKit] Participant connected:", p.identity);
    });

    // EVENT: track subscribed
    room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
      console.log("[LiveKit] Track subscribed:", participant.identity, pub.kind);

      // Detect agent audio
      if (
        pub.kind === Track.Kind.Audio &&
        participant.identity.toLowerCase().includes("agent")
      ) {
        console.log("[AGENT] Audio track detected");
        agentAudioTrack.current = track;

        if (agentAudioRef.current) {
          const mediaEl = track.attach();
          agentAudioRef.current.srcObject = mediaEl.srcObject;
        }
      }
    });

    return () => {
      disconnect();
      localCam?.stop();
      localMic?.stop();
    };
  }, [roomName, token]);

  return {
    status,
    localVideoRef,
    agentAudioRef,
    userAudioTrack,
    agentAudioTrack,
    disconnect,
  };
}
