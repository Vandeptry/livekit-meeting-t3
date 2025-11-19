//src/app/_components/RoomList.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

interface Room {
  id: string;
  name: string;
}

export function RoomList() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: rooms, isLoading: isLoadingRooms } =
    api.livekit.getRooms.useQuery();

  const joinMutation = api.livekit.joinRoom.useMutation({
    onSuccess: (data) => {
      setError(null);
      router.replace(`/${data.roomName}`);
    },
    onError: (err) => {
      setError(err.message || "Lỗi khi join phòng.");
    },
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identity.trim()) {
      setError("Vui lòng nhập Tên.");
      return;
    }
    if (!selectedRoomId) {
      setError("Vui lòng chọn 1 phòng.");
      return;
    }

    joinMutation.mutate({
      roomId: selectedRoomId,
      identity: identity.trim(),
    });
  };

  if (!mounted || isLoadingRooms) {
    return <div className="text-xl text-white">Đang tải danh sách phòng...</div>;
  }

  const selectedRoom = rooms?.find((r) => r.id === selectedRoomId);

  return (
    <div className="w-full max-w-xl rounded-xl bg-white/10 p-8 shadow-2xl">
      <h2 className="mb-6 text-3xl font-bold text-white">
        Tham gia Cuộc họp LiveKit
      </h2>

      <form onSubmit={handleJoin} className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Tên Định danh
          </label>
          <input
            type="text"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="Ví dụ: VanPham"
            className="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
            disabled={joinMutation.isPending}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Chọn phòng
          </label>

          <div className="grid grid-cols-1 gap-3">
            {rooms?.map((room: Room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomId(room.id)}
                className={`rounded-lg p-3 text-left transition ${
                  selectedRoomId === room.id
                    ? "bg-purple-500 text-white shadow-md font-semibold"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-400">Lỗi: {error}</p>}

        <button
          type="submit"
          className="mt-4 rounded-lg bg-green-500 p-3 text-lg font-bold text-white transition hover:bg-green-600 disabled:bg-gray-500"
          disabled={!selectedRoomId || !identity.trim() || joinMutation.isPending}
        >
          {joinMutation.isPending
            ? "Đang chuẩn bị..."
            : selectedRoom
            ? `Tham gia: ${selectedRoom.name}`
            : "Chọn phòng để tham gia"}
        </button>
      </form>
    </div>
  );
}
