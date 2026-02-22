# slack-processor-python (Python Docker)

Python + `slack-bolt` 기반 Slack 파일 프로세서. Socket Mode로 공개 URL 없이 실행 가능하며, Docker로 배포한다.

> 공통 패턴(이벤트 흐름, 프로세서 레지스트리, 가드)은 [00-common-patterns.md](00-common-patterns.md) 참조.

## 아키텍처

```
src/
├── __init__.py
├── main.py               # 앱 진입점 (Bolt + SocketModeHandler)
├── handlers/
│   ├── __init__.py       # register_file_handler, register_message_handlers export
│   ├── file.py           # file_shared 이벤트 핸들러
│   └── message.py        # app_mention, message 핸들러
├── processors/
│   ├── __init__.py       # 프로세서 import + re-export
│   ├── types.py          # ProcessorInput/Output/Entry (dataclass)
│   ├── registry.py       # @register_processor() 데코레이터 + 탐색/실행
│   ├── image.py          # Pillow 기반 이미지 처리
│   └── document.py       # pypdf, python-docx 기반 문서 처리
└── lib/
    ├── __init__.py
    └── guards.py         # should_skip_file() + 커스텀 가드
```

- **프레임워크:** `slack-bolt` + `SocketModeHandler`
- **HTTP 클라이언트:** `httpx` (비동기 호환, requests 대체)
- **패키지 관리:** `uv` (빠른 설치, pip 호환)
- **타입:** `mypy` strict 모드, `dataclass` 기반

## 프로세서 시스템

**@register_processor() 데코레이터 패턴:**

```python
@register_processor(
    extensions=["jpg", "jpeg", "png", "webp", "gif"],
    mimetypes=["image/jpeg", "image/png", "image/webp", "image/gif"],
    description="Resize and optimize images",
)
def process_image(input: ProcessorInput) -> ProcessorOutput:
    img = Image.open(BytesIO(input.content))
    # ... 처리 로직
    return ProcessorOutput(text="...", file={...}, reply_in_thread=True)
```

**기본 제공 프로세서:**

| 프로세서 | 확장자 | 라이브러리 | 기능 |
|---|---|---|---|
| Image | jpg, jpeg, png, webp, gif | `Pillow` | 리사이즈 (max 800px, LANCZOS) |
| PDF | pdf | `pypdf` | 페이지별 텍스트 추출 (1000자 미리보기) |
| Word | docx | `python-docx` | 단락별 텍스트 추출 (1000자 미리보기) |

## 타입 시스템 (dataclass)

```python
@dataclass
class ProcessorInput:
    filename: str          # 원본 파일명
    mimetype: str          # MIME 타입
    extension: str         # 확장자 (점 제외)
    content: bytes         # 파일 바이너리
    user_id: str           # 업로더 Slack ID
    channel_id: str        # 채널 ID
    thread_ts: str | None = None  # 스레드 타임스탬프

@dataclass
class ProcessorOutput:
    text: str | None = None
    file: FileOutput | None = None   # TypedDict: content, filename, title
    reply_in_thread: bool = True
```

## 가드 모듈

```python
# src/lib/guards.py
should_skip_file(
    file_user_id=file.get("user"),
    bot_user_id=context.get("bot_user_id"),
    filename=file.get("name"),
    file_size=file.get("size"),
    mimetype=file.get("mimetype"),
) → SkipResult  # {"skip": bool, "reason": str | None}

# 커스텀 가드 추가
add_guard(guard_video)
```

세 가드 함수가 순차 실행되며, 첫 번째 `skip=True`가 발생하면 즉시 반환한다.

## 코드 품질

| 도구 | 설정 | 용도 |
|---|---|---|
| `ruff` | line-length=100, py311, E/F/I/N/W | 린팅 + import 정렬 |
| `mypy` | strict=true, py311 | 정적 타입 검사 |

```bash
ruff check src/   # 린트
mypy src/         # 타입 검사
```

## 배포

```dockerfile
# python:3.11-slim 단일 스테이지
FROM python:3.11-slim

# 시스템 의존성 (Pillow 빌드용)
RUN apt-get install -y libjpeg-dev zlib1g-dev libpng-dev

# uv로 빠른 패키지 설치
RUN pip install uv
RUN uv pip install --system -e .

ENV PYTHONUNBUFFERED=1
CMD ["python", "-m", "src.main"]
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
# 환경 설정
uv venv && source .venv/bin/activate
uv pip install -e .

# 실행
python -m src.main

# 코드 품질
ruff check src/       # 린트
mypy src/             # 타입 검사

# Docker
docker build -t slack-bot-python .
docker run --env-file .env slack-bot-python
```
