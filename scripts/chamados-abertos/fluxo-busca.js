import { resetSession, updateSession } from '../../utils/sessionManager.js';
import { criarMensagemComBotoes } from '../../utils/utils.js';
import { buscarChamadosPorTelefone } from './chamado-service.js';
import { detalhesChamado } from './detalhes-chamado.js';
import mensagens from '../../assets/messages_default.json' with { type: 'json' }; 

// Função para extrair o telefone do ID do usuário
function extrairTelefoneDoUserId(userId) {
    return userId.replace(/\D/g, '').replace(/^55/, '');
}

/**
 * ETAPA 1: Inicia o fluxo, busca os chamados e apresenta a mensagem completa com a lista textual e botões abaixo.
 */
export async function iniciarFluxoBusca(userId) {
    try {
        const telefone = extrairTelefoneDoUserId(userId);
        const chamados = await buscarChamadosPorTelefone(telefone);

        if (!chamados || chamados.length === 0) {
            return "Você não possui chamados em aberto.";
        }

        // Salva os chamados e define o próximo passo da conversa na sessão
        updateSession(userId, {
            step: 'aguardando_clique_ver_detalhes',
            data: { chamadosEncontrados: chamados }
        });

        let resposta = "📋 *Seus chamados em aberto:*\n\n";
        chamados.forEach((ch, i) => {
            resposta += `${i + 1}. #*${ch.codigo}* - ${ch.assunto} (Status: ${ch.status})\n`;
        });
        
        // Retorna a mensagem com a lista textual e botões abaixo (incluindo "Ver Detalhes" e "Voltar ao menu")
        return criarMensagemComBotoes(resposta, mensagens.button.button_detalhes);

    } catch (err) {
        console.error("Erro ao buscar chamados:", err.message);
        return "Não consegui consultar seus chamados agora. Tente novamente em instantes.";
    }
}

export async function gerenciarFluxoBusca(textoUsuario, userId, session) {
    const textoUsuarioLower = (textoUsuario || '').toLowerCase().trim();

    const querDetalhes = ['detalhes do chamado', 'detalhes', 'ver detalhes', 'detalhe'].includes(textoUsuarioLower);
    if ((textoUsuario === 'btn_detalhar_chamado' || querDetalhes) && session.step === 'aguardando_clique_ver_detalhes') {
        return criarListaInterativaChamados(userId, session);
    }

    if (session.step === 'aguardando_selecao_chamado') {
        const codigoSelecionado = textoUsuario;
        const resposta = await detalhesChamado(userId, codigoSelecionado);
        
        resetSession(userId); 
        updateSession(userId, { step: 'menu' });
        return resposta;
    }

    resetSession(userId);
    updateSession(userId, { step: 'menu' });
    return 'Ops, algo deu errado. Voltando ao menu principal.';
}

function criarListaInterativaChamados(userId, session) {
    const chamados = session.data.chamadosEncontrados;

    if (!chamados || chamados.length === 0) {
        return "Não encontrei os chamados na sua sessão. Por favor, inicie a busca novamente.";
    }

    updateSession(userId, { step: 'aguardando_selecao_chamado' });

    const rows = chamados.map(chamado => ({
        id: String(chamado.codigo),
        title: mensagens.interactive_chamados.section.rows_template.title.replace('{codigo}', chamado.codigo),
        description: mensagens.interactive_chamados.section.rows_template.description
            .replace('{assunto}', chamado.assunto.replace('Aberto via Whatsapp:', '').trim().substring(0, 50))
    }));

    return {
        type: 'interactive',
        interactive: {
            type: mensagens.interactive_chamados.type,
            body: { text: mensagens.interactive_chamados.body },
            action: {
                button: mensagens.interactive_chamados.button,
                sections: [{
                    title: mensagens.interactive_chamados.section.title,
                    rows: rows
                }]
            }
        }
    };;
}