# 보일러플레이트 비교 및 선택 가이드

세 보일러플레이트의 상세 비교 매트릭스, 선택 가이드, 시크릿 관리 방법을 제공한다.

## 비교 매트릭스

| 항목 | slack-processor-ts | slack-processor-ts-cloudflare | slack-processor-python |
|---|---|---|---|
| **런타임** | Node.js 20 | Cloudflare Workers | Python 3.11 |
| **언어** | TypeScript (strict) | TypeScript (strict) | Python (mypy strict) |
| **프레임워크** | @slack/bolt v4 | Hono v4 | slack-bolt |
| **통신 방식** | Socket Mode | HTTP Webhook | Socket Mode |
| **데이터베이스** | 없음 | D1 (SQLite) | 없음 |
| **배포** | Docker (node:20-alpine) | wrangler deploy | Docker (python:3.11-slim) |
| **프로세서 등록** | `registerProcessor({...})` | `registerHandler<T>()` | `@register_processor()` |
| **파일 처리 라이브러리** | sharp, pdf-parse, mammoth | (직접 구현) | Pillow, pypdf, python-docx |
| **HTTP 클라이언트** | fetch (내장) | fetch (Workers 내장) | httpx |
| **가드 시스템** | `shouldSkipFile()` | 인라인 체크 | `should_skip_file()` |
| **ID 생성** | — | nanoid | — |
| **패키지 관리** | pnpm | pnpm + wrangler | uv |
| **린팅** | — | — | ruff |
| **타입 검사** | tsc --noEmit | tsc --noEmit | mypy --strict |
| **Docker 스테이지** | 2단계 (builder+runner) | N/A | 1단계 (slim) |
| **헬스체크** | wget :3000 | GET / 라우트 | — |

## 선택 가이드

### 빠른 시작 → `slack-processor-ts`

- Socket Mode로 `.env` 파일만 설정하면 즉시 실행
- `@slack/bolt`이 이벤트 라우팅, 미들웨어, 에러 처리를 모두 제공
- 공개 URL이나 서버리스 설정 불필요

### 서버리스 / 무료 운영 → `slack-processor-ts-cloudflare`

- Cloudflare Workers 무료 티어 (10만 요청/일)
- D1 데이터베이스 내장으로 파일 메타데이터 영속 저장
- 글로벌 엣지 배포, 자동 스케일링
- 서버 관리 불필요

### Python 생태계 활용 → `slack-processor-python`

- Pillow, pypdf, python-docx 등 성숙한 파일 처리 라이브러리
- `@register_processor()` 데코레이터로 직관적인 프로세서 등록
- ruff + mypy strict로 코드 품질 관리
- 기존 Python 코드베이스와 통합 용이

### 데이터 영속성 필요 → `slack-processor-ts-cloudflare`

- D1(SQLite) 기본 바인딩으로 documents, messages 테이블 제공
- 파일 처리 이력, 대화 컨텍스트를 데이터베이스에 저장
- `/view/:id` 라우트로 저장된 문서를 웹에서 조회

### 내부 네트워크 운영 → `slack-processor-ts` 또는 `slack-processor-python`

- Socket Mode는 봇에서 Slack으로 아웃바운드 연결만 필요
- 방화벽 뒤, VPN 내부, 프라이빗 네트워크에서 실행 가능
- 공개 URL 노출 없이 운영

## 시크릿 관리

### Slack 앱 설정에서 발급

| 시크릿 | 위치 | 용도 |
|---|---|---|
| Bot User OAuth Token (`xoxb-`) | OAuth & Permissions | API 호출 인증 |
| App-Level Token (`xapp-`) | Basic Information → App-Level Tokens | Socket Mode 연결 |
| Signing Secret | Basic Information | 요청 서명 검증 |

### 환경별 시크릿 설정

**로컬 개발 (.env 파일):**

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
```

**Docker 배포 (환경 변수):**

```bash
docker run \
  -e SLACK_BOT_TOKEN=xoxb-... \
  -e SLACK_APP_TOKEN=xapp-... \
  -e SLACK_SIGNING_SECRET=... \
  my-slack-bot
```

**Cloudflare Workers (wrangler secret):**

```bash
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put SLACK_SIGNING_SECRET
# D1 바인딩은 wrangler.toml에서 설정
```
