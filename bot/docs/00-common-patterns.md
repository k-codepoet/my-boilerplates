# 공통 아키텍처 패턴

세 보일러플레이트가 공유하는 이벤트 처리 흐름, 프로세서 레지스트리, 가드 패턴을 설명한다.

## 이벤트 처리 흐름

세 보일러플레이트 모두 동일한 파이프라인 구조를 따른다:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Slack Event │ ──→ │   Handler    │ ──→ │   Guards     │ ──→ │  Processor   │
│  (file_shared│     │  (라우팅)     │     │  (스킵 체크)  │     │  (파일 처리)  │
│   message    │     │              │     │              │     │              │
│   app_mention│     │              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                     ┌──────────────┐                                 │
                     │  Slack API   │ ←────────────────────────────────┘
                     │  (응답 전송)  │
                     │  postMessage │
                     │  uploadFile  │
                     └──────────────┘
```

**핵심 흐름:**
1. Slack에서 이벤트 수신 (Socket Mode 또는 HTTP Webhook)
2. 이벤트 타입별 핸들러로 라우팅 (`file_shared`, `app_mention`, `message`)
3. 가드 체크 — 봇 자체 파일, 대용량, 패턴 매칭 등 스킵 조건 확인
4. 프로세서 레지스트리에서 확장자/MIME 타입으로 적합한 프로세서 탐색
5. 파일 다운로드 → 프로세서 실행 → 결과를 Slack으로 전송

## 프로세서 레지스트리 패턴

세 보일러플레이트 모두 **확장자/MIME 타입 기반 프로세서 매핑** 패턴을 공유한다:

```
                    ┌─────────────────────────────────┐
                    │      Processor Registry         │
                    │                                 │
                    │  extensions: ["jpg","png","webp"]│──→ Image Processor
                    │  extensions: ["pdf"]             │──→ PDF Processor
                    │  extensions: ["docx"]            │──→ DOCX Processor
                    │  extensions: ["csv"]             │──→ (직접 추가)
                    └─────────────────────────────────┘
```

**확장 방법:** 새 프로세서 파일을 생성하고, `registerProcessor()` (TS) 또는 `@register_processor()` (Python) 데코레이터로 등록하면 자동으로 레지스트리에 추가된다.

## 가드 패턴

모든 보일러플레이트는 `shouldSkipFile()` / `should_skip_file()` 함수로 불필요한 처리를 사전 차단한다:

| 가드 | 설명 | 기본값 |
|---|---|---|
| 봇 자체 파일 스킵 | `fileUserId === botUserId` → 무한 루프 방지 | 활성 |
| 파일명 패턴 스킵 | `-resized`, `-processed`, `-thumbnail`, `-converted` 포함 시 스킵 | 활성 |
| 대용량 파일 스킵 | `MAX_FILE_SIZE` 환경변수 초과 시 스킵 | 50MB |

커스텀 가드 추가: `addGuard()` (TS) / `add_guard()` (Python) 함수로 확장 가능.

## Socket Mode vs HTTP Webhook

```
Socket Mode (ts, python)              HTTP Webhook (cloudflare)
========================              =========================
봇 → Slack WebSocket 연결              Slack → 봇 HTTP POST 전송
공개 URL 불필요                         공개 URL 필수
방화벽 내부에서 실행 가능                인터넷 노출 필수
SLACK_APP_TOKEN 필요                   서명 검증(HMAC-SHA256) 필요
지속적 연결 유지                        요청-응답 모델 (무상태)
```

| 항목 | Socket Mode (ts, python) | HTTP Webhook (cloudflare) |
|---|---|---|
| **통신** | WebSocket (봇 → Slack) | HTTP POST (Slack → 봇) |
| **공개 URL** | 불필요 | 필수 |
| **보안** | App Token 기반 | HMAC-SHA256 서명 검증 |
| **인프라** | 서버/Docker 필요 (상시 실행) | 서버리스 (요청 시 실행) |
| **방화벽** | 내부 네트워크에서 실행 가능 | 인터넷 노출 필수 |
| **지연시간** | WebSocket 유지 → 낮은 지연 | 콜드 스타트 가능성 |
| **비용** | 서버 유지비 (VM/Docker) | 무료 티어 가능 (Workers) |
| **데이터 영속성** | 없음 (외부 DB 연동 필요) | D1 (SQLite) 내장 |
| **확장성** | 수동 스케일링 | 자동 글로벌 스케일링 |
| **Slack SDK** | `@slack/bolt` (풀스택 SDK) | fetch 기반 직접 구현 |
| **설정 복잡도** | 낮음 (.env 파일) | 중간 (wrangler.toml + secret) |
| **적합 환경** | 사내, 개발, 프로토타입 | 프로덕션, 글로벌 배포 |
