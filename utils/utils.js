import { resetSession } from './sessionManager.js';

const blockedUsers = new Map();
const userMessageCounts = new Map();
const userLastMessages = new Map();

const SPAM_LIMIT = 30; // Limite de mensagens por minuto (Cada mensagem conta como 2, então é sempre o dobro)
const TIME_WINDOW = 60 * 1000; // Janela de tempo para o limite (1 minuto)
const BLOCK_TIME = 60 * 1000; // Tempo de bloqueio (1 minuto)
const REPEATED_MESSAGE_LIMIT = 3; // Número de mensagens idênticas consecutivas para bloqueio
const WARNING_REPEATED_MESSAGE_LIMIT = 2; // Número de mensagens idênticas consecutivas para aviso
const REPEATED_BLOCK_TIME = 3 * 60 * 1000; // Tempo de bloqueio (3 minutos)
const RAPID_FIRE_LIMIT = 5; // Limite de mensagens em uma janela curta
const RAPID_FIRE_WINDOW = 5 * 1000; // Janela curta de tempo (5 segundos)

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

function formatPhoneNumber(num) {
    return num.replace(/\D/g, '');
}

function validarEntrada(texto, campo, minCaracteres = 3) {
    if (!texto || texto.trim().length < minCaracteres) {
        return `${campo} deve ter pelo menos ${minCaracteres} caracteres. Por favor, informe corretamente.`;
    }
    return null;
}

/* checkSpamProtection
***************************************************************************************************
* Proteção contra spam
* - Combina a lógica de frequência e repetição
****************************************************************************************************/
function checkSpamProtection(userId, textoUsuario) {
    const now = Date.now();

    // 1. Remover bloqueio expirado
    const blockInfo = blockedUsers.get(userId);
    if (blockInfo && now >= blockInfo.expires) {
        blockedUsers.delete(userId);
        userMessageCounts.delete(userId);
        userLastMessages.delete(userId);
    }

    // 2. Verificar se está bloqueado (após a limpeza)
    if (blockInfo && now < blockInfo.expires) {
        if (textoUsuario) {
            console.log(`[${getCurrentTime()}][SPAM] Usuário ${userId} bloqueado`);
            return null; // Não responde
        }
    }

    // 3. Lógica para mensagens repetidas
    let userMessages = userLastMessages.get(userId) || [];
    userMessages = userMessages.filter(msg => (now - msg.timestamp) <= 5000); // Manter as últimas mensagens (5s)

    const isConsecutive = userMessages.length > 0 && userMessages[userMessages.length - 1].text === textoUsuario;

    if (isConsecutive) {
        userMessages.push({ text: textoUsuario, timestamp: now });
        if (userMessages.length === WARNING_REPEATED_MESSAGE_LIMIT) {
            userLastMessages.set(userId, userMessages);
            return `⚠️ Por favor, evite enviar mensagens idênticas repetidamente. Caso continue, você poderá ser bloqueado temporariamente.`;
        }
        if (userMessages.length >= REPEATED_MESSAGE_LIMIT) {
            return applyBlock(
                userId,
                now,
                `envio de mensagens idênticas consecutivas`,
                REPEATED_BLOCK_TIME,
                'repeticao'
            );
        }
    } else {
        userMessages = [{ text: textoUsuario, timestamp: now }];
    }
    userLastMessages.set(userId, userMessages);

    // 4. Lógica para controle de frequência
    let userCount = userMessageCounts.get(userId) || { messages: [] };
    userCount.messages = userCount.messages.filter(timestamp => (now - timestamp) <= TIME_WINDOW);
    userCount.messages.push(now);
    const messagesInWindow = userCount.messages.length;

    userMessageCounts.set(userId, userCount);

    console.log(`[${getCurrentTime()}][MSG] ${userId}: ${messagesInWindow}/${SPAM_LIMIT} mensagens no último minuto`);

    // 5. Lógica para proteção contra "rajada" de mensagens (rapid-fire)
    const rapidFireMessages = userCount.messages.filter(timestamp => (now - timestamp) <= RAPID_FIRE_WINDOW);
    const messagesInRapidFireWindow = rapidFireMessages.length;

    if (messagesInRapidFireWindow >= RAPID_FIRE_LIMIT) {
        console.log(`[${getCurrentTime()}][SPAM] Usuário ${userId} atingiu o limite de "rajada" de mensagens.`);
        return applyBlock(
            userId,
            now,
            `envio de ${messagesInRapidFireWindow} mensagens em ${RAPID_FIRE_WINDOW / 1000} segundos.`,
            REPEATED_BLOCK_TIME, // Usando o mesmo tempo de bloqueio para mensagens repetidas
            'rapid-fire'
        );
    }

    // 6. Bloquear se o limite de frequência for atingido
    if (messagesInWindow >= SPAM_LIMIT) {
        return applyBlock(
            userId,
            now,
            `envio de ${messagesInWindow} mensagens em menos de 1 minuto.`,
            BLOCK_TIME,
            'frequencia'
        );
    }

    return false;
}

/* applyBlock
***************************************************************************************************
* Aplica o bloqueio ao usuário e retorna a mensagem de aviso
****************************************************************************************************/
function applyBlock(userId, now, reason, blockTime = BLOCK_TIME, type) {
    blockedUsers.set(userId, {
        expires: now + blockTime,
        blockedAt: now,
        reason: reason
    });

    userMessageCounts.delete(userId);
    userLastMessages.delete(userId);
    resetSession(userId);

    const minutes = blockTime / 60000;
    console.log(`[${getCurrentTime()}][SPAM] Usuário ${userId} bloqueado por ${minutes} minutos. Motivo: ${reason}`);

    if (type === 'frequencia') {
        return `🚫 *Bloqueio Temporário*\n\nVocê foi bloqueado por ${minutes} minutos devido ao envio de ${SPAM_LIMIT / 2} mensagens em menos de 1 minuto.\n\n⏰ Aguarde para usar novamente.`;
    } else if (type === 'repeticao') {
        return `🚫 *Bloqueio Temporário*\n\nVocê foi bloqueado por ${minutes} minutos devido ao envio de mensagens idênticas consecutivas.\n\n⏰ Aguarde para usar novamente.`;
    } else if (type === 'rapid-fire') {
        return `🚫 *Bloqueio Temporário*\n\nVocê foi bloqueado por ${minutes} minutos devido ao envio de mensagens consecutivas muito rápido.\n\n⏰ Aguarde para usar novamente.`;
    }
}

/* cleanupOldData
***************************************************************************************************
* Limpeza periódica de dados antigos para evitar crescimento indefinido
****************************************************************************************************/
function cleanupOldData() {
    const now = Date.now();
    let cleaned = 0;

    // Limpar bloqueios expirados
    for (const [userId, blockInfo] of blockedUsers.entries()) {
        if (now >= blockInfo.expires) {
            blockedUsers.delete(userId);
            userMessageCounts.delete(userId);
            userLastMessages.delete(userId);
            cleaned++;
        }
    }

    // Limpar mensagens antigas
    for (const [userId, messages] of userLastMessages.entries()) {
        const freshMessages = messages.filter(msg => (now - msg.timestamp) <= 5000);
        if (freshMessages.length === 0) {
            userLastMessages.delete(userId);
        } else {
            userLastMessages.set(userId, freshMessages);
        }
    }

    if (cleaned > 0) {
        console.log(`[${getCurrentTime()}][SPAM] ${cleaned} usuários desbloqueados`);
    }
}

function criarMensagemComBotoes(texto, botoes) {
    if (!Array.isArray(botoes)) {
        botoes = [];
    }
    return {
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: texto },
            action: {
                buttons: botoes.map(botao => ({
                    type: "reply",
                    reply: { id: botao.id, title: botao.title }
                }))
            }
        }
    };
}


export {
    formatPhoneNumber,
    validarEntrada,
    checkSpamProtection,
    cleanupOldData,
    blockedUsers,
    userMessageCounts,
    userLastMessages,
    getCurrentTime,
    criarMensagemComBotoes
};