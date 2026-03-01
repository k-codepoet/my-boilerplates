# AI Context Boilerplates — Documentation

## Overview

AI Context 보일러플레이트는 "웹 UI로 데이터 관리 + Claude Code CLI로 AI 대화"라는 구조를 표준화한 템플릿입니다.

## Architecture

### Core Concept

```
사용자
  ├── Web UI → 데이터 입력/관리 (CRUD) + 채팅
  └── Claude Code CLI → 대화/분석 (MCP를 통해 같은 DB 접근)
```

- **Web App**: 도메인 데이터의 입력/조회/수정/삭제 + 채팅 UI
- **MCP Server**: Claude Code가 데이터를 읽고 쓰기 (대화 기록 포함)
- **SQLite**: 두 프로세스가 같은 파일을 공유 (WAL 모드로 동시 읽기 안전)

### MCP Integration

`.mcp.json` 파일이 프로젝트 루트에 있으면 Claude Code CLI가 자동으로 인식:

```json
{
  "mcpServers": {
    "context-manager": {
      "command": "npx",
      "args": ["tsx", "./mcp/index.ts"],
      "env": { "DATABASE_PATH": "./data/app.db" }
    }
  }
}
```

MCP 서버는 3가지 기능을 제공:
- **Tools**: 데이터 조회 + 쓰기 함수 (Claude가 호출) — 읽기 8개, 쓰기 4개
- **Resources**: 데이터 스냅샷 (Claude가 읽기)
- **Prompts**: 분석 프롬프트 템플릿

### MCP Tools

| 도구 | 타입 | 설명 |
|------|------|------|
| `list-portfolios` | 읽기 | 포트폴리오 목록 |
| `get-portfolio` | 읽기 | 포트폴리오 + 보유 자산 상세 |
| `portfolio-summary` | 읽기 | 배분 분석 요약 |
| `list-assets` | 읽기 | 전체 자산 목록 |
| `get-asset` | 읽기 | 자산 상세 |
| `list-transactions` | 읽기 | 거래 내역 |
| `rebalance-analysis` | 읽기 | 리밸런싱 분석 |
| `overview` | 읽기 | 전체 데이터 개요 |
| `list-chat-sessions` | 읽기 | 대화 세션 목록 |
| `get-chat-session` | 읽기 | 세션 + 메시지 상세 |
| `create-chat-session` | 쓰기 | 새 세션 생성 |
| `add-chat-message` | 쓰기 | 세션에 메시지 추가 |

## Customization Flow

```
degit 복제
  ↓
app/db/schema.ts → 도메인 엔티티 정의
  ↓
app/lib/queries.ts → 공유 쿼리 작성
  ↓
app/routes/ → UI 페이지 수정
  ↓
mcp/tools/ → MCP 도구 교체
  ↓
mcp/prompts/ → 분석 프롬프트 교체
  ↓
CLAUDE.md → 프로젝트 설명 수정
```

## Deployment

Docker multi-stage 빌드 → 홈서버 Traefik → Cloudflare Tunnel:
- MCP 서버는 Docker에 포함되지 않음 (로컬 개발용, stdio transport)
- Web App만 Docker로 배포
- 원격에서 MCP 사용 시 HTTP transport 추가 가능 (별도 구현 필요)

## Documents

| 문서 | 내용 |
|------|------|
| [../README.md](../README.md) | 카테고리 개요, 선택 가이드 |
| [react-router-ssr-mcp](../react-router-ssr-mcp/README.md) | 보일러플레이트 상세 |
| [data-flow.md](data-flow.md) | 서비스 구조 + 데이터 흐름 상세 |
