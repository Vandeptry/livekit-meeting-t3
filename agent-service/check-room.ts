import { RoomServiceClient } from "livekit-server-sdk";

// --- THAY THẾ BẰNG THÔNG TIN CỦA BẠN ---
const LIVEKIT_URL = "https://meeting-t3-14zfyes1.livekit.cloud";
const LIVEKIT_API_KEY = "APIpHrqCcwFL9ec";
const LIVEKIT_API_SECRET = "8NyV3GwkM4yn6ToPnUToor7rZkOVSchaXmHGjiWEXLK";
// ----------------------------------------

const roomServiceClient = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

async function checkActiveRooms() {
    try {
        // Lấy danh sách tất cả các phòng đang hoạt động theo Server
        const rooms = await roomServiceClient.listRooms();

        if (rooms.length === 0) {
            console.log("✅ LiveKit Server xác nhận: KHÔNG có phòng nào đang hoạt động.");
            console.log("-> Session đang ACTIVE trên UI là lỗi hiển thị lịch sử.");
        } else {
            console.log(`⚠️ Tìm thấy ${rooms.length} phòng đang hoạt động theo Server:`);
            for (const room of rooms) {
                console.log(`- Tên: ${room.name}, SID: ${room.sid}, Người tham gia: ${room.numParticipants}`);
            }
        }
    } catch (error) {
        console.error("Lỗi khi kiểm tra danh sách phòng:", (error as any).message);
    }
}

checkActiveRooms();