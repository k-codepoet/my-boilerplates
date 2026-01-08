# Ink CLI Boilerplate

React 기반 TypeScript TUI 애플리케이션.

## 구조

```
├── package.json           # Ink + React 의존성
├── tsconfig.json          # TypeScript + JSX 설정
└── src/
    ├── cli.tsx            # 진입점
    └── App.tsx            # 메인 컴포넌트
```

## 개발

```bash
pnpm install
pnpm dev              # 개발 모드 (watch)
pnpm build            # 빌드
```

## npm 배포

Ink는 JS로 실행되므로 바이너리 배포가 필요 없음:

```bash
npm publish --access public
```

사용자는 바로 설치 가능:

```bash
npm install -g @mycli/cli
mycli
```

## 특징

- **React 컴포넌트 모델** - 익숙한 패턴
- **Flexbox 레이아웃** - CSS 같은 레이아웃
- **@inkjs/ui** - 스피너, 셀렉트 등 컴포넌트 제공
- **별도 빌드 불필요** - Node.js만 있으면 실행

## 컴포넌트 예시

```tsx
import { Spinner, Select } from "@inkjs/ui";

// 스피너
<Spinner label="Loading..." />

// 셀렉트
<Select
  options={[
    { label: "Option 1", value: "1" },
    { label: "Option 2", value: "2" },
  ]}
  onChange={(value) => console.log(value)}
/>
```

## 바이너리 배포 (선택)

Node.js 없이 배포하려면 [pkg](https://github.com/vercel/pkg) 또는 [bun build --compile](https://bun.sh/docs/bundler/executables) 사용:

```bash
# bun 사용 시
bun build --compile src/cli.tsx --outfile mycli
```
