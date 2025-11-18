import { RoomServiceClient } from "livekit-server-sdk";

// --- THAY THẾ BẰNG THÔNG TIN CHÍNH XÁC ---
const LIVEKIT_URL = "https://meeting-t3-14zfyes1.livekit.cloud";
const LIVEKIT_API_KEY = "APIpHrqCcwFL9ec";
const LIVEKIT_API_SECRET = "8NyV3GwkM4yn6ToPnUToor7rZkOVSchaXmHGjiWEXLK";

// SỬ DỤNG ROOM SID hoặc TÊN PHÒNG CHÍNH XÁC
const IDENTIFIER_TO_CLOSE = "RM_BfDL6YqidgEG"; // Room SID của phòng đang ACTIVE trong ảnh

// ---------------------------------------------------------

const roomServiceClient = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

async function endSpecificSession() {
    try {
        console.log(`Tiến hành buộc đóng session/phòng: ${IDENTIFIER_TO_CLOSE}`);
        
        // deleteRoom chấp nhận cả Room Name (dev-room-f) hoặc Room SID (RM_jQEzFdimcR3s)
        await roomServiceClient.deleteRoom(IDENTIFIER_TO_CLOSE);
        
        console.log(`✅ Session/Phòng "${IDENTIFIER_TO_CLOSE}" đã được đóng thành công.`);

    } catch (error) {
        const errorMessage = (error as any).message || String(error);
        if (errorMessage.includes("room not found")) {
            console.log(`Phòng "${IDENTIFIER_TO_CLOSE}" không tồn tại hoặc đã đóng.`);
            console.log("-> Nếu đây là session ghi âm, bạn cần xóa thủ công trên LiveKit Cloud console.");
        } else {
            console.error("Lỗi xảy ra trong quá trình đóng phòng:", errorMessage);
        }
    }
}

endSpecificSession();