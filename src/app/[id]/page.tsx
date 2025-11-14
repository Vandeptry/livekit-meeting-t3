// src/app/[id]/page.tsx
"use client";
import dynamic from 'next/dynamic';
import { use as useUnwrap } from 'react';

const LiveKitRoom = dynamic(
    () => import('./livekit-rom-client').then((mod) => mod.LivekitRoom),
    { 
        ssr: false, 
        loading: () => <p className='text-xl text-gray-400'>Đang tải phòng họp...</p>
    }
);

interface RoomPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token: string }>;
}

export default function RoomPage({ params, searchParams }: RoomPageProps) {
  const { id: roomName } = useUnwrap(params);
  const { token } = useUnwrap(searchParams);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 w-full">
        <h1 className="text-3xl font-bold text-red-400">Lỗi: Thiếu Token.</h1>
        <p className="mt-4 text-white">Vui lòng quay lại trang chủ để chọn phòng.</p>
      </div>
    );
  }

  return (
    <LiveKitRoom 
      roomName={roomName} 
      token={token} 
    />
  );
}