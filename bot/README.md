# Bot/Processor 보일러플레이트

> Slack Bot 3종 — TypeScript(Docker) / TypeScript(Cloudflare Workers) / Python(Docker).
> 파일 업로드 시 자동 처리(이미지 리사이즈, PDF/DOCX 텍스트 추출)하는 프로세서 파이프라인.

## 보일러플레이트 목록

| 이름 | 런타임 | 통신 방식 | DB | 배포 | 한 줄 설명 |
|------|--------|-----------|-----|------|-----------|
| `slack-processor-ts` | Node.js 20 | Socket Mode | 없음 | Docker | 자체 호스팅, 빠른 시작 |
| `slack-processor-ts-cloudflare` | Workers | HTTP Webhook | D1 | wrangler | 서버리스, 데이터 영속 |
| `slack-processor-python` | Python 3.11 | Socket Mode | 없음 | Docker | Python 생태계 활용 |

## 선택 가이드

| 상황 | 추천 |
|------|------|
| 빠른 시작, 프로토타입 | `slack-processor-ts` |
| 서버리스 / 무료 운영 | `slack-processor-ts-cloudflare` |
| Python 라이브러리 필요 | `slack-processor-python` |
| 데이터 저장 필요 | `slack-processor-ts-cloudflare` (D1) |
| 내부 네트워크 / 방화벽 내부 | `slack-processor-ts` 또는 `python` (Socket Mode) |

## 공통 패턴

- **프로세서 레지스트리** — 확장자/MIME 타입 기반으로 프로세서를 자동 매핑. `registerProcessor()` (TS) / `@register_processor()` (Python)으로 등록.
- **가드 패턴** — `shouldSkipFile()` / `should_skip_file()`로 봇 자체 파일, 대용량, 패턴 매칭 등 불필요한 처리를 사전 차단.

## 빠른 시작

### slack-processor-ts

```bash
pnpm dev          # tsx watch (개발 모드, 핫리로드)
pnpm build        # tsc (TypeScript 컴파일)
pnpm start        # node dist/index.js (프로덕션)
pnpm typecheck    # tsc --noEmit
```

### slack-processor-ts-cloudflare

```bash
pnpm dev              # wrangler dev (로컬 Workers 런타임)
pnpm deploy           # wrangler deploy (프로덕션 배포)
pnpm typecheck        # tsc --noEmit
pnpm db:init          # D1 로컬 스키마 적용
pnpm db:init:remote   # D1 프로덕션 스키마 적용
```

### slack-processor-python

```bash
uv venv && source .venv/bin/activate
uv pip install -e .
python -m src.main              # 실행
ruff check src/ && mypy src/    # 린트 + 타입 검사
```

## 필요 시크릿

| 변수 | 용도 | ts | cloudflare | python |
|------|------|:--:|:----------:|:------:|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token (`xoxb-`) | O | O | O |
| `SLACK_APP_TOKEN` | App-Level Token (`xapp-`, Socket Mode) | O | — | O |
| `SLACK_SIGNING_SECRET` | 요청 서명 검증 | O | O | O |
| `MAX_FILE_SIZE` | 최대 파일 크기 (기본 50MB) | — | — | — |

- **Socket Mode** (ts, python): `.env` 파일에 설정
- **Cloudflare**: `wrangler secret put`으로 설정, D1은 `wrangler.toml`에서 바인딩

## 기술 스택 비교

| 항목 | ts | cloudflare | python |
|------|-----|------------|--------|
| 프레임워크 | @slack/bolt v4 | Hono v4 | slack-bolt |
| 파일 처리 | sharp, pdf-parse, mammoth | (직접 구현) | Pillow, pypdf, python-docx |
| 패키지 관리 | pnpm | pnpm + wrangler | uv |
| 타입 검사 | tsc | tsc | mypy --strict |
| Docker | 2단계 (alpine) | N/A | 1단계 (slim) |

## 다음 작업

- [ ] 추가 프로세서 구현 (CSV, Excel, 오디오 등)
- [ ] 테스트 프레임워크 도입 (TS: vitest, Python: pytest)
- [ ] Cloudflare D1 마이그레이션 관리 도구 추가
- [ ] Socket Mode ↔ HTTP Webhook 전환 가이드 문서화

## 상세 문서

- [아키텍처 상세](docs/index.md) — 이벤트 처리 흐름, D1 스키마, 프로세서 구현 가이드, Socket Mode vs Webhook 비교, 전체 비교 매트릭스
