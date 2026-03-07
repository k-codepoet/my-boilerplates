# Changelog

이 프로젝트의 주요 변경 사항을 기록합니다.
형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)

## [Unreleased]

### Added
- `docs/DEPLOY.md` — Docker 빌드/배포 파이프라인 문서 (GitLab CI → Registry → my-devops → Portainer)
- `docs/DEPLOY_CLOUDFLARE.md` — Cloudflare 배포 파이프라인 향후 작업 문서
- `web/tanstack-router-spa/` Docker 지원 — Dockerfile, nginx.conf, docker-compose.yml, .dockerignore 추가
- `deploy-registry.yml`에 4개 web boilerplate 배포 대상 등록 (sample-ssr-base, sample-spa, sample-tanstack-ssr, sample-tanstack-spa)
- `.gitlab/ci/docker-build.yml`에 tanstack-router-spa Docker 빌드 검증 추가

### Changed
- `web/tanstack-start-ssr/` — vinxi → vite+nitro 마이그레이션 (TanStack Start v1.166+)
  - `@tailwindcss/postcss` → `@tailwindcss/vite`, path alias `@/*` → `~/*`
  - `.validator()` → `.inputValidator()` API 변경 반영
- `game/gameglue-demo/` — UI/배포 수정
  - play 라우트에 HomeLayout 적용 (홈↔Play 네비게이션 연결)
  - 깨진 docs/search UI 비활성화 (fumadocs SPA 모드 호환 이슈, TODO)
  - `server.fs.allow` 추가 (pnpm monorepo dev 호환)
  - `suppressHydrationWarning` 추가 (fumadocs 테마 스크립트 hydration 충돌 방지)
- `context.md` — 공통 인프라 문서 섹션 추가
