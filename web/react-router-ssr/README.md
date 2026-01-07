# React Router SSR

SSR 풀스택 boilerplate. 서버 사이드 렌더링을 지원합니다.

## 기술 스택

- React Router 7 (SSR)
- Tailwind CSS v4
- TypeScript
- Docker
- shadcn/ui 호환 테마 시스템

## 사용법

```bash
# 1. 복제
cp -r boilerplates/web/react-router-ssr apps/{프로젝트명}
cd apps/{프로젝트명}

# 2. package.json name 수정
# "@boilerplates/react-router-ssr" → "@apps/{프로젝트명}"

# 3. 의존성 설치
pnpm install

# 4. 개발 서버 시작
pnpm dev
```

## 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 (HMR) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 실행 |
| `pnpm typecheck` | 타입 체크 |

## 구조

```
├── .github/
│   └── workflows/
│       └── docker.yml    # Docker 빌드/푸시 워크플로우
├── app/
│   ├── app.css           # Tailwind + 테마 변수
│   ├── entry.server.tsx  # SSR 엔트리
│   ├── root.tsx          # 루트 레이아웃
│   ├── routes.ts         # 라우트 정의
│   ├── routes/           # 페이지 컴포넌트
│   └── lib/              # 유틸리티
├── Dockerfile            # Docker 이미지 빌드
├── docker-compose.yml    # 로컬 Docker 실행
└── vite.config.ts        # Vite 설정
```

## shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add button
```

## Docker 실행

### 로컬 실행

```bash
# docker-compose로 실행
docker compose up --build

# 또는 직접 빌드/실행
docker build -t my-app .
docker run -p 3000:3000 my-app
```

### CI/CD (GitHub Actions)

GitHub Actions 워크플로우가 포함되어 있습니다:

- **main 브랜치 push** → Docker 이미지 빌드 + ghcr.io 푸시
- **PR 생성** → Docker 이미지 빌드 (푸시 안함)

#### 이미지 태그

- `ghcr.io/{owner}/{repo}:latest` - main 브랜치 최신
- `ghcr.io/{owner}/{repo}:main` - main 브랜치
- `ghcr.io/{owner}/{repo}:{sha}` - 커밋 SHA

#### 이미지 사용

```bash
# GitHub Container Registry에서 pull
docker pull ghcr.io/{owner}/{repo}:latest

# 실행
docker run -p 3000:3000 ghcr.io/{owner}/{repo}:latest
```

#### 권한 설정

GitHub Actions는 `GITHUB_TOKEN`을 자동으로 사용하므로 별도 설정 불필요.
단, 저장소 Settings → Actions → General에서:
- "Workflow permissions" → "Read and write permissions" 선택

## 배포

Docker 이미지를 사용하여 다양한 환경에 배포 가능:

- **직접 배포**: `docker run` 또는 `docker compose`
- **Kubernetes**: Deployment/Service 매니페스트 작성
- **클라우드**: AWS ECS, Google Cloud Run, Azure Container Apps 등
