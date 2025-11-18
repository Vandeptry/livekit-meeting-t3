//agent-service/realtime-agent.ts
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
import "dotenv/config";

const agent = defineAgent({
    prewarm: async (_proc: JobProcess) => {
      console.log("[AGENT] Prewarm...");
    },
  
    entry: async (ctx: JobContext) => {
      console.log("[AGENT] Job started for room:", ctx.job.room?.name);

      const brain = new voice.Agent({
        instructions: `
          Bạn là trợ lý AI tiếng Việt trong một cuộc họp trực tuyến.
          Trả lời ngắn gọn, rõ ràng và lịch sự.
          Khi nghe người dùng nói, hãy trả lời bằng giọng nói tự nhiên.
        `
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
  
      // Chào user
      await session.generateReply({
        instructions:
          "Hãy gửi lời chào người dùng bằng tiếng Việt, giới thiệu bạn là trợ lý AI.",
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
    }),
  );
  