# Bot/Processor 보일러플레이트 아키텍처

Slack 이벤트를 수신하여 파일 처리, 메시지 응답 등의 자동화 파이프라인을 구축하기 위한 3개의 보일러플레이트 아키텍처 문서.

| 보일러플레이트 | 런타임 | 통신 방식 | 배포 |
|---|---|---|---|
| `slack-processor-ts` | Node.js 20 | Socket Mode | Docker (자체 호스팅) |
| `slack-processor-ts-cloudflare` | Cloudflare Workers | HTTP Webhook | `wrangler deploy` |
| `slack-processor-python` | Python 3.11 | Socket Mode | Docker (자체 호스팅) |

## 문서 목차

- [공통 아키텍처 패턴](00-common-patterns.md) — 이벤트 처리 흐름, 프로세서 레지스트리, 가드 패턴, Socket Mode vs HTTP Webhook
- [slack-processor-ts](01-slack-processor-ts.md) — TypeScript + @slack/bolt, Socket Mode, Docker 배포
- [slack-processor-ts-cloudflare](02-slack-processor-cloudflare.md) — Hono + D1, HTTP Webhook, Cloudflare Workers 배포
- [slack-processor-python](03-slack-processor-python.md) — Python + slack-bolt, Socket Mode, Docker 배포
- [비교 및 선택 가이드](04-comparison.md) — 비교 매트릭스, 선택 가이드, 시크릿 관리, 명령어 요약
