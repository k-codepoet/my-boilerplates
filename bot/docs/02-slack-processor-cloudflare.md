# slack-processor-ts-cloudflare (Hono + D1)

Hono v4 + Cloudflare D1 기반 Slack 파일 프로세서. HTTP Webhook으로 이벤트를 수신하며, Workers에 서버리스로 배포한다.

> 공통 패턴(이벤트 흐름, 프로세서 레지스트리, 가드)은 [00-common-patterns.md](00-common-patterns.md) 참조.

## 아키텍처

```
src/
├── index.ts              # Hono 앱 + 이벤트 핸들러 등록 + 라우트
├── slack/
│   ├── types.ts          # Bindings, SlackEvent*, 응답 타입
│   ├── api.ts            # Slack REST API 래퍼 (fetch 기반)
│   └── events.ts         # registerHandler(), createEventsHandler()
└── lib/
    └── utils.ts          # generateId(nanoid), escapeHtml, formatDate

schema.sql                # D1 데이터베이스 스키마
wrangler.toml             # Workers 설정 + D1 바인딩
```

- **프레임워크:** Hono v4 (경량 웹 프레임워크, Cloudflare Workers 최적화)
- **데이터베이스:** Cloudflare D1 (SQLite 호환, 엣지 배포)
- **통신:** HTTP Webhook (Slack → Workers 엔드포인트 POST)
- **의존성:** `hono`, `nanoid` (최소 의존성)

## Hono + Workers 환경 바인딩

```typescript
type Bindings = {
  DB: D1Database              // D1 데이터베이스
  SLACK_BOT_TOKEN: string     // wrangler secret
  SLACK_SIGNING_SECRET: string // wrangler secret
}

const app = new Hono<{ Bindings: Bindings }>()
```

## D1 스키마

```sql
-- documents 테이블: 처리된 파일 기록
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT,
  slack_channel_id TEXT NOT NULL,
  slack_file_id TEXT,
  slack_thread_ts TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- messages 테이블: 대화 컨텍스트 저장
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT,
  slack_user_id TEXT NOT NULL,
  slack_user_name TEXT,
  message_text TEXT NOT NULL,
  message_ts TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_documents_slack_file ON documents(slack_file_id);
CREATE INDEX IF NOT EXISTS idx_documents_channel ON documents(slack_channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_doc ON messages(document_id);
```

## 이벤트 처리

**registerHandler() 패턴:**

```typescript
// 이벤트 핸들러 등록 (Map 기반 레지스트리)
const eventHandlers = new Map<string, EventHandler>()

registerHandler<FileSharedEvent>('file_shared', async (event, env) => {
  // env.DB, env.SLACK_BOT_TOKEN 접근 가능
  const docId = generateId()
  await env.DB.prepare('INSERT INTO documents ...').bind(...).run()
  await postMessage(env.SLACK_BOT_TOKEN, { channel, text })
})
```

**createEventsHandler() 흐름:**

```
POST /slack/events
    │
    ├─ body.type === 'url_verification'
    │   └─ return { challenge } (Slack 초기 설정)
    │
    └─ body.type === 'event_callback'
        ├─ eventHandlers.get(event.type) → 핸들러 탐색
        ├─ c.executionCtx.waitUntil(handler(...)) → 백그라운드 실행
        └─ return { ok: true } → 즉시 응답 (3초 제한 충족)
```

**핵심:** `executionCtx.waitUntil()`로 핸들러를 백그라운드에서 실행하여 Slack의 3초 응답 제한을 충족한다.

## 서명 검증

```typescript
// HMAC-SHA256 서명 검증 (Web Crypto API)
verifySlackSignature(signingSecret, signature, timestamp, body)

// 미들웨어로 적용 가능
app.use('/slack/*', createSignatureMiddleware())
// → x-slack-signature, x-slack-request-timestamp 헤더 검증
// → 5분 이상 지난 요청 거부 (리플레이 공격 방지)
```

## 라우트

| 메서드 | 경로 | 설명 |
|---|---|---|
| `GET` | `/` | 헬스체크 ("Slack Bot is running!") |
| `POST` | `/slack/events` | Slack 이벤트 웹훅 수신 |
| `GET` | `/view/:id` | D1에 저장된 문서 HTML 뷰 |

## Slack API 래퍼

`@slack/bolt` 대신 `fetch()` 기반 직접 구현 (Workers 호환):

| 함수 | Slack API | 설명 |
|---|---|---|
| `getFileInfo()` | `files.info` | 파일 메타데이터 조회 |
| `downloadFile()` | (private URL) | 파일 콘텐츠 다운로드 |
| `getUserInfo()` | `users.info` | 사용자 정보 조회 |
| `getConversationReplies()` | `conversations.replies` | 스레드 메시지 조회 |
| `postMessage()` | `chat.postMessage` | 메시지 전송 |
| `postEphemeral()` | `chat.postEphemeral` | 임시 메시지 전송 |
| `addReaction()` | `reactions.add` | 리액션 추가 |
| `openView()` | `views.open` | 모달 뷰 열기 |

## 배포

```bash
# D1 데이터베이스 생성
wrangler d1 create my-slack-bot-db
# → wrangler.toml의 database_id 업데이트

# 스키마 적용
pnpm db:init          # 로컬
pnpm db:init:remote   # 프로덕션

# 시크릿 설정
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put SLACK_SIGNING_SECRET

# 배포
pnpm deploy           # wrangler deploy
```

## 필요 시크릿

| 변수 | 설명 | 설정 방법 |
|---|---|---|
| `SLACK_BOT_TOKEN` | `xoxb-` Bot User OAuth Token | `wrangler secret put` |
| `SLACK_SIGNING_SECRET` | 요청 서명 검증 | `wrangler secret put` |
| `DB` | D1 데이터베이스 바인딩 | `wrangler.toml` |

## 명령어

```bash
pnpm dev              # wrangler dev (로컬 Workers 런타임)
pnpm deploy           # wrangler deploy (프로덕션 배포)
pnpm typecheck        # tsc --noEmit
pnpm db:init          # D1 로컬 스키마 적용
pnpm db:init:remote   # D1 프로덕션 스키마 적용
```
