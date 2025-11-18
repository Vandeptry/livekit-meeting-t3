//src/app/[id]/useLKSession.ts
"use client";

import { useMemo } from "react";
import { TokenSource } from "livekit-client";
import {useSession} from "@livekit/components-react";

export function useLKSession(roomName: string, identity: string) {
  const tokenSource = useMemo(() => {
    return TokenSource.endpoint("/api/connection-details");
  }, []);

  const session = useSession(tokenSource, {
    roomName,
  });

  return session;
}
