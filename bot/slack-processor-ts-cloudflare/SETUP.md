# Slack Bot Setup Guide

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

# 2. Create D1 database
wrangler d1 create my-slack-bot-db
# Copy the database_id to wrangler.toml

# 3. Initialize local database
pnpm db:init

# 4. Start dev server
pnpm dev
```

---

## 1. Create Slack App

1. Go to https://api.slack.com/apps
2. **Create New App** → **From scratch**
3. Enter App Name and select Workspace
4. **Create App**

---

## 2. Configure Bot Token Scopes

Navigate to **OAuth & Permissions** → **Scopes** → **Bot Token Scopes**

| Scope | Purpose |
|-------|---------|
| `chat:write` | Send messages |
| `files:read` | Read uploaded files |
| `channels:history` | Read channel messages |
| `groups:history` | Read private channel messages |
| `users:read` | Get user info (names, profiles) |

Add more scopes based on your needs:
- `reactions:write` - Add emoji reactions
- `channels:read` - List channels
- `im:write` - Send direct messages

---

## 3. Enable Event Subscriptions

Navigate to **Event Subscriptions**:

1. **Enable Events** → ON
2. **Request URL**: `https://YOUR_WORKER.workers.dev/slack/events`
   - Wait for "Verified" status
3. **Subscribe to bot events**:

| Event | Trigger |
|-------|---------|
| `file_shared` | File uploaded to channel |
| `message.channels` | Message in public channel |
| `message.groups` | Message in private channel |
| `app_mention` | Bot mentioned (@bot) |

---

## 4. Install App to Workspace

1. **OAuth & Permissions** → **Install to Workspace**
2. Click **Allow**
3. Copy **Bot User OAuth Token** (starts with `xoxb-`)

---

## 5. Deploy to Cloudflare

```bash
# Create database
wrangler d1 create my-slack-bot-db

# Update wrangler.toml with database_id

# Initialize remote database
pnpm db:init:remote

# Set secrets
wrangler secret put SLACK_BOT_TOKEN
# Paste xoxb-... token

wrangler secret put SLACK_SIGNING_SECRET
# Find in Basic Information → App Credentials

# Deploy
pnpm deploy
```

---

## 6. Update Request URL

After deployment, update the Request URL in Slack:
- **Event Subscriptions** → **Request URL**
- Enter: `https://YOUR_WORKER.workers.dev/slack/events`

---

## 7. Invite Bot to Channel

In your Slack workspace:
```
/invite @YourBotName
```

---

## Troubleshooting

### Request URL not verified
- Check Worker is deployed: `curl https://YOUR_WORKER.workers.dev`
- Check `/slack/events` endpoint returns `{ "challenge": "..." }`

### Bot not responding
- Verify bot is invited to the channel
- Check event subscriptions are enabled
- Verify `SLACK_BOT_TOKEN` secret is set

### File download fails
- Ensure `files:read` scope is added
- Reinstall app after adding new scopes

---

## Useful Commands

```bash
# Local development
pnpm dev

# View logs
wrangler tail

# Query database
wrangler d1 execute my-slack-bot-db --local --command "SELECT * FROM documents"
wrangler d1 execute my-slack-bot-db --remote --command "SELECT * FROM documents"

# Redeploy
pnpm deploy
```

---

## Project Structure

```
src/
├── index.ts           # Main app + routes
├── slack/
│   ├── types.ts       # Type definitions
│   ├── api.ts         # Slack API helpers
│   └── events.ts      # Event handler system
└── lib/
    └── utils.ts       # Utilities
```

---

## Adding Event Handlers

```ts
import { registerHandler } from './slack/events'
import type { MessageEvent } from './slack/types'

registerHandler<MessageEvent>('message', async (event, env) => {
  // Your logic here
  console.log('Message:', event.text)
})
```

---

## Slack API Reference

- [Events API](https://api.slack.com/events)
- [Web API Methods](https://api.slack.com/methods)
- [Block Kit Builder](https://app.slack.com/block-kit-builder)
