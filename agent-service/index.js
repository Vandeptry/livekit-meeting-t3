// agent-service/index.js
import 'dotenv/config';
import express from 'express';
import { WebhookReceiver, AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const AGENT_PORT = Number(process.env.AGENT_PORT ?? 3001);
const LIVEKIT_HOST = process.env.LIVEKIT_URL
    ? process.env.LIVEKIT_URL.replace(/^ws(s)?:\/\//, 'http$1://')
    : 'http://192.168.1.43:7880';

const LIVEKIT_API_KEY = (process.env.LIVEKIT_API_KEY ?? 'devkey').trim();
const LIVEKIT_API_SECRET = (process.env.LIVEKIT_API_SECRET ?? 'secret').trim();
const WEBHOOK_SECRET = (process.env.WEBHOOK_SECRET ?? 'secret').trim();
const TARGET_ROOM = process.env.TARGET_ROOM ?? 'dev-room-1';
const AGENT_IDENTITY = process.env.AGENT_IDENTITY ?? `bot-${TARGET_ROOM}`;

console.log(`[AGENT CONFIG] Host: ${LIVEKIT_HOST}, Key: ${LIVEKIT_API_KEY}, Secret (Truncated): ${LIVEKIT_API_SECRET.substring(0, 4)}...`);
console.log(`[AGENT CONFIG] Target Room: ${TARGET_ROOM}, Identity: ${AGENT_IDENTITY}`);

const app = express();
const receiver = new WebhookReceiver(LIVEKIT_API_KEY, WEBHOOK_SECRET);
const roomService = new RoomServiceClient(LIVEKIT_HOST, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

/**
 * @param {string} roomName
 */
async function sendWelcomeMessage(roomName) {
    const welcomeMessage = `Chào mừng, tôi là ${AGENT_IDENTITY}. Cần giúp gì không?`;
    const data = Buffer.from(welcomeMessage, 'utf8');

    try {
        await roomService.sendData(
            roomName,
            data,
            0,
            [],
        );
        console.log(`[AGENT] Sent data message to room ${roomName} successfully.`);
    } catch (error) {
        console.error(`[AGENT SEND DATA ERROR] Failed to send welcome message to ${roomName}:`, error);
    }
}

app.use(
    express.raw({
        type: 'application/webhook+json',
        verify: (req, res, buf) => { },
    }),
);

app.post('/api/webhook', async (req, res) => {
    let event;
    try {
        const rawBody = req.body;
        if (!rawBody || !Buffer.isBuffer(rawBody)) {
            console.warn('[WEBHOOK] Received invalid request payload type.');
            return res.status(400).send('Invalid request payload type.');
        }
        event = receiver.receive(rawBody.toString('utf8'), req.headers.authorization);
    } catch (e) {
        console.error('[WEBHOOK ERROR] Invalid Signature or Payload:', e);
        return res.status(401).send('Invalid webhook signature or payload.');
    }
    event = await event;

    if (
        event?.event === 'participant_joined' &&
        event?.room?.name === TARGET_ROOM &&
        event?.participant?.identity !== AGENT_IDENTITY
    ) {
        console.log(`[WEBHOOK EVENT] Detected user ${event.participant?.identity} joined ${event.room?.name}. Attempting to send welcome...`);
        await sendWelcomeMessage(event.room.name);
        return res.status(200).send('Agent sent welcome message.');
    }

    console.log(`[WEBHOOK IGNORED] Event type: ${event?.event} in room: ${event?.room?.name}`);
    return res.status(200).send('Event received, but ignored.');
});

app.listen(AGENT_PORT, '0.0.0.0', () => {
    console.log(`LiveKit Agent Service running on port ${AGENT_PORT}. Ready to receive webhooks.`);
});