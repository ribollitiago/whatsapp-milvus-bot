# whatsapp-milvus-bot

Production-ready WhatsApp Business API bot integrated with the Milvus IT service desk — automates ticket creation, status lookup, and support flows via chat.

---

## Features

- 🎫 **Automated ticket opening** — users can open IT support tickets directly through WhatsApp
- 🔍 **Ticket status lookup** — query open tickets and retrieve details without human intervention
- 📋 **Main menu flow** — guided conversation menu to route users to the right action
- 🔄 **Session management** — tracks user conversation state across interactions
- 📎 **Media support** — send media files via WhatsApp as part of automated responses
- 🔗 **Milvus integration** — communicates with the Milvus API to manage service desk operations
- 🌐 **ngrok tunnel** — exposes the local webhook endpoint for WhatsApp API callbacks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| WhatsApp API | WhatsApp Business API (via HTTP) |
| Service Desk | Milvus API |
| Tunnel | ngrok |
| Session State | In-memory session manager |

---

## Project Structure

```
├── index.js                        # Entry point — HTTP server & webhook receiver
├── handlers/
│   └── messageHandler.js           # Routes incoming messages to the correct flow
├── scripts/
│   ├── menu-principal.js           # Main menu conversation flow
│   ├── abertura-chamado.js         # Ticket creation flow
│   └── chamados-abertos/
│       ├── chamado-service.js      # Open tickets service layer
│       ├── detalhes-chamado.js     # Ticket details retrieval
│       └── fluxo-busca.js          # Ticket search conversation flow
├── services/
│   ├── milvusClient.js             # Milvus API client
│   ├── whatsappClient.js           # WhatsApp API client
│   └── sendMediaViaWhatsapp.js     # Media sending service
├── utils/
│   └── sessionManager.js          # User session state tracking
└── assets/
    └── messages_default.json       # Default message templates
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/ribollitiago/whatsapp-milvus-bot.git
cd whatsapp-milvus-bot

# Install dependencies
npm install

# Configure environment variables
# Create a .env file with:
# WHATSAPP_TOKEN=...
# WHATSAPP_PHONE_NUMBER_ID=...
# MILVUS_API_URL=...
# MILVUS_API_TOKEN=...
# VERIFY_TOKEN=...       # Webhook verification token

# Start ngrok tunnel (exposes port to WhatsApp webhook)
ngrok http 3000

# Start the bot
npm start
```

> **Note:** Register your ngrok HTTPS URL as the webhook endpoint in your WhatsApp Business API configuration before running.

---

## Author

**Tiago Ribolli Blasquez**  
[linkedin.com/in/tiagoribolli](https://www.linkedin.com/in/tiago-ribolli-blasquez-060810244) · [github.com/ribollitiago](https://github.com/ribollitiago)
