// src/app/hooks/useRecorder.ts
"use client";

import { useRef, useState } from "react";

export function useRecorder(
  agentAudioRef?: React.RefObject<HTMLAudioElement>,
  agentAudioTrack?: React.RefObject<MediaStreamTrack | null>
) {
  const [recording, setRecording] = useState(false);

  const [recordedUrlA, setRecordedUrlA] = useState<string | null>(null);
  const [recordedUrlB, setRecordedUrlB] = useState<string | null>(null);

  const [transcript, setTranscript] = useState<string | null>(null);

  const recARef = useRef<MediaRecorder | null>(null);
  const recBRef = useRef<MediaRecorder | null>(null);

  const chunksA = useRef<BlobPart[]>([]);
  const chunksB = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      console.log("[Recorder] START");
      console.log("[Recorder] agentAudioRef.current:", agentAudioRef?.current);
      console.log("[Recorder] agentAudioTrack.current:", agentAudioTrack?.current);

      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[Recorder] mic track:", mic.getAudioTracks()[0]);

      const ctxA = new AudioContext();
      const destA = ctxA.createMediaStreamDestination();

      const micSourceA = ctxA.createMediaStreamSource(mic);
      micSourceA.connect(destA);

      if (agentAudioRef?.current) {
        const agentSrcA = ctxA.createMediaElementSource(agentAudioRef.current);
        agentSrcA.connect(destA);
        console.log("[Recorder] Added HTML audio to Recorder A");
      }

      const recorderA = new MediaRecorder(destA.stream, { mimeType: "audio/webm" });
      chunksA.current = [];
      recorderA.ondataavailable = (e) => {
        if (e.data.size > 0) chunksA.current.push(e.data);
      };
      recorderA.onstop = () => {
        const blob = new Blob(chunksA.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedUrlA(url);
        console.log("[Recorder] A DONE:", url);
      };

      const ctxB = new AudioContext();
      const destB = ctxB.createMediaStreamDestination();

      const micSourceB = ctxB.createMediaStreamSource(mic);
      micSourceB.connect(destB);

      if (agentAudioTrack?.current instanceof MediaStreamTrack) {
        const rawStream = new MediaStream([agentAudioTrack.current]);
        const rawSource = ctxB.createMediaStreamSource(rawStream);
        rawSource.connect(destB);
        console.log("[Recorder] Added RAW agent track to Recorder B");
      } else {
        console.log("[Recorder] RAW agent track is NULL");
      }

      const recorderB = new MediaRecorder(destB.stream, { mimeType: "audio/webm" });
      chunksB.current = [];
      recorderB.ondataavailable = (e) => {
        if (e.data.size > 0) chunksB.current.push(e.data);
      };
      recorderB.onstop = () => {
        const blob = new Blob(chunksB.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedUrlB(url);
        console.log("[Recorder] B DONE:", url);
      };

      recARef.current = recorderA;
      recBRef.current = recorderB;

      recorderA.start(200);
      recorderB.start(200);

      console.log("[Recorder] A STATE:", recorderA.state);
      console.log("[Recorder] B STATE:", recorderB.state);

      setRecording(true);
    } catch (err) {
      console.error("[Recorder] ERROR:", err);
      alert("Không thể bắt đầu ghi âm.");
    }
  };

  const stopRecording = () => {
    console.log("[Recorder] STOP");
    recARef.current?.stop();
    recBRef.current?.stop();
    setRecording(false);
  };

  const transcribe = async (url?: string) => {
    const fileUrl = url ?? recordedUrlA;
    if (!fileUrl) return;

    const blob = await (await fetch(fileUrl)).blob();
    const form = new FormData();
    form.append("file", blob, "recording.webm");

    console.log("[Recorder] TRANSCRIBE:", fileUrl);

    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    const json = await res.json();

    setTranscript(json.text ?? "Lỗi phân tích âm thanh");
  };

  return {
    recording,
    recordedUrlA,
    recordedUrlB,
    transcript,
    startRecording,
    stopRecording,
    transcribe,
  };
}
