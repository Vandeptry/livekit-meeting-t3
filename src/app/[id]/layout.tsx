// src/app/[id]/layout.tsx
import type { ReactNode } from 'react';

export default function RoomLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center w-full">
      {children}
    </div>
  );
}