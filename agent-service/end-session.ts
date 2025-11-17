//agent-service/end-session.ts
import { RoomServiceClient } from "livekit-server-sdk";

async function main() {
  const url = "https://meeting-t3-14zfyes1.livekit.cloud";
  const apiKey = "APIpHrqCcwFL9ec";
  const apiSecret = "8NyV3GwkM4yn6ToPnUToor7rZkOVSchaXmHGjiWEXLK";

  const roomName = "dev-room-1";

  const client = new RoomServiceClient(url, apiKey, apiSecret);

  const info = await client.listParticipants(roomName);

  console.log("Participants:", info);

  for (const p of info) {
    console.log("Disconnecting:", p.identity);
    await client.removeParticipant(roomName, p.identity);
  }
}

main();
