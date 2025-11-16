//src/app/[id]/livekit-events.ts
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  RemoteParticipant,
  type LocalTrack,
  createLocalTracks,
} from "livekit-client";

export function registerRoomEvents(
  room: Room,
  opts: {
    setStatus: (msg: string) => void;
    localMediaRef: React.RefObject<HTMLDivElement>;
    publishedLocalTracks: React.MutableRefObject<LocalTrack[]>;
    isConnected: React.MutableRefObject<boolean>;
  },
): void {
  const { setStatus, localMediaRef, publishedLocalTracks, isConnected } = opts;

  // Không async trực tiếp ở callback
  room.on(RoomEvent.Connected, () => {
    void (async () => {
      isConnected.current = true;
      setStatus("Đã kết nối — Agent sẽ vào phòng");

      try {
        const tracks = await createLocalTracks({
          video: true,
          audio: true,
        });

        if (room.state !== ConnectionState.Connected) {
          tracks.forEach((t) => t.stop());
          return;
        }

        const videoTrack = tracks.find((t) => t.kind === Track.Kind.Video);
        if (videoTrack && localMediaRef.current) {
          localMediaRef.current.innerHTML = "";
          localMediaRef.current.appendChild(videoTrack.attach());
        }

        for (const t of tracks) {
          await room.localParticipant.publishTrack(t);
        }

        publishedLocalTracks.current = tracks;
        setStatus("Bạn đã vào phòng — đang chờ Agent...");
      } catch {
        setStatus("Không lấy được thiết bị (nhưng vẫn vào phòng OK)");
      }
    })();
  });

  room.on(RoomEvent.Reconnecting, () => setStatus("Đang reconnect..."));
  room.on(RoomEvent.Reconnected, () => setStatus("Đã reconnect"));

  room.on(RoomEvent.Disconnected, () => {
    isConnected.current = false;
    setStatus("Bạn đã rời phòng");
  });

  room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
    setStatus(`Tham gia: ${p.identity}`);
  });

  room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
    setStatus(`Rời phòng: ${p.identity}`);
  });

  room.on(RoomEvent.DataReceived, (payload, participant) => {
    try {
      const txt = new TextDecoder().decode(payload);
      const data = JSON.parse(txt) as Record<string, unknown>;

      if (data.type === "agent_message") {
        setStatus(`🤖 Agent: ${String(data.text)}`);
        return;
      }

      console.log("Data:", data, "from:", participant?.identity);
    } catch {
      console.error("Data parse error");
    }
  });
}
