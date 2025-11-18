// agent-service/index.ts
import {
  defineAgent,
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  voice,
} from "@livekit/agents";

import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as openai from "@livekit/agents-plugin-openai";
import * as silero from "@livekit/agents-plugin-silero";
import { BackgroundVoiceCancellation } from "@livekit/noise-cancellation-node";

import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});
const agent = defineAgent({
  prewarm: async (_proc: JobProcess) => {
    console.log("[AGENT] Prewarm pipeline...");
  },

  entry: async (ctx: JobContext) => {
    console.log("[AGENT] Job started for room:", ctx.job.room?.name);
    const assistant = new voice.Agent({
      instructions: `
        Bạn là trợ lý AI tiếng Việt, hỗ trợ người dùng trong cuộc gọi thoại.
        Trả lời ngắn gọn, rõ ràng, xưng "mình" / "bạn" cho thân thiện.
        Nếu nghe không rõ hoặc không hiểu thì hãy hỏi lại.
      `,
    });
    const vad = (await silero.VAD.load()) as silero.VAD;
    const session = new voice.AgentSession({
      vad,
      stt: new deepgram.STT(),              // Deepgram STT
      llm: new openai.LLM(),                // OpenAI LLM
      tts: new elevenlabs.TTS(),            // ElevenLabs TTS
      turnDetection: new livekit.turnDetector.MultilingualModel(),
    });

    await session.start({
      room: ctx.room,
      agent: assistant,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });
    await ctx.connect();

    console.log("[AGENT] Pipeline session started in room:", ctx.room?.name);

    const handle = session.generateReply({ userInput: "Xin chào bạn, mình có thể giúp gì cho bạn?" });
    await handle.waitForPlayout();
  },
});

export default agent;

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    wsURL: process.env.LIVEKIT_URL!,
    apiKey: process.env.LIVEKIT_API_KEY!,
    apiSecret: process.env.LIVEKIT_API_SECRET!,
  }),
);
