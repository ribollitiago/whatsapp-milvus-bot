import axios from 'axios';
import https from 'https';
import 'dotenv/config';
import { criarMensagemComBotoes } from '../../utils/utils.js';
import mensagens from '../../assets/messages_default.json' with { type: 'json' };

import { listarAcompanhamentos } from '../../services/milvusClient.js';

const BASE_URL = process.env.MILVUS_BASE_URL || 'https://apiintegracao.milvus.com.br';
const TOKEN = process.env.MILVUS_TOKEN;

const axiosInstance = axios.create({
    timeout: 10000,
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

/**
 * Normaliza um número de telefone, removendo caracteres não numéricos e o DDI 55.
 * @param {string} raw - O número de telefone bruto.
 * @returns {string} O número de telefone normalizado.
 */
function normalizePhone(raw) {
    if (!raw) return '';
    return String(raw).replace(/\D/g, '').replace(/^55/, '');
}

/**
 * Busca os dados de um único chamado na API pelo seu código.
 * @param {string} chamadoCodigo - O código do chamado a ser buscado.
 * @returns {Promise<object|null>} O objeto do ticket ou null se não for encontrado.
 */
async function fetchTicketByCode(chamadoCodigo) {
    const body = {
        filtro_body: { codigo: String(chamadoCodigo) },
        total_registros: 1,
        pagina: 1
    };
    try {
        const response = await axiosInstance.post(
            `${BASE_URL}/api/chamado/listagem`,
            body,
            { headers: { 'Authorization': TOKEN, 'Content-Type': 'application/json' } }
        );
        return response.data?.lista?.[0] || null;
    } catch (error) {
        console.error(`Erro ao buscar ticket #${chamadoCodigo} na API:`, error.message);
        throw new Error('Falha ao comunicar com a API de chamados.');
    }
}

/**
 * Monta a mensagem de texto com os detalhes e acompanhamentos de um chamado.
 * @param {object} ticket - O objeto do chamado.
 * @param {Array} acompanhamentos - A lista de acompanhamentos.
 * @returns {string} A mensagem formatada.
 */
function formatarRespostaChamado(ticket, acompanhamentos) {
    const messageLines = [
        `*Detalhes do chamado ${ticket.codigo}:*`,
        `*Assunto:* ${ticket.assunto}`,
        `*Status:* ${ticket.status}`,
        `*Técnico Responsável:* ${ticket.tecnico || 'Não atribuído'}`,
        ''
    ];

    // **MELHORIA**: Filtra o acompanhamento automático de criação do chamado.
    const acompanhamentosFiltrados = acompanhamentos.filter(a => a.pessoa !== 'Token');

    if (acompanhamentosFiltrados.length === 0) {
        messageLines.push("Nenhum acompanhamento público encontrado.");
    } else {
        messageLines.push("*Acompanhamentos:*");
        acompanhamentosFiltrados.forEach((a, index) => {
            messageLines.push(
                `\n*${index + 1}.* 👤 ${a.pessoa} (${a.perfil})`,
                `   📅 ${a.data}`
            );
        });
    }

    return messageLines.join('\n');
}

/**
 * Orquestra o fluxo de busca e formatação dos detalhes de um chamado.
 * @param {string} userId - O ID do usuário (telefone).
 * @param {string} codigoChamado - O código do chamado selecionado.
 * @returns {Promise<object|string>} A resposta formatada para o bot.
 */
export async function detalhesChamado(userId, codigoChamado) {
    try {
        const ticket = await fetchTicketByCode(codigoChamado);
        if (!ticket) {
            return `Chamado com código *${codigoChamado}* não encontrado.`;
        }

        const ticketPhone = normalizePhone(ticket.telefone || ticket.email_conferencia || '');
        const userPhone = normalizePhone(userId);

        if (!ticketPhone || ticketPhone !== userPhone) {
            console.warn(`Tentativa de acesso indevido ao chamado ${codigoChamado} pelo usuário ${userId}`);
            return "Você não possui permissão para visualizar este chamado.";
        }

        const acompanhamentos = await listarAcompanhamentos(codigoChamado);
        const respostaFormatada = formatarRespostaChamado(ticket, acompanhamentos);
        
        return criarMensagemComBotoes(respostaFormatada, mensagens.button.button_buscar_chamado);

    } catch (err) {
        console.error(`Erro no fluxo de detalhes do chamado ${codigoChamado}:`, err.message);
        return "Erro ao buscar detalhes do chamado. Tente novamente.";
    }
}