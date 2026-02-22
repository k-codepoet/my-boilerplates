# slack-processor-ts (Node.js Docker)

TypeScript + `@slack/bolt` v4 기반 Slack 파일 프로세서. Socket Mode로 공개 URL 없이 실행 가능하며, Docker로 배포한다.

> 공통 패턴(이벤트 흐름, 프로세서 레지스트리, 가드)은 [00-common-patterns.md](00-common-patterns.md) 참조.

## 아키텍처

```
src/
├── index.ts              # 앱 진입점 (Bolt 초기화, Socket Mode)
├── handlers/
│   ├── index.ts          # 핸들러 등록 허브
│   ├── file.ts           # file_shared 이벤트 핸들러
│   └── message.ts        # app_mention, message 핸들러
├── processors/
│   ├── types.ts          # ProcessorInput/Output/Entry 타입
│   ├── registry.ts       # 프로세서 레지스트리 (등록/탐색/실행)
│   ├── image.ts          # sharp 기반 이미지 처리
│   ├── document.ts       # pdf-parse, mammoth 기반 문서 처리
│   └── index.ts          # 프로세서 import + re-export
└── lib/
    ├── guards.ts         # 스킵 조건 가드
    └── slack.ts          # Slack API 유틸리티
```

- **프레임워크:** `@slack/bolt` v4 + Socket Mode
- **환경변수:** `dotenv` 로드 (.env 파일)
- **핸들러 등록:** `registerHandlers(app)` → `registerFileHandler()` + `registerMessageHandlers()`

## 이벤트 핸들러

| 이벤트 | 핸들러 | 설명 |
|---|---|---|
| `file_shared` | `file.ts` | 파일 업로드 시 다운로드 → 프로세서 → 응답 |
| `app_mention` | `message.ts` | 봇 멘션 시 지원 타입 안내 |
| `message` (regex) | `message.ts` | `help\|지원\|도움` 키워드 매칭 |

## 파일 처리 파이프라인

```
file_shared 이벤트
    │
    ├─ client.files.info() → 파일 메타데이터 획득
    ├─ shouldSkipFile() → 가드 체크
    ├─ fetch(url_private) → 파일 다운로드 (Bearer 토큰)
    ├─ processFile(input) → 레지스트리에서 프로세서 탐색/실행
    │
    └─ 결과 전송:
       ├─ output.file → client.files.uploadV2() (파일 업로드)
       └─ output.text → client.chat.postMessage() (텍스트 응답)
```

## 프로세서 레지스트리

```typescript
// 등록 (registry.ts)
registerProcessor({
  extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff'],
  mimetypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  process: processImage,
  description: 'Resize and optimize images',
})

// 탐색: 확장자 우선, MIME 타입 fallback
findProcessor(filename, mimetype) → ProcessorEntry | undefined
```

**기본 제공 프로세서:**

| 프로세서 | 확장자 | 라이브러리 | 기능 |
|---|---|---|---|
| Image | jpg, jpeg, png, webp, gif, tiff | `sharp` | 리사이즈 (max 800px), 썸네일 |
| PDF | pdf | `pdf-parse` | 텍스트 추출 (1000자 미리보기) |
| Word | docx | `mammoth` | 텍스트 추출 (1000자 미리보기) |

## 타입 시스템

```typescript
interface ProcessorInput {
  filename: string       // 원본 파일명
  mimetype: string       // MIME 타입
  extension: string      // 확장자 (점 제외)
  buffer: Buffer         // 파일 바이너리
  userId: string         // 업로더 Slack ID
  channelId: string      // 채널 ID
  threadTs?: string      // 스레드 타임스탬프
}

interface ProcessorOutput {
  text?: string          // 텍스트 메시지
  blocks?: unknown[]     // Slack Block Kit
  file?: {               // 업로드할 파일
    buffer: Buffer
    filename: string
    title?: string
  }
  replyInThread?: boolean // 스레드 답글 여부
}
```

## 배포

```dockerfile
# Multi-stage Docker (node:20-alpine)
FROM node:20-alpine AS builder   # 빌드: pnpm install → tsc
FROM node:20-alpine AS runner    # 실행: pnpm install --prod + dist/
# PORT=3000, HEALTHCHECK wget
```

## 필요 시크릿

| 변수 | 설명 | 필수 |
|---|---|---|
| `SLACK_BOT_TOKEN` | `xoxb-` Bot User OAuth Token | Y |
| `SLACK_APP_TOKEN` | `xapp-` App-Level Token (Socket Mode용) | Y |
| `SLACK_SIGNING_SECRET` | 요청 서명 검증 | Y |
| `MAX_FILE_SIZE` | 최대 파일 크기 (bytes, 기본 50MB) | N |

## 명령어

```bash
pnpm dev          # tsx watch src/index.ts (개발 모드, 핫리로드)
pnpm build        # tsc (TypeScript 컴파일)
pnpm start        # node dist/index.js (프로덕션 실행)
pnpm typecheck    # tsc --noEmit (타입 검사만)
```
