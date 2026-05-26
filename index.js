// index.js
// Ponto de entrada principal do servidor Express

import { setupClient } from './services/whatsappClient.js';
import { processMessage } from './handlers/messageHandler.js';

// Define o token de verificação para o webhook
const VERIFY_TOKEN = 'tokenSecreto123';

// Configura e inicia o cliente, obtendo o app e as funções de serviço
const { app, sendMessage, processedMessages, recentlyCheckedBlocks } = setupClient();

// 🎯 Webhook principal para receber mensagens
app.post('/webhook', async (req, res) => {
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const message = changes?.value?.messages?.[0];
        const now = Date.now();

        // 🔥 RESPONDER IMEDIATAMENTE para a API do WhatsApp
        res.status(200).json({ status: 'received', timestamp: new Date().toISOString() });

        if (!message) {
            console.log(`[${now}]📥 Webhook sem mensagem`);
            return;
        }

        // ✅ Definir 'from' antes de usar e logar
        const from = message.from;
        console.log(`[${now}]📥 Mensagem de: ${from} | Tipo: ${message.type} | ID: ${message.id}`);

        // ✅ Verificação de mensagem duplicada
        const messageKey = `${message.id}_${from}`;
        if (processedMessages.has(messageKey)) {
            console.log(`[${now}]⚠️ Mensagem duplicada ignorada: ${messageKey}`);
            return;
        }
        processedMessages.set(messageKey, Date.now());

        // 🔒 Verificação rápida de cache para evitar spam
        const cachedCheck = recentlyCheckedBlocks.get(from);
        if (cachedCheck && cachedCheck.expires > now && cachedCheck.blocked) {
            console.log(`[${now}][CACHE] Ignorando (cache): ${from}`);
            return;
        }

        // Ignorar eventos de status (entregue/lido)
        if (changes?.value?.statuses) {
            console.log(`[${now}]📨 Evento de status ignorado`);
            return;
        }

        // 📝 Processar mensagem assincronamente usando o messageHandler
        // Passa todas as dependências necessárias (services) para a função
        processMessage(message, from, { sendMessage, recentlyCheckedBlocks });

    } catch (error) {
        console.error(`[${Date.now()}]Erro no webhook: ${error.message}`);
    }
});

// 🔍 Verificação do Webhook (GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// 🚀 Inicia o servidor
app.listen(80, () => {
    console.log(`[${Date.now()}]🚀 Servidor rodando na porta 80`);
});
