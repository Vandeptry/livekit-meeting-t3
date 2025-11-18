// src/app/[id]/livekit-rom-client.tsx
"use client";

import { useRouter } from "next/navigation";
import { useLivekitConnection } from "../hooks/useLivekit";
import { useRecorder } from "../hooks/useRecorder";

interface LivekitRoomProps {
  roomName: string;
  token: string;
}

export function LivekitRoom({ roomName, token }: LivekitRoomProps) {
  const router = useRouter();

  const {
    status,
    localMediaRef,
    agentAudioRef,
    agentAudioTrack,
    performDisconnect,
    isConnected,
  } = useLivekitConnection(roomName, token);

  console.log("[UI] agentAudioRef:", agentAudioRef.current);
  console.log("[UI] agentAudioTrack:", agentAudioTrack.current);
  console.log("[UI] isConnected:", isConnected.current);

  const {
    recording,
    recordedUrlA,
    recordedUrlB,
    transcript,
    startRecording,
    stopRecording,
    transcribe,
  } = useRecorder(agentAudioRef, agentAudioTrack);

  const exit = async () => {
    await performDisconnect();
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <div className="flex w-full max-w-4xl flex-col items-center rounded-lg bg-gray-800 p-8 shadow-xl">
      <h1 className="mb-4 text-3xl font-bold">Phòng: {roomName}</h1>

      <p className="mb-6 text-lg text-purple-300">{status}</p>

      <div
        ref={localMediaRef}
        className="mb-6 flex h-80 w-full items-center justify-center overflow-hidden rounded-lg bg-black"
      />

      <audio ref={agentAudioRef} autoPlay playsInline />

      {!recording ? (
        <button
          onClick={startRecording}
          className="mb-4 rounded-lg bg-blue-600 p-3 text-lg font-bold text-white"
        >
          Bắt đầu ghi âm
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="mb-4 rounded-lg bg-yellow-600 p-3 text-lg font-bold text-white"
        >
          Dừng ghi âm
        </button>
      )}

      {recordedUrlA && (
        <div className="w-full mt-4">
          <p className="text-white mb-1">Bản ghi A (User only)</p>
          <audio controls src={recordedUrlA} className="w-full" />
          <button
            onClick={() => transcribe(recordedUrlA)}
            className="mt-2 rounded-lg bg-green-600 p-2 text-white"
          >
            Xuất văn bản A
          </button>
        </div>
      )}

      {recordedUrlB && (
        <div className="w-full mt-4">
          <p className="text-white mb-1">Bản ghi B (Full)</p>
          <audio controls src={recordedUrlB} className="w-full" />
          <button
            onClick={() => transcribe(recordedUrlB)}
            className="mt-2 rounded-lg bg-green-600 p-2 text-white"
          >
            Xuất văn bản B
          </button>
        </div>
      )}

      {transcript && (
        <div className="mt-4 w-full rounded-lg bg-gray-900 p-4 text-left text-white">
          <h3 className="mb-2 text-xl font-bold text-purple-400">Văn bản</h3>
          <p className="whitespace-pre-line">{transcript}</p>
        </div>
      )}

      <button
        onClick={exit}
        className="mt-6 rounded-lg bg-red-600 p-3 text-lg font-bold text-white"
      >
        Rời phòng
      </button>
    </div>
  );
}
