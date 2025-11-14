// src/app/[id]/livekit-rom-client.tsx - Giải pháp 2
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

const LIVEKIT_URL = 'ws://192.168.1.43:7880'; 

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

    const performDisconnect = useCallback(() => {
        const currentRoom = room.current;
        
        if (currentRoom && currentRoom.state !== 'disconnected') { 
            try {
                currentRoom.disconnect();
                
                (publishedLocalTracks.current as LKLocalTrack[]).forEach(t => {
                    t.detach();
                    t.stop();
                });
                publishedLocalTracks.current = [];
            } catch (e) {
            }
        }
        isConnected.current = false;
        setIsConnecting(false);
        if (localMediaRef.current) localMediaRef.current.innerHTML = '';
        setStatus('Đã ngắt kết nối');
    }, []);

    const connect = useCallback(async (currentRoomName: string, currentToken: string) => {
        if (isConnecting || isConnected.current || !Room) return;

        setIsConnecting(true);
        setStatus(`Đang kết nối vào phòng ${currentRoomName}...`);

        try {
            if (room.current && room.current.state === 'connected') {
                setIsConnecting(false);
                return; 
            }
            
            if (!room.current || room.current.state === 'disconnected') {
                room.current = new Room({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ],
                    dynacast: true,
                    adaptiveStream: false,
                    autoConnect: false, 
                });
            }
        
            room.current
              .on(RoomEvent.Connected, async () => {
                isConnected.current = true;
                setIsConnecting(false);
                setStatus(`Đã kết nối thành công! Đang kiểm tra thiết bị...`);

                try {
                    const localTracks = await createLocalTracks({
                        video: true,
                        audio: true,
                    });

                    if (room.current.state !== 'connected') {
                        setStatus('Connected! Nhưng phòng đã đóng lại trong khi lấy media.');
                        localTracks.forEach((t: LKLocalTrack) => t.stop());
                        return;
                    }
                    
                    if (localTracks.length > 0) {
                        const localVideoTrack = localTracks.find((t: LKLocalTrack) => t.kind === Track.Kind.Video);
                        if (localVideoTrack && localMediaRef.current) {
                            localMediaRef.current.innerHTML = '';
                            localMediaRef.current.appendChild(localVideoTrack.attach());
                        }

                        for (const track of localTracks) {
                            await room.current.localParticipant.publishTrack(track);
                        }
                        publishedLocalTracks.current = localTracks;
                        setStatus('Connected & Published successfully! Đang chờ Agent...');
                    } else {
                        setStatus('Connected! Không tìm thấy thiết bị Media (Camera/Mic). Đang chờ Agent...');
                    }

                } catch (e) {
                    const errorMsg = (e as Error).message;
                    if (errorMsg.includes('Permission denied') || errorMsg.includes('device')) {
                        setStatus('Connected! Lỗi thiết bị/quyền truy cập. Không thể publish. Đang chờ Agent...');
                    } else {
                        setStatus(`Connected! Lỗi không mong muốn: ${errorMsg}`);
                    }
                }
              })
              
              .on(RoomEvent.FailedToConnect, (error: Error) => {
                performDisconnect();
                const errorDetails = `LỖI KẾT NỐI PC: ${error.name} - ${error.message}`;
                setStatus(`Failed to connect: ${errorDetails}. KIỂM TRA MẠNG & FIREWALL!`);
              })

              .on(RoomEvent.Reconnecting, () => {
                setStatus('Đang reconnect...');
              })

              .on(RoomEvent.Reconnected, () => {
                setStatus('Đã reconnect thành công');
              })

              .on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality) => {
              })

              .on(RoomEvent.Disconnected, () => {
              })
              .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
                setStatus(`Participant connected: ${participant.identity}.`);
              })
              .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
              });

            try {
                await room.current.connect(LIVEKIT_URL, currentToken);
            } catch (error) {
                const errorMessage = (error as Error).message;
                if (!errorMessage.includes('Received leave request')) {
                    setStatus(`Failed to connect (Signal): ${errorMessage}`);
                }
                setIsConnecting(false);
                isConnected.current = false;
            }
        } catch (error) {
            setIsConnecting(false);
            isConnected.current = false;
            setStatus(`Lỗi khởi tạo: ${(error as Error).message}`);
        }
    }, [isConnecting, performDisconnect]);

    useEffect(() => {
        void connect(roomName, token);

        return () => {
            if (room.current) {
                performDisconnect();
            }
            room.current = null;
        };
    }, [roomName, token]);


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