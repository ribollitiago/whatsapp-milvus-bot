# WhatsApp Milvus Bot

O **WhatsApp Milvus Bot** é uma solução de software desenvolvida para integrar a **API do WhatsApp Business** ao sistema de gestão de serviços **Milvus**. Esta ferramenta automatiza o processo de suporte técnico, permitindo que usuários finais interajam com a plataforma de chamados através de uma interface de mensagens familiar, otimizando o tempo de resposta e a organização das demandas de TI.

## Funcionamento do Sistema

O fluxo operacional do projeto inicia-se com o recebimento de mensagens via **Webhook**, processadas por um servidor **Express** que valida a autenticidade das requisições. O sistema utiliza um motor de processamento de mensagens que diferencia entradas de texto simples de interações ricas, como botões e listas. A lógica de negócio está centralizada no componente `messageHandler`, que consulta scripts de conversação para determinar a melhor resposta ou ação a ser executada no Milvus.

A integração com o Milvus é realizada de forma assíncrona, garantindo que a API do WhatsApp receba uma confirmação imediata de recebimento, evitando reenvios desnecessários por parte dos servidores da Meta. O bot é capaz de gerenciar o ciclo de vida básico de um chamado, desde a sua abertura até a anexação de evidências multimídia enviadas pelos usuários.

## Requisitos de Ambiente

Para a correta execução e implantação deste projeto, é fundamental que o ambiente de hospedagem atenda aos requisitos técnicos listados na tabela abaixo:

| Requisito | Especificação Recomendada | Finalidade |
| :--- | :--- | :--- |
| **Runtime** | Node.js v18.x ou superior | Execução do código JavaScript (ESM) |
| **Gerenciador** | NPM ou Yarn | Instalação e gestão de dependências |
| **Infraestrutura** | Servidor com porta 80 aberta | Recebimento de tráfego do Webhook |
| **Conectividade** | Acesso HTTPS externo | Comunicação com APIs da Meta e Milvus |
| **Ferramenta Auxiliar** | Ngrok (opcional) | Túnel para desenvolvimento em ambiente local |

## Configuração de Variáveis de Ambiente

A configuração do projeto é realizada através de um arquivo `.env` localizado na raiz do diretório. Este arquivo deve conter as credenciais de autenticação e os endereços de API necessários para a operação. A tabela a seguir detalha cada uma das variáveis obrigatórias:

| Variável | Descrição | Exemplo de Valor |
| :--- | :--- | :--- |
| `MILVUS_BASE_URL` | URL base da instância da API do Milvus | `https://api.milvus.com.br` |
| `MILVUS_TOKEN` | Token de autorização para chamadas de API | `Bearer seu_token_aqui` |
| `MILVUS_CLIENT_ID` | Identificador único do cliente no Milvus | `12345` |
| `WHATSAPP_TOKEN` | Token de acesso permanente da Meta | `EAAG...` |
| `PHONE_NUMBER_ID` | Identificador do número de telefone da API | `10987654321` |
| `WEBHOOK_VERIFY_TOKEN` | Token para validação do Webhook no Facebook | `tokenSecreto123` |

## Estrutura de Arquivos

O projeto está organizado de forma modular para facilitar a manutenção e escalabilidade. Abaixo estão descritos os principais diretórios e suas responsabilidades:

*   **`services/`**: Contém os clientes `milvusClient.js` e `whatsappClient.js`, responsáveis pela comunicação de baixo nível com as APIs externas.
*   **`handlers/`**: Abriga o `messageHandler.js`, que detém a lógica de interpretação de mensagens e roteamento de respostas.
*   **`scripts/`**: Define os fluxos de diálogo e menus interativos que o usuário visualiza no WhatsApp.
*   **`utils/`**: Funções de suporte para formatação de dados, tratamento de datas e logs do sistema.

## Instruções de Instalação

O processo de instalação começa com a clonagem do repositório e a instalação das dependências via gerenciador de pacotes. Após configurar o arquivo `.env` com as informações da tabela anterior, o servidor pode ser iniciado utilizando o comando `npm start`. É recomendável utilizar um gerenciador de processos como o **PM2** para ambientes de produção, garantindo que o bot permaneça ativo e reinicie automaticamente em caso de falhas críticas.

---
Por *Tiago Blasquez*
