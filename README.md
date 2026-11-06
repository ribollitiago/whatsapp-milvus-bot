# WhatsApp Milvus Bot 🤖

An enterprise integration service connecting the **WhatsApp Business API** with the **Milvus IT Service Desk Platform**, automating ticket lifecycles and support workflows directly via messaging.

---

## Architecture & Workflow

```
WhatsApp User ──> WhatsApp Webhook / API ──> Message Handler ──> Session Manager
                                                                      │
                                                                      ▼
                                                                Milvus Client API
                                                                      │
                                                            (Create/Query Tickets)
```

---

## Features

- **Automated Ticket Creation** — Guides users step-by-step to log IT support incidents and service requests directly in Milvus.
- **Ticket Status & Inquiries** — Query open tickets, examine statuses, and read technician updates in real time.
- **Session Management** — In-memory session tracking ensuring stateful multi-step conversational flows per phone number.
- **Attachment & Media Support** — Processes and forwards screenshots and documents directly into the corresponding Milvus tickets.
- **Webhook Gateway** — Node.js service handling incoming WhatsApp webhook events with signature and payload validation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Messaging API | WhatsApp Cloud / Business API |
| Service Desk Integration | Milvus REST Client |
| Local Tunneling (Dev) | ngrok integration |

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- Active WhatsApp Business API developer credentials
- Milvus Service Desk API access key & base URL

### Installation

```bash
# Clone repository
git clone https://github.com/ribollitiago/whatsapp-milvus-bot.git
cd whatsapp-milvus-bot

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
MILVUS_API_URL=https://api.milvus.com.br
MILVUS_API_TOKEN=your_milvus_token
PORT=3000
```

### Run

```bash
node index.js
```

---

## Author

**Tiago Ribolli Blasquez**  
[linkedin.com/in/tiagoribolli](https://linkedin.com/in/tiago-ribolli-blasquez-060810244) · [github.com/ribollitiago](https://github.com/ribollitiago)
