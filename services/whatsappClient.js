// whatsappClient.js
// Responsável pela configuração do cliente, envio de mensagens e caches.

import 'dotenv/config';

import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';

import { getCurrentTime, formatPhoneNumber } from '../utils/utils.js';

const processedMessages = new Map();

const recentlyCheckedBlocks = new Map();

export function setupClient() {
    const app = express();
    app.use(bodyParser.json());

    const TOKEN = process.env.WHATSAPP_TOKEN || '';
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
    console.log(`[${getCurrentTime()}][TOKEN] + ${TOKEN} + [PHONE] ${PHONE_NUMBER_ID}`);

    async function sendMessage(to, messageData, retries = 3) {
        try {
            await axios.post(
                `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: formatPhoneNumber(to),
                    ...messageData
                },
                {
                    headers: {
                        Authorization: `Bearer ${TOKEN}`,
                        'Content-Type': 'application/json',
                        'Timeout': 10000
                    }
                }
            );
        } catch (error) {
            if (retries > 0) {
                console.log(`[${getCurrentTime()}] Retentativa ${4 - retries} para ${to}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return sendMessage(to, messageData, retries - 1);
            }
            throw error;
        }
    }

    setInterval(() => {
        const now = Date.now();
        const fiveMinutesAgo = now - 300000;

        for (const [messageKey, timestamp] of processedMessages.entries()) {
            if (timestamp < fiveMinutesAgo) {
                processedMessages.delete(messageKey);
            }
        }
        console.log(`[${getCurrentTime()}] Mensagens antigas limpas do cache`);
    }, 60000);
e
    setInterval(() => {
        const now = Date.now();
        let cleaned = 0;

        for (const [userId, cacheInfo] of recentlyCheckedBlocks.entries()) {
            if (now >= cacheInfo.expires) {
                recentlyCheckedBlocks.delete(userId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[${getCurrentTime()}][CACHE CLEANUP] Limpos ${cleaned} registros do cache`);
        }
    }, 60000);

    return { app, sendMessage, processedMessages, recentlyCheckedBlocks };
}