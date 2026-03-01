# 서비스 구조 & 데이터 흐름

## 서비스 구조도

```
┌─────────────────────────────────────────────────────────────┐
│ 사용자 머신                                                  │
│                                                             │
│  ┌──────────────────────┐    ┌───────────────────────────┐  │
│  │  Web App (SSR)       │    │  Claude Code CLI           │  │
│  │  React Router v7     │    │                            │  │
│  │                      │    │  ┌──────────────────────┐  │  │
│  │  /chat    채팅 UI    │    │  │  MCP Server (stdio)  │  │  │
│  │  /items   데이터 관리│    │  │  12 tools (R/W)      │  │  │
│  │  /transactions  ...  │    │  │  2 resources (R)     │  │  │
│  │                      │    │  │  2 prompts           │  │  │
│  │  Drizzle ORM         │    │  │  Drizzle ORM         │  │  │
│  └──────────┬───────────┘    │  └──────────┬───────────┘  │  │
│             │                │             │              │  │
│             │                └─────────────│──────────────┘  │
│             │ read/write                   │ read/write      │
│             ▼                              ▼                 │
│        ┌─────────────────────────────────────┐              │
│        │  SQLite (WAL mode)                  │              │
│        │  ./data/app.db                      │              │
│        │                                     │              │
│        │  portfolios, assets, holdings,      │              │
│        │  transactions, marketPrices,        │              │
│        │  chatSessions, chatMessages         │              │
│        └─────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**프로세스 관계:**
- Web App과 MCP Server는 별도 프로세스
- Web App: `pnpm dev` (또는 Docker 컨테이너)
- MCP Server: Claude Code CLI가 `.mcp.json`을 읽고 자동 spawn (stdio transport)
- 두 프로세스가 같은 SQLite 파일을 공유, WAL 모드로 동시 접근 안전

## DB 스키마 관계도

```
portfolios ──1:N── holdings ──N:1── assets
    │                                  │
    └──1:N── transactions ──N:1────────┘
                                       │
                             marketPrices ──N:1─┘

chatSessions ──1:N── chatMessages
```

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|-----------|
| `portfolios` | 투자 포트폴리오 | name, currency, targetAllocation |
| `assets` | 개별 자산 | symbol, name, type, exchange |
| `holdings` | 포트폴리오 내 보유 자산 | portfolioId(FK), assetId(FK), quantity |
| `transactions` | 거래 내역 | portfolioId(FK), assetId(FK), type, price |
| `marketPrices` | 시세 기록 | assetId(FK), price, source |
| `chatSessions` | 대화 세션 | title, createdAt, updatedAt |
| `chatMessages` | 대화 메시지 | sessionId(FK), role, content |

## 공유 쿼리 계층

```
app/lib/queries.ts          ← 공유 쿼리 함수 정의
    │
    ├── app/routes/*.tsx     ← Web App에서 import
    └── mcp/tools/*.ts       ← MCP Server에서 import
```

모든 DB 접근은 `app/lib/queries.ts`를 통해 이루어진다. 웹 라우트와 MCP 도구가 동일한 함수를 호출하므로, 비즈니스 로직이 한 곳에만 존재한다.

## 데이터 흐름

### 흐름 1: 웹에서 채팅 → MCP로 조회

```
[Web Browser]
    │ POST /chat/:id  { role: "user", content: "..." }
    ▼
[Web App - action()]
    │ addChatMessage(sessionId, "user", content)
    ▼
[SQLite]  chatMessages 테이블에 INSERT
    ▲
    │ getChatSessionWithMessages(sessionId)
[MCP Server - get-chat-session tool]
    │
    ▼
[Claude Code CLI]  세션 + 메시지 목록 수신
```

### 흐름 2: MCP로 대화 기록 → 웹에서 확인

```
[Claude Code CLI]
    │ create-chat-session { title: "분석 결과" }
    │ add-chat-message { sessionId, role: "assistant", content: "..." }
    ▼
[MCP Server]
    │ createChatSession() / addChatMessage()
    ▼
[SQLite]  chatSessions + chatMessages INSERT
    ▲
    │ listChatSessions() / getChatSessionWithMessages()
[Web App - loader()]
    │
    ▼
[Web Browser]  /chat 페이지에서 새 세션 + 메시지 확인
```

### 흐름 3: 도메인 데이터 조회 (MCP → Claude)

```
[Claude Code CLI]
    │ "포트폴리오 요약해줘"
    ▼
[Claude]  → portfolio-summary tool 호출
    │
[MCP Server]
    │ getPortfolioSummary(portfolioId)
    ▼
[SQLite]  portfolios + holdings + assets JOIN
    │
    ▼
[Claude]  결과를 자연어로 정리하여 응답
```

## MCP 도구 전체 목록

### 도메인 도구 (item-tools.ts, analysis-tools.ts)

| 도구 | R/W | 설명 |
|------|-----|------|
| `list-portfolios` | R | 전체 포트폴리오 목록 |
| `get-portfolio` | R | 포트폴리오 + 보유 자산 상세 |
| `portfolio-summary` | R | 배분 분석 + 총 비용 요약 |
| `list-assets` | R | 전체 자산 목록 |
| `get-asset` | R | 자산 상세 정보 |
| `list-transactions` | R | 거래 내역 (포트폴리오 필터 가능) |
| `rebalance-analysis` | R | 현재 배분 vs 목표 비교 |
| `overview` | R | 전체 데이터 개요 |

### 채팅 도구 (chat-tools.ts)

| 도구 | R/W | 설명 |
|------|-----|------|
| `list-chat-sessions` | R | 전체 세션 목록 (최신순) |
| `get-chat-session` | R | 세션 + 메시지 상세 |
| `create-chat-session` | **W** | 새 세션 생성, ID 반환 |
| `add-chat-message` | **W** | 세션에 메시지 추가 |

## 웹 라우트

| 경로 | 파일 | 기능 |
|------|------|------|
| `/` | `routes/home.tsx` | 대시보드 |
| `/items` | `routes/items.tsx` | 포트폴리오/자산 목록 |
| `/items/:id` | `routes/items.$id.tsx` | 포트폴리오 상세 |
| `/transactions` | `routes/transactions.tsx` | 거래 내역 |
| `/import` | `routes/import.tsx` | 데이터 가져오기 |
| `/chat` | `routes/chat.tsx` | 채팅 세션 목록 + 생성 |
| `/chat/:id` | `routes/chat.$id.tsx` | 채팅 UI (메시지 입출력) |
