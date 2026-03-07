# Cloudflare 배포 파이프라인

이 문서는 Cloudflare Workers/Pages 배포의 현재 상태와 GitLab CE 파이프라인 추가 계획을 정리합니다.

---

## 현재 상태

**GitHub Actions 기반으로만 동작합니다.**

| Boilerplate | 배포 대상 | 방식 |
|-------------|-----------|------|
| `react-router-ssr-cloudflare` | Cloudflare Workers | `wrangler-action@v3` → `wrangler deploy` |
| `react-router-spa-cloudflare` | Cloudflare Pages | `wrangler-action@v3` → `wrangler pages deploy` |

두 프로젝트 모두 `main` push 시 프로덕션 배포, PR 시 프리뷰 배포 후 PR 코멘트로 URL을 남깁니다.

### 참고할 기존 GitHub Actions 파일

| 파일 | 배포 대상 |
|------|-----------|
| `web/react-router-ssr-cloudflare/.github/workflows/deploy.yml` | Workers (SSR) |
| `web/react-router-spa-cloudflare/.github/workflows/deploy.yml` | Pages (SPA) |

---

## 목표

GitLab CE에서도 Cloudflare 배포가 가능하도록 `.gitlab-ci.yml` 파이프라인을 추가합니다.

Docker 배포는 이미 GitLab CI 기반으로 운영 중이므로 (`DEPLOY.md` 참고), Cloudflare 배포도 동일한 GitLab 인프라에서 실행할 수 있어야 합니다.

---

## 필요한 작업

### 1. GitLab CI Variables 등록

GitLab Settings > CI/CD > Variables에 추가:

| 변수 | 용도 | 속성 |
|------|------|------|
| `CLOUDFLARE_API_TOKEN` | wrangler 인증용 API Token | Protected, Masked |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID | Protected, Masked |

### 2. Workers 배포 잡 (SSR)

`react-router-ssr-cloudflare` 용. wrangler CLI를 직접 사용합니다.

```yaml
deploy-workers:
  image: node:22-alpine
  stage: deploy
  before_script:
    - corepack enable && corepack prepare pnpm@latest --activate
    - pnpm install --frozen-lockfile
    - pnpm build
  script:
    - npx wrangler deploy --env ${DEPLOY_ENV}
  variables:
    CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN
    CLOUDFLARE_ACCOUNT_ID: $CLOUDFLARE_ACCOUNT_ID
```

- `main` branch push: `DEPLOY_ENV=production`
- MR branch push: `DEPLOY_ENV=preview`

### 3. Pages 배포 잡 (SPA)

`react-router-spa-cloudflare` 용.

```yaml
deploy-pages:
  image: node:22-alpine
  stage: deploy
  before_script:
    - corepack enable && corepack prepare pnpm@latest --activate
    - pnpm install --frozen-lockfile
    - pnpm build
  script:
    - npx wrangler pages deploy ./build/client
        --project-name=${PROJECT_NAME}
        --branch=${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME:-$CI_COMMIT_REF_NAME}
  variables:
    CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN
    CLOUDFLARE_ACCOUNT_ID: $CLOUDFLARE_ACCOUNT_ID
```

- `main` push: 프로덕션 배포 (branch=main)
- MR push: 프리뷰 배포 (branch=MR 소스 브랜치)

### 4. MR 프리뷰 URL 코멘트

GitHub Actions에서는 `actions/github-script`로 PR 코멘트를 남기고 있습니다. GitLab에서는:

- wrangler 출력에서 URL 파싱
- GitLab MR Notes API (`POST /api/v4/projects/:id/merge_requests/:iid/notes`)로 코멘트 생성
- `CI_MERGE_REQUEST_IID` + `CI_PROJECT_ID` 환경변수 활용

### 5. 파이프라인 파일 배치

기존 GitLab CI 구조(`DEPLOY.md` 참고)에 맞춰:

```
.gitlab/ci/deploy-cloudflare.yml   # Workers + Pages 배포 잡 정의
```

`.gitlab-ci.yml`의 `include`에 추가하면 됩니다.

---

## 트리거 규칙 (안)

| 조건 | Workers (SSR) | Pages (SPA) |
|------|---------------|-------------|
| `main` push | production 배포 | production 배포 |
| MR 생성/업데이트 | preview 배포 + 코멘트 | preview 배포 + 코멘트 |

Docker 배포처럼 태그 기반이 아니라, **브랜치 기반**으로 트리거합니다 (GitHub Actions와 동일한 방식 유지).
