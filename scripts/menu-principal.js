
import mensagens from '../assets/messages_default.json' with { type: 'json' };
import { getSession, updateSession, resetSession } from '../utils/sessionManager.js';
import { checkSpamProtection, criarMensagemComBotoes, getCurrentTime } from '../utils/utils.js';
import { gerenciarFluxoAberturaChamado } from './abertura-chamado.js'; // Importando o novo fluxo
import { iniciarFluxoBusca, gerenciarFluxoBusca } from './chamados-abertos/fluxo-busca.js';

const FLUXO_ABERTURA_STEPS = [
    'aceitar_termos',
    'solicitando_nome',
    'solicitando_area',
    'solicitando_matricula',
    'solicitando_categoria',
    'solicitando_descricao',
    'solicitando_anexo',
    'solicitando_resumo'
];

/**
 * Função principal que processa a mensagem do usuário e a direciona para o fluxo correto.
 * @param {string} textoUsuario - O texto da mensagem do usuário.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<object|string>} A resposta a ser enviada.
 */

async function escolherMensagem(textoUsuario, userId) {
    const txt = (textoUsuario || '').toLowerCase().trim();
    const session = getSession(userId) || { step: null, data: {} };

    const spamCheck = checkSpamProtection(userId, textoUsuario);
    if (spamCheck === null) {
        console.log(`[${getCurrentTime()}][SPAM] Ignorando mensagem de usuário bloqueado: ${userId}`);
        const error = new Error('USER_BLOCKED_IGNORE_WEBHOOK');
        error.shouldIgnore = true;
        throw error;
    }
    if (typeof spamCheck === 'string') {
        return spamCheck;
    }

    if (txt.includes('cancelar') || textoUsuario === 'btn_cancelar_atendimento') {
        resetSession(userId);
        updateSession(userId, { step: 'menu' });
        return criarMensagemComBotoes(mensagens.mensagens.solicitando_cancelar, [mensagens.button.button_default] || []);
    }

    if (txt.includes('iniciar') || textoUsuario === 'btn_menu' || txt === 'menu') {
        updateSession(userId, { step: 'menu' });
        return criarMensagemComBotoes(mensagens.saudacao, mensagens.button.button_menu_default || []);
    }

    if (FLUXO_ABERTURA_STEPS.includes(session.step)) {
        return gerenciarFluxoAberturaChamado(textoUsuario, userId, session);
    }

    if (session.step && session.step.startsWith('aguardando_')) {
        return gerenciarFluxoBusca(textoUsuario, userId, session);
    }

    const querAbrirChamado = txt.includes('abrir') || txt.includes('novo') || textoUsuario === 'btn_novo_chamado';
    if (querAbrirChamado || FLUXO_ABERTURA_STEPS.includes(session.step)) {

        if (querAbrirChamado && !FLUXO_ABERTURA_STEPS.includes(session.step)) {
            updateSession(userId, { step: 'aceitar_termos' });
        }

        const currentSession = getSession(userId);
        return gerenciarFluxoAberturaChamado(textoUsuario, userId, currentSession);
    }

    if (session.step && session.step.startsWith('aguardando_')) {
        return gerenciarFluxoBusca(textoUsuario, userId, session);
    }

    if (txt.includes('abertos') || textoUsuario === 'btn_chamados_abertos') {
        return iniciarFluxoBusca(userId); // << DELEGAÇÃO SIMPLES!
    }

    if (session.step === 'menu') {
        return criarMensagemComBotoes(mensagens.saudacao, mensagens.button.button_menu_default || []);
    }

    resetSession(userId);
    return criarMensagemComBotoes(mensagens.mensagens.nao_entendi, [mensagens.button.button_default] || []);
}

export { escolherMensagem };