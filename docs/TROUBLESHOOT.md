# Troubleshooting

## In Progress

### Vite Dev Server - Tailscale DNS 원격 접근 불가

**날짜**: 2026-03-01
**보일러플레이트**: ai-context/react-router-ssr-mcp
**환경**: codepoet-linux-1 → 원격 머신에서 `codepoet-linux-1:5173` 접근

**증상**: `host: true` + `allowedHosts: true` 설정 후에도 Tailscale Magic DNS를 통한 원격 접근 시 CORS/차단 에러 발생

**시도한 설정** (vite.config.ts):
```typescript
server: {
  host: true,
  allowedHosts: true,
}
```

**다음 조사**:
- 브라우저 DevTools에서 실제 에러 내용 확인 (CORS vs connection refused)
- `curl codepoet-linux-1:5173`으로 TCP 레벨 접근 확인
- `server.hmr.host` 별도 설정 테스트
- React Router v7 dev 서버의 host 제한 확인

**참고**: my-devops 상세 → `docs/troubleshoot/inprogress/vite-dev-tailscale-remote-access.md`
