// src/app/[id]/livekit-room.tsx
"use client";

import { useRouter } from "next/navigation";
import { useLivekitRoom } from "../hooks/useLivekitRoom";
import { useRecorder } from "../hooks/useRecorder";

interface Props {
  roomName: string;
  token: string;
}

export function LivekitRoom({ roomName, token }: Props) {
  const router = useRouter();

  const {
    status,
    localVideoRef,
    agentAudioRef,
    agentAudioTrack,
    userAudioTrack,
    disconnect,
  } = useLivekitRoom(roomName, token);

  const {
    recording,
    recordedUrlA,
    recordedUrlB,
    transcript,
    startRecording,
    stopRecording,
    transcribe,
  } = useRecorder(userAudioTrack, agentAudioTrack);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center rounded-lg bg-gray-800 p-8 text-white shadow-xl">
      <h1 className="mb-4 text-3xl font-bold">Phòng: {roomName}</h1>

      <p className="mb-6 text-lg text-purple-300">{status}</p>

      {/* Local camera preview */}
      <div
        ref={localVideoRef}
        className="mb-6 flex h-80 w-full items-center justify-center overflow-hidden rounded-lg bg-black"
      />

      {/* Agent audio */}
      <audio ref={agentAudioRef} autoPlay playsInline />

      {/* Record controls */}
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

      {/* User-only recording */}
      {recordedUrlA && (
        <div className="mt-4 w-full">
          <p className="mb-1 text-white">Bản ghi A (User)</p>
          <audio controls src={recordedUrlA} className="w-full" />
          <button
            onClick={() => transcribe(recordedUrlA)}
            className="mt-2 rounded-lg bg-green-600 p-2 text-white"
          >
            Xuất văn bản A
          </button>
        </div>
      )}

      {/* Full recording */}
      {recordedUrlB && (
        <div className="mt-4 w-full">
          <p className="mb-1 text-white">Bản ghi B (Full)</p>
          <audio controls src={recordedUrlB} className="w-full" />
          <button
            onClick={() => transcribe(recordedUrlB)}
            className="mt-2 rounded-lg bg-green-600 p-2 text-white"
          >
            Xuất văn bản B
          </button>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="mt-4 w-full rounded-lg bg-gray-900 p-4 text-left text-white">
          <h3 className="mb-2 text-xl font-bold text-purple-400">Văn bản</h3>
          <p className="whitespace-pre-line">{transcript}</p>
        </div>
      )}

      {/* Exit */}
      <button
        onClick={() => {
          disconnect();
          router.push("/");
        }}
        className="mt-6 rounded-lg bg-red-600 p-3 text-lg font-bold text-white"
      >
        Rời phòng
      </button>
    </div>
  );
}
