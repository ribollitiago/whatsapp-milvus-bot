// messageHandler.js
import { getCurrentTime } from '../utils/utils.js';
import { escolherMensagem } from '../scripts/menu-principal.js';

export async function processMessage(message, from, services) {
    const { sendMessage } = services;
    try {
        let messageText = '';

        if (message.type === 'interactive') {
            if (message.interactive.type === 'button_reply') {
                messageText = message.interactive.button_reply.id;
            } else if (message.interactive.type === 'list_reply') {
                messageText = message.interactive.list_reply.id;
            }
        } else if (message.text) {
            messageText = message.text.body;
        }

        const resposta = await escolherMensagem(messageText, from);

        if (!resposta) {
            console.error(`[${getCurrentTime()}][ERRO] A função escolherMensagem retornou um valor vazio (undefined/null).`);
            return;
        }

        if (typeof resposta === 'object' && resposta.type === 'interactive') {
            await sendMessage(from, {
                type: 'interactive',
                interactive: resposta.interactive
            });
        } else if (typeof resposta === 'string' && resposta.length > 0) {
            await sendMessage(from, {
                type: 'text',
                text: { body: resposta }
            });
        } else {
             console.warn(`[${getCurrentTime()}][AVISO] Tipo de resposta inválido ou corpo vazio. Resposta:`, resposta);
        }

        console.log(`[${getCurrentTime()}]📨 Resposta enviada para ${from}`);

    } catch (error) {
        if (error.shouldIgnore) {
             console.log(`[${getCurrentTime()}]🛑 Webhook ignorado para usuário bloqueado: ${from}`);
             return;
        }
        console.error(`[${getCurrentTime()}] Erro no processMessage: ${error.name}: ${error.message}`);
        if (error.isAxiosError) {
            console.error(`[${getCurrentTime()}] Detalhes do Axios:`, JSON.stringify(error.response?.data, null, 2));
        }
    }
}