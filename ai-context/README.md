# AI Context Boilerplates

> 웹 UI로 도메인 데이터를 관리하고, Claude Code CLI + MCP로 AI 대화/분석을 수행하는 앱 템플릿.

## Boilerplate 목록

| 이름 | 렌더링 | 배포 | 설명 | 상태 |
|------|--------|------|------|------|
| `react-router-ssr-mcp` | SSR | Docker | React Router v7 + SQLite + MCP Server | ✅ |

## 선택 가이드

```
AI Context App이 필요하다
├── 홈서버 + Docker 배포 → react-router-ssr-mcp ✅
└── Cloudflare Workers 배포 → (예정) react-router-ssr-mcp-cloudflare
```

## 구조

모든 ai-context 보일러플레이트는 동일한 아키텍처를 공유:

```
┌──────────────────────┐     ┌────────────────────┐
│  Web App (SSR)       │     │  Claude Code CLI    │
│  컨텍스트 관리 UI    │     │  자연어 대화/분석   │
│  채팅 UI             │     │                    │
│  SQLite (Drizzle)   ◄├─────┤► MCP Server        │
└──────────────────────┘  DB │  (stdio, R/W)      │
                             └────────────────────┘
```

- 웹 앱과 MCP 서버가 동일 SQLite DB를 공유 (WAL 모드)
- 웹에서 입력한 데이터를 MCP로 조회하고, MCP로 기록한 데이터를 웹에서 확인
- 상세 데이터 흐름: [docs/data-flow.md](docs/data-flow.md)

## 공통 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | React Router v7 / (향후 TanStack) |
| Styling | Tailwind CSS v4, shadcn/ui (new-york), lucide-react |
| Database | SQLite + Drizzle ORM (better-sqlite3) |
| MCP | @modelcontextprotocol/sdk |
| TypeScript | strict, verbatimModuleSyntax |

## 사용법

```bash
# 1. degit으로 복제
npx degit user/my-boilerplates/ai-context/react-router-ssr-mcp my-app
cd my-app

# 2. 설치 + DB 초기화
pnpm install && pnpm db:push

# 3. 도메인 커스텀 (🎯 파일들만 수정)
#    app/db/schema.ts → 내 엔티티
#    app/lib/queries.ts → 내 쿼리
#    mcp/tools/ → 내 MCP 도구
#    CLAUDE.md → 내 프로젝트 설명

# 4. 개발
pnpm dev    # 웹 앱
claude      # Claude Code CLI (MCP 자동 연결)
```

## 다음 작업

- [x] Chat Sessions — 웹 채팅 UI + MCP 읽기/쓰기 도구
- [ ] Cloudflare Workers 변형 (`react-router-ssr-mcp-cloudflare`, D1 사용)
- [ ] TanStack Start 변형 (`tanstack-start-ssr-mcp`)
- [ ] Import/Export 기능 완성 (CSV 파싱, 파일 다운로드)
- [ ] shadcn/ui 폼 컴포넌트 추가 (Create/Edit 다이얼로그)
