// src/lib/livekit-token.ts
import { AccessToken } from 'livekit-server-sdk';
import type { VideoGrant } from 'livekit-server-sdk';
import { env } from '~/env.js';

const sanitize = (v?: string) => (v ?? '').replace(/['";]/g, '').trim();

const LIVEKIT_API_KEY = sanitize(env.LIVEKIT_API_KEY);
const LIVEKIT_API_SECRET = sanitize(env.LIVEKIT_API_SECRET);

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  throw new Error('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not set. Check your .env values.');
}

export async function createToken(roomName: string, identity: string, isAgent: boolean = false, ttl: number = 3600): Promise<string> {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity,
        ttl,
    });

    const grant: VideoGrant = {
        roomJoin: true,
        room: roomName,
        canPublish: !isAgent, 
        canSubscribe: true,
    };

    at.addGrant(grant);

    return at.toJwt();
}