# 배포 파이프라인

이 문서는 my-boilerplates의 Docker 기반 배포 파이프라인을 설명합니다.

## 핵심 요약

```
git tag {name}/v{YYYY}.{M}.{patch} → git push --tags
  → GitLab CI: Docker 멀티플랫폼 빌드 → Registry push → Portainer 자동 배포
```

태그 하나로 빌드부터 배포까지 자동화됩니다. 새 boilerplate 추가 시 `deploy-registry.yml`에 한 줄만 추가하면 됩니다.

---

## Repo별 역할 분리

| Repo | 역할 |
|------|------|
| **my-boilerplates** (이 repo) | 소스코드, Dockerfile, CI 파이프라인, `deploy-registry.yml` |
| **my-devops** | 배포 선언 (`docker-compose.yml`) — Portainer가 참조하는 SSOT |
| **Portainer** | webhook 수신 → compose pull → 컨테이너 재생성 (fallback: 5분 폴링) |

---

## 배포 흐름 상세

### 1. 태그 Push

```bash
git tag sample-ssr/v2026.3.1
git push origin --tags
```

태그 형식: `{name}/v{YYYY}.{M}.{patch}` — 정규식 `^[a-z0-9-]+\/v\d{4}\.\d+\.\d+$` 매칭 시 파이프라인 트리거.

### 2. build-image Stage

GitLab CI가 태그에서 이름/버전을 파싱하고, `deploy-registry.yml`에서 설정을 로드합니다.

```
태그: sample-ssr/v2026.3.1
  → DEPLOY_NAME=sample-ssr
  → DEPLOY_VERSION=v2026.3.1
  → deploy-registry.yml에서 빌드경로, 이미지명, compose경로, webhook변수 로드
```

빌드 과정:

1. **degit 시뮬레이션** — monorepo에서 해당 boilerplate를 `/tmp/build-app`에 독립 복사
2. **pnpm install** — standalone lockfile 생성 (`--no-frozen-lockfile`)
3. **docker buildx** — `linux/amd64` + `linux/arm64` 멀티플랫폼 빌드
4. **Registry push** — `:{version}` + `:latest` 두 태그로 GitLab Container Registry에 push

`APP_VERSION` build arg를 통해 버전 정보가 이미지 내부로 전달됩니다 (vite define → 앱 footer 등에 표시).

### 3. deploy Stage

build-image 완료 후 실행됩니다.

1. **my-devops clone** — `DEVOPS_DEPLOY_TOKEN`으로 인증
2. **compose 업데이트** — `docker-compose.yml`의 image 태그를 새 버전으로 `sed` 교체
3. **git commit + push** — my-devops에 변경사항 반영
4. **Portainer webhook** — POST 호출로 즉시 재배포 (실패 시 5분 폴링으로 fallback)

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `.gitlab-ci.yml` | 메인 CI 설정 (stages, includes) |
| `.gitlab/ci/deploy.yml` | build-image + deploy 잡 정의 |
| `deploy-registry.yml` | 태그이름 → boilerplate경로, 이미지명, compose경로, webhook변수 매핑 |
| `.gitlab/ci/_templates.yml` | 공통 rules, degit-node 템플릿 |
| `.gitlab/ci/docker-build.yml` | Dockerfile 빌드 검증 (validate용) |
| 각 boilerplate의 `Dockerfile` | 멀티스테이지 빌드 (builder → runner, `node:22-alpine`) |

### deploy-registry.yml 형식

```
{태그이름}: {boilerplate경로} {이미지경로} {compose경로} {webhook변수명}
```

현재 등록된 배포 대상:

```
sample-ssr:    web/react-router-ssr-authentik  sample-ssr    services/.../docker-compose.yml  WEBHOOK_SAMPLE_SSR
gameglue-demo: game/gameglue-demo             gameglue-demo services/.../docker-compose.yml  WEBHOOK_GAMEGLUE_DEMO
```

---

## Runner

- **mac-mini-2** (arm64, shell executor) — 빌드 + 배포 모두 실행
- QEMU (`tonistiigi/binfmt`) + `docker buildx`로 amd64/arm64 멀티플랫폼 지원
- buildx builder 이름: `multiarch`

---

## CI Variables

GitLab Settings > CI/CD > Variables에 등록 필요:

| 변수 | 용도 | 속성 |
|------|------|------|
| `DEVOPS_DEPLOY_TOKEN` | my-devops repo push용 GitLab Deploy Token | Protected, Masked |
| `WEBHOOK_{NAME}` | Portainer stack webhook URL (배포 대상별) | Protected, Masked |

`WEBHOOK_{NAME}`은 `deploy-registry.yml`의 webhook변수명과 일치해야 합니다. 예: `WEBHOOK_SAMPLE_SSR`.

---

## 새 boilerplate 배포 추가 절차

1. **deploy-registry.yml에 행 추가**

   ```
   my-app: web/my-app my-app services/codepoet-mac-mini-2/my-app/docker-compose.yml WEBHOOK_MY_APP
   ```

2. **GitLab CI Variables에 webhook 추가**

   `WEBHOOK_MY_APP` — Portainer stack webhook URL (Protected, Masked)

3. **태그 push로 배포**

   ```bash
   git tag my-app/v2026.3.1
   git push origin --tags
   ```

---

## 트러블슈팅

### webhook 실패 시

Portainer가 5분 주기로 Registry를 폴링하므로, webhook 실패해도 최대 5분 내 자동 배포됩니다. CI 로그에 `Webhook failed (will update via polling)` 메시지가 출력됩니다.

### deploy-registry.yml에 없는 태그

태그 이름이 `deploy-registry.yml`에 없으면 build-image 잡이 즉시 실패하며, 등록 가능한 대상 목록을 출력합니다.

### buildx builder 문제

`multiarch` builder가 없으면 자동 생성됩니다. 기존 builder에 문제가 있을 경우:

```bash
docker buildx rm multiarch
# 다음 CI 실행 시 자동 재생성
```
