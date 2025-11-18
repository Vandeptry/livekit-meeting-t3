// agent-service/index.ts
import {
  defineAgent,
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  voice
} from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const agent = defineAgent({
  prewarm: async (_proc: JobProcess) => {
    console.log("[AGENT] Prewarm...");
  },

  entry: async (ctx: JobContext) => {
    console.log("[AGENT] Job started for room:", ctx.job.room?.name);

    const brain = new voice.Agent({
      instructions: `
        Bạn là trợ lý AI tiếng Việt.
        Trả lời ngắn và rõ ràng.
        Khi bắt đầu chỉ cần nói: "Xin chào bạn".
      `,
    });

    const session = new voice.AgentSession({
      llm: new openai.realtime.RealtimeModel({
        voice: "alloy",
      }),
    });

    await session.start({
      agent: brain,
      room: ctx.room,
    });

    console.log("[AGENT] Connected to room:", ctx.room?.name);

    await session.generateReply({
      instructions: "Xin chào bạn",
    });
  },
});

export default agent;

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    wsURL: process.env.LIVEKIT_URL!,
    apiKey: process.env.LIVEKIT_API_KEY!,
    apiSecret: process.env.LIVEKIT_API_SECRET!,
  })
);
