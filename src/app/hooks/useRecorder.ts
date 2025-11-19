// src/app/hooks/useRecorder.ts
"use client";

import { useRef, useState } from "react";

export function useRecorder(
  userAudioTrackRef: React.MutableRefObject<any>,
  agentAudioTrackRef: React.MutableRefObject<any>,
) {
  const [recording, setRecording] = useState(false);
  const [recordedUrlA, setRecordedUrlA] = useState<string | null>(null);
  const [recordedUrlB, setRecordedUrlB] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const mediaRecorderA = useRef<MediaRecorder | null>(null);
  const mediaRecorderB = useRef<MediaRecorder | null>(null);

  const chunksA = useRef<Blob[]>([]);
  const chunksB = useRef<Blob[]>([]);

  const trackToStream = (track: any) => {
    if (!track) return null;
    const mediaStreamTrack = track.mediaStreamTrack;
    if (!mediaStreamTrack) return null;
    return new MediaStream([mediaStreamTrack]);
  };

  const startRecording = () => {
    const userTrack = userAudioTrackRef.current;
    const agentTrack = agentAudioTrackRef.current;

    if (!userTrack) {
      console.warn("[Recorder] User audio track missing");
      return;
    }

    const userStream = trackToStream(userTrack);
    if (userStream) {
      mediaRecorderA.current = new MediaRecorder(userStream, {
        mimeType: "audio/webm",
      });
      chunksA.current = [];
      mediaRecorderA.current.ondataavailable = (e) => chunksA.current.push(e.data);
      mediaRecorderA.current.onstop = () => {
        const blob = new Blob(chunksA.current, { type: "audio/webm" });
        setRecordedUrlA(URL.createObjectURL(blob));
      };
      mediaRecorderA.current.start();
    }

    const mixedStream = new MediaStream();

    if (userTrack?.mediaStreamTrack) {
      mixedStream.addTrack(userTrack.mediaStreamTrack);
    }
    if (agentTrack?.mediaStreamTrack) {
      mixedStream.addTrack(agentTrack.mediaStreamTrack);
    }

    mediaRecorderB.current = new MediaRecorder(mixedStream, {
      mimeType: "audio/webm",
    });
    chunksB.current = [];
    mediaRecorderB.current.ondataavailable = (e) => chunksB.current.push(e.data);
    mediaRecorderB.current.onstop = () => {
      const blob = new Blob(chunksB.current, { type: "audio/webm" });
      setRecordedUrlB(URL.createObjectURL(blob));
    };
    mediaRecorderB.current.start();

    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
    if (mediaRecorderA.current && mediaRecorderA.current.state !== "inactive") {
      mediaRecorderA.current.stop();
    }

    if (mediaRecorderB.current && mediaRecorderB.current.state !== "inactive") {
      mediaRecorderB.current.stop();
    }
  };

  const transcribe = async (audioUrl: string | null) => {
    if (!audioUrl) return;

    setTranscript("Đang xử lý...");

    setTimeout(() => {
      setTranscript("Chưa triển khai STT.");
    }, 1000);
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