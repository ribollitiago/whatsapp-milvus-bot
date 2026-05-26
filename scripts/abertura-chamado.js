import mensagens from '../assets/messages_default.json' with { type: 'json' };
import { getSession, updateSession, resetSession } from '../utils/sessionManager.js';
import { criarChamado } from '../services/milvusClient.js';
import { validarEntrada, getCurrentTime, criarMensagemComBotoes } from '../utils/utils.js';

/**
 * Gerencia o fluxo de abertura de um novo chamado.
 * @param {string} textoUsuario - O texto enviado pelo usuário.
 * @param {string} userId - O ID do usuário.
 * @param {object} session - A sessão atual do usuário.
 * @returns {object|string} A resposta a ser enviada ao usuário.
 */
async function gerenciarFluxoAberturaChamado(textoUsuario, userId, session) {
    const txt = (textoUsuario || '').toLowerCase().trim();

    if (textoUsuario === mensagens.button.button_confirmar.id && session.processing) {
        console.log(`[${getCurrentTime()}]⏳ Confirmação já em processamento para: ${userId}`);
        return "Sua solicitação já está sendo processada. Aguarde...";
    }

    switch (session.step) {
        case 'aceitar_termos':
            if (textoUsuario === mensagens.button.button_termo_aceito.id || txt.includes('aceitar')) {
                updateSession(userId, { step: 'solicitando_nome' });
                return criarMensagemComBotoes(mensagens.mensagens.solicitando_nome, [mensagens.button.button_cancelar]);
            }
            if (textoUsuario === mensagens.button.button_termo_recusado.id || txt.includes('recusar') || txt.includes('não') || txt.includes('nao')) {
                resetSession(userId);
                updateSession(userId, { step: 'menu' });
                const textoRecusa = mensagens.mensagens.termos_recusados || "Você recusou os termos.";
                return criarMensagemComBotoes(textoRecusa, mensagens.button.button_menu_default || []);
            }
            const termosText = mensagens.mensagens.termos_uso || "Deseja aceitar os termos?";
            return criarMensagemComBotoes(termosText, [mensagens.button.button_termo_aceito, mensagens.button.button_termo_recusado]);

        case 'solicitando_nome':
            const erroNome = validarEntrada(textoUsuario, "Nome");
            if (erroNome) {
                return criarMensagemComBotoes(erroNome, [mensagens.button.button_cancelar]);
            }
            updateSession(userId, { step: 'solicitando_area', data: { nome: textoUsuario } });
            return criarMensagemComBotoes(mensagens.mensagens.solicitando_area, [mensagens.button.button_cancelar]);

        case 'solicitando_area':
            const erroArea = validarEntrada(textoUsuario, "Área");
            if (erroArea) {
                return criarMensagemComBotoes(erroArea, [mensagens.button.button_cancelar]);
            }
            updateSession(userId, { step: 'solicitando_matricula', data: { ...session.data, area: textoUsuario } });
            return criarMensagemComBotoes(mensagens.mensagens.solicitando_matricula, [mensagens.button.button_cancelar]);

        case 'solicitando_matricula':
            const erroMatricula = validarEntrada(textoUsuario, "Matrícula");
            if (erroMatricula) {
                return criarMensagemComBotoes(erroMatricula, [mensagens.button.button_cancelar]);
            }
            updateSession(userId, { step: 'solicitando_categoria', data: { ...session.data, matricula: textoUsuario } });
            return {
                type: 'interactive',
                interactive: {
                    type: 'list',
                    body: { text: mensagens.mensagens.solicitando_categoria },
                    action: {
                        button: mensagens.interactive_categoria.button,
                        sections: mensagens.interactive_categoria.sections
                    }
                }
            };

        case 'solicitando_categoria': {
            const tipoMap = {
                'tipo_problema': 'Problema',
                'tipo_solicitacao': 'Solicitação',
                'tipo_informacoes': 'Informações'
            };

            if (!tipoMap[textoUsuario]) {
                const textoInvalido = "Opção inválida. Por favor, selecione uma das categorias da lista abaixo:";
                return {
                    type: 'interactive',
                    interactive: {
                        type: 'list',
                        body: { text: textoInvalido },
                        action: {
                            button: mensagens.interactive_categoria.button,
                            sections: mensagens.interactive_categoria.sections
                        }
                    }
                };
            }

            const tipoLabel = tipoMap[textoUsuario];
            updateSession(userId, { step: 'solicitando_descricao', data: { ...session.data, tipo: tipoLabel } });
            return criarMensagemComBotoes(mensagens.mensagens.solicitando_descricao, [mensagens.button.button_cancelar]);
        }

       case 'solicitando_descricao':
            const erroDescricao = validarEntrada(textoUsuario, "Descrição", 10);
            if (erroDescricao) {
                return criarMensagemComBotoes(erroDescricao, [mensagens.button.button_cancelar]);
            }
            updateSession(userId, { step: 'solicitando_anexo', data: { ...session.data, descricao: textoUsuario } });
            return criarMensagemComBotoes(mensagens.mensagens.solicitando_anexo, [mensagens.button.button_pular, mensagens.button.button_cancelar]);


        case 'solicitando_anexo':
            if (textoUsuario === mensagens.button.button_pular.id || txt.includes('pular')) {
                updateSession(userId, { step: 'solicitando_resumo', data: { ...session.data, anexo: null } });
                const s = getSession(userId);
                const resumoText = (mensagens.mensagens.chamado_resumo || "")
                    .replace('{nome}', s.data.nome || '')
                    .replace('{area}', s.data.area || '')
                    .replace('{matricula}', s.data.matricula || '')
                    .replace('{categoria}', s.data.tipo || '')
                    .replace('{descricao}', s.data.descricao || '');
                return criarMensagemComBotoes(resumoText, [mensagens.button.button_confirmar, mensagens.button.button_cancelar]);
            }

            if (textoUsuario.startsWith('media_')) { 
                updateSession(userId, { step: 'solicitando_resumo', data: { ...session.data, anexo: textoUsuario } });
                const s = getSession(userId);
                const resumoText = (mensagens.mensagens.chamado_resumo || "")
                    .replace('{nome}', s.data.nome || '')
                    .replace('{area}', s.data.area || '')
                    .replace('{matricula}', s.data.matricula || '')
                    .replace('{categoria}', s.data.tipo || '')
                    .replace('{descricao}', s.data.descricao || '');
                return criarMensagemComBotoes(resumoText, [mensagens.button.button_confirmar, mensagens.button.button_cancelar]);
            }
            return criarMensagemComBotoes(
                "Por favor, envie uma imagem ou selecione 'Pular' para continuar.",
                [mensagens.button.button_pular, mensagens.button.button_cancelar]
            );

        case 'solicitando_resumo': {
            if (textoUsuario === mensagens.button.button_confirmar.id || textoUsuario === 'btn_tentar_novamente' || textoUsuario === 'btn_pular_anexo' || txt.includes('pular')) {
                updateSession(userId, { processing: true });
                const s = getSession(userId);
                const camposObrigatorios = ['nome', 'area', 'matricula', 'tipo', 'descricao'];
                const camposFaltantes = camposObrigatorios.filter(campo => !s.data[campo] || s.data[campo].trim().length < 3);

                if (camposFaltantes.length > 0) {
                    return criarMensagemComBotoes(`Erro: Campos incompletos: ${camposFaltantes.join(', ')}.`, [mensagens.button.button_cancelar]);
                }

                try {
                    const chamadoData = { ...s.data, userId, timestamp: new Date() };
                    const rawPhone = (chamadoData.telefone || userId || '').toString().replace(/\D/g, '').replace(/^55/, '');
                    const categoriaPrimaria = /^\d+$/.test(String(chamadoData.tipo).trim()) ? 'Geral' : chamadoData.tipo || 'Geral';
                    const descricaoCompleta = `CHAMADO ABERTO VIA WHATSAPP: ${userId}\n\nNOME DO USUÁRIO: ${chamadoData.nome}\n\nÁREA: ${chamadoData.area || 'SEM VALOR'}\n\nMATRÍCULA: ${chamadoData.matricula || 'SEM VALOR'}\n\nNUMERO DE TELEFONE: ${rawPhone}\n\nDETALHES DO PROBLEMA: ${chamadoData.descricao || 'SEM VALOR'}`.trim();

                    const payloadMilvus = {
                        assunto: `Aberto via Whatsapp: ${categoriaPrimaria}`,
                        descricao: descricaoCompleta,
                        email: chamadoData.email || '',
                        telefone: rawPhone,
                        contato: chamadoData.nome,
                        tecnico: chamadoData.tecnico || '',
                        categoria_primaria: categoriaPrimaria,
                        categoria_secundaria: chamadoData.categoria_secundaria || ''
                    };

                    console.log(`[${getCurrentTime()}] Enviando payload Milvus: ${JSON.stringify(payloadMilvus)}`);
                    const respostaMilvus = await criarChamado(payloadMilvus);

                    if (!respostaMilvus) throw new Error('Resposta do servidor vazia.');

                    let numeroChamado = respostaMilvus?.numero || respostaMilvus?.raw || Math.floor(1000 + Math.random() * 9000);

                    resetSession(userId);
                    return mensagens.mensagens.chamado_sucesso
                        .replace('{nome}', chamadoData.nome)
                        .replace('{numero}', numeroChamado);

                } catch (err) {
                    console.error(`[${getCurrentTime()}] Erro ao criar chamado: ${err.message}`);
                    updateSession(userId, { processing: false });
                    return criarMensagemComBotoes(
                        mensagens.mensagens.erro_servidor || "Erro ao comunicar com o servidor. Deseja tentar novamente?",
                        [{ id: 'btn_tentar_novamente', title: 'Tentar Novamente' }, mensagens.button.button_cancelar]
                    );
                }
            } else {
                const s = getSession(userId);
                const resumoText = (mensagens.mensagens.chamado_resumo || "")
                    .replace('{nome}', s.data.nome || '')
                    .replace('{area}', s.data.area || '')
                    .replace('{matricula}', s.data.matricula || '')
                    .replace('{categoria}', s.data.tipo || '')
                    .replace('{descricao}', s.data.descricao || '');
                return criarMensagemComBotoes(resumoText, [mensagens.button.button_confirmar, mensagens.button.button_cancelar]);
            }
        }
        default:
            resetSession(userId);
            return criarMensagemComBotoes(mensagens.mensagens.nao_entendi, mensagens.button.button_menu_default || []);
    }
}

export { gerenciarFluxoAberturaChamado };