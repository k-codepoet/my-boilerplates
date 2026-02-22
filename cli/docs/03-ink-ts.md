# TypeScript + Ink 보일러플레이트 아키텍처

## 아키텍처

**React for Terminal** — Ink는 React 컴포넌트를 터미널에 렌더링합니다. 웹 React와 동일한 hooks/JSX 패턴을 사용합니다.

```
cli.tsx (엔트리포인트)
  │
  │  render(<App />)    ← ink의 render 함수
  │
  ▼
App.tsx (메인 컴포넌트)
  │
  ├─ useState(0)        ← React 상태 관리
  ├─ useApp()           ← Ink: exit() 함수 제공
  ├─ useInput()         ← Ink: 키보드 입력 핸들러
  │
  └─ JSX 렌더링
       ├─ <Box>         ← Flexbox 레이아웃 컨테이너
       └─ <Text>        ← 스타일 텍스트 출력
```

**엔트리포인트** (`src/cli.tsx`):
```tsx
#!/usr/bin/env node
import { render } from "ink";
import { App } from "./App.js";

render(<App />);
```

**Ink 전용 Hooks**:
- `useApp()` — `exit()` 함수를 반환하여 프로그램을 종료합니다
- `useInput(handler)` — 키보드 입력을 콜백으로 받습니다. `(input: string, key: Key) => void`

**Ink 컴포넌트**:
- `<Box>` — Flexbox 컨테이너 (`flexDirection`, `padding`, `margin`, `borderStyle`, `borderColor`, `alignItems`)
- `<Text>` — 스타일 텍스트 (`bold`, `color`, `dimColor`)

**레이아웃 시스템**: CSS Flexbox와 동일합니다. Yoga 레이아웃 엔진을 사용하여 터미널에서 Flexbox를 구현합니다.

```tsx
<Box flexDirection="column" padding={1}>
  <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}
       flexDirection="column" alignItems="center">
    <Text bold color="cyan"> mycli - Ink TUI </Text>
    <Box marginTop={1}>
      <Text>Counter: </Text>
      <Text bold color="yellow">{counter}</Text>
    </Box>
    <Box marginTop={1}>
      <Text dimColor>Press ↑/↓ to change, q to quit</Text>
    </Box>
  </Box>
</Box>
```

## 의존성

```json
{
  "dependencies": {
    "ink": "^5.1.0",         // React 터미널 렌더러
    "@inkjs/ui": "^2.0.0",  // UI 컴포넌트 라이브러리 (Spinner, Select 등)
    "react": "^18.3.0"      // React 코어
  },
  "devDependencies": {
    "tsx": "^4.19.0",        // TypeScript 실행기 (dev 모드)
    "typescript": "^5.7.0"   // 컴파일러
  }
}
```

## 빌드 & 배포

```bash
# 개발
pnpm dev           # tsx watch src/cli.tsx (HMR)

# 빌드
pnpm build         # tsc → dist/

# 배포
npm publish        # dist/ 디렉토리만 배포 (files: ["dist"])
```

- **바이너리 불필요**: Node.js 런타임에서 직접 실행
- `prepublishOnly: "pnpm build"` 스크립트로 publish 전 자동 빌드
- `bin: { "mycli": "./dist/cli.js" }` — npm이 자동으로 shim 생성
- `engines: { "node": ">=20" }` — Node.js 20 이상 필요

## TypeScript 설정

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",      // React 17+ JSX transform
    "outDir": "dist",
    "declaration": true       // .d.ts 타입 선언 파일 생성
  }
}
```

## 명령어 요약

```bash
# 개발
pnpm dev                                      # tsx watch (HMR)

# 빌드
pnpm build                                    # tsc → dist/
pnpm typecheck                                # tsc --noEmit (타입 검사만)

# 배포
npm publish                                   # prepublishOnly가 자동 빌드
```
