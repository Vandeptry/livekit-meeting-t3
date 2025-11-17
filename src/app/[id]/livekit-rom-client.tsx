// src/app/[id]/livekit-rom-client.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RemoteParticipant, LocalTrack as LKLocalTrack, ConnectionQuality } from 'livekit-client';

let Room: any, RoomEvent: any, Track: any, createLocalTracks: any;
if (typeof window !== 'undefined') {
    const livekitClient = require('livekit-client');
    Room = livekitClient.Room;
    RoomEvent = livekitClient.RoomEvent;
    Track = livekitClient.Track;
    createLocalTracks = livekitClient.createLocalTracks;
}

const LIVEKIT_URL = 'wss://38f31b36b3ee.ngrok-free.app'; 

interface LivekitRoomProps {
    roomName: string;
    token: string;
}

export function LivekitRoom({ roomName, token }: LivekitRoomProps) {
    const [status, setStatus] = useState("Đang khởi tạo...");
    const [isConnecting, setIsConnecting] = useState(false);
    const localMediaRef = useRef<HTMLDivElement>(null);
    const room = useRef<any>(null);
    const publishedLocalTracks = useRef<LKLocalTrack[]>([]);
    const isConnected = useRef(false);
    // FIX: Thêm flag để ngăn connect() chạy hai lần trong React Strict Mode
    const didRun = useRef(false);

    const performDisconnect = useCallback(() => {
        const currentRoom = room.current;
        
        if (currentRoom && currentRoom.state !== 'disconnected') { 
            try {
                // Rời phòng
                currentRoom.disconnect();
                
                // Dọn dẹp Local Tracks
                (publishedLocalTracks.current as LKLocalTrack[]).forEach(t => {
                    t.detach();
                    t.stop();
                });
                publishedLocalTracks.current = [];
            } catch (e) {
                // Bỏ qua lỗi khi ngắt kết nối
            }
        }
        isConnected.current = false;
        setIsConnecting(false);
        if (localMediaRef.current) localMediaRef.current.innerHTML = '';
        setStatus('Đã ngắt kết nối');
    }, []);

    const connect = useCallback(async (currentRoomName: string, currentToken: string) => {
        // Chặn nếu đang kết nối, đã kết nối, hoặc đang chạy trong strict mode (lần 2)
        if (isConnecting || isConnected.current || !Room) return;

        // Bắt đầu quá trình kết nối
        setIsConnecting(true);
        setStatus(`Đang kết nối vào phòng ${currentRoomName}...`);

        try {
            // Dọn dẹp phòng cũ nếu có
            if (room.current && room.current.state !== 'disconnected') {
                 performDisconnect();
            }

            // Khởi tạo Room mới
            const newRoom = new Room({
                // Đã bao gồm STUN server từ Kịch bản 4 (Tốt cho WebRTC)
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ],
                // Cấu hình reconnect tự động
                autoSubscribe: true,
                adaptiveStream: true,
                // Cho phép SDK tự động reconnect khi bị ngắt kết nối mạng tạm thời
                reconnect: true, 
            });
            room.current = newRoom;
            
            // Đính kèm Listeners trước khi Connect
            newRoom
                .on(RoomEvent.Connected, async () => {
                    isConnected.current = true;
                    setIsConnecting(false);
                    setStatus(`Đã kết nối thành công! Đang kiểm tra thiết bị...`);
                    
                    // Logic lấy và publish media (giữ nguyên)
                    try {
                         const localTracks = await createLocalTracks({ video: true, audio: true });
                         if (newRoom.state !== 'connected') {
                            setStatus('Connected! Nhưng phòng đã đóng lại trong khi lấy media.');
                            localTracks.forEach((t: LKLocalTrack) => t.stop());
                            return;
                         }

                         // Hiển thị và publish
                         const localVideoTrack = localTracks.find((t: LKLocalTrack) => t.kind === Track.Kind.Video);
                         if (localVideoTrack && localMediaRef.current) {
                             localMediaRef.current.innerHTML = '';
                             localMediaRef.current.appendChild(localVideoTrack.attach());
                         }
                         for (const track of localTracks) {
                            await newRoom.localParticipant.publishTrack(track);
                         }
                         publishedLocalTracks.current = localTracks;
                         setStatus('Connected & Published successfully! Đang chờ Agent...');
                    } catch (e) {
                         const errorMsg = (e as Error).message;
                         setStatus(`Connected! Lỗi Media/Quyền truy cập: ${errorMsg}`);
                    }
                })
                
                .on(RoomEvent.FailedToConnect, (error: Error) => {
                    // Lỗi FailedToConnect xảy ra khi WebRTC/ICE thất bại
                    performDisconnect();
                    const errorDetails = `LỖI KẾT NỐI PC: ${error.name} - ${error.message}`;
                    setStatus(`Failed to connect: ${errorDetails}. KIỂM TRA MẠNG/CỔNG UDP!`);
                })

                .on(RoomEvent.Disconnected, () => {
                    // Lắng nghe sự kiện Disconnected để cập nhật trạng thái
                    performDisconnect();
                })
                
                // Thêm các listeners khác nếu cần...

            // Thực hiện kết nối
            await newRoom.connect(LIVEKIT_URL, currentToken);

        } catch (error) {
            const errorMessage = (error as Error).message;
            if (!errorMessage.includes('Received leave request')) {
                setStatus(`Failed to connect (Signal): ${errorMessage}`);
            }
            setIsConnecting(false);
            isConnected.current = false;
        }
    }, [isConnecting, performDisconnect]);

    useEffect(() => {
        // FIX: Ngăn chặn chạy hai lần trong Strict Mode
        if (didRun.current) return;
        didRun.current = true;
        
        void connect(roomName, token);

        return () => {
            // Cleanup khi component unmount
            if (room.current) {
                performDisconnect();
            }
            // Không set room.current = null ở đây để performDisconnect có thể dọn dẹp
        };
    }, [roomName, token, connect, performDisconnect]);
    
    // ... Phần return JSX giữ nguyên
    return (
        <div className="flex flex-col items-center p-8 bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Phòng: {roomName}</h1>
            <p className="mb-6 text-lg">Trạng thái: <span className="font-semibold text-[hsl(280,100%,70%)]">{status}</span></p>

            <div 
                ref={localMediaRef} 
                className="w-full h-80 bg-black rounded-lg mb-6 overflow-hidden flex justify-center items-center"
            >
                <p className='text-gray-400'>Vùng hiển thị media cục bộ (nếu có thiết bị).</p>
            </div>

            <button
                onClick={performDisconnect}
                className="rounded-lg bg-red-600 p-3 text-lg font-bold text-white transition hover:bg-red-700"
            >
                Rời khỏi Phòng
            </button>
        </div>
    );
}