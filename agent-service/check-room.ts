import { RoomServiceClient } from "livekit-server-sdk";

async function main() {
    const url = "https://meeting-t3-14zfyes1.livekit.cloud";
    const apiKey = "APIpHrqCcwFL9ec";
    const apiSecret = "8NyV3GwkM4yn6ToPnUToor7rZkOVSchaXmHGjiWEXLK";

    const client = new RoomServiceClient(url, apiKey, apiSecret);

    const rooms = await client.listRooms();
    console.log("Rooms:", rooms);
}

main();
