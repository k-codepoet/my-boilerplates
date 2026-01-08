# Slack Bot Processor - Setup Guide

Self-hosted Slack bot for file processing pipelines. Uses **Socket Mode** - no public URL required!

## Prerequisites

- **Node.js 22+** (`.nvmrc` 파일 참조)
- **pnpm** 패키지 매니저

```bash
# nvm으로 Node.js 버전 설정
nvm install && nvm use

# pnpm 설치 (없을 경우)
corepack enable && corepack prepare pnpm@latest --activate
```

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file and fill in credentials
cp .env.example .env

# 3. Run in development
pnpm dev
```

---

## 1. Create Slack App

1. Go to https://api.slack.com/apps
2. **Create New App** → **From scratch**
3. Enter App Name and select Workspace
4. **Create App**

---

## 2. Enable Socket Mode

Navigate to **Socket Mode** (left sidebar):

1. Toggle **Enable Socket Mode** → ON
2. Create an **App-Level Token**:
   - Token Name: `socket-token`
   - Scope: `connections:write`
3. Copy the token (starts with `xapp-`)

---

## 3. Configure Bot Token Scopes

Navigate to **OAuth & Permissions** → **Bot Token Scopes**:

| Scope | Purpose |
|-------|---------|
| `chat:write` | Send messages |
| `files:read` | Read uploaded files |
| `files:write` | Upload processed files |
| `channels:history` | Read channel messages |
| `groups:history` | Read private channel messages |
| `app_mentions:read` | Respond to @mentions |

---

## 4. Enable Event Subscriptions

Navigate to **Event Subscriptions**:

1. **Enable Events** → ON
2. **Subscribe to bot events**:

| Event | Trigger |
|-------|---------|
| `file_shared` | File uploaded to channel |
| `app_mention` | Bot mentioned (@bot) |
| `message.channels` | Message in public channel (optional) |

---

## 5. Install App to Workspace

1. **OAuth & Permissions** → **Install to Workspace**
2. Click **Allow**
3. Copy **Bot User OAuth Token** (starts with `xoxb-`)

---

## 6. Configure Environment

Edit `.env`:

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret  # Basic Information → App Credentials
```

---

## 7. Run the Bot

### Development (with hot reload)

```bash
pnpm dev
```

### Production (direct)

```bash
pnpm build
pnpm start
```

### Docker

```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start
pm2 start dist/index.js --name slack-bot

# Auto-restart on reboot
pm2 startup
pm2 save
```

---

## 8. Invite Bot to Channels

In Slack:
```
/invite @YourBotName
```

---

## Adding Custom Processors

Create a new file in `src/processors/`:

```typescript
// src/processors/custom.ts
import { registerProcessor } from './registry.js'
import type { ProcessorInput, ProcessorOutput } from './types.js'

async function processCustom(input: ProcessorInput): Promise<ProcessorOutput> {
  // Your processing logic here
  return {
    text: `Processed: ${input.filename}`,
    replyInThread: true,
  }
}

registerProcessor({
  extensions: ['xyz'],
  mimetypes: ['application/x-xyz'],
  process: processCustom,
  description: 'Process XYZ files',
})
```

Then import it in `src/processors/index.ts`:

```typescript
import './custom.js'
```

---

## Project Structure

```
src/
├── index.ts              # App entry point (Socket Mode)
├── handlers/
│   ├── index.ts          # Handler registration
│   ├── file.ts           # file_shared event
│   └── message.ts        # Message/mention handlers
├── processors/
│   ├── index.ts          # Processor exports
│   ├── types.ts          # Type definitions
│   ├── registry.ts       # Processor registry
│   ├── image.ts          # Image processor (sharp)
│   └── document.ts       # PDF/DOCX processor
└── lib/
    └── slack.ts          # Slack utilities
```

---

## Built-in Processors

| Extension | Description |
|-----------|-------------|
| jpg, png, webp, gif | Resize and optimize images |
| pdf | Extract text from PDFs |
| docx | Extract text from Word documents |

---

## Integrating External APIs

Example: Add OpenAI integration

```typescript
// src/processors/ai-summary.ts
import OpenAI from 'openai'
import { registerProcessor } from './registry.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

registerProcessor({
  extensions: ['txt', 'md'],
  process: async (input) => {
    const text = input.buffer.toString('utf-8')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Summarize the following text.' },
        { role: 'user', content: text },
      ],
    })

    return {
      text: `*Summary of ${input.filename}:*\n${response.choices[0].message.content}`,
      replyInThread: true,
    }
  },
  description: 'AI-powered text summarization',
})
```

---

## Troubleshooting

### Bot not connecting

- Check `SLACK_APP_TOKEN` is correct (starts with `xapp-`)
- Ensure Socket Mode is enabled in Slack app settings

### Files not being processed

- Bot must be invited to the channel
- Check `file_shared` event is subscribed
- Verify `files:read` scope is added

### Permission errors

- Reinstall app after adding new scopes
- Check all required scopes are present

---

## Useful Links

- [Slack Bolt JS](https://slack.dev/bolt-js/)
- [Socket Mode](https://api.slack.com/apis/socket-mode)
- [Events API](https://api.slack.com/events)
