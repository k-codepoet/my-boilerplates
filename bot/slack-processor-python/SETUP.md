# Slack Bot Processor (Python) - Setup Guide

Self-hosted Slack bot for file processing. Uses **Socket Mode** - no public URL required!

## Prerequisites

- **Python 3.12+** (`.python-version` 파일 참조)
- **uv** (권장) 또는 pip

```bash
# uv 설치 (macOS/Linux)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Quick Start

```bash
# 1. Create virtual environment (uv 사용)
uv venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# 2. Install dependencies
uv pip install -e .

# 3. Copy env file and fill in credentials
cp .env.example .env

# 4. Run
python -m src.main
```

> **Note**: pip도 사용 가능하지만 uv가 10~100배 빠릅니다.

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
SLACK_SIGNING_SECRET=your-signing-secret
```

---

## 7. Run the Bot

### Direct

```bash
python -m src.main
```

### Docker

```bash
docker compose up -d
docker compose logs -f
```

### Systemd (Linux)

```ini
# /etc/systemd/system/slack-bot.service
[Unit]
Description=Slack Bot Processor
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/slack-bot-processor-python
ExecStart=/path/to/.venv/bin/python -m src.main
Restart=always
EnvironmentFile=/path/to/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable slack-bot
sudo systemctl start slack-bot
```

---

## Adding Custom Processors

Create a new file in `src/processors/`:

```python
# src/processors/custom.py
from .registry import register_processor
from .types import ProcessorInput, ProcessorOutput


@register_processor(
    extensions=["csv"],
    description="Process CSV files",
)
def process_csv(input: ProcessorInput) -> ProcessorOutput:
    # Your logic here
    return ProcessorOutput(
        text=f"Processed: {input.filename}",
        reply_in_thread=True,
    )
```

Then import it in `src/processors/__init__.py`:

```python
from . import custom
```

---

## Project Structure

```
src/
├── main.py               # App entry point (Socket Mode)
├── handlers/
│   ├── __init__.py
│   ├── file.py           # file_shared event
│   └── message.py        # Message/mention handlers
├── processors/
│   ├── __init__.py
│   ├── types.py          # Type definitions
│   ├── registry.py       # Processor registry
│   ├── image.py          # Image processor (Pillow)
│   └── document.py       # PDF/DOCX processor
└── lib/
    ├── __init__.py
    └── guards.py         # Skip conditions
```

---

## Troubleshooting

### Bot not connecting

- Check `SLACK_APP_TOKEN` is correct (starts with `xapp-`)
- Ensure Socket Mode is enabled

### Import errors

- Make sure you're running from project root: `python -m src.main`
- Check virtual environment is activated

### Files not processing

- Bot must be invited to channel: `/invite @BotName`
- Check `file_shared` event is subscribed
