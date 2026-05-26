// buscar-chamados.js

import {axiosInstance} from '../../services/milvusClient.js';
import "dotenv/config"; 
import { getCurrentTime } from "../../utils/utils.js"; 

const BASE_URL = process.env.MILVUS_BASE_URL || "";
const TOKEN = process.env.MILVUS_TOKEN || "";

/**
 * Busca os chamados de um cliente na API da Milvus.
 * @param {string} telefone - O telefone do cliente.
 * @returns {Promise<Array>} Uma lista de objetos de chamado.
 */
export async function buscarChamadosPorTelefone(telefone) {
    console.log(`[${getCurrentTime()}]🔍 Buscando chamados para o telefone: ${telefone}`);
    if (!TOKEN) {
        throw new Error("Token não configurado. Configure a variável MILVUS_TOKEN");
    }

    try {
        const response = await axiosInstance.post(
            `${BASE_URL}/api/chamado/listagem`, {
                filtro_body: {
                    telefone: telefone,
                    status: "Todos",
                },
                pagina: 1,
                total_registros: 10,
                order_by: "data_criacao",
                is_descending: true,
            }, {
                headers: {
                    Authorization: TOKEN,
                },
            }
        );

        const data = response.data;
        const chamadosFiltrados = data.lista.filter(
            (chamado) => chamado.telefone === telefone
        );
        console.log(`[${getCurrentTime()}]✅ Chamados encontrados para ${telefone}: ${chamadosFiltrados.length}`);
        return chamadosFiltrados;

    } catch (error) {
        console.error(`[${getCurrentTime()}]❌ Erro ao buscar chamados: ${error.message}`);
        throw error;
    }
}