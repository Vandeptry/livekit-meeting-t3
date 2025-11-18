// src/app/[id]/livekit-events.ts
import {
  Room,
  RoomEvent,
  RemoteParticipant,
} from "livekit-client";

export function registerRoomEvents(
  room: Room,
  opts: {
    setStatus: (msg: string) => void;
    localMediaRef: React.RefObject<HTMLDivElement>;
    publishedLocalTracks: React.MutableRefObject<any[]>;
    isConnected: React.MutableRefObject<boolean>;
  },
): void {

  const { setStatus, localMediaRef, publishedLocalTracks, isConnected } = opts;

  room.on(RoomEvent.Connected, () => {
    isConnected.current = true;
    setStatus("Đã kết nối vào phòng");
  });

  room.on(RoomEvent.Reconnecting, () => setStatus("Đang reconnect..."));
  room.on(RoomEvent.Reconnected, () => setStatus("Đã reconnect"));

  room.on(RoomEvent.Disconnected, () => {
    isConnected.current = false;
    setStatus("Bạn đã rời phòng");

    if (localMediaRef.current) {
      localMediaRef.current.innerHTML = "";
    }

    publishedLocalTracks.current.forEach((t) => {
      try {
        t.stop();
        t.detach?.();
      } catch {}
    });

    publishedLocalTracks.current = [];
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
      const data = JSON.parse(txt);

      if (data.type === "agent_message") {
        setStatus(`Agent: ${data.text}`);
        return;
      }

      console.log("Received data:", data, "from", participant?.identity);
    } catch {
      console.error("Data parse error");
    }
  });
}