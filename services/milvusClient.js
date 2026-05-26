import https from 'https';
import axios from 'axios';
import FormData from 'form-data';
import { getCurrentTime } from '../utils/utils.js';

const BASE_URL = process.env.MILVUS_BASE_URL || '';
const TOKEN = process.env.MILVUS_TOKEN || '';
const CLIENT_ID = process.env.MILVUS_CLIENT_ID || '';

const axiosInstance = axios.create({
    timeout: 30000,
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true
    }),
    headers: {
        'User-Agent': 'Node.js WhatsApp Bot',
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
});

/**
 * Cria um novo chamado na API do Milvus.
 * @param {object} payload - Dados do chamado.
 * @returns {Promise<object>} - Resposta com número do chamado e dados brutos.
 */
async function criarChamado(payload) {
    console.log(`[${getCurrentTime()}]=== CRIANDO CHAMADO ===`);
    console.log(`[${getCurrentTime()}]Payload recebido:`, payload);
    console.log(`[${getCurrentTime()}]Environment vars:
- BASE_URL: ${BASE_URL}
- CLIENT_ID: ${CLIENT_ID}
- TOKEN: ${TOKEN ? 'definido' : 'não definido'}`);
    
    const body = {
        cliente_id: CLIENT_ID,
        chamado_assunto: payload.assunto || payload.chamado_assunto || 'Solicitação de suporte',
        chamado_descricao: payload.descricao || payload.chamado_descricao || '',
        chamado_email: payload.email || payload.chamado_email || '',
        chamado_telefone: payload.telefone || payload.chamado_telefone || '',
        chamado_contato: payload.contato || payload.chamado_contato || '',
        chamado_tecnico: payload.tecnico || payload.chamado_tecnico || '',
        chamado_mesa: 'Mesa padrão',
        chamado_setor: 'Setor padrão',
        chamado_categoria_primaria: payload.categoria_primaria || payload.chamado_categoria_primaria || '',
        chamado_categoria_secundaria: payload.categoria_secundaria || payload.chamado_categoria_secundaria || ''
    };

    console.log(`[${getCurrentTime()}]Body a ser enviado:`, body);

    try {
        const response = await axiosInstance.post(
            `${BASE_URL}/api/chamado/criar`,
            body,
            {
                headers: {
                    'Authorization': TOKEN
                }
            }
        );

        console.log(`[${getCurrentTime()}]✅ SUCESSO! Resposta da API:`, response.data);
        const data = response.data;

        let numero = null;
        if (typeof data === 'number') {
            numero = data;
        } else if (typeof data === 'string' && /^\d+$/.test(data.trim())) {
            numero = parseInt(data.trim(), 10);
        } else if (data && (data.numero || data.id || data.chamado_numero)) {
            numero = data.numero || data.id || data.chamado_numero;
        }

        return { numero, raw: data };

    } catch (err) {
        const errorMessage = `[${getCurrentTime()}]Erro detalhado:
  - Mensagem: ${err.message}
  - Status: ${err.response?.status || 'N/A'}
  - Status Text: ${err.response?.statusText || 'N/A'}
  - Dados: ${JSON.stringify(err.response?.data) || 'N/A'}`;
        console.error(errorMessage);
        throw err;
    }
}

/**
 * Cria um novo anexo para um chamado existente na API do Milvus.
 * @param {string|number} chamadoId - O ID do chamado.
 * @param {Buffer|string} file - O arquivo a ser enviado (Buffer ou URL/nome do arquivo).
 * @returns {Promise<boolean>} - True se o anexo foi criado com sucesso.
 */
async function criarAnexo(chamadoId, file) {
    console.log(`[${getCurrentTime()}]=== CRIANDO ANEXO ===`);
    console.log(`[${getCurrentTime()}]Chamado ID: ${chamadoId}, File: ${file}`);

    const formData = new FormData();
    formData.append('anexo', file);

    try {
        const response = await axiosInstance.post(
            `${BASE_URL}/api/chamado/anexo/criar/${chamadoId}`,
            formData,
            {
                headers: {
                    'Authorization': TOKEN,
                    ...formData.getHeaders()
                }
            }
        );

        console.log(`[${getCurrentTime()}]✅ SUCESSO! Anexo criado para chamado ${chamadoId}. Status: ${response.status}`);
        return true;

    } catch (err) {
        const errorMessage = `[${getCurrentTime()}]Erro ao criar anexo:
  - Mensagem: ${err.message}
  - Status: ${err.response?.status || 'N/A'}
  - Status Text: ${err.response?.statusText || 'N/A'}
  - Dados: ${JSON.stringify(err.response?.data) || 'N/A'}`;
        console.error(errorMessage);
        throw err;
    }
}

/**
 * Baixa um anexo de um chamado na API do Milvus.
 * @param {string|number} chamadoId - O ID do chamado.
 * @param {string} anexoId - O ID ou referência do anexo (obtido de listarAcompanhamentos).
 * @returns {Promise<Buffer>} - O arquivo como Buffer.
 */
async function baixarAnexo(chamadoId, anexoId) {
    console.log(`[${getCurrentTime()}]=== BAIXANDO ANEXO ===`);
    console.log(`[${getCurrentTime()}]Chamado ID: ${chamadoId}, Anexo ID: ${anexoId}`);

    try {
        // Assumed endpoint for downloading the attachment
        const response = await axiosInstance.get(
            `${BASE_URL}/api/chamado/anexo/${anexoId}`,
            {
                headers: {
                    'Authorization': TOKEN
                },
                responseType: 'arraybuffer' // To handle binary data
            }
        );

        console.log(`[${getCurrentTime()}]✅ SUCESSO! Anexo baixado para chamado ${chamadoId}. Status: ${response.status}`);
        return Buffer.from(response.data);

    } catch (err) {
        const errorMessage = `[${getCurrentTime()}]Erro ao baixar anexo:
  - Mensagem: ${err.message}
  - Status: ${err.response?.status || 'N/A'}
  - Status Text: ${err.response?.statusText || 'N/A'}
  - Dados: ${JSON.stringify(err.response?.data) || 'N/A'}`;
        console.error(errorMessage);
        throw err;
    }
}

/**
 * Lista acompanhamentos de um chamado, filtrando por anexos.
 * @param {string|number} chamadoId - O ID do chamado.
 * @returns {Promise<Array>} - Lista de acompanhamentos do tipo 'anexos'.
 */
async function listarAcompanhamentos(chamadoId) {
    console.log(`[${getCurrentTime()}]=== LISTANDO ACOMPANHAMENTOS ===`);
    console.log(`[${getCurrentTime()}]Chamado ID: ${chamadoId}`);

    try {
        const response = await axiosInstance.get(
            `${BASE_URL}/api/chamado/acompanhamento/${chamadoId}`,
            {
                headers: {
                    'Authorization': TOKEN
                }
            }
        );

        console.log(`[${getCurrentTime()}]✅ SUCESSO! Acompanhamentos listados:`, response.data);
        return response.data.retorno || [];

    } catch (err) {
        const errorMessage = `[${getCurrentTime()}]Erro ao listar acompanhamentos:
  - Mensagem: ${err.message}
  - Status: ${err.response?.status || 'N/A'}
  - Status Text: ${err.response?.statusText || 'N/A'}
  - Dados: ${JSON.stringify(err.response?.data) || 'N/A'}`;
        console.error(errorMessage);
        throw err;
    }
}

/**
 * Função para testar conectividade básica
 */
async function testarConectividade() {
    console.log(`[${getCurrentTime()}]🔍 Testando conectividade com a API...`);
    
    try {
        const response = await axiosInstance.get(`${BASE_URL}`, { timeout: 30000 });
        console.log(`[${getCurrentTime()}]✅ Conectividade OK - Status: ${response.status}`);
        return true;
    } catch (err) {
        console.log(`[${getCurrentTime()}]❌ Problema de conectividade: ${err.message}`);
        console.log('Código do erro:', err.code);
        
        if (err.code === 'ENOTFOUND') {
            console.log(`[${getCurrentTime()}]💡 Sugestão: Verifique se você está usando proxy corporativo`);
        } else if (err.code === 'ECONNRESET') {
            console.log(`[${getCurrentTime()}]💡 Sugestão: Pode ser bloqueio de firewall`);
        }
        
        return false;
    }
}

export { criarChamado, criarAnexo, baixarAnexo, listarAcompanhamentos, testarConectividade, axiosInstance };