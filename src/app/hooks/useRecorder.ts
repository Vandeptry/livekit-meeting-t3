//src/app/hooks/useRecorder.ts
"use client";

import { useRef, useState } from "react";

export function useRecorder(agentAudioRef?: React.RefObject<HTMLAudioElement>) {
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });

      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();

      // mic
      const micSource = ctx.createMediaStreamSource(mic);
      micSource.connect(dest);

      // agent audio
      if (agentAudioRef?.current) {
        const agentSource = ctx.createMediaElementSource(agentAudioRef.current);
        agentSource.connect(dest);
      }

      const recorder = new MediaRecorder(dest.stream, {
        mimeType: "audio/webm",
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedUrl(URL.createObjectURL(blob));
      };

      recorder.start(200);
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      alert("Không thể bắt đầu ghi âm.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const transcribe = async () => {
    if (!recordedUrl) return;

    const blob = await (await fetch(recordedUrl)).blob();
    const form = new FormData();
    form.append("file", blob, "recording.webm");

    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    const json = await res.json();

    setTranscript(json.text ?? "Lỗi phân tích âm thanh");
  };

  return {
    recording,
    recordedUrl,
    transcript,
    startRecording,
    stopRecording,
    transcribe,
  };
}
