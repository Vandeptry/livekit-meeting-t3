// Dùng require() thay cho import
const { RoomServiceClient } = require("livekit-server-sdk");

// --- THAY THẾ CÁC GIÁ TRỊ SAU BẰNG THÔNG TIN CỦA BẠN ---
const LIVEKIT_URL = "https://meeting-t3-14zfyes1.livekit.cloud";
const LIVEKIT_API_KEY = "APIpHrqCcwFL9ec";
const LIVEKIT_API_SECRET = "8NyV3GwkM4yn6ToPnUToor7rZkOVSchaXmHGjiWEXLK";
// ---------------------------------------------------------

const roomServiceClient = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

async function endAllActiveRooms() {
    try {
        const rooms = await roomServiceClient.listRooms();

        if (rooms.length === 0) {
            console.log("Không tìm thấy phòng nào đang hoạt động.");
            return;
        }

        console.log(`Tìm thấy ${rooms.length} phòng đang hoạt động. Tiến hành đóng...`);

        for (const room of rooms) {
            console.log(`\n--- Đóng phòng: ${room.name} (SID: ${room.sid}) ---`);
            await roomServiceClient.deleteRoom(room.name);
            console.log(`✅ Phòng "${room.name}" đã được đóng thành công.`);
        }

        console.log("\nHoàn tất quá trình đóng phòng.");

    } catch (error) {
        const errorMessage = (error).message || String(error);
        console.error("Lỗi xảy ra trong quá trình đóng phòng:", errorMessage);
    }
}

endAllActiveRooms();