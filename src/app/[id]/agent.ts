//src/app/[id]/agent.ts
let recorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;

export async function startMicCapture(onAudio: (data: ArrayBuffer) => void) {
  if (!navigator.mediaDevices) {
    console.warn("MediaDevices not supported");
    return;
  }

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

  recorder.ondataavailable = async (e) => {
    const buf = await e.data.arrayBuffer();
    onAudio(buf);
  };

  recorder.start(200);
}

export function stopMicCapture() {
  try {
    recorder?.stop();
    stream?.getTracks().forEach((t) => t.stop());
  } catch {}
  
  recorder = null;
  stream = null;
}
